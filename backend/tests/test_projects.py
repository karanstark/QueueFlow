"""Tests for project management endpoints."""
import pytest


@pytest.mark.asyncio
async def test_create_project(auth_client):
    client, _ = auth_client
    res = await client.post("/api/projects/", json={"name": "my-project", "description": "Test"})
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "my-project"
    assert "api_key" in data


@pytest.mark.asyncio
async def test_list_projects_empty(auth_client):
    client, _ = auth_client
    res = await client.get("/api/projects/")
    assert res.status_code == 200
    assert res.json() == []


@pytest.mark.asyncio
async def test_list_projects(auth_client):
    client, _ = auth_client
    await client.post("/api/projects/", json={"name": "proj-1"})
    await client.post("/api/projects/", json={"name": "proj-2"})
    res = await client.get("/api/projects/")
    assert res.status_code == 200
    assert len(res.json()) == 2


@pytest.mark.asyncio
async def test_delete_project(auth_client):
    client, _ = auth_client
    create_res = await client.post("/api/projects/", json={"name": "to-delete"})
    project_id = create_res.json()["id"]
    del_res = await client.delete(f"/api/projects/{project_id}")
    assert del_res.status_code == 200
    list_res = await client.get("/api/projects/")
    assert len(list_res.json()) == 0


@pytest.mark.asyncio
async def test_delete_nonexistent_project(auth_client):
    client, _ = auth_client
    res = await client.delete("/api/projects/99999")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_projects_isolated_per_user(client):
    """User A should not see User B's projects."""
    # Register User A
    await client.post("/api/auth/register", json={
        "username": "userA", "email": "a@test.com", "password": "pass123"
    })
    res_a = await client.post(
        "/api/auth/login",
        data={"username": "userA", "password": "pass123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    token_a = res_a.json()["access_token"]

    # Register User B
    await client.post("/api/auth/register", json={
        "username": "userB", "email": "b@test.com", "password": "pass456"
    })
    res_b = await client.post(
        "/api/auth/login",
        data={"username": "userB", "password": "pass456"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    token_b = res_b.json()["access_token"]

    # User A creates a project
    await client.post("/api/projects/", json={"name": "A-project"},
                      headers={"Authorization": f"Bearer {token_a}"})

    # User B should see 0 projects
    res = await client.get("/api/projects/", headers={"Authorization": f"Bearer {token_b}"})
    assert res.json() == []
