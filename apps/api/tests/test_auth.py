import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register(client: AsyncClient):
    response = await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User",
        "role": "patient"
    })
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"

@pytest.mark.asyncio
async def test_login(client: AsyncClient):
    # Setup user
    await client.post("/api/auth/register", json={
        "email": "login@example.com",
        "password": "password123",
        "full_name": "Login User",
        "role": "patient"
    })
    
    response = await client.post("/api/auth/login", data={
        "username": "login@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
