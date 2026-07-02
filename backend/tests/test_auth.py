"""Tests for authentication endpoints."""
import pytest


@pytest.mark.asyncio
async def test_register_success(client):
    res = await client.post("/api/auth/register", json={
        "username": "karan",
        "email": "karan@example.com",
        "password": "secret123"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["username"] == "karan"
    assert data["email"] == "karan@example.com"
    assert "id" in data
    assert "hashed_password" not in data  # never expose password


@pytest.mark.asyncio
async def test_register_duplicate_username(client):
    payload = {"username": "karan", "email": "karan@example.com", "password": "secret123"}
    await client.post("/api/auth/register", json=payload)
    res = await client.post("/api/auth/register", json=payload)
    assert res.status_code == 400
    assert "already registered" in res.json()["detail"]


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    await client.post("/api/auth/register", json={
        "username": "user1", "email": "same@example.com", "password": "pass123"
    })
    res = await client.post("/api/auth/register", json={
        "username": "user2", "email": "same@example.com", "password": "pass456"
    })
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_login_success(client):
    await client.post("/api/auth/register", json={
        "username": "karan", "email": "karan@example.com", "password": "secret123"
    })
    res = await client.post(
        "/api/auth/login",
        data={"username": "karan", "password": "secret123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post("/api/auth/register", json={
        "username": "karan", "email": "karan@example.com", "password": "secret123"
    })
    res = await client.post(
        "/api/auth/login",
        data={"username": "karan", "password": "wrongpass"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_me_authenticated(auth_client):
    client, _ = auth_client
    res = await client.get("/api/auth/me")
    assert res.status_code == 200
    assert res.json()["username"] == "testuser"


@pytest.mark.asyncio
async def test_me_unauthenticated(client):
    res = await client.get("/api/auth/me")
    assert res.status_code == 401
