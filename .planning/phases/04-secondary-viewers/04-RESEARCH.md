# Phase 4: Secondary Viewers - Research

**Researched:** 2026-03-11
**Domain:** Molecular visualization (3Dmol.js), extxyz parsing (ASE), diatomic data indexing, Plotly multi-curve overlay, Next.js lazy loading
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Diatomic viewer: dedicated page at `/diatomics` (under physicality category navigation)
- Custom-built periodic table grid for element selection (no npm packages — existing ones are outdated)
- Full periodic table shown; elements without diatomic data are grayed out / non-clickable
- After selecting element 1, only valid pair partners remain enabled (dynamic filtering from pre-built index)
- Selecting an element pair renders all 19 models as overlaid Plotly curves with legend
- Pre-built `diatomic_index.json` maps valid element pairs → available models (avoids enumerating 92K files at runtime)
- Curve data: `{pair, element_1, element_2, distance[], energy[]}` per model per pair
- 3D structure viewer uses 3Dmol.js (~500 KB) for WebGL molecular rendering
- Accessed via "View Structure" button in the existing figure drawer (appears only for benchmarks with xyz files)
- Opens a modal/panel with the 3D viewer
- Ball-and-stick rendering style (atoms as spheres, bonds as sticks)
- Show unit cell wireframe box for crystal structures (when Lattice/pbc="T T T" present)
- 3Dmol.js loaded lazily (similar to Plotly lazy loading pattern from Phase 3)
- NEB viewer: dedicated page at `/nebs/li_diffusion` with model selector
- Side-by-side layout: 3D structure animation (3Dmol.js) on left, energy vs. reaction coordinate Plotly chart on right
- Scrub through frames or auto-play animation
- Server-side extxyz parsing: FastAPI endpoint parses extxyz files and returns JSON (frames with atoms, positions, energy)
- Python-side parsing using ASE or custom parser — browser receives ready-to-render data
- 27 extxyz files total, 2 per model (b and c NEB bands), small files (~170 KB each)

### Claude's Discretion
- Periodic table grid styling and layout (CSS Grid)
- Diatomic chart axis labels, colors, and legend placement
- 3Dmol.js viewer controls and camera defaults
- Animation speed and playback controls for NEB viewer
- Loading states for all three viewers
- Error handling when structure/curve data is missing
- Mobile responsive behavior for dedicated pages

### Deferred Ideas (OUT OF SCOPE)
- Phonon interactive viewer (FR-6.3) — 333 MB Plotly JSON file too large; deferred to Phase 5+
- ZnDraw integration — Replace 3Dmol.js in a future version; 3Dmol.js is the pragmatic v1 choice
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FR-6.1 | Diatomic curve viewer — element pair selector + multi-model overlay | Pre-built index, Plotly scatter overlay, custom periodic table CSS grid |
| FR-6.2 | 3D structure viewer for benchmarks with xyz/extxyz files (10+ benchmarks) | 3Dmol.js lazy-loaded, xyz format supported natively, ball-and-stick + unit cell API confirmed |
| FR-6.3 | Phonon interactive viewer via presigned URL | DEFERRED per CONTEXT.md — out of scope for this phase |
| FR-6.4 | NEB trajectory viewer | ASE extxyz parsing, 3Dmol.js frame animation, Plotly energy chart side-by-side |
</phase_requirements>

---

## Summary

Phase 4 adds three viewer types to the ML-PEG leaderboard. The diatomic curve viewer lets researchers compare all 19 MLIP models on any element pair from a custom periodic table grid — the key engineering challenge is a pre-built index to avoid listing 92K files at request time. The 3D structure viewer uses 3Dmol.js (lazy-loaded via `next/dynamic`) to render xyz/extxyz structure files already present in 55+ benchmark directories in MinIO; the "View Structure" button is added to the existing FigureDrawer. The NEB trajectory viewer pairs a 3Dmol.js frame animation with a Plotly energy curve on a dedicated `/nebs/li_diffusion` page; server-side ASE parsing converts extxyz multi-frame files to JSON the browser can consume directly.

All three viewers reuse established project patterns: `next/dynamic` for heavy client-side libraries, SWR hooks in `src/lib/api.ts`, FastAPI endpoints in `api/index.py`, and the storage abstraction in `api/storage.py`. No new major libraries are needed on the frontend beyond 3Dmol.js; ASE is the new Python dependency.

**Primary recommendation:** Build diatomic_index.json as an offline script, serve curve data via a dedicated FastAPI endpoint, lazy-load 3Dmol.js the same way Plotly is lazy-loaded, and parse extxyz server-side with ASE — never pass raw extxyz to the browser.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| 3dmol (npm) | 2.5.4 | WebGL 3D molecular viewer | Only mature, actively-maintained pure-JS 3D mol viewer with xyz/extxyz support; no server required |
| ASE (Python) | 3.27.0 | extxyz multi-frame parsing | Industry-standard atomic simulation library; `ase.io.read(f, index=':')` returns all frames as Atoms list; 2.9 MB wheel, well within Vercel 500 MB limit |
| plotly.js-basic-dist-min | 3.4.0 (already installed) | Diatomic energy curves and NEB energy chart | Already in project; scatter traces confirmed supported |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/dynamic | Built into Next.js 15 | Lazy-load 3Dmol.js | Use same pattern as PlotlyChart — `dynamic(() => import('./Mol3DViewer'), { ssr: false })` |
| SWR | 2.4.1 (already installed) | Data fetching hooks for diatomic/structure/NEB endpoints | All three new viewer hooks extend existing `src/lib/api.ts` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ASE for extxyz | Custom parser | ASE handles edge cases (sparse frames, multi-property headers); custom parser is 200+ lines for the same coverage |
| 3Dmol.js npm | CDN script tag | CDN breaks Next.js SSR and blocks dynamic import; npm allows `next/dynamic` pattern |
| ASE for extxyz | libAtoms/extxyz C library | libAtoms is a C extension requiring compilation; ASE is a pure-Python wrapper that bundles it; simpler for Vercel |

**Installation:**
```bash
# JS — one new package
bun add 3dmol

# Python — add ASE
uv add ase
```

Note: ASE pulls numpy, scipy, and matplotlib as dependencies. Numpy and scipy are typically already present in scientific Python envs. Total added bundle size is well within Vercel's 500 MB limit.

---

## Architecture Patterns

### Recommended Project Structure additions
```
api/
├── index.py          # Add: /diatomics/index, /diatomics/curves/{pair}, /structures/{slug}/{file}, /nebs/{benchmark}/{model}/{band}
src/
├── app/
│   ├── diatomics/
│   │   └── page.tsx          # Diatomic viewer page
│   └── nebs/
│       └── li_diffusion/
│           └── page.tsx      # NEB trajectory viewer page
├── components/
│   ├── PeriodicTable.tsx     # Custom CSS Grid periodic table
│   ├── DiatomicChart.tsx     # Plotly multi-model overlay (uses existing PlotlyChart)
│   ├── Mol3DViewer.tsx       # 3Dmol.js wrapper (dynamic-import target)
│   ├── StructureModal.tsx    # MUI Dialog wrapping Mol3DViewer
│   └── NebViewer.tsx         # Side-by-side 3D animation + energy chart
└── lib/
    ├── api.ts                # Add: useDiatomicIndex, useDiatomicCurves, useStructure, useNebFrames
    └── types.ts              # Add: DiatomicIndex, DiatomicCurve, NebFrame types
scripts/
└── build_diatomic_index.py   # Offline script: scans curves/ dirs, builds diatomic_index.json
```

### Pattern 1: Lazy-Load 3Dmol.js with next/dynamic

**What:** Wrap 3Dmol.js imperative API inside a React component that is only imported via `next/dynamic` with `ssr: false`.
**When to use:** Whenever 3Dmol.js viewer is needed (structure modal, NEB viewer).

```typescript
// src/components/Mol3DViewer.tsx  (dynamic import target — never import directly)
'use client';
import { useEffect, useRef } from 'react';

interface Mol3DViewerProps {
  xyzData: string;      // raw xyz/extxyz text OR JSON frames (for NEB)
  hasPbc: boolean;      // show unit cell box if true
  frameIndex?: number;  // for NEB scrubbing
}

export default function Mol3DViewer({ xyzData, hasPbc, frameIndex }: Mol3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    import('3dmol').then(($3Dmol) => {
      if (!containerRef.current) return;
      const viewer = $3Dmol.createViewer(containerRef.current, {
        backgroundColor: 'transparent',
      });
      const model = viewer.addModel(xyzData, 'xyz');
      viewer.setStyle({}, { sphere: { radius: 0.3 }, stick: { radius: 0.15 } });
      if (hasPbc) {
        viewer.addUnitCell(model, { box: { color: 'grey', linewidth: 1 } });
      }
      viewer.zoomTo();
      viewer.render();
      viewerRef.current = viewer;
    });
    return () => { viewerRef.current = null; };
  }, [xyzData, hasPbc]);

  return <div ref={containerRef} style={{ width: '100%', height: '400px', position: 'relative' }} />;
}

// Usage at call site (StructureModal.tsx, NebViewer.tsx):
// const Mol3DViewer = dynamic(() => import('./Mol3DViewer'), { ssr: false });
```

### Pattern 2: Diatomic Index Pre-Build Script

**What:** Offline Python script scans `data/physicality/diatomics/curves/{model}/{pair}.json` and writes `data/physicality/diatomics/diatomic_index.json`.
**When to use:** Run once after data updates; committed to MinIO; served via FastAPI.

```python
# scripts/build_diatomic_index.py
from pathlib import Path
import json

CURVES_DIR = Path("data/physicality/diatomics/curves")
OUTPUT = Path("data/physicality/diatomics/diatomic_index.json")

# Structure: { "Ac-Ag": ["mace-mp-0b3", "mace-mpa-0", ...], ... }
index: dict[str, list[str]] = {}

for model_dir in sorted(CURVES_DIR.iterdir()):
    if not model_dir.is_dir():
        continue
    model_id = model_dir.name
    for json_file in model_dir.glob("*.json"):
        pair = json_file.stem  # e.g. "Ac-Ag"
        index.setdefault(pair, []).append(model_id)

OUTPUT.write_text(json.dumps(index, sort_keys=True))
print(f"Written {len(index)} pairs to {OUTPUT}")
```

The index maps pair keys → list of model IDs that have data for that pair. This lets the frontend filter enabled elements without scanning 92K files.

### Pattern 3: extxyz Parsing with ASE

**What:** FastAPI endpoint reads extxyz file via ASE, serializes all frames as JSON.
**When to use:** NEB trajectory endpoint.

```python
# In api/index.py — new endpoint
import io
from ase.io import read as ase_read

@router.get("/nebs/{benchmark}/{model}/{band}/frames")
async def neb_frames(benchmark: str, model: str, band: str, request: Request, response: Response):
    storage: StorageBackend = request.app.state.storage
    # Path: nebs/li_diffusion/{model}/{model}-{band}-neb-band.extxyz
    key = f"nebs/{benchmark}/{model}/{model}-{band}-neb-band.extxyz"

    try:
        raw_bytes = storage.get_bytes(key)  # new method needed on StorageBackend
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="NEB file not found")

    atoms_list = ase_read(io.StringIO(raw_bytes.decode()), index=':', format='extxyz')

    frames = []
    for atoms in atoms_list:
        frames.append({
            "energy": float(atoms.info.get("energy", 0.0)),
            "lattice": atoms.cell.tolist() if any(atoms.pbc) else None,
            "pbc": atoms.pbc.tolist(),
            "species": atoms.get_chemical_symbols(),
            "positions": atoms.positions.tolist(),
        })

    response.headers["Cache-Control"] = CACHE_HEADER
    return {"data": frames}
```

Note: `storage.get_bytes()` is a new method on `StorageBackend` — returns raw bytes instead of parsed JSON. Must be added to `FilesystemBackend` and `MinioBackend`.

### Pattern 4: Diatomic Multi-Model Overlay Chart

**What:** Fetch all 19 model curves for a pair, render as overlaid Plotly scatter traces.
**When to use:** Diatomic viewer page after element pair is selected.

```typescript
// Build Plotly traces array from per-model curve data
const traces = curves.map((curve, i) => ({
  x: curve.distance,
  y: curve.energy,
  type: 'scatter' as const,
  mode: 'lines' as const,
  name: curve.model,
  line: { width: 1.5 },
}));

// Reuse existing PlotlyChart component (already lazy-loaded)
<PlotlyChart
  data={traces}
  layout={{
    xaxis: { title: 'Distance (Å)' },
    yaxis: { title: 'Energy (eV)' },
    legend: { orientation: 'v' },
    ...themeOverrides,
  }}
/>
```

### Pattern 5: NEB 3Dmol.js Frame Animation

**What:** Load NEB frames into 3Dmol.js using `addModelsAsFrames`, then use `setFrame(index)` for scrubbing or `animate({loop: 'forward'})` for auto-play.
**When to use:** NEB trajectory viewer page.

```typescript
// In Mol3DViewer when frameData (array of positions) is provided instead of raw xyz string
import('3dmol').then(($3Dmol) => {
  const viewer = $3Dmol.createViewer(containerRef.current, { backgroundColor: 'transparent' });

  // Build a concatenated xyz string for all frames
  const xyzMultiframe = buildXyzString(frames); // custom util converting JSON frames back to xyz text
  const model = viewer.addModelsAsFrames(xyzMultiframe, 'xyz');
  viewer.setStyle({}, { sphere: { radius: 0.3 }, stick: { radius: 0.15 } });
  viewer.addUnitCell(model);
  viewer.zoomTo();
  viewer.render();

  // For scrubbing:
  viewer.setFrame(frameIndex);
  viewer.render();
});
```

### Anti-Patterns to Avoid
- **Importing 3dmol at module level:** 3dmol accesses `window` and `document` on import. Must be inside a dynamic import or `useEffect`. `import 3dmol from '3dmol'` at the top of any file will break SSR.
- **Serving raw extxyz to the browser:** extxyz format is not JSON and requires parsing. Always parse server-side with ASE; browser receives clean JSON frames.
- **Enumerating 92K files at request time:** Never scan the curves directory on each API call. Always read from `diatomic_index.json` — the pre-built index.
- **Calling `viewer.render()` inside SWR re-renders:** The 3Dmol.js viewer is stateful/imperative. Keep it in a `useRef`, re-create or update only when data changes via `useEffect`.
- **Using `plotly.js-cartesian-dist` for NEB chart:** The existing `plotly.js-basic-dist-min` supports scatter traces — same as diatomic curves. No bundle change needed.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 3D molecular rendering | WebGL atom sphere rendering | 3Dmol.js `createViewer` + `addModel` | Handles lighting, bond detection, unit cell, animation frames; 10K+ lines of battle-tested WebGL code |
| extxyz multi-frame parsing | Custom regex/line parser | `ase.io.read(f, index=':', format='extxyz')` | extxyz header grammar has many edge cases (quoted strings, JSON values, sparse frames); ASE handles all of them |
| Element pair validation | On-demand MinIO file-exists checks | `diatomic_index.json` pre-built index | 92K stat calls per page load would hit Vercel timeout; pre-built index is a single JSON fetch |
| Ball detection for bonds | Distance-based bond calculator | 3Dmol.js auto-detects bonds | 3Dmol handles covalent radii lookup and bond detection automatically |

**Key insight:** 3Dmol.js and ASE solve deceptively hard problems (WebGL bond detection, extxyz format edge cases). Custom implementations would be fragile and long.

---

## Common Pitfalls

### Pitfall 1: 3Dmol.js SSR Crash
**What goes wrong:** `Cannot access document/window` error during Next.js server render.
**Why it happens:** 3Dmol.js accesses `window.WebGLRenderingContext` on import; Next.js tries to server-render components by default.
**How to avoid:** Always use `dynamic(() => import('./Mol3DViewer'), { ssr: false })`. Never import `3dmol` at the top of any file that could be server-rendered.
**Warning signs:** Build error mentioning `window is not defined` or `ReferenceError: document is not defined`.

### Pitfall 2: 3Dmol.js Viewer Re-creation on Every React Render
**What goes wrong:** Viewer flickers or resets camera on every state update.
**Why it happens:** Creating a new viewer in `useEffect` without cleanup causes WebGL context leak; creating without ref check recreates on unrelated re-renders.
**How to avoid:** Store viewer in `useRef`. Only create if `viewerRef.current === null`. Destroy on unmount with cleanup function.
**Warning signs:** Viewer resets camera position when unrelated state changes (e.g., dark mode toggle).

### Pitfall 3: ASE Bundle Size on Vercel
**What goes wrong:** Deployment bundle exceeds Vercel limit.
**Why it happens:** ASE 3.27.0 is 2.9 MB wheel but pulls numpy (~50 MB) and scipy (~40 MB). Total ~95 MB for scientific stack.
**How to avoid:** Vercel's Python bundle limit is 500 MB (increased from 250 MB). numpy is ~50 MB, scipy ~40 MB, matplotlib ~30 MB, ase ~3 MB — total ~123 MB, safely within 500 MB. However, only add ase to dependencies; do NOT add matplotlib or scipy unless needed (ASE imports them lazily for visualization, not for I/O).
**Warning signs:** Vercel build log showing "Serverless Function exceeded maximum size". Mitigation: add `matplotlib` to `.vercelignore` or check if scipy is actually imported at import time.

### Pitfall 4: diatomic_index.json Stale After Data Updates
**What goes wrong:** New element pairs or models are missing from the viewer.
**Why it happens:** Index is pre-built offline; if new curve JSONs are added to MinIO, the index is not automatically updated.
**How to avoid:** Document the rebuild script in the project README. Consider caching index in `app.state` like `models_cache` — but always read from MinIO so a re-deploy picks up updates.
**Warning signs:** Element pair shows "No data" despite file existing in MinIO.

### Pitfall 5: Multi-frame extxyz Energy Parsing
**What goes wrong:** Energy field missing or NaN for some frames.
**Why it happens:** ASE reads `energy` from the comment line as `atoms.info["energy"]`; the key name may vary (`energy`, `free_energy`, `E`).
**How to avoid:** Check `atoms.info.get("energy") or atoms.info.get("free_energy", 0.0)`. Sample the actual extxyz files — they use `energy=` in the comment line (confirmed in data sample above).
**Warning signs:** NEB energy chart shows flat line or NaN values.

### Pitfall 6: MinIO list_keys Returns Full Object Names
**What goes wrong:** `storage.list_keys("physicality/diatomics/curves")` returns full object paths, not bare model names.
**Why it happens:** `MinioBackend.list_keys` returns `obj.object_name` which includes the full prefix. `FilesystemBackend` returns bare names. Inconsistency between backends.
**How to avoid:** Strip the prefix when processing MinIO keys — this is an existing pattern issue. For new endpoints, use `storage.get_bytes(key)` with known full paths, not `list_keys`.

---

## Code Examples

Verified patterns from data inspection and official sources:

### Actual extxyz Comment Line Format (from data)
```
111
Lattice="10.23619605 0.0 0.0 0.0 11.9415102 0.0 0.0 0.0 9.30983438" Properties=species:S:1:pos:R:3:spacegroup_kinds:I:1:forces:R:3 config_type=neb energy=-758.407470703125 free_energy=-758.407470703125 stress="..." pbc="T T T"
Li  0.00224890  0.01133716  -0.00471500  ...
```
Energy field: `energy=` in comment line → `atoms.info["energy"]` in ASE. 13 frames per file (confirmed: 13 integer-only lines in sample).

### Actual Diatomic Curve JSON Format (from data)
```json
{
  "pair": "Ac-Ac",
  "element_1": "Ac",
  "element_2": "Ac",
  "distance": [0.18, 0.238...],
  "energy": [19916.08, 7515.55...],
  "force_parallel": [358017.12...]
}
```
Files at path: `physicality/diatomics/curves/{model_id}/{Element1}-{Element2}.json`
19 model directories confirmed in `data/physicality/diatomics/curves/`.

### Actual Structure xyz Format (from data)
```
2
Lattice="0.0 2.8265 2.8265 ..." Properties=... pbc="T T T"
Ga  0.0  0.0  0.0  ...
```
Crystal structures have `pbc="T T T"` — use this to conditionally show unit cell box in 3Dmol.js. Molecular structures have `pbc="F F F"` — no unit cell needed.

### StorageBackend get_bytes Extension

```python
# Add to StorageBackend protocol (api/storage.py)
def get_bytes(self, path: str) -> bytes:
    """Read raw bytes from the given path."""
    ...

# FilesystemBackend implementation:
def get_bytes(self, path: str) -> bytes:
    full_path = self._base / path
    if not full_path.exists():
        raise FileNotFoundError(f"No such file: {full_path}")
    return full_path.read_bytes()

# MinioBackend implementation:
def get_bytes(self, path: str) -> bytes:
    response = self.client.get_object(self.bucket, self._key(path))
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()
```

### New API Endpoints

```
GET /api/v1/diatomics/index
  → { data: { "H-H": ["mace-mp-0b3", ...], ... } }

GET /api/v1/diatomics/curves/{pair}
  e.g. /api/v1/diatomics/curves/H-H
  → { data: [ { model: "mace-mp-0b3", distance: [...], energy: [...] }, ... ] }

GET /api/v1/structures/{benchmark_slug}/{model}/{filename}
  e.g. /api/v1/structures/plf547/mace-mp-0b3/4GID_43_complex.xyz
  → { data: { xyz_string: "...", has_pbc: false } }

GET /api/v1/nebs/{benchmark}/{model}/{band}/frames
  e.g. /api/v1/nebs/li_diffusion/mace-mp-0b3/b/frames
  → { data: [ { energy: -758.4, positions: [...], species: [...], lattice: [...] }, ... ] }
```

### CSS Grid Periodic Table Key Pattern

```tsx
// Each element is positioned by grid-column / grid-row
// Standard periodic table: 18 columns × 10 rows (including lanthanides/actinides rows)
const ELEMENT_GRID_POSITION: Record<string, { col: number; row: number }> = {
  H:  { col: 1, row: 1 },
  He: { col: 18, row: 1 },
  Li: { col: 1, row: 2 },
  // ...
};

// CSS:
.periodic-table { display: grid; grid-template-columns: repeat(18, 1fr); gap: 2px; }
.element { grid-column: {col}; grid-row: {row}; }
.element.disabled { opacity: 0.3; pointer-events: none; }
.element.selected { border: 2px solid; }
```

---

## Data Characteristics (Confirmed from Local Data)

| Resource | Count | Location | Size |
|----------|-------|----------|------|
| Curve JSON files | ~92K (5,667 max per model × 19 models) | `physicality/diatomics/curves/{model}/{pair}.json` | ~300–5000 bytes each |
| Model directories | 19 | `physicality/diatomics/curves/` | confirmed |
| NEB extxyz files | 26–27 | `nebs/li_diffusion/{model}/` | ~170 KB each |
| NEB frames per file | 13 | extxyz multi-frame | confirmed |
| xyz benchmark dirs | 55+ | spread across all categories | ~5.6 MB total |
| Benchmarks with pbc="T T T" | Several (bulk_crystal, molecular_crystal, etc.) | parsed from header | show unit cell |

The **structure viewer** (FR-6.2) applies to many more benchmarks than the "10 benchmarks" mentioned in CONTEXT.md — the local data shows 55+ benchmark directories with xyz files. The "View Structure" button should be benchmark-agnostic: if a benchmark has a `structures/` or model-subdir xyz files, show the button.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 3Dmol.js loaded via CDN script tag | npm package with `next/dynamic` | 3dmol v1.8+ | SSR-safe, tree-shakeable, no waterfall load |
| ASE as heavyweight dependency | ASE 3.27.0, 2.9 MB wheel | 2025 | ASE io module is safe to import in serverless; only add what is used |
| Vercel 250 MB Python limit | 500 MB limit (2024 increase) | 2024 | numpy + scipy + ase easily fits without special exclusions |
| Per-request file scanning | Pre-built index JSON | Industry standard | Eliminates 92K MinIO stat calls |

**Deprecated/outdated:**
- molecule-3d-for-react (Autodesk): last updated 2017, abandoned, do not use
- ngl viewer: npm package has TypeScript issues and larger bundle than 3Dmol.js for this use case

---

## Open Questions

1. **Structure viewer "which file to show" per benchmark**
   - What we know: xyz files are per model per benchmark (e.g. `supramolecular/PLF547/mace-mp-0b3/4GID_43_complex.xyz`). There can be thousands of xyz files per benchmark.
   - What's unclear: Does the "View Structure" button show one specific structure or let the user browse? The CONTEXT.md says "opens a modal/panel with the 3D viewer" but doesn't specify which structure is shown when a benchmark has thousands of xyz files.
   - Recommendation: Show the first xyz file found for the selected model within the benchmark. Add a note that full browsing is a future enhancement.

2. **NEB model naming conventions**
   - What we know: Files are named `{model}-{band}-neb-band.extxyz` (e.g. `mace-mp-0b3-b-neb-band.extxyz`). Some models use `_` instead of `-` (observed: `mattersim_5M-c-neb-band.extxyz` alongside `mattersim-5M-b-neb-band.extxyz`).
   - What's unclear: Is the underscore variant a data inconsistency or intentional? The endpoint must handle both.
   - Recommendation: Scan the model directory with `storage.list_keys()` and match by pattern, rather than constructing the filename deterministically.

3. **3Dmol.js dark mode**
   - What we know: The viewer takes a `backgroundColor` config option. The project uses MUI CSS Variables for dark/light mode.
   - What's unclear: Whether to use `transparent` background (inherits from CSS) or explicitly set the color.
   - Recommendation: Use `transparent` background — let the MUI Paper/Box background color show through the WebGL canvas.

---

## Validation Architecture

Config: `workflow.nyquist_validation` is absent from `.planning/config.json` — treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 8.0.0 + httpx 0.27.0 |
| Config file | `pyproject.toml` → `[tool.pytest.ini_options]` |
| Quick run command | `uv run pytest tests/ -x -q` |
| Full suite command | `uv run pytest tests/ -v` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FR-6.1 | GET /api/v1/diatomics/index returns valid index JSON | unit | `uv run pytest tests/test_diatomics.py::test_diatomic_index -x` | No — Wave 0 |
| FR-6.1 | GET /api/v1/diatomics/curves/H-H returns 19 model curves | unit | `uv run pytest tests/test_diatomics.py::test_diatomic_curves -x` | No — Wave 0 |
| FR-6.2 | GET /api/v1/structures/{slug}/{model}/{file} returns xyz_string and has_pbc | unit | `uv run pytest tests/test_structures.py::test_structure_endpoint -x` | No — Wave 0 |
| FR-6.4 | GET /api/v1/nebs/li_diffusion/{model}/{band}/frames returns 13 frames with energy | unit | `uv run pytest tests/test_nebs.py::test_neb_frames_count -x` | No — Wave 0 |
| FR-6.4 | NEB frame has energy, species, positions, lattice keys | unit | `uv run pytest tests/test_nebs.py::test_neb_frame_schema -x` | No — Wave 0 |
| FR-6.1 | Periodic table renders, disabled elements not clickable | manual | Visual inspection — no automated browser test | N/A |
| FR-6.2 | 3D structure renders correctly with unit cell | manual | Visual inspection in browser | N/A |

### Sampling Rate
- **Per task commit:** `uv run pytest tests/ -x -q`
- **Per wave merge:** `uv run pytest tests/ -v`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/test_diatomics.py` — covers FR-6.1 API endpoints
- [ ] `tests/test_structures.py` — covers FR-6.2 structure endpoint
- [ ] `tests/test_nebs.py` — covers FR-6.4 NEB frames endpoint
- [ ] ASE install: `uv add ase` — required before any extxyz tests run

---

## Sources

### Primary (HIGH confidence)
- Official data inspection (`/Users/fzills/tools/ml-peg-ui/data/`) — confirmed extxyz format, curve JSON schema, directory structure, model count (19)
- Existing codebase (`api/index.py`, `api/storage.py`, `api/models.py`, `src/lib/api.ts`) — confirmed patterns for new endpoints
- ASE PyPI page (https://pypi.org/project/ase/) — version 3.27.0, 2.9 MB wheel confirmed

### Secondary (MEDIUM confidence)
- 3Dmol.js GitHub releases (https://github.com/3dmol/3Dmol.js/releases) — version 2.5.4 (Jan 2025) confirmed; API methods `addModel`, `addModelsAsFrames`, `setStyle`, `addUnitCell` confirmed from docs
- Vercel Python bundle limit: 500 MB (increased 2024) — https://vercel.com/changelog/python-vercel-functions-bundle-size-limit-increased-to-500mb
- 3Dmol.js npm page — package name `3dmol`, `import('3dmol/build/3Dmol.js')` pattern for bundlers confirmed
- ASE `ase.io.read(f, index=':', format='extxyz')` pattern — https://wiki.fysik.dtu.dk/ase/ase/io/io.html

### Tertiary (LOW confidence)
- numpy/scipy bundle sizes (~50 MB / ~40 MB) — widely cited community estimate; not officially benchmarked in this Vercel config

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 3Dmol.js version confirmed from releases, ASE from PyPI, all other libs already in project
- Architecture: HIGH — patterns derived from existing codebase (storage abstraction, dynamic import, SWR hooks)
- Pitfalls: HIGH for known SSR issues (confirmed Next.js/3Dmol pattern); MEDIUM for ASE bundle (estimate, not benchmarked on this project)
- Data format: HIGH — directly inspected local data files

**Research date:** 2026-03-11
**Valid until:** 2026-06-11 (stable libraries; 90 days reasonable for 3Dmol.js, ASE, Next.js 15)
