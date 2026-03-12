"""Tests for diatomic index and curves API endpoints (TDD - Task 2)."""

import pytest
from starlette.testclient import TestClient

from api.models import DiatomicIndexResponse, DiatomicCurvesResponse


def test_diatomic_index_returns_200(test_client: TestClient) -> None:
    """GET /api/v1/diatomics/index returns 200 with dict data."""
    response = test_client.get("/api/v1/diatomics/index")
    assert response.status_code == 200
    body = response.json()
    assert "data" in body, "Response missing 'data' key"
    assert isinstance(body["data"], dict), "Expected data to be a dict"
    assert len(body["data"]) > 0, "Expected at least one element pair in index"


def test_diatomic_index_response_schema(test_client: TestClient) -> None:
    """GET /api/v1/diatomics/index response validates as DiatomicIndexResponse."""
    response = test_client.get("/api/v1/diatomics/index")
    assert response.status_code == 200
    body = DiatomicIndexResponse.model_validate(response.json())
    assert body.meta.count == len(body.data)
    # H-H pair should be present (all 19 models have it)
    assert "H-H" in body.data, "Expected H-H pair in diatomic index"
    assert len(body.data["H-H"]) > 0, "Expected at least one model for H-H pair"


def test_diatomic_index_has_5000_plus_pairs(test_client: TestClient) -> None:
    """GET /api/v1/diatomics/index returns 5000+ element pairs."""
    response = test_client.get("/api/v1/diatomics/index")
    assert response.status_code == 200
    body = response.json()
    assert len(body["data"]) > 5000, f"Expected 5000+ pairs, got {len(body['data'])}"


def test_diatomic_index_cache_control(test_client: TestClient) -> None:
    """GET /api/v1/diatomics/index sets Cache-Control header."""
    from api.index import CACHE_HEADER

    response = test_client.get("/api/v1/diatomics/index")
    assert response.status_code == 200
    assert "cache-control" in response.headers
    assert response.headers["cache-control"] == CACHE_HEADER


def test_diatomic_curves_valid_pair(test_client: TestClient) -> None:
    """GET /api/v1/diatomics/curves/H-H returns 200 with curves list."""
    response = test_client.get("/api/v1/diatomics/curves/H-H")
    assert response.status_code == 200
    body = DiatomicCurvesResponse.model_validate(response.json())
    assert len(body.data) > 0, "Expected at least one curve for H-H"
    assert body.meta.count == len(body.data)


def test_diatomic_curves_response_fields(test_client: TestClient) -> None:
    """GET /api/v1/diatomics/curves/H-H returns curves with correct fields."""
    response = test_client.get("/api/v1/diatomics/curves/H-H")
    assert response.status_code == 200
    body = response.json()
    curve = body["data"][0]
    assert "model" in curve, "Curve missing 'model' field"
    assert "pair" in curve, "Curve missing 'pair' field"
    assert "distance" in curve, "Curve missing 'distance' field"
    assert "energy" in curve, "Curve missing 'energy' field"
    assert isinstance(curve["distance"], list), "distance should be a list"
    assert isinstance(curve["energy"], list), "energy should be a list"
    assert len(curve["distance"]) > 0, "distance array should not be empty"
    assert len(curve["energy"]) == len(curve["distance"]), "energy and distance must be same length"


def test_diatomic_curves_invalid_pair_returns_404(test_client: TestClient) -> None:
    """GET /api/v1/diatomics/curves/Zz-Zz returns 404 for unknown pair."""
    response = test_client.get("/api/v1/diatomics/curves/Zz-Zz")
    assert response.status_code == 404


def test_diatomic_curves_cache_control(test_client: TestClient) -> None:
    """GET /api/v1/diatomics/curves/H-H sets Cache-Control header."""
    from api.index import CACHE_HEADER

    response = test_client.get("/api/v1/diatomics/curves/H-H")
    assert response.status_code == 200
    assert "cache-control" in response.headers
    assert response.headers["cache-control"] == CACHE_HEADER
