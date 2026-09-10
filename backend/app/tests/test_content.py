"""Tests for content API and Anchor validation."""

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.repositories.content_repository import (
    ContentBundle,
    ContentValidationError,
)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def default_bundle() -> ContentBundle:
    data = Path(__file__).parent.parent / "data" / "content.json"
    return ContentBundle(json.loads(data.read_text(encoding="utf-8")))


# ---------------------------------------------------------------------------
# GET /api/content/home
# ---------------------------------------------------------------------------

class TestHomeContent:
    def test_returns_200_and_expected_shape(self, client: TestClient):
        response = client.get("/api/content/home")
        assert response.status_code == 200

        data = response.json()
        assert data["title"] == "基于证据的 COPD 病理学习"
        assert data["subtitle"]
        assert isinstance(data["learningPath"], list)
        assert len(data["learningPath"]) >= 1
        assert data["learningPath"][0]["id"] == "anchor_specimen"

    def test_learning_path_items_have_required_fields(self, client: TestClient):
        data = client.get("/api/content/home").json()
        for item in data["learningPath"]:
            assert set(item.keys()) >= {"id", "type", "name"}


# ---------------------------------------------------------------------------
# GET /api/content/anchor/{anchorId}
# ---------------------------------------------------------------------------

class TestAnchorContext:
    def test_specimen_anchor_returns_full_context(self, client: TestClient):
        response = client.get("/api/content/anchor/anchor_specimen")
        assert response.status_code == 200

        data = response.json()
        assert data["anchor"] == "anchor_specimen"
        assert data["specimen"] is not None
        assert data["specimen"]["id"] == "specimen_1"
        assert len(data["hotspots"]) == 3

    def test_annotation_anchor_returns_mechanism_and_clinical(
        self, client: TestClient
    ):
        response = client.get("/api/content/anchor/anchor_annotation_1")
        assert response.status_code == 200

        data = response.json()
        assert data["annotation"] is not None
        assert data["annotation"]["id"] == "annotation_1"
        assert data["mechanism"] is not None
        assert data["mechanism"]["id"] == "mechanism_1"
        assert data["clinical"] is not None
        assert data["clinical"]["id"] == "clinical_1"

    @pytest.mark.parametrize(
        "anchor_id",
        ["anchor_annotation_1", "anchor_annotation_2", "anchor_annotation_3"],
    )
    def test_all_three_annotation_anchors_resolve(
        self, client: TestClient, anchor_id: str
    ):
        response = client.get(f"/api/content/anchor/{anchor_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["anchor"] == anchor_id
        assert data["annotation"] is not None

    def test_unknown_valid_anchor_returns_empty_context(self, client: TestClient):
        response = client.get("/api/content/anchor/anchor_nope_99")
        assert response.status_code == 200

        data = response.json()
        assert data["anchor"] == "anchor_nope_99"
        assert data["specimen"] is None
        assert data["hotspots"] == []
        assert data["slide"] is None
        assert data["slideAnnotations"] == []
        assert data["annotation"] is None
        assert data["mechanism"] is None
        assert data["clinical"] is None

    def test_invalid_anchor_returns_400_chinese(self, client: TestClient):
        response = client.get("/api/content/anchor/Anchor-1")
        assert response.status_code == 400

        data = response.json()
        assert data["error"]["code"] == "INVALID_REQUEST"
        assert "格式不合法" in data["error"]["message"]


# ---------------------------------------------------------------------------
# Content validation
# ---------------------------------------------------------------------------

class TestContentValidation:
    def test_default_bundle_is_valid(self, default_bundle: ContentBundle):
        # Loading the default bundle in the fixture already runs validation;
        # reaching this point without raising proves validity.
        assert default_bundle.home.title

    def test_duplicate_id_detected(self):
        raw = _load_default_dict()
        # duplicate a hotspot id
        raw["hotspots"][1]["id"] = raw["hotspots"][0]["id"]
        with pytest.raises(ContentValidationError) as excinfo:
            ContentBundle(raw)
        assert any("duplicate_id" in e for e in excinfo.value.errors)

    def test_dangling_link_detected(self):
        raw = _load_default_dict()
        raw["hotspots"][0]["anchor"] = "anchor_does_not_exist"
        with pytest.raises(ContentValidationError) as excinfo:
            ContentBundle(raw)
        assert any("dangling_link" in e for e in excinfo.value.errors)

    def test_coordinate_out_of_bounds_detected(self):
        raw = _load_default_dict()
        raw["hotspots"][0]["x"] = 0.95
        raw["hotspots"][0]["width"] = 0.5  # x + width = 1.45 > 1
        with pytest.raises(ContentValidationError) as excinfo:
            ContentBundle(raw)
        # bounds violation surfaces as a validation error
        assert excinfo.value.errors


def _load_default_dict() -> dict:
    data = Path(__file__).parent.parent / "data" / "content.json"
    return json.loads(data.read_text(encoding="utf-8"))
