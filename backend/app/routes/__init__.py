from fastapi import APIRouter
from app.routes import auth, projects, queues, jobs, stats, workers, logs, dlq

api_router = APIRouter()
api_router.include_router(auth.router,     prefix="/auth",     tags=["auth"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(queues.router,   prefix="/queues",   tags=["queues"])
api_router.include_router(jobs.router,     prefix="/jobs",     tags=["jobs"])
api_router.include_router(stats.router,    prefix="/stats",    tags=["stats"])
api_router.include_router(workers.router,  prefix="/workers",  tags=["workers"])
api_router.include_router(logs.router,     prefix="/logs",     tags=["logs"])
api_router.include_router(dlq.router,      prefix="/dlq",      tags=["dlq"])
