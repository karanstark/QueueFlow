from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from pydantic import BaseModel
from datetime import datetime

from app.config.database import get_db
from app.models import Worker, Job
from app.auth.deps import get_current_user
from app.models import User

router = APIRouter()


class WorkerResponse(BaseModel):
    id: str
    name: str
    status: str
    created_at: datetime
    running_jobs: int = 0
    last_heartbeat: datetime | None = None

    class Config:
        from_attributes = True


@router.get("/", response_model=List[WorkerResponse])
async def list_workers(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Worker))
    workers = result.scalars().all()

    # Attach running job counts to each worker
    output = []
    for w in workers:
        running = await db.execute(
            select(Job).filter(Job.worker_id == w.id, Job.status.in_(["running", "claimed"]))
        )
        count = len(running.scalars().all())
        output.append(WorkerResponse(
            id=w.id,
            name=w.name,
            status=w.status,
            created_at=w.created_at,
            running_jobs=count,
            last_heartbeat=w.created_at,  # Use created_at as proxy for heartbeat
        ))
    return output
