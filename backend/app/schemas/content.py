"""Pydantic schemas matching the frontend Zod schemas in
`frontend/src/types/content.ts` and `frontend/src/types/anchor.ts`.

All models use ``extra = "forbid"`` to prevent accidental contract drift.
Field names are camelCase to match the frontend directly.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

# ---------------------------------------------------------------------------
# Anchor – matches frontend anchorIdSchema / anchorItemSchema
# ---------------------------------------------------------------------------

ANCHOR_ID_RE = r"^[a-z0-9_]+$"

AnchorType = Literal["specimen", "slide", "annotation", "mechanism", "clinical", "ai_evidence"]


class AnchorItem(BaseModel):
    """A single entry in the learning-path / anchor registry."""

    id: str = Field(..., min_length=1, pattern=ANCHOR_ID_RE)
    type: AnchorType
    name: str = Field(..., min_length=1)
    links: dict[str, str] | None = Field(default=None)

    model_config = {"extra": "forbid"}


# ---------------------------------------------------------------------------
# Home page
# ---------------------------------------------------------------------------

class HomePageContent(BaseModel):
    """GET /api/content/home response – must match frontend homePageContentSchema."""

    title: str = Field(..., min_length=1)
    subtitle: str = Field(..., min_length=1)
    learningPath: list[AnchorItem]

    model_config = {"extra": "forbid"}


# ---------------------------------------------------------------------------
# Coordinates
# ---------------------------------------------------------------------------

class SlidePosition(BaseModel):
    x: float = Field(..., ge=0, le=1)
    y: float = Field(..., ge=0, le=1)
    width: float = Field(..., ge=0, le=1)
    height: float = Field(..., ge=0, le=1)

    model_config = {"extra": "forbid"}

    @field_validator("width")
    @classmethod
    def x_within_bounds(cls, value: float, info) -> float:
        # bounds check at overall validation time
        return value

    def check_bounds(self) -> None:
        if self.x + self.width > 1 + 1e-9:
            raise ValueError("x + width 超出 1")
        if self.y + self.height > 1 + 1e-9:
            raise ValueError("y + height 超出 1")


# ---------------------------------------------------------------------------
# Hotspot
# ---------------------------------------------------------------------------

class HotspotData(BaseModel):
    id: str = Field(..., min_length=1)
    label: str = Field(..., min_length=1)
    anchor: str = Field(..., min_length=1, pattern=ANCHOR_ID_RE)
    x: float = Field(..., ge=0, le=1)
    y: float = Field(..., ge=0, le=1)
    width: float = Field(..., ge=0, le=1)
    height: float = Field(..., ge=0, le=1)

    model_config = {"extra": "forbid"}

    def check_bounds(self) -> None:
        if self.x + self.width > 1 + 1e-9:
            raise ValueError(f"hotspot {self.id}: x + width 超出 1")
        if self.y + self.height > 1 + 1e-9:
            raise ValueError(f"hotspot {self.id}: y + height 超出 1")


# ---------------------------------------------------------------------------
# Specimen
# ---------------------------------------------------------------------------

class SpecimenData(BaseModel):
    id: str = Field(..., min_length=1)
    type: Literal["specimen"]
    title: str = Field(..., min_length=1)
    image: str = Field(..., min_length=1)
    altText: str | None = Field(default=None)
    hotspots: list[str] = Field(..., min_length=1)

    model_config = {"extra": "forbid"}


# ---------------------------------------------------------------------------
# Slide
# ---------------------------------------------------------------------------

class SlideData(BaseModel):
    id: str = Field(..., min_length=1)
    type: Literal["slide"]
    title: str = Field(..., min_length=1)
    image: str = Field(..., min_length=1)
    altText: str | None = Field(default=None)
    anchor: str = Field(..., min_length=1, pattern=ANCHOR_ID_RE)

    model_config = {"extra": "forbid"}


# ---------------------------------------------------------------------------
# Annotation
# ---------------------------------------------------------------------------

class AnnotationLinks(BaseModel):
    specimen: str | None = None
    slide: str | None = None
    mechanism: str | None = None
    clinical: str | None = None

    model_config = {"extra": "forbid"}


class AnnotationData(BaseModel):
    id: str = Field(..., min_length=1)
    type: Literal["annotation"]
    name: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    anchor: str = Field(..., min_length=1, pattern=ANCHOR_ID_RE)
    slidePosition: SlidePosition | None = None
    links: AnnotationLinks

    model_config = {"extra": "forbid"}


# ---------------------------------------------------------------------------
# Mechanism
# ---------------------------------------------------------------------------

class MechanismNode(BaseModel):
    id: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)

    model_config = {"extra": "forbid"}


class MechanismData(BaseModel):
    id: str = Field(..., min_length=1)
    type: Literal["mechanism"]
    title: str = Field(..., min_length=1)
    anchor: str = Field(..., min_length=1, pattern=ANCHOR_ID_RE)
    summary: str = Field(..., min_length=1)
    nodes: list[MechanismNode] = Field(..., min_length=1)

    model_config = {"extra": "forbid"}


# ---------------------------------------------------------------------------
# Clinical
# ---------------------------------------------------------------------------

class ClinicalData(BaseModel):
    id: str = Field(..., min_length=1)
    type: Literal["clinical"]
    title: str = Field(..., min_length=1)
    anchor: str = Field(..., min_length=1, pattern=ANCHOR_ID_RE)
    summary: str = Field(..., min_length=1)
    impact: str = Field(..., min_length=1)
    symptoms: list[str] = Field(..., min_length=1)
    treatment: list[str] = Field(..., min_length=1)
    prevention: list[str] = Field(..., min_length=1)

    model_config = {"extra": "forbid"}


# ---------------------------------------------------------------------------
# Explorer context – the aggregated response for a given anchor
# ---------------------------------------------------------------------------

class ExplorerContext(BaseModel):
    """GET /api/content/anchor/{anchorId} response.

    Must match frontend ``explorerContextSchema``.  Nullable fields use
    ``None``, arrays default to ``[]``.
    """

    anchor: str = Field(..., min_length=1, pattern=ANCHOR_ID_RE)
    specimen: SpecimenData | None = None
    hotspots: list[HotspotData] = Field(default_factory=list)
    slide: SlideData | None = None
    slideAnnotations: list[AnnotationData] = Field(default_factory=list)
    annotation: AnnotationData | None = None
    mechanism: MechanismData | None = None
    clinical: ClinicalData | None = None

    model_config = {"extra": "forbid"}
