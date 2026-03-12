"""Tests for get_bytes method on storage backends (TDD - Task 1)."""

import json
from pathlib import Path

import pytest


def test_fs_get_bytes_returns_bytes(tmp_path: Path) -> None:
    """FilesystemBackend.get_bytes returns raw bytes for an existing file."""
    from api.storage import FilesystemBackend

    content = b"raw bytes content"
    test_file = tmp_path / "test.xyz"
    test_file.write_bytes(content)

    backend = FilesystemBackend(base_path=str(tmp_path))
    result = backend.get_bytes("test.xyz")
    assert result == content


def test_fs_get_bytes_not_found(tmp_path: Path) -> None:
    """FilesystemBackend.get_bytes raises FileNotFoundError for missing file."""
    from api.storage import FilesystemBackend

    backend = FilesystemBackend(base_path=str(tmp_path))
    with pytest.raises(FileNotFoundError):
        backend.get_bytes("nonexistent.xyz")


def test_fs_get_bytes_reads_json_file(tmp_path: Path) -> None:
    """FilesystemBackend.get_bytes can read JSON files as raw bytes."""
    from api.storage import FilesystemBackend

    data = {"key": "value"}
    test_file = tmp_path / "data.json"
    test_file.write_bytes(json.dumps(data).encode())

    backend = FilesystemBackend(base_path=str(tmp_path))
    result = backend.get_bytes("data.json")
    assert json.loads(result) == data


def test_minio_backend_has_get_bytes() -> None:
    """MinioBackend class has a get_bytes method defined."""
    from api.storage import MinioBackend

    assert hasattr(MinioBackend, "get_bytes"), "MinioBackend missing get_bytes method"
    import inspect
    sig = inspect.signature(MinioBackend.get_bytes)
    assert "path" in sig.parameters, "get_bytes missing 'path' parameter"


def test_storage_protocol_includes_get_bytes() -> None:
    """StorageBackend protocol includes get_bytes."""
    from api.storage import StorageBackend, FilesystemBackend

    assert hasattr(StorageBackend, "get_bytes"), "StorageBackend protocol missing get_bytes"
    # FilesystemBackend should be a valid StorageBackend
    assert isinstance(FilesystemBackend(base_path="data"), StorageBackend)


def test_new_pydantic_models_defined() -> None:
    """All 7 new Pydantic models are importable from api.models."""
    from api.models import (
        DiatomicCurve,
        DiatomicIndexResponse,
        DiatomicCurvesResponse,
        StructureData,
        StructureResponse,
        NebFrame,
        NebFramesResponse,
    )
    # Validate shape of each model
    curve = DiatomicCurve(model="mace-mp-0b3", pair="H-H", distance=[1.0, 2.0], energy=[-1.0, -2.0])
    assert curve.model == "mace-mp-0b3"
    assert curve.pair == "H-H"
    assert curve.distance == [1.0, 2.0]
    assert curve.energy == [-1.0, -2.0]


def test_diatomic_index_response_model() -> None:
    """DiatomicIndexResponse wraps a dict[str, list[str]] with meta."""
    from api.models import DiatomicIndexResponse, Meta

    resp = DiatomicIndexResponse(
        data={"H-H": ["mace-mp-0b3", "mace-mp-0a"], "H-He": ["mace-mp-0b3"]},
        meta=Meta(count=2),
    )
    assert len(resp.data) == 2
    assert resp.meta.count == 2


def test_structure_response_model() -> None:
    """StructureResponse wraps StructureData with xyz_string and has_pbc."""
    from api.models import StructureResponse, StructureData

    resp = StructureResponse(data=StructureData(xyz_string="3\nPBC\nH 0 0 0", has_pbc=False))
    assert resp.data.xyz_string == "3\nPBC\nH 0 0 0"
    assert resp.data.has_pbc is False


def test_neb_frames_response_model() -> None:
    """NebFramesResponse wraps list[NebFrame] with meta."""
    from api.models import NebFramesResponse, NebFrame, Meta

    frame = NebFrame(
        energy=-758.4,
        species=["Li", "O"],
        positions=[[0.0, 0.0, 0.0], [1.0, 1.0, 1.0]],
        lattice=[[10.0, 0.0, 0.0], [0.0, 10.0, 0.0], [0.0, 0.0, 10.0]],
    )
    resp = NebFramesResponse(data=[frame], meta=Meta(count=1))
    assert len(resp.data) == 1
    assert resp.data[0].energy == -758.4
    assert resp.data[0].lattice is not None


def test_neb_frame_lattice_can_be_none() -> None:
    """NebFrame lattice field accepts None for non-periodic structures."""
    from api.models import NebFrame

    frame = NebFrame(
        energy=-1.0,
        species=["H"],
        positions=[[0.0, 0.0, 0.0]],
        lattice=None,
    )
    assert frame.lattice is None
