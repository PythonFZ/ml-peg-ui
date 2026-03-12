"""Tests for NEB frames endpoint (TDD - Task 2).

Uses nebs/li_diffusion/mace-mp-0b3 as the test model.
The b-band file has 13 frames.
"""

import pytest
from starlette.testclient import TestClient

from api.models import NebFramesResponse, NebFrame


def test_neb_frames_returns_200(test_client: TestClient) -> None:
    """GET /api/v1/nebs/li_diffusion/mace-mp-0b3/b/frames returns 200."""
    response = test_client.get("/api/v1/nebs/li_diffusion/mace-mp-0b3/b/frames")
    assert response.status_code == 200


def test_neb_frames_count(test_client: TestClient) -> None:
    """GET /api/v1/nebs/li_diffusion/mace-mp-0b3/b/frames returns 13 frames."""
    response = test_client.get("/api/v1/nebs/li_diffusion/mace-mp-0b3/b/frames")
    assert response.status_code == 200
    body = NebFramesResponse.model_validate(response.json())
    assert len(body.data) == 13, f"Expected 13 NEB frames, got {len(body.data)}"
    assert body.meta.count == 13


def test_neb_frame_schema(test_client: TestClient) -> None:
    """Each NEB frame has energy, species, positions, and lattice keys."""
    response = test_client.get("/api/v1/nebs/li_diffusion/mace-mp-0b3/b/frames")
    assert response.status_code == 200
    body = response.json()
    for i, frame in enumerate(body["data"]):
        assert "energy" in frame, f"Frame {i} missing 'energy'"
        assert "species" in frame, f"Frame {i} missing 'species'"
        assert "positions" in frame, f"Frame {i} missing 'positions'"
        assert "lattice" in frame, f"Frame {i} missing 'lattice'"
        assert isinstance(frame["energy"], float), f"Frame {i} energy should be float"
        assert isinstance(frame["species"], list), f"Frame {i} species should be list"
        assert isinstance(frame["positions"], list), f"Frame {i} positions should be list"


def test_neb_frame_lattice_present_for_periodic(test_client: TestClient) -> None:
    """NEB frames for li_diffusion have lattice (pbc=T T T)."""
    response = test_client.get("/api/v1/nebs/li_diffusion/mace-mp-0b3/b/frames")
    assert response.status_code == 200
    body = response.json()
    first_frame = body["data"][0]
    assert first_frame["lattice"] is not None, "Expected non-null lattice for periodic NEB"
    assert len(first_frame["lattice"]) == 3, "Expected 3x3 lattice matrix"


def test_neb_frames_model_validates(test_client: TestClient) -> None:
    """NEB response validates cleanly as NebFramesResponse."""
    response = test_client.get("/api/v1/nebs/li_diffusion/mace-mp-0b3/b/frames")
    assert response.status_code == 200
    body = NebFramesResponse.model_validate(response.json())
    assert all(isinstance(f, NebFrame) for f in body.data)


def test_neb_not_found_returns_404(test_client: TestClient) -> None:
    """GET /api/v1/nebs/li_diffusion/nonexistent_model/b/frames returns 404."""
    response = test_client.get("/api/v1/nebs/li_diffusion/nonexistent_model_xyz/b/frames")
    assert response.status_code == 404


def test_neb_invalid_band_returns_404(test_client: TestClient) -> None:
    """GET /api/v1/nebs/li_diffusion/mace-mp-0b3/z/frames returns 404 for unknown band."""
    response = test_client.get("/api/v1/nebs/li_diffusion/mace-mp-0b3/z/frames")
    assert response.status_code == 404


def test_neb_cache_control(test_client: TestClient) -> None:
    """GET /api/v1/nebs/.../frames sets Cache-Control header."""
    from api.index import CACHE_HEADER

    response = test_client.get("/api/v1/nebs/li_diffusion/mace-mp-0b3/b/frames")
    assert response.status_code == 200
    assert "cache-control" in response.headers
    assert response.headers["cache-control"] == CACHE_HEADER


def test_neb_mattersim_underscore_model(test_client: TestClient) -> None:
    """GET /api/v1/nebs/li_diffusion/mattersim-5M/b/frames works (model has underscore in filename)."""
    response = test_client.get("/api/v1/nebs/li_diffusion/mattersim-5M/b/frames")
    assert response.status_code == 200
    body = NebFramesResponse.model_validate(response.json())
    assert len(body.data) > 0, "Expected at least one frame for mattersim-5M"
