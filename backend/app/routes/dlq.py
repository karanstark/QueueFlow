from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from pydantic import BaseModel
from datetime import datetime, timezone

from app.config.database import get_db
from app.models import DeadLetterQueue, Job, Queue, Project, User
from app.auth.deps import get_current_user

router = APIRouter()


class DLQResponse(BaseModel):
    id: int
    job_id: int
    payload: dict
    reason: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/", response_model=List[DLQResponse])
async def list_dlq(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Get job IDs belonging to this user
    project_ids_result = await db.execute(
        select(Project.id).filter(Project.user_id == current_user.id)
    )
    project_ids = project_ids_result.scalars().all()
    if not project_ids:
        return []

    queue_ids_result = await db.execute(
        select(Queue.id).filter(Queue.project_id.in_(project_ids))
    )
    queue_ids = queue_ids_result.scalars().all()
    if not queue_ids:
        return []

    job_ids_result = await db.execute(
        select(Job.id).filter(Job.queue_id.in_(queue_ids))
    )
    job_ids = job_ids_result.scalars().all()
    if not job_ids:
        return []

    result = await db.execute(
        select(DeadLetterQueue)
        .filter(DeadLetterQueue.job_id.in_(job_ids))
        .order_by(DeadLetterQueue.created_at.desc())
    )
    return result.scalars().all()


@router.post("/{dlq_id}/retry")
async def retry_dlq_job(
    dlq_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(DeadLetterQueue).filter(DeadLetterQueue.id == dlq_id))
    dlq_entry = result.scalars().first()
    if not dlq_entry:
        raise HTTPException(status_code=404, detail="DLQ entry not found")

    # Re-queue the original job
    job_result = await db.execute(select(Job).filter(Job.id == dlq_entry.job_id))
    job = job_result.scalars().first()

    if job:
        job.status = "queued"
        job.retry_count = 0
        job.run_at = datetime.now(timezone.utc)
        job.updated_at = job.run_at

    # Remove from DLQ
    await db.delete(dlq_entry)
    await db.commit()
    return {"detail": "Job re-queued from DLQ"}


@router.delete("/{dlq_id}")
async def delete_dlq_entry(
    dlq_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(DeadLetterQueue).filter(DeadLetterQueue.id == dlq_id))
    dlq_entry = result.scalars().first()
    if not dlq_entry:
        raise HTTPException(status_code=404, detail="DLQ entry not found")

    await db.delete(dlq_entry)
    await db.commit()
    return {"detail": "DLQ entry deleted"}
