from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

# --- Auth ---
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True


# --- Projects ---
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    api_key: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Queues ---
class QueueCreate(BaseModel):
    name: str
    project_id: int
    priority: str = Field(default="normal")          # low, normal, high
    concurrency_limit: int = Field(default=5, ge=1, le=50)
    retry_policy: str = Field(default="exponential") # fixed, linear, exponential

class QueueResponse(BaseModel):
    id: int
    name: str
    status: str
    priority: str = "normal"
    concurrency_limit: int = 5
    retry_policy: str = "exponential"
    project_id: int
    created_at: datetime
    # Runtime stats (populated by route)
    job_count: int = 0
    completed_count: int = 0
    failed_count: int = 0
    running_count: int = 0

    class Config:
        from_attributes = True


# --- Jobs ---
class JobCreate(BaseModel):
    queue_id: int
    payload: Dict[str, Any]
    priority: str = Field(default="normal")          # low, normal, high
    max_retries: int = Field(default=3, ge=0, le=10)
    retry_strategy: str = Field(default="exponential")
    scheduled_at: Optional[datetime] = None

class JobResponse(BaseModel):
    id: int
    queue_id: int
    status: str
    priority: str = "normal"
    retry_count: int
    max_retries: int
    retry_strategy: str
    scheduled_at: Optional[datetime]
    run_at: Optional[datetime]
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_ms: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    payload: Dict[str, Any]
    worker_id: Optional[str] = None

    class Config:
        from_attributes = True


# --- Chart data ---
class ThroughputPoint(BaseModel):
    time: str
    completed: int
    failed: int

class QueueDistPoint(BaseModel):
    name: str
    value: int

class FailureRatePoint(BaseModel):
    day: str
    rate: float

class WorkerUtilPoint(BaseModel):
    worker: str
    cpu: int
    mem: int

class ChartData(BaseModel):
    throughput: List[ThroughputPoint] = []
    queue_distribution: List[QueueDistPoint] = []
    failure_rate: List[FailureRatePoint] = []
    worker_utilization: List[WorkerUtilPoint] = []
    avg_duration_ms: float = 0
    success_rate: float = 0


# --- Stats ---
class DashboardStats(BaseModel):
    total_jobs: int
    queued_jobs: int = 0
    running_jobs: int
    completed_jobs: int = 0
    failed_jobs: int
    dead_letter: int = 0
    total_queues: int
    active_workers: int
    queues: List[QueueResponse] = []
