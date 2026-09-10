"""Pydantic schemas matching the frontend Zod schemas in
`frontend/src/types/ai.ts`.

Field names are camelCase.  All models use ``extra = "forbid"`` to prevent
contract drift.  The anchor-id pattern mirrors the frontend anchorIdSchema.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

ANCHOR_ID_RE = r"^[a-z0-9_]+$"

Likelihood = Literal["low", "medium", "high", "unknown"]


# ---------------------------------------------------------------------------
# Request
# ---------------------------------------------------------------------------

class PatientInfo(BaseModel):
    age: int = Field(..., gt=0)
    sex: str = Field(..., min_length=1)
    smokingHistory: str = Field(..., min_length=1)

    model_config = {"extra": "forbid"}


class Tests(BaseModel):
    lungFunction: str | None = Field(default=None)
    ctDescription: str | None = Field(default=None)

    model_config = {"extra": "forbid"}


class AIAnalyzeRequest(BaseModel):
    patientInfo: PatientInfo
    symptoms: list[str] = Field(..., min_length=1)
    tests: Tests
    pathologyContext: list[str] = Field(default_factory=list)

    model_config = {"extra": "forbid"}


# ---------------------------------------------------------------------------
# Response
# ---------------------------------------------------------------------------

class AIAssessment(BaseModel):
    disease: str = Field(..., min_length=1)
    likelihood: Likelihood
    confidence: float = Field(..., ge=0, le=1)
    basis: list[str] = Field(..., min_length=1)

    model_config = {"extra": "forbid"}


class AIEvidence(BaseModel):
    text: str = Field(..., min_length=1)
    anchorId: str = Field(..., min_length=1, pattern=ANCHOR_ID_RE)

    model_config = {"extra": "forbid"}


class AIResult(BaseModel):
    assessment: AIAssessment
    evidence: list[AIEvidence] = Field(..., min_length=1)
    differential: list[str] = Field(default_factory=list)
    recommendation: list[str] = Field(default_factory=list)
    disclaimer: str = Field(..., min_length=1)

    model_config = {"extra": "forbid"}
