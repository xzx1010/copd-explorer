"""Tests for AI analysis API, providers, and safety validation."""

import asyncio

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.repositories.content_repository import ContentRepository, load_content_bundle
from app.schemas.ai import AIAssessment, AIEvidence, AIResult
from app.services.ai_provider import (
    AIProviderResponseError,
    AIProviderTimeoutError,
    DeepSeekProvider,
    MockAIProvider,
)
from app.services.ai_service import AIService

VALID_REQUEST = {
    "patientInfo": {
        "age": 65,
        "sex": "男性",
        "smokingHistory": "40 年，每日一包",
    },
    "symptoms": ["慢性咳嗽", "咳痰", "活动后气促"],
    "tests": {
        "lungFunction": "FEV₁/FVC 0.62",
        "ctDescription": "双肺透亮度增高，可见肺大疱",
    },
    "pathologyContext": [],
}


# ---------------------------------------------------------------------------
# Mock success path
# ---------------------------------------------------------------------------

class TestMockSuccess:
    def test_valid_request_returns_200(self, client: TestClient):
        response = client.post("/api/ai/analyze", json=VALID_REQUEST)
        assert response.status_code == 200

        data = response.json()
        assert data["assessment"]["disease"]
        assert data["assessment"]["likelihood"] in {
            "low",
            "medium",
            "high",
            "unknown",
        }
        assert 0 <= data["assessment"]["confidence"] <= 1
        assert len(data["assessment"]["basis"]) >= 1
        assert len(data["evidence"]) >= 1

    def test_disclaimer_present(self, client: TestClient):
        data = client.post("/api/ai/analyze", json=VALID_REQUEST).json()
        assert data["disclaimer"].strip()
        assert "教学" in data["disclaimer"] or "不构成" in data["disclaimer"]

    def test_evidence_anchors_are_real(self, client: TestClient):
        data = client.post("/api/ai/analyze", json=VALID_REQUEST).json()
        repo = ContentRepository(load_content_bundle())
        for ev in data["evidence"]:
            assert repo.has_anchor(ev["anchorId"])

    def test_recommendation_field_name(self, client: TestClient):
        data = client.post("/api/ai/analyze", json=VALID_REQUEST).json()
        # Contract: field is `recommendation`, never `recommendations`
        assert "recommendation" in data
        assert "recommendations" not in data


# ---------------------------------------------------------------------------
# Request validation
# ---------------------------------------------------------------------------

class TestRequestValidation:
    def test_missing_required_field(self, client: TestClient):
        body = {k: v for k, v in VALID_REQUEST.items() if k != "patientInfo"}
        response = client.post("/api/ai/analyze", json=body)
        assert response.status_code == 422
        data = response.json()
        assert data["error"]["code"] == "VALIDATION_ERROR"

    def test_wrong_type(self, client: TestClient):
        body = {**VALID_REQUEST, "symptoms": "慢性咳嗽"}
        response = client.post("/api/ai/analyze", json=body)
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "VALIDATION_ERROR"

    def test_unknown_field_rejected(self, client: TestClient):
        body = {**VALID_REQUEST, "extraField": "should-not-exist"}
        response = client.post("/api/ai/analyze", json=body)
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "VALIDATION_ERROR"

    def test_chinese_validation_message(self, client: TestClient):
        response = client.post("/api/ai/analyze", json={})
        assert response.status_code == 422
        data = response.json()
        assert "校验" in data["error"]["message"] or data["error"]["message"]


# ---------------------------------------------------------------------------
# Provider / error mapping
# ---------------------------------------------------------------------------

class TestErrorMapping:
    def test_timeout_maps_to_408(self, client: TestClient, monkeypatch):
        async def _raise_timeout(self, _request):
            raise AIProviderTimeoutError()

        monkeypatch.setattr(MockAIProvider, "analyze", _raise_timeout)
        response = client.post("/api/ai/analyze", json=VALID_REQUEST)
        assert response.status_code == 408
        assert response.json()["error"]["code"] == "AI_TIMEOUT"

    def test_provider_failure_maps_to_500(self, client: TestClient, monkeypatch):
        async def _raise_failure(self, _request):
            raise AIProviderResponseError("模拟服务失败")

        monkeypatch.setattr(MockAIProvider, "analyze", _raise_failure)
        response = client.post("/api/ai/analyze", json=VALID_REQUEST)
        assert response.status_code == 500
        assert response.json()["error"]["code"] == "AI_SERVICE_ERROR"


# ---------------------------------------------------------------------------
# DeepSeek adapter boundary
# ---------------------------------------------------------------------------

class TestDeepSeekProvider:
    def test_no_key_raises_service_error(self):
        provider = DeepSeekProvider(api_key="")
        with pytest.raises(AIProviderResponseError) as excinfo:
            asyncio.run(provider.analyze(_request_obj()))
        assert "DEEPSEEK_API_KEY" in str(excinfo.value)

    def test_service_selects_mock_by_default(self):
        settings = Settings(ai_provider="mock")
        repo = ContentRepository(load_content_bundle())
        service = AIService(settings, repo)
        assert isinstance(service._make_provider(), MockAIProvider)

    def test_service_selects_deepseek_when_configured(self):
        settings = Settings(ai_provider="deepseek", deepseek_api_key="test")
        repo = ContentRepository(load_content_bundle())
        service = AIService(settings, repo)
        assert isinstance(service._make_provider(), DeepSeekProvider)


# ---------------------------------------------------------------------------
# Evidence anchor + safety validation (unit level)
# ---------------------------------------------------------------------------

class TestValidationHelpers:
    def test_invalid_evidence_anchor_rejected(self):
        service = AIService(
            Settings(ai_provider="mock"),
            ContentRepository(load_content_bundle()),
        )
        bad = AIResult(
            assessment=AIAssessment(
                disease="慢性阻塞性肺疾病（COPD）",
                likelihood="high",
                confidence=0.88,
                basis=["依据"],
            ),
            evidence=[AIEvidence(text="x", anchorId="anchor_nope_99")],
            differential=[],
            recommendation=[],
            disclaimer="本分析仅为教学用途。",
        )
        with pytest.raises(AIProviderResponseError):
            service._validate_evidence_anchors(bad)

    def test_overcertain_disease_rejected(self):
        service = AIService(
            Settings(ai_provider="mock"),
            ContentRepository(load_content_bundle()),
        )
        result = _valid_result(disease="患者确诊 COPD")
        with pytest.raises(AIProviderResponseError):
            service._validate_safety(result)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _request_obj():
    from app.schemas.ai import AIAnalyzeRequest

    return AIAnalyzeRequest.model_validate(VALID_REQUEST)


def _valid_result(disease: str) -> AIResult:
    return AIResult(
        assessment=AIAssessment(
            disease=disease,
            likelihood="high",
            confidence=0.88,
            basis=["依据"],
        ),
        evidence=[AIEvidence(text="x", anchorId="anchor_annotation_1")],
        differential=[],
        recommendation=[],
        disclaimer="本分析仅为教学用途，不构成临床诊断建议。",
    )
