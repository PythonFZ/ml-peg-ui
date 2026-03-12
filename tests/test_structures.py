"""Tests for structure endpoint (TDD - Task 2).

Uses supramolecular/PLF547/mace-mp-0b3/10GS_01_complex.xyz as the test file.
pbc="F F F" in that file means has_pbc=False.
"""

import pytest
from starlette.testclient import TestClient

from api.models import StructureResponse


def test_structure_endpoint_returns_200(test_client: TestClient) -> None:
    """GET /api/v1/structures/plf547/mace-mp-0b3/10GS_01_complex.xyz returns 200."""
    response = test_client.get("/api/v1/structures/plf547/mace-mp-0b3/10GS_01_complex.xyz")
    assert response.status_code == 200


def test_structure_response_schema(test_client: TestClient) -> None:
    """GET /api/v1/structures/... validates as StructureResponse."""
    response = test_client.get("/api/v1/structures/plf547/mace-mp-0b3/10GS_01_complex.xyz")
    assert response.status_code == 200
    body = StructureResponse.model_validate(response.json())
    assert isinstance(body.data.xyz_string, str), "xyz_string should be a string"
    assert len(body.data.xyz_string) > 0, "xyz_string should not be empty"
    assert isinstance(body.data.has_pbc, bool), "has_pbc should be a bool"


def test_structure_has_pbc_false_for_molecular(test_client: TestClient) -> None:
    """PLF547 structures have pbc=F so has_pbc should be False."""
    response = test_client.get("/api/v1/structures/plf547/mace-mp-0b3/10GS_01_complex.xyz")
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["has_pbc"] is False, "Expected has_pbc=False for molecular structure"


def test_structure_xyz_string_contains_atoms(test_client: TestClient) -> None:
    """The returned xyz_string starts with atom count line."""
    response = test_client.get("/api/v1/structures/plf547/mace-mp-0b3/10GS_01_complex.xyz")
    assert response.status_code == 200
    body = response.json()
    xyz = body["data"]["xyz_string"]
    first_line = xyz.strip().split("\n")[0].strip()
    assert first_line.isdigit(), f"Expected first line to be atom count, got: {first_line!r}"


def test_structure_not_found_returns_404(test_client: TestClient) -> None:
    """GET /api/v1/structures/plf547/mace-mp-0b3/nonexistent.xyz returns 404."""
    response = test_client.get("/api/v1/structures/plf547/mace-mp-0b3/nonexistent.xyz")
    assert response.status_code == 404


def test_structure_benchmark_not_found_returns_404(test_client: TestClient) -> None:
    """GET /api/v1/structures/nonexistent_benchmark/model/file.xyz returns 404."""
    response = test_client.get("/api/v1/structures/nonexistent_benchmark_xyz/model/file.xyz")
    assert response.status_code == 404


def test_structure_cache_control(test_client: TestClient) -> None:
    """GET /api/v1/structures/... sets Cache-Control header."""
    from api.index import CACHE_HEADER

    response = test_client.get("/api/v1/structures/plf547/mace-mp-0b3/10GS_01_complex.xyz")
    assert response.status_code == 200
    assert "cache-control" in response.headers
    assert response.headers["cache-control"] == CACHE_HEADER
