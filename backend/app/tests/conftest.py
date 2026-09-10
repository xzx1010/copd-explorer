"""Shared pytest fixtures for the backend test suite."""


import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def client() -> TestClient:
    """Return a synchronous TestClient wrapping our FastAPI app."""
    app = create_app()
    return TestClient(app)
