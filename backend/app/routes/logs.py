from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from pydantic import BaseModel
from datetime import datetime

from app.config.database import get_db
from app.models import JobLog, Job, Queue, Project, User
from app.auth.deps import get_current_user

router = APIRouter()


class JobLogResponse(BaseModel):
    id: int
    job_id: int
    status: str
    message: str | None
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/", response_model=List[JobLogResponse])
async def list_logs(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify the job belongs to the current user
    result = await db.execute(
        select(Job)
        .join(Queue)
        .join(Project)
        .filter(Job.id == job_id, Project.user_id == current_user.id)
    )
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Job not found")

    result = await db.execute(
        select(JobLog).filter(JobLog.job_id == job_id).order_by(JobLog.created_at.asc())
    )
    return result.scalars().all()
