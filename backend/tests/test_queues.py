"""Tests for queue management endpoints."""
import pytest


async def _create_project(client, name="test-project"):
    res = await client.post("/api/projects/", json={"name": name})
    return res.json()["id"]


@pytest.mark.asyncio
async def test_create_queue(auth_client):
    client, _ = auth_client
    pid = await _create_project(client)
    res = await client.post("/api/queues/", json={
        "name": "email-queue", "project_id": pid,
        "priority": "high", "concurrency_limit": 10, "retry_policy": "exponential"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "email-queue"
    assert data["priority"] == "high"
    assert data["concurrency_limit"] == 10
    assert data["status"] == "active"


@pytest.mark.asyncio
async def test_list_queues(auth_client):
    client, _ = auth_client
    pid = await _create_project(client)
    await client.post("/api/queues/", json={"name": "q1", "project_id": pid})
    await client.post("/api/queues/", json={"name": "q2", "project_id": pid})
    res = await client.get(f"/api/queues/?project_id={pid}")
    assert res.status_code == 200
    assert len(res.json()) == 2


@pytest.mark.asyncio
async def test_pause_and_resume_queue(auth_client):
    client, _ = auth_client
    pid = await _create_project(client)
    qid = (await client.post("/api/queues/", json={"name": "q1", "project_id": pid})).json()["id"]

    pause_res = await client.patch(f"/api/queues/{qid}/pause")
    assert pause_res.status_code == 200
    assert pause_res.json()["status"] == "paused"

    resume_res = await client.patch(f"/api/queues/{qid}/resume")
    assert resume_res.status_code == 200
    assert resume_res.json()["status"] == "active"


@pytest.mark.asyncio
async def test_delete_queue(auth_client):
    client, _ = auth_client
    pid = await _create_project(client)
    qid = (await client.post("/api/queues/", json={"name": "q1", "project_id": pid})).json()["id"]
    del_res = await client.delete(f"/api/queues/{qid}")
    assert del_res.status_code == 200
    list_res = await client.get(f"/api/queues/?project_id={pid}")
    assert list_res.json() == []


@pytest.mark.asyncio
async def test_queue_not_found_for_other_user(client):
    # Register two users
    for u, e in [("u1", "u1@t.com"), ("u2", "u2@t.com")]:
        await client.post("/api/auth/register", json={"username": u, "email": e, "password": "pass"})

    t1 = (await client.post("/api/auth/login", data={"username": "u1", "password": "pass"},
                             headers={"Content-Type": "application/x-www-form-urlencoded"})).json()["access_token"]
    t2 = (await client.post("/api/auth/login", data={"username": "u2", "password": "pass"},
                             headers={"Content-Type": "application/x-www-form-urlencoded"})).json()["access_token"]

    pid = (await client.post("/api/projects/", json={"name": "p1"},
                              headers={"Authorization": f"Bearer {t1}"})).json()["id"]
    qid = (await client.post("/api/queues/", json={"name": "q1", "project_id": pid},
                              headers={"Authorization": f"Bearer {t1}"})).json()["id"]

    # User 2 tries to pause User 1's queue
    res = await client.patch(f"/api/queues/{qid}/pause", headers={"Authorization": f"Bearer {t2}"})
    assert res.status_code == 404
