"""Unit tests for Pydantic response models in api.models (TDD - RED phase)."""

import pytest


def test_benchmark_row_extra_fields_preserved() -> None:
    """BenchmarkRow with extra fields preserves them in model_dump()."""
    from api.models import BenchmarkRow

    row = BenchmarkRow.model_validate(
        {"id": "x", "MLIP": "y", "Score": 0.9, "custom_metric": 1.23}
    )
    dumped = row.model_dump()
    assert dumped.get("custom_metric") == 1.23, (
        "Extra fields not preserved in BenchmarkRow.model_dump()"
    )


def test_benchmark_row_score_none() -> None:
    """BenchmarkRow with Score=None validates successfully."""
    from api.models import BenchmarkRow

    row = BenchmarkRow.model_validate({"id": "abc", "MLIP": "SomeMLIP", "Score": None})
    assert row.Score is None


def test_meta_serializes_correctly() -> None:
    """Meta(count=3, columns=['a','b']) serializes correctly."""
    from api.models import Meta

    m = Meta(count=3, columns=["a", "b"])
    dumped = m.model_dump()
    assert dumped == {"count": 3, "columns": ["a", "b"]}


def test_categories_response_accepts_data_meta() -> None:
    """CategoriesResponse accepts data+meta shape."""
    from api.models import BenchmarkEntry, CategoriesResponse, CategoryItem, Meta

    resp = CategoriesResponse(
        data=[
            CategoryItem(
                slug="cat1",
                name="Category 1",
                benchmarks=[BenchmarkEntry(slug="b1", name="Bench 1")],
            )
        ],
        meta=Meta(count=1),
    )
    assert resp.meta.count == 1
    assert len(resp.data) == 1


def test_benchmark_table_response_accepts_data_meta() -> None:
    """BenchmarkTableResponse accepts data+meta shape."""
    from api.models import BenchmarkMeta, BenchmarkRow, BenchmarkTableResponse, ColumnDescriptor

    cols = [
        ColumnDescriptor(id="id", name="id"),
        ColumnDescriptor(id="MLIP", name="MLIP"),
        ColumnDescriptor(id="Score", name="Score"),
    ]
    resp = BenchmarkTableResponse(
        data=[BenchmarkRow(id="x", MLIP="y", Score=0.9)],
        meta=BenchmarkMeta(count=1, columns=cols),
    )
    assert resp.meta.count == 1
    assert len(resp.meta.columns) == 3


def test_models_response_accepts_data_meta() -> None:
    """ModelsResponse accepts data+meta shape."""
    from api.models import Meta, ModelEntry, ModelsResponse

    resp = ModelsResponse(
        data=[ModelEntry(id="m1", display_name="Model 1")],
        meta=Meta(count=1),
    )
    assert resp.meta.count == 1
    assert resp.data[0].id == "m1"


def test_health_response_serializes() -> None:
    """HealthResponse(status='ok') serializes to {'status': 'ok'}."""
    from api.models import HealthResponse

    h = HealthResponse(status="ok")
    assert h.model_dump() == {"status": "ok"}


def test_storage_does_not_import_orjson() -> None:
    """Importing api.storage does not use orjson."""
    import ast
    import pathlib

    storage_src = pathlib.Path("api/storage.py").read_text()
    tree = ast.parse(storage_src)
    for node in ast.walk(tree):
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    assert alias.name != "orjson", "orjson found in api/storage.py imports"
            elif isinstance(node, ast.ImportFrom):
                assert node.module != "orjson", "orjson found in api/storage.py imports"


def test_openapi_schema_has_typed_responses() -> None:
    """OpenAPI schema JSON contains references to all key response model names."""
    import json

    from api.index import app

    schema = app.openapi()
    schema_str = json.dumps(schema)

    expected_models = [
        "HealthResponse",
        "CategoriesResponse",
        "BenchmarkTableResponse",
        "ModelsResponse",
    ]
    for model_name in expected_models:
        assert model_name in schema_str, (
            f"OpenAPI schema does not reference '{model_name}' — "
            f"endpoint may be missing a typed return annotation"
        )


def test_no_orjson_in_codebase() -> None:
    """No .py file under api/ or tests/, and pyproject.toml, contains any 'orjson' reference."""
    import pathlib

    repo_root = pathlib.Path(__file__).parent.parent

    # Collect all Python files under api/ and tests/
    # Exclude this file itself — it contains "orjson" in assertion strings intentionally
    this_file = pathlib.Path(__file__).resolve()
    py_files = [
        p for p in list((repo_root / "api").rglob("*.py")) + list((repo_root / "tests").rglob("*.py"))
        if p.resolve() != this_file
    ]
    pyproject = repo_root / "pyproject.toml"

    offending: list[str] = []
    for path in py_files:
        text = path.read_text()
        if "orjson" in text:
            offending.append(str(path.relative_to(repo_root)))

    if pyproject.exists() and "orjson" in pyproject.read_text():
        offending.append("pyproject.toml")

    assert not offending, (
        f"'orjson' found in the following files (must be fully removed): {offending}"
    )
