"""Smoke tests for config file correctness.

These tests verify that the project scaffolding is correct — all config files exist
and contain the expected values per requirements:
- NFR-2.2: minio-py (not boto3) to stay under 100 MB Vercel bundle limit
- NFR-2.4: data/ excluded from Vercel bundle (vercel.json + .vercelignore)
- NFR-3.1: bun run dev starts both Next.js and uvicorn via concurrently
- NFR-3.2: uv.lock committed for reproducible Vercel Python builds
- NFR-3.4: TypeScript types match actual data schemas
"""

import json
from pathlib import Path

import pytest

# Project root is two levels up from this test file: tests/ -> project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent


def test_vercelignore():
    """NFR-2.4: .vercelignore must exist and list data/ to exclude data from Vercel upload."""
    vercelignore = PROJECT_ROOT / ".vercelignore"
    assert vercelignore.exists(), ".vercelignore must exist"
    lines = vercelignore.read_text().splitlines()
    assert "data/" in lines, ".vercelignore must contain 'data/' line"


def test_vercel_json_excludes_data():
    """NFR-2.4: vercel.json must exclude data/** from the serverless function bundle."""
    vercel_json = PROJECT_ROOT / "vercel.json"
    assert vercel_json.exists(), "vercel.json must exist"
    config = json.loads(vercel_json.read_text())
    exclude_files = config["functions"]["api/index.py"]["excludeFiles"]
    assert exclude_files == "data/**", (
        f"vercel.json functions.api/index.py.excludeFiles must be 'data/**', got {exclude_files!r}"
    )


def test_dev_script():
    """NFR-3.1: package.json dev script must use concurrently to start next dev + uvicorn."""
    package_json = PROJECT_ROOT / "package.json"
    assert package_json.exists(), "package.json must exist"
    config = json.loads(package_json.read_text())
    dev_script = config["scripts"]["dev"]
    assert "concurrently" in dev_script, "dev script must use concurrently"
    assert "uvicorn" in dev_script, "dev script must start uvicorn"


def test_uv_lockfile():
    """NFR-3.2: Both pyproject.toml and uv.lock must exist for reproducible Vercel builds."""
    assert (PROJECT_ROOT / "pyproject.toml").exists(), "pyproject.toml must exist"
    assert (PROJECT_ROOT / "uv.lock").exists(), "uv.lock must be committed"


def test_pyproject_deps():
    """NFR-2.2: pyproject.toml must include minio (not boto3) to stay under 100 MB bundle."""
    import tomllib

    pyproject = PROJECT_ROOT / "pyproject.toml"
    assert pyproject.exists(), "pyproject.toml must exist"
    config = tomllib.loads(pyproject.read_text())
    deps = " ".join(config["project"]["dependencies"])
    assert "minio" in deps, "minio must be in project dependencies"
    assert "boto3" not in deps, "boto3 must NOT be in project dependencies (82 MB — too large for Vercel)"


def test_ts_types():
    """NFR-3.4: src/lib/types.ts must exist and export the 4 core interfaces."""
    types_file = PROJECT_ROOT / "src" / "lib" / "types.ts"
    assert types_file.exists(), "src/lib/types.ts must exist"
    content = types_file.read_text()
    for interface in ("ApiEnvelope", "MetricsRow", "Category", "Model"):
        assert interface in content, f"types.ts must export {interface} interface"
