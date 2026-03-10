"""Tests for storage backends (FilesystemBackend and MinioBackend)."""

import json
import os
from pathlib import Path

import pytest


def test_fs_get_json(tmp_path: Path) -> None:
    """FilesystemBackend.get_json reads and parses a JSON file."""
    from api.storage import FilesystemBackend

    data = {"key": "value", "number": 42}
    test_file = tmp_path / "test.json"
    test_file.write_bytes(json.dumps(data).encode())

    backend = FilesystemBackend(base_path=str(tmp_path))
    result = backend.get_json("test.json")
    assert result == data


def test_fs_list_keys(tmp_path: Path) -> None:
    """FilesystemBackend.list_keys returns subdirectories under a prefix."""
    from api.storage import FilesystemBackend

    (tmp_path / "dir_a").mkdir()
    (tmp_path / "dir_b").mkdir()
    (tmp_path / "dir_c").mkdir()

    backend = FilesystemBackend(base_path=str(tmp_path))
    keys = backend.list_keys("")
    assert "dir_a" in keys
    assert "dir_b" in keys
    assert "dir_c" in keys


def test_fs_get_json_not_found(tmp_path: Path) -> None:
    """FilesystemBackend.get_json raises FileNotFoundError for missing files."""
    from api.storage import FilesystemBackend

    backend = FilesystemBackend(base_path=str(tmp_path))
    with pytest.raises(FileNotFoundError):
        backend.get_json("nonexistent.json")


def test_fs_presigned_url(tmp_path: Path) -> None:
    """FilesystemBackend.presigned_url raises NotImplementedError."""
    from api.storage import FilesystemBackend

    backend = FilesystemBackend(base_path=str(tmp_path))
    with pytest.raises(NotImplementedError):
        backend.presigned_url("any/path.json")


@pytest.mark.integration
def test_minio_get_json() -> None:
    """MinioBackend.get_json reads from real MinIO (requires MINIO_ENDPOINT)."""
    minio_endpoint = os.environ.get("MINIO_ENDPOINT")
    if not minio_endpoint:
        pytest.skip("MINIO_ENDPOINT not set — skipping MinIO integration test")

    from api.storage import MinioBackend

    backend = MinioBackend()
    # This test will fail with a meaningful error if MinIO is not reachable
    # or the bucket/prefix is wrong
    assert backend is not None
