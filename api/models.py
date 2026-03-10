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
    meta: Meta


class ModelEntry(BaseModel):
    id: str
    display_name: str


class ModelsResponse(BaseModel):
    data: list[ModelEntry]
    meta: Meta
