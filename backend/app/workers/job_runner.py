import asyncio
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update

from app.config.database import AsyncSessionLocal
from app.models import Job, JobLog, Worker, DeadLetterQueue, Queue

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

HEARTBEAT_INTERVAL = 15   # seconds between heartbeats
POLL_INTERVAL = 5          # seconds between polls
MAX_CONCURRENT_JOBS = 5    # max jobs this worker runs simultaneously


class JobRunner:
    def __init__(self, worker_id: str):
        self.worker_id = worker_id
        self.is_running = False
        self._active_tasks: set[asyncio.Task] = set()

    async def register_worker(self):
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(Worker).filter(Worker.id == self.worker_id))
            existing = result.scalars().first()
            now = datetime.now(timezone.utc)
            if existing:
                existing.status = "active"
                existing.last_heartbeat = now
            else:
                session.add(Worker(
                    id=self.worker_id,
                    name=f"Worker-{self.worker_id[:8]}",
                    status="active",
                    last_heartbeat=now,
                ))
            await session.commit()
            logger.info(f"Worker {self.worker_id} registered.")

    async def unregister_worker(self):
        async with AsyncSessionLocal() as session:
            await session.execute(
                update(Worker)
                .where(Worker.id == self.worker_id)
                .values(status="offline")
            )
            await session.commit()
            logger.info(f"Worker {self.worker_id} unregistered.")

    async def send_heartbeat(self):
        """Periodically update last_heartbeat timestamp on the worker row."""
        while self.is_running:
            try:
                async with AsyncSessionLocal() as session:
                    await session.execute(
                        update(Worker)
                        .where(Worker.id == self.worker_id)
                        .values(last_heartbeat=datetime.now(timezone.utc))
                    )
                    await session.commit()
            except Exception as e:
                logger.warning(f"Heartbeat failed: {e}")
            await asyncio.sleep(HEARTBEAT_INTERVAL)

    async def start(self):
        self.is_running = True
        await self.register_worker()
        logger.info(f"Worker {self.worker_id} started.")

        # Run heartbeat and poll loop concurrently
        await asyncio.gather(
            self.heartbeat_loop(),
            self.poll_loop(),
        )

    async def heartbeat_loop(self):
        while self.is_running:
            try:
                async with AsyncSessionLocal() as session:
                    await session.execute(
                        update(Worker)
                        .where(Worker.id == self.worker_id)
                        .values(last_heartbeat=datetime.now(timezone.utc))
                    )
                    await session.commit()
            except Exception as e:
                logger.warning(f"Heartbeat failed: {e}")
            await asyncio.sleep(HEARTBEAT_INTERVAL)

    async def poll_loop(self):
        while self.is_running:
            try:
                # Only pick up more jobs if below concurrency limit
                if len(self._active_tasks) < MAX_CONCURRENT_JOBS:
                    await self.poll_and_dispatch()
            except Exception as e:
                logger.error(f"Poll error: {e}")
            await asyncio.sleep(POLL_INTERVAL)

    def stop(self):
        self.is_running = False

    async def poll_and_dispatch(self):
        """Claim one job and dispatch it as a concurrent asyncio task."""
        async with AsyncSessionLocal() as session:
            now = datetime.now(timezone.utc)

            # Find oldest queued job whose queue is active
            result = await session.execute(
                select(Job)
                .join(Queue)
                .filter(
                    Job.status == "queued",
                    Job.run_at <= now,
                    Queue.status == "active",  # respect paused queues
                )
                .order_by(Job.run_at.asc())
                .limit(1)
            )
            job = result.scalars().first()
            if not job:
                return

            # Claim it
            job.status = "claimed"
            job.worker_id = self.worker_id
            job.updated_at = now
            session.add(JobLog(
                job_id=job.id,
                status="claimed",
                message=f"Claimed by worker {self.worker_id[:8]}"
            ))
            await session.commit()
            job_id = job.id

        # Dispatch as concurrent task
        task = asyncio.create_task(self.execute_job(job_id))
        self._active_tasks.add(task)
        task.add_done_callback(self._active_tasks.discard)
        logger.info(f"Dispatched job {job_id} (active: {len(self._active_tasks)})")

    async def execute_job(self, job_id: int):
        """Execute a single claimed job."""
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(Job).filter(Job.id == job_id))
            job = result.scalars().first()
            if not job or job.status != "claimed":
                return

            start_time = datetime.now(timezone.utc)
            try:
                job.status = "running"
                job.started_at = start_time
                job.updated_at = start_time
                session.add(JobLog(
                    job_id=job.id,
                    status="running",
                    message="Job started execution"
                ))
                await session.commit()

                # Simulated work (2 seconds)
                await asyncio.sleep(2)

                if job.payload and job.payload.get("should_fail"):
                    raise Exception("Mock failure triggered by payload flag")

                # Success
                end_time = datetime.now(timezone.utc)
                duration = (end_time - start_time).total_seconds() * 1000

                job.status = "completed"
                job.completed_at = end_time
                job.duration_ms = duration
                job.updated_at = end_time
                session.add(JobLog(
                    job_id=job.id,
                    status="completed",
                    message=f"Completed in {duration:.0f}ms"
                ))
                await session.commit()
                logger.info(f"Job {job_id} completed in {duration:.0f}ms")

            except Exception as e:
                logger.error(f"Job {job_id} failed: {e}")
                await self.handle_failure(session, job, str(e))

    async def handle_failure(self, session: AsyncSession, job: Job, error_msg: str):
        job.retry_count += 1
        now = datetime.now(timezone.utc)

        if job.retry_count <= job.max_retries:
            # Calculate backoff delay
            strategy = job.retry_strategy
            if strategy == "fixed":
                delay = 10
            elif strategy == "linear":
                delay = 10 * job.retry_count
            elif strategy == "exponential":
                delay = min(2 ** job.retry_count, 300)  # cap at 5 min
            else:
                delay = 10

            job.status = "queued"
            job.run_at = now + timedelta(seconds=delay)
            job.updated_at = now
            session.add(JobLog(
                job_id=job.id,
                status="failed",
                message=f"Attempt {job.retry_count}/{job.max_retries} failed. "
                        f"Retrying in {delay}s ({strategy} backoff). Error: {error_msg}"
            ))
            logger.info(f"Job {job.id} retry {job.retry_count}/{job.max_retries} in {delay}s")
        else:
            # Permanently failed — move to DLQ
            job.status = "failed"
            job.updated_at = now
            session.add(JobLog(
                job_id=job.id,
                status="failed",
                message=f"Permanently failed after {job.max_retries} retries. Error: {error_msg}"
            ))

            existing = await session.execute(
                select(DeadLetterQueue).filter(DeadLetterQueue.job_id == job.id)
            )
            if not existing.scalars().first():
                session.add(DeadLetterQueue(
                    job_id=job.id,
                    payload=job.payload,
                    reason=f"Max retries ({job.max_retries}) exceeded. Last error: {error_msg}"
                ))
            logger.error(f"Job {job.id} added to DLQ after {job.max_retries} retries")

        await session.commit()
