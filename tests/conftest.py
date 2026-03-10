"""Shared pytest fixtures for the ml-peg-api test suite."""

import json
import tempfile
from pathlib import Path

import pytest
from starlette.testclient import TestClient


@pytest.fixture
def tmp_data_dir(tmp_path: Path) -> Path:
    """Create a temporary directory with a mock benchmark data structure.

    Mirrors the real data layout: {category}/{benchmark}/{benchmark}_metrics_table.json
    Returns the root path. Cleaned up automatically by pytest after the test.
    """
    category_dir = tmp_path / "conformers"
    benchmark_dir = category_dir / "37conf8"
    benchmark_dir.mkdir(parents=True)

    metrics = [
        {"id": "test-model", "MLIP": "test-model-D3", "Score": 0.85, "metric1": 1.23},
        {"id": "test-model-2", "MLIP": "test-model-2-D3", "Score": 0.72, "metric1": 2.10},
        {"id": "test-model-3", "MLIP": "test-model-3-D3", "Score": 0.91, "metric1": 0.88},
    ]
    metrics_file = benchmark_dir / "37conf8_metrics_table.json"
    metrics_file.write_text(json.dumps({"data": metrics, "columns": []}))

    return tmp_path


@pytest.fixture(scope="session")
def test_client() -> TestClient:
    """Provide a TestClient for the FastAPI app.

    Uses the real data/ directory so endpoint tests exercise actual data paths.
    Session-scoped so the lifespan runs once for all tests in the session.
    """
    from api.index import app

    with TestClient(app) as client:
        yield client
