from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from datetime import datetime, timezone

from app.config.database import get_db
from app.models import Job, Queue, Project, User
from app.schemas import JobCreate, JobResponse
from app.auth.deps import get_current_user

router = APIRouter()


@router.post("/", response_model=JobResponse)
async def create_job(
    job_in: JobCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Queue)
        .join(Project)
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
        max_retries=job_in.max_retries,
        retry_strategy=job_in.retry_strategy,
        scheduled_at=job_in.scheduled_at,
        run_at=run_at,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job


@router.get("/", response_model=List[JobResponse])
async def list_jobs(
    queue_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Queue)
        .join(Project)
        .filter(Queue.id == queue_id, Project.user_id == current_user.id)
    )
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Queue not found")

    result = await db.execute(
        select(Job).filter(Job.queue_id == queue_id).order_by(Job.created_at.desc())
    )
    return result.scalars().all()


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
    if job.status not in ("failed",):
        raise HTTPException(status_code=400, detail=f"Only failed jobs can be retried (current status: '{job.status}')")
    job.status = "queued"
    job.retry_count = 0
    job.run_at = datetime.now(timezone.utc)
    job.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(job)
    return job


async def _get_user_job(job_id: int, current_user: User, db: AsyncSession) -> Job:
    result = await db.execute(
        select(Job)
        .join(Queue)
        .join(Project)
        .filter(Job.id == job_id, Project.user_id == current_user.id)
    )
    job = result.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
