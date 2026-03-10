"""Tests for all FastAPI endpoints in api.index."""

import fastapi
import pytest
from starlette.testclient import TestClient


def test_app_exists() -> None:
    """The FastAPI app is importable and is a FastAPI instance."""
    from api.index import app

    assert isinstance(app, fastapi.FastAPI)


def test_health(test_client: TestClient) -> None:
    """GET /api/v1/health returns 200 with {status: 'ok'}."""
    response = test_client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"


def test_categories(test_client: TestClient) -> None:
    """GET /api/v1/categories returns 200 with data array of at least 10 categories."""
    response = test_client.get("/api/v1/categories")
    assert response.status_code == 200
    body = response.json()
    assert "data" in body
    assert isinstance(body["data"], list)
    # data/ has 17 top-level dirs minus assets = 16 categories
    assert len(body["data"]) >= 10, (
        f"Expected at least 10 categories, got {len(body['data'])}"
    )
    for cat in body["data"]:
        assert "slug" in cat, f"Category missing 'slug': {cat}"
        assert "name" in cat, f"Category missing 'name': {cat}"
        assert "benchmarks" in cat, f"Category missing 'benchmarks': {cat}"


def test_categories_embed_benchmarks(test_client: TestClient) -> None:
    """At least one category has non-empty benchmarks with slug and name keys."""
    response = test_client.get("/api/v1/categories")
    assert response.status_code == 200
    body = response.json()
    categories_with_benchmarks = [
        cat for cat in body["data"] if len(cat["benchmarks"]) > 0
    ]
    assert len(categories_with_benchmarks) >= 1, (
        "No categories have embedded benchmarks"
    )
    for bench in categories_with_benchmarks[0]["benchmarks"]:
        assert "slug" in bench, f"Benchmark missing 'slug': {bench}"
        assert "name" in bench, f"Benchmark missing 'name': {bench}"


def test_benchmark_table(test_client: TestClient) -> None:
    """GET /api/v1/benchmarks/37conf8/table returns 200 with data rows and meta.columns."""
    response = test_client.get("/api/v1/benchmarks/37conf8/table")
    assert response.status_code == 200
    body = response.json()
    assert "data" in body
    assert isinstance(body["data"], list)
    assert len(body["data"]) > 0, "Expected at least one row in metrics table"

    # Each row must have the standard fields
    first_row = body["data"][0]
    assert "id" in first_row, f"Row missing 'id': {first_row}"
    assert "MLIP" in first_row, f"Row missing 'MLIP': {first_row}"
    assert "Score" in first_row, f"Row missing 'Score': {first_row}"

    # meta.columns must be a list
    assert "meta" in body
    assert "columns" in body["meta"], f"meta missing 'columns': {body['meta']}"
    assert isinstance(body["meta"]["columns"], list)
    assert len(body["meta"]["columns"]) > 0


def test_benchmark_table_404(test_client: TestClient) -> None:
    """GET /api/v1/benchmarks/nonexistent/table returns 404."""
    response = test_client.get("/api/v1/benchmarks/this-benchmark-does-not-exist/table")
    assert response.status_code == 404


def test_models(test_client: TestClient) -> None:
    """GET /api/v1/models returns 200 with data array of models with id and display_name."""
    response = test_client.get("/api/v1/models")
    assert response.status_code == 200
    body = response.json()
    assert "data" in body
    assert isinstance(body["data"], list)
    assert len(body["data"]) > 0, "Expected at least one model"

    for model in body["data"][:5]:  # Spot-check first 5
        assert "id" in model, f"Model missing 'id': {model}"
        assert "display_name" in model, f"Model missing 'display_name': {model}"


def test_envelope_shape(test_client: TestClient) -> None:
    """All list endpoints return {data: [...], meta: {count: N}} envelope shape."""
    endpoints = [
        "/api/v1/categories",
        "/api/v1/benchmarks/37conf8/table",
        "/api/v1/models",
    ]
    for endpoint in endpoints:
        response = test_client.get(endpoint)
        assert response.status_code == 200, f"Expected 200 for {endpoint}, got {response.status_code}"
        body = response.json()
        assert "data" in body, f"Missing 'data' key in response from {endpoint}"
        assert "meta" in body, f"Missing 'meta' key in response from {endpoint}"
        assert "count" in body["meta"], f"Missing 'meta.count' in response from {endpoint}"
        assert isinstance(body["data"], list), f"'data' is not a list in response from {endpoint}"
        assert body["meta"]["count"] == len(body["data"]), (
            f"meta.count ({body['meta']['count']}) != len(data) ({len(body['data'])}) for {endpoint}"
        )


def test_figure_stub(test_client: TestClient) -> None:
    """GET /api/v1/benchmarks/{slug}/figures/{figure} returns 501 (not yet implemented)."""
    response = test_client.get("/api/v1/benchmarks/37conf8/figures/37conf8")
    assert response.status_code == 501
