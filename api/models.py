"""Pydantic response models for the ml-peg benchmark leaderboard API.

All models are defined here and imported by api/index.py for use as endpoint
return type annotations. FastAPI auto-serializes Pydantic model instances to JSON
and generates OpenAPI schemas from the return type annotations.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class Meta(BaseModel):
    count: int
    columns: list[str] | None = None


class Threshold(BaseModel):
    """Good/bad bounds and optional unit for a single metric threshold."""

    model_config = ConfigDict(extra="allow")

    good: float
    bad: float
    unit: str | None = None


class ColumnDescriptor(BaseModel):
    """Structured column descriptor with display name and identifier."""

    name: str
    id: str


class ColumnTooltip(BaseModel):
    """Tooltip content for a column header."""

    value: str
    type: str = "markdown"


class BenchmarkMeta(BaseModel):
    """Extended metadata for the benchmark table endpoint."""

    count: int
    columns: list[ColumnDescriptor] | None = None
    thresholds: dict[str, Threshold] = {}
    tooltip_header: dict[str, ColumnTooltip | str] = {}
    weights: dict[str, float] = {}


class HealthResponse(BaseModel):
    status: str


class BenchmarkEntry(BaseModel):
    slug: str
    name: str


class CategoryItem(BaseModel):
    slug: str
    name: str
    benchmarks: list[BenchmarkEntry]


class CategoriesResponse(BaseModel):
    data: list[CategoryItem]
    meta: Meta


class BenchmarkRow(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str
    MLIP: str
    Score: float | None = None


class BenchmarkTableResponse(BaseModel):
    data: list[BenchmarkRow]
    meta: BenchmarkMeta


class ModelEntry(BaseModel):
    id: str
    display_name: str


class ModelsResponse(BaseModel):
    data: list[ModelEntry]
    meta: Meta


class FigureItem(BaseModel):
    """A single figure entry with slug and display name."""

    slug: str
    name: str


class FigureListResponse(BaseModel):
    """Response for the figures index endpoint."""

    data: list[FigureItem]
    meta: Meta


class FigureResponse(BaseModel):
    """Response for the figure detail endpoint (inline Plotly JSON)."""

    data: dict


# --- Phase 4: Secondary Viewer Models ---


class DiatomicCurve(BaseModel):
    """A single diatomic potential energy curve for one model and element pair."""

    model: str
    pair: str
    distance: list[float]
    energy: list[float]


class DiatomicIndexResponse(BaseModel):
    """Response for the diatomic index endpoint.

    Maps element pairs (e.g. 'H-H') to lists of models with data for that pair.
    """

    data: dict[str, list[str]]
    meta: Meta


class DiatomicCurvesResponse(BaseModel):
    """Response for the diatomic curves endpoint.

    Returns all available curves for a given element pair across models.
    """

    data: list[DiatomicCurve]
    meta: Meta


class StructureData(BaseModel):
    """Raw structure data parsed from an XYZ file."""

    xyz_string: str
    has_pbc: bool


class StructureResponse(BaseModel):
    """Response for the structure endpoint."""

    data: StructureData


class NebFrame(BaseModel):
    """A single frame in a NEB trajectory."""

    energy: float
    species: list[str]
    positions: list[list[float]]
    lattice: list[list[float]] | None


class NebFramesResponse(BaseModel):
    """Response for the NEB frames endpoint."""

    data: list[NebFrame]
    meta: Meta
