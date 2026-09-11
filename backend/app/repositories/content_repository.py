"""Read-only repository for the static content bundle.

Loads ``data/content.json`` once, validates its structure and referential
integrity, and serves parsed Pydantic models to services.
"""

from __future__ import annotations

import json
import logging
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.schemas.content import (
    AnchorItem,
    AnnotationData,
    ClinicalData,
    HomePageContent,
    HotspotData,
    MechanismData,
    SlideData,
    SpecimenData,
)

logger = logging.getLogger(__name__)

# Path relative to *this file*; works regardless of CWD.
_DATA_DIR = Path(__file__).resolve().parent.parent / "data"
_CONTENT_PATH = _DATA_DIR / "content.json"


class ContentValidationError(Exception):
    """Raised when the loaded content bundle fails integrity checks."""

    def __init__(self, errors: list[str]) -> None:
        self.errors = errors
        super().__init__("内容数据校验失败")


class ContentBundle:
    """Parsed, validated, immutable content snapshot."""

    def __init__(self, raw: dict[str, Any]) -> None:
        self.home: HomePageContent = HomePageContent.model_validate(raw["home"])
        self.specimens: list[SpecimenData] = [
            SpecimenData.model_validate(s) for s in raw["specimens"]
        ]
        self.hotspots: list[HotspotData] = [
            HotspotData.model_validate(h) for h in raw["hotspots"]
        ]
        self.slides: list[SlideData] = [
            SlideData.model_validate(s) for s in raw["slides"]
        ]
        self.annotations: list[AnnotationData] = [
            AnnotationData.model_validate(a) for a in raw["annotations"]
        ]
        self.mechanisms: list[MechanismData] = [
            MechanismData.model_validate(m) for m in raw["mechanisms"]
        ]
        self.clinical: list[ClinicalData] = [
            ClinicalData.model_validate(c) for c in raw["clinical"]
        ]
        self.anchors: list[AnchorItem] = [
            AnchorItem.model_validate(a) for a in raw["anchors"]
        ]

        # ---- coordinate bounds ----------------------------------------------
        errors: list[str] = []
        for hotspot in self.hotspots:
            try:
                hotspot.check_bounds()
            except ValueError as exc:
                errors.append(f"invalid_coordinates:{hotspot.id}:{exc}")

        for annotation in self.annotations:
            if annotation.slidePosition:
                try:
                    annotation.slidePosition.check_bounds()
                except ValueError as exc:
                    errors.append(f"invalid_coordinates:{annotation.id}:{exc}")

        # ---- referential / count integrity checks ---------------------------
        errors.extend(_validate_bundle(self))
        if errors:
            raise ContentValidationError(errors)


# ---------------------------------------------------------------------------
# validation helpers
# ---------------------------------------------------------------------------

def _validate_bundle(bundle: ContentBundle) -> list[str]:
    errors: list[str] = []

    record_by_id: dict[str, str] = {}

    def _add_id(id_: str, kind: str) -> None:
        if id_ in record_by_id:
            errors.append(f"duplicate_id:{kind}:{id_}")
            return
        record_by_id[id_] = kind

    for specimen in bundle.specimens:
        _add_id(specimen.id, "specimen")
    for hotspot in bundle.hotspots:
        _add_id(hotspot.id, "hotspot")
    for slide in bundle.slides:
        _add_id(slide.id, "slide")
    for annotation in bundle.annotations:
        _add_id(annotation.id, "annotation")
    for mechanism in bundle.mechanisms:
        _add_id(mechanism.id, "mechanism")
    for clinical in bundle.clinical:
        _add_id(clinical.id, "clinical")
    for anchor in bundle.anchors:
        _add_id(anchor.id, "anchor")

    all_anchor_ids = {anchor.id for anchor in bundle.anchors}

    # hotspot links
    for hotspot in bundle.hotspots:
        if hotspot.anchor not in all_anchor_ids:
            errors.append(f"dangling_link:{hotspot.anchor}")

    # slide links
    for slide in bundle.slides:
        if slide.anchor not in all_anchor_ids:
            errors.append(f"dangling_link:{slide.anchor}")

    # annotation links
    for annotation in bundle.annotations:
        if annotation.anchor not in all_anchor_ids:
            errors.append(f"dangling_link:{annotation.anchor}")
        for target in _anchor_refs(annotation.links.model_dump()):
            if target not in all_anchor_ids:
                errors.append(f"dangling_link:{target}")

    # mechanism links
    for mechanism in bundle.mechanisms:
        if mechanism.anchor not in all_anchor_ids:
            errors.append(f"dangling_link:{mechanism.anchor}")

    # clinical links
    for clinical in bundle.clinical:
        if clinical.anchor not in all_anchor_ids:
            errors.append(f"dangling_link:{clinical.anchor}")

    # anchor links
    for anchor in bundle.anchors:
        if anchor.links:
            for target in anchor.links.values():
                if target not in all_anchor_ids:
                    errors.append(f"dangling_link:{target}")

    # minimum counts
    checks: list[tuple[str, int, int]] = [
        ("home.learningPath", len(bundle.home.learningPath), 1),
        ("specimens", len(bundle.specimens), 1),
        ("hotspots", len(bundle.hotspots), 3),
        ("slides", len(bundle.slides), 3),
        ("annotations", len(bundle.annotations), 3),
        ("mechanisms", len(bundle.mechanisms), 2),
        ("clinical", len(bundle.clinical), 2),
    ]
    for label, actual, minimum in checks:
        if actual < minimum:
            errors.append(f"missing_required:{label}")

    if not any(a.type == "specimen" for a in bundle.anchors):
        errors.append("missing_default_anchor:specimen")

    return errors


def _anchor_refs(links: dict[str, Any]) -> list[str]:
    return [v for v in links.values() if isinstance(v, str)]


# ---------------------------------------------------------------------------
# repository – singleton-ish via lru_cache
# ---------------------------------------------------------------------------

@lru_cache
def load_content_bundle(path: str | None = None) -> ContentBundle:
    """Load, parse and validate the content bundle.

    Cached after first call.  Pass ``path`` in tests to inject an
    alternative fixture; leave ``None`` for the default data file.
    """
    source = path or str(_CONTENT_PATH)
    logger.info("正在加载内容数据：%s", source)

    raw = json.loads(Path(source).read_text(encoding="utf-8"))
    return ContentBundle(raw)


class ContentRepository:
    """Thin accessor over the validated ContentBundle."""

    def __init__(self, bundle: ContentBundle | None = None) -> None:
        self._bundle = bundle or load_content_bundle()

    @property
    def bundle(self) -> ContentBundle:
        return self._bundle

    def get_home(self) -> HomePageContent:
        return self._bundle.home

    def get_specimens(self) -> list[SpecimenData]:
        return list(self._bundle.specimens)

    def get_hotspots_for_specimen(self, specimen_id: str) -> list[HotspotData]:
        specimen = next(
            (s for s in self._bundle.specimens if s.id == specimen_id), None
        )
        if specimen is None:
            return []
        return [h for h in self._bundle.hotspots if h.id in specimen.hotspots]

    def get_slide_by_anchor(self, anchor_id: str) -> SlideData | None:
        return next(
            (s for s in self._bundle.slides if s.anchor == anchor_id), None
        )

    def get_annotation_by_anchor(self, anchor_id: str) -> AnnotationData | None:
        return next(
            (a for a in self._bundle.annotations if a.anchor == anchor_id), None
        )

    def get_mechanism_by_anchor(self, anchor_id: str) -> MechanismData | None:
        return next(
            (m for m in self._bundle.mechanisms if m.anchor == anchor_id), None
        )

    def get_clinical_by_anchor(self, anchor_id: str) -> ClinicalData | None:
        return next(
            (c for c in self._bundle.clinical if c.anchor == anchor_id), None
        )

    def get_annotations_for_slide(self, slide_anchor: str) -> list[AnnotationData]:
        return [
            a
            for a in self._bundle.annotations
            if a.links.slide == slide_anchor
        ]

    def has_anchor(self, anchor_id: str) -> bool:
        return any(a.id == anchor_id for a in self._bundle.anchors)

    def anchor_ids(self) -> list[str]:
        """Return the validated anchor IDs available for AI evidence links."""
        return [anchor.id for anchor in self._bundle.anchors]

    def set_test_bundle(self, bundle: ContentBundle) -> None:
        """Replace the internal bundle (for tests only)."""
        self._bundle = bundle
