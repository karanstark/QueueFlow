from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List

from app.config.database import get_db
from app.models import Queue, Project, Job, User
from app.schemas import QueueCreate, QueueResponse
from app.auth.deps import get_current_user

router = APIRouter()


async def _enrich_queue(queue: Queue, db: AsyncSession) -> QueueResponse:
    """Attach live job count stats to a queue response."""
    total = (await db.execute(select(func.count(Job.id)).filter(Job.queue_id == queue.id))).scalar() or 0
    completed = (await db.execute(select(func.count(Job.id)).filter(Job.queue_id == queue.id, Job.status == "completed"))).scalar() or 0
    failed = (await db.execute(select(func.count(Job.id)).filter(Job.queue_id == queue.id, Job.status == "failed"))).scalar() or 0
    running = (await db.execute(select(func.count(Job.id)).filter(Job.queue_id == queue.id, Job.status.in_(["running", "claimed"])))).scalar() or 0

    return QueueResponse(
        id=queue.id,
        name=queue.name,
        status=queue.status,
        priority=queue.priority or "normal",
        concurrency_limit=queue.concurrency_limit or 5,
        retry_policy=queue.retry_policy or "exponential",
        project_id=queue.project_id,
        created_at=queue.created_at,
        job_count=total,
        completed_count=completed,
        failed_count=failed,
        running_count=running,
    )


@router.post("/", response_model=QueueResponse)
async def create_queue(
    queue_in: QueueCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Project).filter(Project.id == queue_in.project_id, Project.user_id == current_user.id)
    )
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")

    queue = Queue(**queue_in.model_dump())
    db.add(queue)
    await db.commit()
    await db.refresh(queue)
    return await _enrich_queue(queue, db)


@router.get("/", response_model=List[QueueResponse])
async def list_queues(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Project).filter(Project.id == project_id, Project.user_id == current_user.id)
    )
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(select(Queue).filter(Queue.project_id == project_id))
    queues = result.scalars().all()
    return [await _enrich_queue(q, db) for q in queues]


@router.patch("/{queue_id}/pause")
async def pause_queue(queue_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    queue = await _get_user_queue(queue_id, current_user, db)
    queue.status = "paused"
    await db.commit()
    await db.refresh(queue)
    return await _enrich_queue(queue, db)


@router.patch("/{queue_id}/resume")
async def resume_queue(queue_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    queue = await _get_user_queue(queue_id, current_user, db)
    queue.status = "active"
    await db.commit()
    await db.refresh(queue)
    return await _enrich_queue(queue, db)


@router.delete("/{queue_id}")
async def delete_queue(queue_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    queue = await _get_user_queue(queue_id, current_user, db)
    await db.delete(queue)
    await db.commit()
    return {"detail": "Queue deleted"}


async def _get_user_queue(queue_id: int, current_user: User, db: AsyncSession) -> Queue:
    result = await db.execute(
        select(Queue).join(Project).filter(Queue.id == queue_id, Project.user_id == current_user.id)
    )
    queue = result.scalars().first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    return queue
