"""FastAPI application for ml-peg benchmark leaderboard API.

Serves benchmark data with 5 endpoints:
- GET /api/v1/health      — liveness check
- GET /api/v1/categories  — all categories with embedded benchmark lists
- GET /api/v1/benchmarks/{slug}/table — metrics table for a benchmark
- GET /api/v1/benchmarks/{slug}/figures/{figure_slug} — figure data (stubbed)
- GET /api/v1/models      — unique models across all benchmarks

Storage is abstracted via api.storage: FilesystemBackend in local dev,
MinioBackend in production (when MINIO_ENDPOINT is set).
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException, Request, Response
from fastapi.responses import RedirectResponse

from api.models import (
    BenchmarkMeta,
    BenchmarkRow,
    BenchmarkTableResponse,
    CategoriesResponse,
    CategoryItem,
    ColumnDescriptor,
    ColumnTooltip,
    FigureItem,
    FigureListResponse,
    FigureResponse,
    HealthResponse,
    Meta,
    ModelEntry,
    ModelsResponse,
    Threshold,
)
from api.storage import StorageBackend, create_storage

# Load local env overrides (no-op if absent)
load_dotenv(".env.local")

logger = logging.getLogger(__name__)

CACHE_HEADER = "s-maxage=3600, stale-while-revalidate=86400"

# Categories to skip when scanning the data directory
_SKIP_CATEGORIES = {"assets"}


def _slugify(name: str) -> str:
    """Convert a directory name to a lowercase slug."""
    return name.lower()


def _humanize(name: str) -> str:
    """Convert a directory name to a human-readable label.

    Replaces underscores with spaces and applies title case.
    """
    return name.replace("_", " ").title()


def _build_category_index(storage: StorageBackend) -> tuple[list[dict], dict[str, str]]:
    """Scan the storage backend and build the category/benchmark index.

    Returns:
        categories: List of category dicts suitable for the /categories endpoint.
        slug_map: Dict mapping benchmark_slug -> "{category}/{BenchmarkDir}"
    """
    categories: list[dict] = []
    slug_map: dict[str, str] = {}

    top_level = storage.list_keys("")
    for category_name in sorted(top_level):
        if category_name in _SKIP_CATEGORIES:
            continue

        benchmark_dirs = storage.list_keys(category_name)
        benchmarks: list[dict] = []

        for bench_dir in sorted(benchmark_dirs):
            # Only include directories (benchmark directories), not files
            bench_slug = _slugify(bench_dir)
            bench_path = f"{category_name}/{bench_dir}"
            slug_map[bench_slug] = bench_path
            benchmarks.append({"slug": bench_slug, "name": bench_dir})

        if benchmarks:
            categories.append(
                {
                    "slug": _slugify(category_name),
                    "name": _humanize(category_name),
                    "benchmarks": benchmarks,
                }
            )

    return categories, slug_map


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    """Build storage backend and category index at startup."""
    storage = create_storage()
    categories, slug_map = _build_category_index(storage)

    app.state.storage = storage
    app.state.categories = categories
    app.state.slug_map = slug_map
    app.state.models_cache = None  # lazily computed on first /models request

    logger.info(
        "API ready: %d categories, %d benchmarks indexed",
        len(categories),
        len(slug_map),
    )

    yield

    # Cleanup (nothing to close for filesystem backend)


router = APIRouter(prefix="/api/v1")


@router.get("/health")
async def health() -> HealthResponse:
    """Liveness check endpoint."""
    return HealthResponse(status="ok")


@router.get("/categories")
async def categories(request: Request, response: Response) -> CategoriesResponse:
    """Return all categories with embedded benchmark lists."""
    response.headers["Cache-Control"] = CACHE_HEADER
    cats = request.app.state.categories
    return CategoriesResponse(
        data=[CategoryItem.model_validate(c) for c in cats],
        meta=Meta(count=len(cats)),
    )


@router.get("/benchmarks/{slug}/table")
async def benchmark_table(slug: str, request: Request, response: Response) -> BenchmarkTableResponse:
    """Return the metrics table for a specific benchmark.

    The slug is case-insensitive (e.g. '37conf8' maps to 'conformers/37Conf8').
    Returns 404 if the benchmark slug is not found.
    """
    slug_map: dict[str, str] = request.app.state.slug_map
    storage: StorageBackend = request.app.state.storage

    bench_path = slug_map.get(slug.lower())
    if bench_path is None:
        raise HTTPException(status_code=404, detail=f"Benchmark '{slug}' not found")

    # File path: {category}/{BenchmarkDir}/{slug}_metrics_table.json
    metrics_file = f"{bench_path}/{slug.lower()}_metrics_table.json"
    try:
        payload = storage.get_json(metrics_file)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Metrics table not found for '{slug}'")

    rows: list[dict] = payload.get("data", payload) if isinstance(payload, dict) else payload

    # Extract rich metadata from the raw JSON (default to empty if missing)
    raw_columns: list[dict] = payload.get("columns", []) if isinstance(payload, dict) else []
    raw_thresholds: dict = payload.get("thresholds", {}) if isinstance(payload, dict) else {}
    raw_tooltip_header: dict = payload.get("tooltip_header", {}) if isinstance(payload, dict) else {}
    raw_weights: dict = payload.get("weights", {}) if isinstance(payload, dict) else {}

    # Validate structured fields
    columns_validated = [ColumnDescriptor.model_validate(c) for c in raw_columns if isinstance(c, dict)]
    thresholds_validated = {k: Threshold.model_validate(v) for k, v in raw_thresholds.items() if isinstance(v, dict)}
    tooltip_header_validated: dict[str, ColumnTooltip | str] = {
        k: ColumnTooltip.model_validate(v) if isinstance(v, dict) else v
        for k, v in raw_tooltip_header.items()
    }
    weights_validated = {k: float(v) for k, v in raw_weights.items() if isinstance(v, (int, float))}

    rows_validated = [BenchmarkRow.model_validate(r) for r in rows]
    response.headers["Cache-Control"] = CACHE_HEADER
    return BenchmarkTableResponse(
        data=rows_validated,
        meta=BenchmarkMeta(
            count=len(rows_validated),
            columns=columns_validated if columns_validated else None,
            thresholds=thresholds_validated,
            tooltip_header=tooltip_header_validated,
            weights=weights_validated,
        ),
    )


@router.get("/benchmarks/{slug}/figures")
async def benchmark_figures_index(slug: str, request: Request, response: Response) -> FigureListResponse:
    """Return a list of available figure slugs for the given benchmark.

    Returns 404 if the benchmark slug is not found.
    Returns an empty list if the benchmark has no figures.
    """
    slug_map: dict[str, str] = request.app.state.slug_map
    storage: StorageBackend = request.app.state.storage

    bench_path = slug_map.get(slug.lower())
    if bench_path is None:
        raise HTTPException(status_code=404, detail=f"Benchmark '{slug}' not found")

    all_keys = storage.list_keys(bench_path)
    figure_items: list[FigureItem] = []
    for key in all_keys:
        # Figure files are named figure_{slug}.json
        if key.startswith("figure_") and key.endswith(".json"):
            figure_slug = key[len("figure_"):-len(".json")]
            figure_items.append(FigureItem(slug=figure_slug, name=figure_slug))

    response.headers["Cache-Control"] = CACHE_HEADER
    return FigureListResponse(data=figure_items, meta=Meta(count=len(figure_items)))


_FIGURE_SIZE_LIMIT = 4 * 1024 * 1024  # 4 MB


@router.get("/benchmarks/{slug}/figures/{figure_slug}")
async def benchmark_figure(slug: str, figure_slug: str, request: Request, response: Response):
    """Return figure data for a specific benchmark figure.

    For files exceeding 4 MB, returns a 307 redirect to a presigned URL.
    Otherwise, returns the Plotly JSON payload inline.
    Returns 404 if benchmark slug or figure slug is not found.
    """
    slug_map: dict[str, str] = request.app.state.slug_map
    storage: StorageBackend = request.app.state.storage

    bench_path = slug_map.get(slug.lower())
    if bench_path is None:
        raise HTTPException(status_code=404, detail=f"Benchmark '{slug}' not found")

    figure_file = f"{bench_path}/figure_{figure_slug}.json"

    try:
        size = storage.get_object_size(figure_file)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Figure '{figure_slug}' not found for benchmark '{slug}'")

    if size > _FIGURE_SIZE_LIMIT:
        url = storage.presigned_url(figure_file)
        return RedirectResponse(url=url, status_code=307)

    payload = storage.get_json(figure_file)
    response.headers["Cache-Control"] = CACHE_HEADER
    return FigureResponse(data=payload)


@router.get("/models")
async def models(request: Request, response: Response) -> ModelsResponse:
    """Return all unique models derived from all benchmark metrics tables.

    Results are cached after the first request.
    """
    if request.app.state.models_cache is not None:
        response.headers["Cache-Control"] = CACHE_HEADER
        model_entries = [ModelEntry.model_validate(m) for m in request.app.state.models_cache]
        return ModelsResponse(data=model_entries, meta=Meta(count=len(model_entries)))

    storage: StorageBackend = request.app.state.storage
    slug_map: dict[str, str] = request.app.state.slug_map

    seen_ids: set[str] = set()
    model_list: list[dict] = []

    for bench_slug, bench_path in slug_map.items():
        metrics_file = f"{bench_path}/{bench_slug}_metrics_table.json"
        try:
            payload = storage.get_json(metrics_file)
            rows: list[dict] = payload.get("data", payload) if isinstance(payload, dict) else payload
            for row in rows:
                model_id = row.get("id", "")
                if model_id and model_id not in seen_ids:
                    seen_ids.add(model_id)
                    model_list.append(
                        {
                            "id": model_id,
                            "display_name": row.get("MLIP", model_id),
                        }
                    )
        except (FileNotFoundError, KeyError, TypeError):
            # Skip benchmarks with missing or malformed metrics files
            logger.debug("Skipping %s — metrics table not readable", metrics_file)

    model_list.sort(key=lambda m: m["id"])
    request.app.state.models_cache = model_list

    response.headers["Cache-Control"] = CACHE_HEADER
    model_entries = [ModelEntry.model_validate(m) for m in model_list]
    return ModelsResponse(data=model_entries, meta=Meta(count=len(model_entries)))


# Build the FastAPI application
app = FastAPI(
    title="ML-PEG Benchmark API",
    version="0.1.0",
    lifespan=lifespan,
)
app.include_router(router)
