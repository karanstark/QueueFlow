import asyncio
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update

from app.config.database import AsyncSessionLocal
from app.models import Job, JobLog, Worker, DeadLetterQueue

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class JobRunner:
    def __init__(self, worker_id: str):
        self.worker_id = worker_id
        self.is_running = False
        self.poll_interval = 5  # seconds

    async def register_worker(self):
        async with AsyncSessionLocal() as session:
            # Upsert: update if exists, insert if not
            result = await session.execute(select(Worker).filter(Worker.id == self.worker_id))
            existing = result.scalars().first()
            if existing:
                existing.status = "active"
            else:
                worker = Worker(id=self.worker_id, name=f"Worker-{self.worker_id[:8]}", status="active")
                session.add(worker)
            await session.commit()
            logger.info(f"Worker {self.worker_id} registered.")

    async def unregister_worker(self):
        async with AsyncSessionLocal() as session:
            await session.execute(
                update(Worker).where(Worker.id == self.worker_id).values(status="offline")
            )
            await session.commit()
            logger.info(f"Worker {self.worker_id} unregistered.")

    async def start(self):
        self.is_running = True
        await self.register_worker()
        logger.info(f"Worker {self.worker_id} started polling.")

        while self.is_running:
            try:
                await self.poll_and_execute()
            except Exception as e:
                logger.error(f"Error in worker loop: {e}")
            await asyncio.sleep(self.poll_interval)

    def stop(self):
        self.is_running = False

    async def poll_and_execute(self):
        async with AsyncSessionLocal() as session:
            now = datetime.now(timezone.utc)

            # SQLite-safe polling: select then check/claim manually
            result = await session.execute(
                select(Job).filter(
                    Job.status == "queued",
                    Job.run_at <= now
                ).limit(1)
            )
            job = result.scalars().first()

            if not job:
                return  # Nothing to do

            # Claim the job (optimistic lock via status check)
            job.status = "claimed"
            job.worker_id = self.worker_id
            job.updated_at = now

            log = JobLog(
                job_id=job.id,
                status="claimed",
                message=f"Job claimed by worker {self.worker_id}"
            )
            session.add(log)
            await session.commit()

            logger.info(f"Worker {self.worker_id} claimed job {job.id}")

        # Execute in a fresh session to avoid long-held transactions
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(Job).filter(Job.id == job.id))
            job = result.scalars().first()
            if not job or job.status != "claimed":
                return  # Another worker grabbed it

            try:
                job.status = "running"
                session.add(JobLog(job_id=job.id, status="running", message="Job started running"))
                await session.commit()

                # Simulated work
                await asyncio.sleep(2)

                # Check for mock failure flag in payload
                if job.payload and job.payload.get("should_fail"):
                    raise Exception("Mock simulated failure")

                job.status = "completed"
                job.updated_at = datetime.now(timezone.utc)
                session.add(JobLog(job_id=job.id, status="completed", message="Job completed successfully"))
                await session.commit()
                logger.info(f"Job {job.id} completed.")

            except Exception as e:
                logger.error(f"Job {job.id} failed: {e}")
                await self.handle_failure(session, job, str(e))

    async def handle_failure(self, session: AsyncSession, job: Job, error_msg: str):
        job.retry_count += 1

        if job.retry_count <= job.max_retries:
            job.status = "queued"
            # Calculate retry delay based on strategy
            if job.retry_strategy == "fixed":
                delay = 10
            elif job.retry_strategy == "linear":
                delay = 10 * job.retry_count
            elif job.retry_strategy == "exponential":
                delay = 2 ** job.retry_count
            else:
                delay = 10

            job.run_at = datetime.now(timezone.utc) + timedelta(seconds=delay)
            job.updated_at = datetime.now(timezone.utc)

            session.add(JobLog(
                job_id=job.id,
                status="failed",
                message=f"Failed. Retrying in {delay}s (attempt {job.retry_count}/{job.max_retries}). Error: {error_msg}"
            ))
            logger.info(f"Job {job.id} will be retried at {job.run_at}")
        else:
            # Max retries exceeded — move to Dead Letter Queue
            job.status = "failed"
            job.updated_at = datetime.now(timezone.utc)

            session.add(JobLog(
                job_id=job.id,
                status="failed",
                message=f"Max retries ({job.max_retries}) exceeded. Job moved to DLQ. Error: {error_msg}"
            ))

            # Write to DLQ — check for existing entry first
            existing_dlq = await session.execute(
                select(DeadLetterQueue).filter(DeadLetterQueue.job_id == job.id)
            )
            if not existing_dlq.scalars().first():
                dlq_entry = DeadLetterQueue(
                    job_id=job.id,
                    payload=job.payload,
                    reason=f"Max retries ({job.max_retries}) exceeded. Last error: {error_msg}"
                )
                session.add(dlq_entry)

            logger.error(f"Job {job.id} permanently failed after {job.max_retries} retries — added to DLQ.")

        await session.commit()
