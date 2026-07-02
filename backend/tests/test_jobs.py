"""Tests for job dispatch, lifecycle, pagination, and filtering."""
import pytest


async def _setup(client):
    """Helper: create project + queue, return (project_id, queue_id)."""
    pid = (await client.post("/api/projects/", json={"name": "p1"})).json()["id"]
    qid = (await client.post("/api/queues/", json={"name": "q1", "project_id": pid})).json()["id"]
    return pid, qid


@pytest.mark.asyncio
async def test_create_job(auth_client):
    client, _ = auth_client
    _, qid = await _setup(client)
    res = await client.post("/api/jobs/", json={
        "queue_id": qid,
        "payload": {"task": "send_email", "to": "user@example.com"},
        "max_retries": 3,
        "retry_strategy": "exponential"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "queued"
    assert data["queue_id"] == qid
    assert data["retry_count"] == 0


@pytest.mark.asyncio
async def test_list_jobs_paginated(auth_client):
    client, _ = auth_client
    _, qid = await _setup(client)

    # Dispatch 5 jobs
    for i in range(5):
        await client.post("/api/jobs/", json={"queue_id": qid, "payload": {"i": i}})

    res = await client.get(f"/api/jobs/?queue_id={qid}&page=1&page_size=3")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 5
    assert data["total_pages"] == 2
    assert len(data["items"]) == 3

    # Page 2
    res2 = await client.get(f"/api/jobs/?queue_id={qid}&page=2&page_size=3")
    assert len(res2.json()["items"]) == 2


@pytest.mark.asyncio
async def test_filter_jobs_by_status(auth_client):
    client, _ = auth_client
    _, qid = await _setup(client)

    await client.post("/api/jobs/", json={"queue_id": qid, "payload": {"a": 1}})
    await client.post("/api/jobs/", json={"queue_id": qid, "payload": {"b": 2}})

    res = await client.get(f"/api/jobs/?queue_id={qid}&status=queued")
    assert res.status_code == 200
    items = res.json()["items"]
    assert all(j["status"] == "queued" for j in items)


@pytest.mark.asyncio
async def test_retry_failed_job(auth_client):
    client, _ = auth_client
    _, qid = await _setup(client)

    job_id = (await client.post("/api/jobs/", json={"queue_id": qid, "payload": {"should_fail": True}})).json()["id"]

    # Manually cancel to set failed status
    await client.patch(f"/api/jobs/{job_id}/cancel")

    retry_res = await client.patch(f"/api/jobs/{job_id}/retry")
    assert retry_res.status_code == 200
    assert retry_res.json()["status"] == "queued"
    assert retry_res.json()["retry_count"] == 0


@pytest.mark.asyncio
async def test_cannot_dispatch_to_paused_queue(auth_client):
    client, _ = auth_client
    pid, qid = await _setup(client)

    await client.patch(f"/api/queues/{qid}/pause")
    res = await client.post("/api/jobs/", json={"queue_id": qid, "payload": {"task": "test"}})
    assert res.status_code == 400
    assert "paused" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_single_job(auth_client):
    client, _ = auth_client
    _, qid = await _setup(client)
    job_id = (await client.post("/api/jobs/", json={"queue_id": qid, "payload": {"x": 1}})).json()["id"]
    res = await client.get(f"/api/jobs/{job_id}")
    assert res.status_code == 200
    assert res.json()["id"] == job_id


@pytest.mark.asyncio
async def test_job_not_found(auth_client):
    client, _ = auth_client
    res = await client.get("/api/jobs/99999")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_stats_endpoint(auth_client):
    client, _ = auth_client
    _, qid = await _setup(client)
    await client.post("/api/jobs/", json={"queue_id": qid, "payload": {"task": "x"}})

    res = await client.get("/api/stats/")
    assert res.status_code == 200
    data = res.json()
    assert data["total_jobs"] == 1
    assert data["queued_jobs"] == 1
    assert data["total_queues"] == 1
