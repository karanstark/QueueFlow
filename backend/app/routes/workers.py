from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta

from app.config.database import get_db
from app.models import Worker, Job, User
from app.auth.deps import get_current_user

router = APIRouter()

HEARTBEAT_TIMEOUT = 30  # seconds — worker is considered offline if no heartbeat


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

    now = datetime.now(timezone.utc)
    output = []
    for w in workers:
        # Auto-mark stale workers as offline
        heartbeat = w.last_heartbeat
        if heartbeat:
            # Make timezone-aware if naive
            if heartbeat.tzinfo is None:
                heartbeat = heartbeat.replace(tzinfo=timezone.utc)
            if (now - heartbeat).total_seconds() > HEARTBEAT_TIMEOUT and w.status == "active":
                w.status = "offline"
                await db.commit()

        running = (await db.execute(
            select(func.count(Job.id)).filter(
                Job.worker_id == w.id,
                Job.status.in_(["running", "claimed"])
            )
        )).scalar() or 0

        output.append(WorkerResponse(
            id=w.id,
            name=w.name,
            status=w.status,
            created_at=w.created_at,
            running_jobs=running,
            last_heartbeat=w.last_heartbeat,
        ))
    return output
