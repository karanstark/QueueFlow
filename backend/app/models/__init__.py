from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.config.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    projects = relationship("Project", back_populates="owner")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    api_key = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="projects")
    queues = relationship("Queue", back_populates="project")


class Queue(Base):
    __tablename__ = "queues"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    status = Column(String, default="active") # active, paused
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="queues")
    jobs = relationship("Job", back_populates="queue")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    queue_id = Column(Integer, ForeignKey("queues.id"), nullable=False)
    payload = Column(JSON, nullable=False)
    status = Column(String, default="queued", index=True) # queued, claimed, running, completed, failed
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    retry_strategy = Column(String, default="exponential") # fixed, linear, exponential
    scheduled_at = Column(DateTime, nullable=True) # For delayed/scheduled jobs
    run_at = Column(DateTime, nullable=True, index=True) # The actual time to run (used for scheduling & retries)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    worker_id = Column(String, nullable=True) # Which worker claimed it

    queue = relationship("Queue", back_populates="jobs")
    logs = relationship("JobLog", back_populates="job")


class Worker(Base):
    __tablename__ = "workers"

    id = Column(String, primary_key=True, index=True) # UUID based
    name = Column(String, nullable=False)
    status = Column(String, default="active") # active, offline
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class WorkerHeartbeat(Base):
    __tablename__ = "worker_heartbeats"
    
    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(String, ForeignKey("workers.id"), nullable=False)
    last_heartbeat = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class JobLog(Base):
    __tablename__ = "job_logs"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    status = Column(String, nullable=False)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    job = relationship("Job", back_populates="logs")


class DeadLetterQueue(Base):
    __tablename__ = "dead_letter_queue"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, nullable=False, unique=True) # Don't enforce strict FK to allow jobs to be deleted
    payload = Column(JSON, nullable=False)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
