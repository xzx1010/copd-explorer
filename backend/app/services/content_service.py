"""Content service – assembles ExplorerContext for any anchor."""

from __future__ import annotations

import logging

from app.repositories.content_repository import ContentRepository
from app.schemas.content import (
    AnnotationData,
    ClinicalData,
    ExplorerContext,
    HotspotData,
    MechanismData,
    SlideData,
    SpecimenData,
)

logger = logging.getLogger(__name__)


class ContentService:
    """Orchestrates cross-entity resolution for the Explorer page."""

    def __init__(self, repo: ContentRepository) -> None:
        self._repo = repo

    def get_home_content(self) -> object:
        """Return the raw HomePageContent dict.

        The router will cast it through its ``response_model``.
        """
        return self._repo.get_home()

    def get_context(self, anchor_id: str) -> ExplorerContext:
        """Build the full ExplorerContext for *anchor_id*.

        Logic mirrors the frontend ``StaticContentRepository.getContext()``.
        """
        if not self._repo.has_anchor(anchor_id):
            return ExplorerContext(
                anchor=anchor_id,
                specimen=None,
                hotspots=[],
                slide=None,
                slideAnnotations=[],
                annotation=None,
                mechanism=None,
                clinical=None,
            )

        specimens = self._repo.get_specimens()
        specimen: SpecimenData | None = specimens[0] if specimens else None
        hotspots: list[HotspotData] = (
            self._repo.get_hotspots_for_specimen(specimen.id)
            if specimen
            else []
        )

        # Direct lookups
        slide: SlideData | None = self._repo.get_slide_by_anchor(anchor_id)
        annotation: AnnotationData | None = self._repo.get_annotation_by_anchor(anchor_id)
        mechanism: MechanismData | None = self._repo.get_mechanism_by_anchor(anchor_id)
        clinical: ClinicalData | None = self._repo.get_clinical_by_anchor(anchor_id)

        # Fallback via annotation links
        fallback_slide: SlideData | None = None
        fallback_mechanism: MechanismData | None = None
        fallback_clinical: ClinicalData | None = None

        if annotation:
            if annotation.links.slide:
                fallback_slide = self._repo.get_slide_by_anchor(
                    annotation.links.slide
                )
            if annotation.links.mechanism:
                fallback_mechanism = self._repo.get_mechanism_by_anchor(
                    annotation.links.mechanism
                )
            if annotation.links.clinical:
                fallback_clinical = self._repo.get_clinical_by_anchor(
                    annotation.links.clinical
                )

        resolved_slide = slide or fallback_slide
        resolved_mechanism = mechanism or fallback_mechanism
        resolved_clinical = clinical or fallback_clinical

        slide_annotations: list[AnnotationData] = (
            self._repo.get_annotations_for_slide(resolved_slide.anchor)
            if resolved_slide
            else []
        )

        return ExplorerContext(
            anchor=anchor_id,
            specimen=specimen,
            hotspots=hotspots,
            slide=resolved_slide,
            slideAnnotations=slide_annotations,
            annotation=annotation,
            mechanism=resolved_mechanism,
            clinical=resolved_clinical,
        )
