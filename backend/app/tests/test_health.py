"""Tests for health-check endpoint and global error handling."""

from fastapi.testclient import TestClient


class TestHealthEndpoint:
    """GET /api/health"""

    def test_returns_200_with_correct_fields(self, client: TestClient):
        response = client.get("/api/health")
        assert response.status_code == 200

        data = response.json()
        assert data == {
            "status": "ok",
            "service": "copd-backend",
            "version": "1.0.0",
        }

    def test_response_is_json(self, client: TestClient):
        response = client.get("/api/health")
        assert response.headers["content-type"].startswith("application/json")


class TestUnimplementedRoutes:
    """Requests to /api/* endpoints that don't exist yet."""

    def test_returns_structured_error(self, client: TestClient):
        # A future/unregistered route still triggers the catch-all.
        response = client.get("/api/future/not/implemented")
        assert response.status_code == 404

        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "CONTENT_NOT_FOUND"
        assert "暂未实现" in data["error"]["message"]

    def test_no_stack_trace_in_response(self, client: TestClient):
        response = client.get("/api/nonexistent")
        assert response.status_code == 404
        data = response.json()
        # Must not leak internal paths or exception class names
        body = str(data)
        assert "traceback" not in body.lower()
        assert "File " not in body
        assert "raise " not in body


class TestValidationErrors:
    """Ensure Pydantic validation errors return Chinese messages."""

    def test_invalid_json_body(self, client: TestClient):
        response = client.post(
            "/api/health",  # health is GET-only but the router won't match POST
            content="not json",
            headers={"Content-Type": "application/json"},
        )
        # Falls through to the catch-all which expects JSON
        assert response.status_code == 404

    def test_missing_required_body(self, client: TestClient):
        """If we POST to a route that expects a body, validation should fire.
        At T20 there is no POST route; skip until T22.

        This test exists as a placeholder to remind us to validate 422→中文
        once POST /api/ai/analyze is registered.
        """


class TestCORS:
    """Verify CORS headers for allowed origins."""

    def test_allowed_origin_has_cors_headers(self, client: TestClient):
        response = client.options(
            "/api/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            },
        )
        # FastAPI's CORSMiddleware should add allow-origin
        assert "access-control-allow-origin" in response.headers
        assert (
            response.headers["access-control-allow-origin"] == "http://localhost:5173"
            or response.headers["access-control-allow-origin"] == "*"
        )

    def test_disallowed_origin_missing_cors(self, client: TestClient):
        response = client.options(
            "/api/health",
            headers={
                "Origin": "https://evil.example.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        # Should NOT allow a disallowed origin
        allow_origin = response.headers.get("access-control-allow-origin", "")
        assert allow_origin != "https://evil.example.com"
