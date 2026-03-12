"""FastAPI application for ml-peg benchmark leaderboard API.

Serves benchmark data with 9 endpoints:
- GET /api/v1/health      — liveness check
- GET /api/v1/categories  — all categories with embedded benchmark lists
- GET /api/v1/benchmarks/{slug}/table — metrics table for a benchmark
- GET /api/v1/benchmarks/{slug}/figures/{figure_slug} — figure data
- GET /api/v1/models      — unique models across all benchmarks
- GET /api/v1/diatomics/index — diatomic element pair index
- GET /api/v1/diatomics/curves/{pair} — potential energy curves for an element pair
- GET /api/v1/structures/{benchmark_slug}/{model}/{filename} — raw xyz structure
- GET /api/v1/nebs/{benchmark}/{model}/{band}/frames — NEB trajectory frames

Storage is abstracted via api.storage: FilesystemBackend in local dev,
MinioBackend in production (when MINIO_ENDPOINT is set).
"""

from __future__ import annotations

import io
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
    DiatomicCurve,
    DiatomicCurvesResponse,
    DiatomicIndexResponse,
    FigureItem,
    FigureListResponse,
    FigureResponse,
    HealthResponse,
    Meta,
    ModelEntry,
    ModelsResponse,
    NebFrame,
    NebFramesResponse,
    StructureData,
    StructureResponse,
    Threshold,
)
from api.storage import StorageBackend, create_storage

# Load local env overrides (no-op if absent)
load_dotenv(".env.local")

logger = logging.getLogger(__name__)

CACHE_HEADER = "s-maxage=3600, stale-while-revalidate=86400"

# Categories to skip when scanning the data directory
_SKIP_CATEGORIES = {"assets", "onboarding"}


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
    app.state.diatomic_index = None  # lazily computed on first /diatomics/index request

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

    # Find the *_metrics_table.json file in the benchmark directory
    # Filenames are inconsistent (e.g. gscdb138_metrics_table.json in GSCDB138_field/)
    bench_keys = storage.list_keys(bench_path)
    metrics_files = [k for k in bench_keys if k.endswith("_metrics_table.json")]
    if not metrics_files:
        raise HTTPException(status_code=404, detail=f"Metrics table not found for '{slug}'")
    metrics_file = f"{bench_path}/{metrics_files[0]}"
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


def _get_diatomic_index(request: Request) -> dict[str, list[str]]:
    """Load the diatomic index from storage, caching in app.state after first load."""
    if request.app.state.diatomic_index is not None:
        return request.app.state.diatomic_index

    storage: StorageBackend = request.app.state.storage
    try:
        index = storage.get_json("physicality/diatomics/diatomic_index.json")
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Diatomic index not found — run scripts/build_diatomic_index.py",
        )
    request.app.state.diatomic_index = index
    return index


@router.get("/diatomics/index")
async def diatomic_index(request: Request, response: Response) -> DiatomicIndexResponse:
    """Return the diatomic element pair index.

    Maps each element pair (e.g. 'H-H') to the list of models with data for that pair.
    """
    index = _get_diatomic_index(request)
    response.headers["Cache-Control"] = CACHE_HEADER
    return DiatomicIndexResponse(data=index, meta=Meta(count=len(index)))


@router.get("/diatomics/curves/{pair}")
async def diatomic_curves(pair: str, request: Request, response: Response) -> DiatomicCurvesResponse:
    """Return all diatomic potential energy curves for a given element pair.

    Returns 404 if the pair is not in the index.
    """
    storage: StorageBackend = request.app.state.storage
    index = _get_diatomic_index(request)

    if pair not in index:
        raise HTTPException(status_code=404, detail=f"Diatomic pair '{pair}' not found")

    curves: list[DiatomicCurve] = []
    for model_id in index[pair]:
        try:
            data = storage.get_json(f"physicality/diatomics/curves/{model_id}/{pair}.json")
            curves.append(
                DiatomicCurve(
                    model=model_id,
                    pair=data.get("pair", pair),
                    distance=data.get("distance", []),
                    energy=data.get("energy", []),
                )
            )
        except FileNotFoundError:
            # Index may be stale; skip missing files gracefully
            logger.warning("Diatomic curve file missing for %s/%s", model_id, pair)

    response.headers["Cache-Control"] = CACHE_HEADER
    return DiatomicCurvesResponse(data=curves, meta=Meta(count=len(curves)))


@router.get("/structures/{benchmark_slug}/{model}/{filename}")
async def structure(
    benchmark_slug: str,
    model: str,
    filename: str,
    request: Request,
    response: Response,
) -> StructureResponse:
    """Return the raw xyz string and has_pbc flag for a structure file.

    Returns 404 if benchmark slug or file is not found.
    """
    slug_map: dict[str, str] = request.app.state.slug_map
    storage: StorageBackend = request.app.state.storage

    bench_path = slug_map.get(benchmark_slug.lower())
    if bench_path is None:
        raise HTTPException(status_code=404, detail=f"Benchmark '{benchmark_slug}' not found")

    file_path = f"{bench_path}/{model}/{filename}"
    try:
        raw = storage.get_bytes(file_path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Structure file '{filename}' not found")

    xyz_string = raw.decode("utf-8", errors="replace")

    # Detect PBC from the second line of the xyz file: pbc="T T T"
    lines = xyz_string.splitlines()
    has_pbc = False
    if len(lines) >= 2:
        second_line = lines[1]
        has_pbc = 'pbc="T T T"' in second_line or "pbc='T T T'" in second_line

    response.headers["Cache-Control"] = CACHE_HEADER
    return StructureResponse(data=StructureData(xyz_string=xyz_string, has_pbc=has_pbc))


@router.get("/nebs/{benchmark}/{model}/{band}/frames")
async def neb_frames(
    benchmark: str,
    model: str,
    band: str,
    request: Request,
    response: Response,
) -> NebFramesResponse:
    """Return parsed NEB trajectory frames for the given benchmark/model/band.

    Returns 404 if the benchmark, model, or band combination has no data.
    """
    import ase.io  # type: ignore[import-untyped]

    storage: StorageBackend = request.app.state.storage

    # List files in the model directory to find the matching band file
    model_prefix = f"nebs/{benchmark}/{model}"
    try:
        keys = storage.list_keys(model_prefix)
    except Exception:
        keys = []

    if not keys:
        raise HTTPException(status_code=404, detail=f"No NEB data found for '{benchmark}/{model}'")

    # Find the file matching pattern *-{band}-neb-band.extxyz
    # Handles both hyphen and underscore variants (e.g. mattersim-5M vs mattersim_5M)
    band_suffix = f"-{band}-neb-band.extxyz"
    matching_key = None
    for key in keys:
        if key.endswith(band_suffix):
            matching_key = key
            break

    if matching_key is None:
        raise HTTPException(
            status_code=404,
            detail=f"No NEB band '{band}' found for '{benchmark}/{model}'",
        )

    file_path = f"{model_prefix}/{matching_key}"
    try:
        raw = storage.get_bytes(file_path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"NEB file not found: {file_path}")

    # Parse extxyz with ASE
    atoms_list = ase.io.read(io.StringIO(raw.decode("utf-8")), index=":", format="extxyz")

    frames: list[NebFrame] = []
    for atoms in atoms_list:
        # Energy from calculator results (ASE stores energy/free_energy in calc)
        energy = 0.0
        if atoms.calc is not None:
            results = atoms.calc.results
            energy = float(results.get("energy", results.get("free_energy", 0.0)))

        # Lattice: 3x3 matrix if periodic, None if non-periodic
        lattice = None
        if any(atoms.pbc):
            lattice = atoms.cell.tolist()

        frames.append(
            NebFrame(
                energy=energy,
                species=atoms.get_chemical_symbols(),
                positions=atoms.positions.tolist(),
                lattice=lattice,
            )
        )

    response.headers["Cache-Control"] = CACHE_HEADER
    return NebFramesResponse(data=frames, meta=Meta(count=len(frames)))


# Build the FastAPI application
app = FastAPI(
    title="ML-PEG Benchmark API",
    version="0.1.0",
    lifespan=lifespan,
)
app.include_router(router)
