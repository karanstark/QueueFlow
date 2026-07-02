from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings

from app.routes import api_router
from contextlib import asynccontextmanager
import asyncio
import uuid
from app.workers.job_runner import JobRunner

worker_instance = None
worker_task = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global worker_instance, worker_task
    # Start worker
    worker_id = str(uuid.uuid4())
    worker_instance = JobRunner(worker_id)
    worker_task = asyncio.create_task(worker_instance.start())
    yield
    # Shutdown worker
    if worker_instance:
        worker_instance.stop()
        await worker_instance.unregister_worker()
    if worker_task:
        await worker_task

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"message": "Welcome to QueueFlow API"}
