"""AI service – selects a provider and validates its output."""

from __future__ import annotations

import logging

from app.core.config import Settings
from app.repositories.content_repository import ContentRepository
from app.schemas.ai import AIAnalyzeRequest, AIResult
from app.services.ai_provider import (
    AIProvider,
    AIProviderResponseError,
    DeepSeekProvider,
    MockAIProvider,
)

logger = logging.getLogger(__name__)


class AIService:
    """Orchestrates AI analysis with safe provider selection and validation."""

    def __init__(self, settings: Settings, repo: ContentRepository) -> None:
        self._settings = settings
        self._repo = repo

    def _make_provider(self) -> AIProvider:
        if self._settings.ai_provider == "deepseek":
            return DeepSeekProvider(
                api_key=self._settings.deepseek_api_key,
                timeout_seconds=self._settings.ai_timeout_seconds,
            )
        # Default (mock) – deterministic teaching fixture
        return MockAIProvider()

    async def analyze(self, request: AIAnalyzeRequest) -> AIResult:
        provider = self._make_provider()
        result = await provider.analyze(request)

        # Safety checks before returning to the frontend
        self._validate_evidence_anchors(result)
        self._validate_safety(result)

        return result

    # ------------------------------------------------------------------
    # Validation helpers
    # ------------------------------------------------------------------

    def _validate_evidence_anchors(self, result: AIResult) -> None:
        """Ensure every evidence anchor references a real, displayable anchor."""
        missing = [
            ev.anchorId
            for ev in result.evidence
            if not self._repo.has_anchor(ev.anchorId)
        ]
        if missing:
            logger.warning(
                "AI 返回了不存在或不可展示的 Anchor：%s",
                ", ".join(missing),
            )
            raise AIProviderResponseError(
                "AI 返回的证据引用无效，无法安全展示结果。"
            )

    def _validate_safety(self, result: AIResult) -> None:
        """Minimal over-certainty guard.

        The frontend renders disclaimer as plain text; we only reject when the
        disease label reads as a definitive real-world diagnosis.  This is a
        teaching aid, not a clinical tool.
        """
        disease = result.assessment.disease
        if "确诊" in disease or "明确诊断" in disease:
            raise AIProviderResponseError(
                "AI 返回了过度确定的诊断表述，已拒绝展示。"
            )
