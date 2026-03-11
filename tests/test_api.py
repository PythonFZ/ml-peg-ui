"""Tests for all FastAPI endpoints in api.index."""

import fastapi
import pytest
from starlette.testclient import TestClient

from api.models import (
    BenchmarkTableResponse,
    CategoriesResponse,
    FigureItem,
    FigureListResponse,
    HealthResponse,
    ModelsResponse,
)


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
    HealthResponse.model_validate(body)


def test_categories(test_client: TestClient) -> None:
    """GET /api/v1/categories returns 200 with data array of at least 10 categories."""
    response = test_client.get("/api/v1/categories")
    assert response.status_code == 200
    body = CategoriesResponse.model_validate(response.json())
    # data/ has 17 top-level dirs minus assets = 16 categories
    assert len(body.data) >= 10, (
        f"Expected at least 10 categories, got {len(body.data)}"
    )
    assert body.meta.count == len(body.data)


def test_categories_embed_benchmarks(test_client: TestClient) -> None:
    """At least one category has non-empty benchmarks with slug and name keys."""
    response = test_client.get("/api/v1/categories")
    assert response.status_code == 200
    body = CategoriesResponse.model_validate(response.json())
    categories_with_benchmarks = [cat for cat in body.data if len(cat.benchmarks) > 0]
    assert len(categories_with_benchmarks) >= 1, (
        "No categories have embedded benchmarks"
    )
    for bench in categories_with_benchmarks[0].benchmarks:
        assert bench.slug, f"Benchmark missing 'slug': {bench}"
        assert bench.name, f"Benchmark missing 'name': {bench}"


def test_benchmark_table(test_client: TestClient) -> None:
    """GET /api/v1/benchmarks/37conf8/table returns 200 with data rows and meta.columns."""
    response = test_client.get("/api/v1/benchmarks/37conf8/table")
    assert response.status_code == 200
    body = BenchmarkTableResponse.model_validate(response.json())
    assert len(body.data) > 0, "Expected at least one row in metrics table"

    # Each row must have the standard fields
    first_row = body.data[0]
    assert first_row.id, f"Row missing 'id': {first_row}"
    assert first_row.MLIP, f"Row missing 'MLIP': {first_row}"

    # meta.columns must be a list
    assert body.meta.columns is not None, f"meta missing 'columns': {body.meta}"
    assert isinstance(body.meta.columns, list)
    assert len(body.meta.columns) > 0


def test_benchmark_table_404(test_client: TestClient) -> None:
    """GET /api/v1/benchmarks/nonexistent/table returns 404."""
    response = test_client.get("/api/v1/benchmarks/this-benchmark-does-not-exist/table")
    assert response.status_code == 404


def test_models(test_client: TestClient) -> None:
    """GET /api/v1/models returns 200 with data array of models with id and display_name."""
    response = test_client.get("/api/v1/models")
    assert response.status_code == 200
    body = ModelsResponse.model_validate(response.json())
    assert len(body.data) > 0, "Expected at least one model"
    assert body.data[0].id, f"Model missing 'id': {body.data[0]}"


def test_envelope_shape(test_client: TestClient) -> None:
    """All list endpoints return {data: [...], meta: {count: N}} envelope shape."""
    endpoints_and_models = [
        ("/api/v1/categories", CategoriesResponse),
        ("/api/v1/benchmarks/37conf8/table", BenchmarkTableResponse),
        ("/api/v1/models", ModelsResponse),
    ]
    for endpoint, Model in endpoints_and_models:
        response = test_client.get(endpoint)
        assert response.status_code == 200, f"Expected 200 for {endpoint}, got {response.status_code}"
        body = Model.model_validate(response.json())
        assert body.meta.count == len(body.data), (
            f"meta.count ({body.meta.count}) != len(data) ({len(body.data)}) for {endpoint}"
        )


def test_benchmark_figures_index(test_client: TestClient) -> None:
    """GET /api/v1/benchmarks/37conf8/figures returns 200 with figure list."""
    response = test_client.get("/api/v1/benchmarks/37conf8/figures")
    assert response.status_code == 200
    body = FigureListResponse.model_validate(response.json())
    assert len(body.data) >= 1, "Expected at least one figure for 37conf8"
    assert body.meta.count == len(body.data)
    for item in body.data:
        assert item.slug, f"FigureItem missing slug: {item}"
        assert item.name, f"FigureItem missing name: {item}"


def test_benchmark_figures_index_404(test_client: TestClient) -> None:
    """GET /api/v1/benchmarks/nonexistent/figures returns 404."""
    response = test_client.get("/api/v1/benchmarks/nonexistent/figures")
    assert response.status_code == 404


def test_benchmark_figure_json(test_client: TestClient) -> None:
    """GET /api/v1/benchmarks/37conf8/figures/37conf8 returns 200 with Plotly JSON."""
    response = test_client.get("/api/v1/benchmarks/37conf8/figures/37conf8")
    assert response.status_code == 200
    body = response.json()
    assert "data" in body, "Response missing 'data' key"
    assert isinstance(body["data"], dict), "Expected 'data' to be a dict (Plotly payload)"
    # Plotly JSON has a top-level 'data' key with trace list
    assert "data" in body["data"], "Plotly payload missing 'data' key (traces array)"


def test_benchmark_figure_404(test_client: TestClient) -> None:
    """GET /api/v1/benchmarks/37conf8/figures/nonexistent_figure returns 404."""
    response = test_client.get("/api/v1/benchmarks/37conf8/figures/nonexistent_figure")
    assert response.status_code == 404


def test_benchmark_figures_empty(test_client: TestClient) -> None:
    """GET /api/v1/benchmarks/phonons/figures returns 200 with empty data and count 0."""
    response = test_client.get("/api/v1/benchmarks/phonons/figures")
    assert response.status_code == 200
    body = FigureListResponse.model_validate(response.json())
    assert body.data == [], f"Expected empty figures list for phonons, got {body.data}"
    assert body.meta.count == 0


def test_benchmark_figure_cache_headers(test_client: TestClient) -> None:
    """GET /api/v1/benchmarks/37conf8/figures/37conf8 includes Cache-Control header."""
    from api.index import CACHE_HEADER

    response = test_client.get("/api/v1/benchmarks/37conf8/figures/37conf8")
    assert response.status_code == 200
    assert "cache-control" in response.headers, "Response missing Cache-Control header"
    assert response.headers["cache-control"] == CACHE_HEADER


def test_benchmark_table_thresholds(test_client: TestClient) -> None:
    """GET /api/v1/benchmarks/37conf8/table response includes meta.thresholds with good/bad per metric."""
    response = test_client.get("/api/v1/benchmarks/37conf8/table")
    assert response.status_code == 200
    body = response.json()
    assert "thresholds" in body["meta"], "meta missing 'thresholds'"
    thresholds = body["meta"]["thresholds"]
    assert isinstance(thresholds, dict), "meta.thresholds must be a dict"
    # At least one threshold entry should exist with good/bad fields
    assert len(thresholds) > 0, "Expected at least one threshold entry"
    first_key = next(iter(thresholds))
    entry = thresholds[first_key]
    assert "good" in entry, f"Threshold entry missing 'good': {entry}"
    assert "bad" in entry, f"Threshold entry missing 'bad': {entry}"


def test_benchmark_table_tooltip_header(test_client: TestClient) -> None:
    """GET /api/v1/benchmarks/37conf8/table response includes meta.tooltip_header dict."""
    response = test_client.get("/api/v1/benchmarks/37conf8/table")
    assert response.status_code == 200
    body = response.json()
    assert "tooltip_header" in body["meta"], "meta missing 'tooltip_header'"
    tooltip_header = body["meta"]["tooltip_header"]
    assert isinstance(tooltip_header, dict), "meta.tooltip_header must be a dict"


def test_benchmark_table_weights(test_client: TestClient) -> None:
    """GET /api/v1/benchmarks/37conf8/table response includes meta.weights dict."""
    response = test_client.get("/api/v1/benchmarks/37conf8/table")
    assert response.status_code == 200
    body = response.json()
    assert "weights" in body["meta"], "meta missing 'weights'"
    weights = body["meta"]["weights"]
    assert isinstance(weights, dict), "meta.weights must be a dict"


def test_benchmark_table_columns_structured(test_client: TestClient) -> None:
    """GET /api/v1/benchmarks/37conf8/table response includes meta.columns as list of {name, id} objects."""
    response = test_client.get("/api/v1/benchmarks/37conf8/table")
    assert response.status_code == 200
    body = response.json()
    columns = body["meta"]["columns"]
    assert isinstance(columns, list), "meta.columns must be a list"
    assert len(columns) > 0, "Expected at least one column descriptor"
    first_col = columns[0]
    assert "name" in first_col, f"Column descriptor missing 'name': {first_col}"
    assert "id" in first_col, f"Column descriptor missing 'id': {first_col}"


def test_get_object_size_returns_positive_int() -> None:
    """FilesystemBackend.get_object_size returns a positive int for an existing file."""
    from api.storage import FilesystemBackend

    backend = FilesystemBackend(base_path="data")
    size = backend.get_object_size("conformers/37Conf8/figure_37conf8.json")
    assert isinstance(size, int), f"Expected int, got {type(size)}"
    assert size > 0, f"Expected positive file size, got {size}"


def test_get_object_size_raises_file_not_found() -> None:
    """FilesystemBackend.get_object_size raises FileNotFoundError for missing file."""
    from api.storage import FilesystemBackend

    backend = FilesystemBackend(base_path="data")
    with pytest.raises(FileNotFoundError):
        backend.get_object_size("nonexistent/path/file.json")


def test_figure_item_model_validates() -> None:
    """FigureItem validates {slug, name}."""
    item = FigureItem.model_validate({"slug": "37conf8", "name": "37conf8"})
    assert item.slug == "37conf8"
    assert item.name == "37conf8"


def test_figure_list_response_validates() -> None:
    """FigureListResponse validates {data: [...], meta: {count: 1}}."""
    from api.models import Meta

    response = FigureListResponse.model_validate({
        "data": [{"slug": "37conf8", "name": "37conf8"}],
        "meta": {"count": 1},
    })
    assert len(response.data) == 1
    assert response.meta.count == 1


def test_figure_response_validates() -> None:
    """FigureResponse validates {data: {plotly dict}}."""
    from api.models import FigureResponse

    response = FigureResponse.model_validate({
        "data": {"data": [], "layout": {}}
    })
    assert isinstance(response.data, dict)


def test_benchmark_table_cache_headers(test_client: TestClient) -> None:
    """GET /api/v1/benchmarks/37conf8/table includes Cache-Control header matching CACHE_HEADER."""
    from api.index import CACHE_HEADER

    response = test_client.get("/api/v1/benchmarks/37conf8/table")
    assert response.status_code == 200
    assert "cache-control" in response.headers, "Response missing Cache-Control header"
    assert response.headers["cache-control"] == CACHE_HEADER, (
        f"Expected Cache-Control: {CACHE_HEADER}, got: {response.headers.get('cache-control')}"
    )
