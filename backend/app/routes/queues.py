from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.config.database import get_db
from app.models import Queue, Project, User
from app.schemas import QueueCreate, QueueResponse
from app.auth.deps import get_current_user

router = APIRouter()


@router.post("/", response_model=QueueResponse)
async def create_queue(
    queue_in: QueueCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Project).filter(Project.id == queue_in.project_id, Project.user_id == current_user.id)
    )
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    queue = Queue(**queue_in.model_dump())
    db.add(queue)
    await db.commit()
    await db.refresh(queue)
    return queue


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
    return result.scalars().all()


@router.patch("/{queue_id}/pause")
async def pause_queue(
    queue_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    queue = await _get_user_queue(queue_id, current_user, db)
    queue.status = "paused"
    await db.commit()
    await db.refresh(queue)
    return {"detail": "Queue paused", "id": queue.id, "status": queue.status}


@router.patch("/{queue_id}/resume")
async def resume_queue(
    queue_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    queue = await _get_user_queue(queue_id, current_user, db)
    queue.status = "active"
    await db.commit()
    await db.refresh(queue)
    return {"detail": "Queue resumed", "id": queue.id, "status": queue.status}


@router.delete("/{queue_id}")
async def delete_queue(
    queue_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    queue = await _get_user_queue(queue_id, current_user, db)
    await db.delete(queue)
    await db.commit()
    return {"detail": "Queue deleted"}


async def _get_user_queue(queue_id: int, current_user: User, db: AsyncSession) -> Queue:
    result = await db.execute(
        select(Queue)
        .join(Project)
        .filter(Queue.id == queue_id, Project.user_id == current_user.id)
    )
    queue = result.scalars().first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    return queue
