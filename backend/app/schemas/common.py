"""Shared Pydantic schemas used across multiple routers."""

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """GET /api/health response."""

    status: str = Field(default="ok", examples=["ok"])
    service: str = Field(default="copd-backend", examples=["copd-backend"])
    version: str = Field(default="1.0.0", examples=["1.0.0"])
