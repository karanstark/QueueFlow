from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.config.database import get_db
from app.models import Job, Queue, Project, User, Worker, DeadLetterQueue
from app.schemas import DashboardStats
from app.auth.deps import get_current_user

router = APIRouter()

@router.get("/", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Get user's project IDs
    projects_result = await db.execute(
        select(Project.id).filter(Project.user_id == current_user.id)
    )
    project_ids = projects_result.scalars().all()

    empty = DashboardStats(
        total_jobs=0, queued_jobs=0, running_jobs=0,
        completed_jobs=0, failed_jobs=0, dead_letter=0,
        total_queues=0, active_workers=0, queues=[]
    )

    if not project_ids:
        return empty

    # Get queues
    queues_result = await db.execute(
        select(Queue).filter(Queue.project_id.in_(project_ids))
    )
    queues = queues_result.scalars().all()
    queue_ids = [q.id for q in queues]

    if not queue_ids:
        return empty._replace(active_workers=(
            await db.execute(select(func.count(Worker.id)).filter(Worker.status == "active"))
        ).scalar() or 0) if hasattr(empty, '_replace') else empty

    # Job counts by status
    def count_status(status: str):
        return (
            select(func.count(Job.id))
            .filter(Job.queue_id.in_(queue_ids), Job.status == status)
        )

    total_jobs     = (await db.execute(select(func.count(Job.id)).filter(Job.queue_id.in_(queue_ids)))).scalar() or 0
    queued_jobs    = (await db.execute(count_status("queued"))).scalar() or 0
    running_jobs   = (await db.execute(count_status("running"))).scalar() or 0
    claimed_jobs   = (await db.execute(count_status("claimed"))).scalar() or 0
    completed_jobs = (await db.execute(count_status("completed"))).scalar() or 0
    failed_jobs    = (await db.execute(count_status("failed"))).scalar() or 0

    # DLQ count — jobs from user's queues that are in the DLQ
    job_ids_result = await db.execute(
        select(Job.id).filter(Job.queue_id.in_(queue_ids))
    )
    job_ids = job_ids_result.scalars().all()
    dead_letter = 0
    if job_ids:
        dead_letter = (await db.execute(
            select(func.count(DeadLetterQueue.id)).filter(DeadLetterQueue.job_id.in_(job_ids))
        )).scalar() or 0

    active_workers = (await db.execute(
        select(func.count(Worker.id)).filter(Worker.status == "active")
    )).scalar() or 0

    return DashboardStats(
        total_jobs=total_jobs,
        queued_jobs=queued_jobs,
        running_jobs=running_jobs + claimed_jobs,
        completed_jobs=completed_jobs,
        failed_jobs=failed_jobs,
        dead_letter=dead_letter,
        total_queues=len(queue_ids),
        active_workers=active_workers,
        queues=queues,
    )
