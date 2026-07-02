from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel

from app.config.database import get_db
from app.models import Job, Queue, Project, User
from app.schemas import JobCreate, JobResponse
from app.auth.deps import get_current_user

router = APIRouter()


class PaginatedJobResponse(BaseModel):
    items: List[JobResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


@router.post("/", response_model=JobResponse)
async def create_job(
    job_in: JobCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Queue).join(Project)
        .filter(Queue.id == job_in.queue_id, Project.user_id == current_user.id)
    )
    queue = result.scalars().first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found or access denied")
    if queue.status == "paused":
        raise HTTPException(status_code=400, detail="Queue is paused. Resume it before dispatching jobs.")

    run_at = job_in.scheduled_at or datetime.now(timezone.utc)
    job = Job(
        queue_id=job_in.queue_id,
        payload=job_in.payload,
        priority=job_in.priority,
        max_retries=job_in.max_retries,
        retry_strategy=job_in.retry_strategy,
        scheduled_at=job_in.scheduled_at,
        run_at=run_at,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job


@router.get("/", response_model=PaginatedJobResponse)
async def list_jobs(
    queue_id: int,
    status: Optional[str] = Query(None, description="Filter by status: queued|running|completed|failed|claimed"),
    priority: Optional[str] = Query(None, description="Filter by priority: low|normal|high"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=200, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify queue ownership
    result = await db.execute(
        select(Queue).join(Project)
        .filter(Queue.id == queue_id, Project.user_id == current_user.id)
    )
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Queue not found")

    # Base query with optional filters
    query = select(Job).filter(Job.queue_id == queue_id)
    count_query = select(func.count(Job.id)).filter(Job.queue_id == queue_id)

    if status:
        query = query.filter(Job.status == status)
        count_query = count_query.filter(Job.status == status)
    if priority:
        query = query.filter(Job.priority == priority)
        count_query = count_query.filter(Job.priority == priority)

    total = (await db.execute(count_query)).scalar() or 0
    offset = (page - 1) * page_size
    items = (await db.execute(
        query.order_by(Job.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()

    return PaginatedJobResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, -(-total // page_size)),  # ceiling division
    )


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await _get_user_job(job_id, current_user, db)


@router.patch("/{job_id}/cancel", response_model=JobResponse)
async def cancel_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    job = await _get_user_job(job_id, current_user, db)
    if job.status not in ("queued", "scheduled"):
        raise HTTPException(status_code=400, detail=f"Cannot cancel a job with status '{job.status}'")
    job.status = "failed"
    job.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(job)
    return job


@router.patch("/{job_id}/retry", response_model=JobResponse)
async def retry_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    job = await _get_user_job(job_id, current_user, db)
    if job.status != "failed":
        raise HTTPException(status_code=400, detail=f"Only failed jobs can be retried (current: '{job.status}')")
    job.status = "queued"
    job.retry_count = 0
    job.run_at = datetime.now(timezone.utc)
    job.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(job)
    return job


async def _get_user_job(job_id: int, current_user: User, db: AsyncSession) -> Job:
    result = await db.execute(
        select(Job).join(Queue).join(Project)
        .filter(Job.id == job_id, Project.user_id == current_user.id)
    )
    job = result.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
