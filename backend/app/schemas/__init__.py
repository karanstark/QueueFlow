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

class QueueResponse(BaseModel):
    id: int
    name: str
    status: str
    project_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Jobs ---
class JobCreate(BaseModel):
    queue_id: int
    payload: Dict[str, Any]
    max_retries: int = Field(default=3, ge=0, le=10)
    retry_strategy: str = Field(default="exponential") # fixed, linear, exponential
    scheduled_at: Optional[datetime] = None

class JobResponse(BaseModel):
    id: int
    queue_id: int
    status: str
    retry_count: int
    max_retries: int
    retry_strategy: str
    scheduled_at: Optional[datetime]
    run_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    payload: Dict[str, Any]

    class Config:
        from_attributes = True

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
