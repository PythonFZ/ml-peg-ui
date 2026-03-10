# Data Model: ML-PEG Benchmark Data Structure and API Schema

**Researched:** 2026-03-10
**Confidence:** HIGH (based on direct file inspection of 8+ JSON schemas, all xyz/extxyz structures, and full directory tree)

---

## 1. Directory Structure Overview

```
data/
├── assets/
│   └── bulk_crystal/
│       └── phonons/           # (empty — assets dir currently unused)
├── onboarding/                # Tutorial videos (mp4): interactive-tables-plots, tooltips, weights-thresholds
├── <category>/
│   └── <benchmark>/
│       ├── <benchmark>_metrics_table.json   # THE primary data file
│       ├── figure_*.json                    # Pre-computed Plotly figure specs
│       └── <model-id>/                      # Per-model structure files
│           ├── <idx>.xyz                    # Individual atomic structures
│           ├── <idx>.extxyz                 # NEB trajectory structures
│           └── structs/                     # Some benchmarks nest .xyz here
└── physicality/
    └── diatomics/
        ├── diatomics_metrics_table.json
        └── curves/
            └── <model-id>/
                └── <Element1>-<Element2>.json  # Diatomic potential energy curves
```

### 14 Top-Level Categories and Their Benchmarks

| Category | Benchmarks |
|---|---|
| `bulk_crystal` | `elasticity`, `lattice_constants`, `phonons` |
| `conformers` | `37Conf8`, `DipCONFS`, `Glucose205`, `Maltose222`, `MPCONF196`, `OpenFF_Tors`, `solvMPCONF196`, `UpU46` |
| `electric_field` | `GSCDB138_field` |
| `interstitial` | `FE1SIA`, `Relastab` |
| `isomers` | `GSCDB138_isomers` |
| `lanthanides` | `isomer_complexes` |
| `molecular` | `GMTKN55`, `Wiggle150` |
| `molecular_crystal` | `CPOSS209`, `DMC_ICE13`, `X23` |
| `molecular_reactions` | `BH2O_36`, `BH9`, `Criegee22`, `CYCLO70`, `GSCDB138_barriers`, `RDB7` |
| `nebs` | `li_diffusion` |
| `non_covalent_interactions` | `GSCDB138_NCIs`, `IONPI19`, `NCIA_D1200`, `NCIA_D442x10`, `NCIA_HB300SPXx10`, `NCIA_HB375x10`, `NCIA_IHB100x10`, `NCIA_R739x5`, `QUID` |
| `physicality` | `diatomics`, `extensivity`, `locality` |
| `supramolecular` | `LNCI16`, `PLA15`, `PLF547`, `S30L` |
| `surfaces` | `elemental_slab_oxygen_adsorption`, `graphene_wetting_under_strain`, `OC157`, `S24`, `SBH17` |
| `thermochemistry` | `GSCDB138_thermochemistry` |
| `tm_complexes` | `3dTMV`, `GSCDB138_tm_complexes` |

**Total: 52 metrics_table.json files across 50 benchmarks**

### Models Present (canonical IDs)

```
mace-mp-0a, mace-mp-0b3, mace-mpa-0, mace-omat-0, mace-matpes-r2scan,
mace-mh-1-omat, mace-mh-1-omol, mace-omol, mace-polar-1-s, mace-polar-1-m,
mace-polar-1-l, orb-v3-consv-inf-omat, orb-v3-consv-omol, mattersim-5M,
uma-m-1p1-omat, uma-m-1p1-omol, uma-s-1p1-omat, uma-s-1p1-omol, pet-mad
```

Note: Some benchmarks append `-D3` to the model ID in `data[]` entries (indicating Grimme D3 dispersion correction applied), but `model_name_map` maps these back to the canonical ID without `-D3`. The `id` field in each row always uses the canonical model ID.

---

## 2. Core Data File: `*_metrics_table.json`

This is the most important file type. Every benchmark has exactly one. It is a single flat JSON object with these top-level keys:

### Full Schema

```typescript
interface MetricsTableFile {
  // REQUIRED: The rows of the leaderboard table
  data: MetricsTableRow[];

  // REQUIRED: Column definitions for the table renderer
  columns: ColumnDef[];

  // REQUIRED: Per-column tooltip text (shown on header hover)
  tooltip_header: Record<string, TooltipValue | string>;

  // REQUIRED: Good/bad thresholds for color-coding cells
  thresholds: Record<string, ThresholdDef>;

  // REQUIRED: Per-metric weight for computing Score
  weights: Record<string, number>;

  // REQUIRED: Level of theory each model was evaluated at
  model_levels_of_theory: Record<string, string>;

  // REQUIRED: Level of theory the reference data was computed at
  metric_levels_of_theory: Record<string, string | null>;

  // REQUIRED: Full model configuration (for hover cards)
  model_configs: Record<string, ModelConfig>;

  // REQUIRED: Maps displayed model name (with -D3 suffix) to canonical model ID
  model_name_map: Record<string, string>;
}
```

### `MetricsTableRow`

Each row is a flat object. The schema is benchmark-specific but always contains:

```typescript
interface MetricsTableRow {
  MLIP: string;       // Display name (may include "-D3" suffix)
  id: string;         // Canonical model ID (no -D3 suffix)
  Score: number;      // 0–1 normalized aggregate score, higher is better
  [metricName: string]: number | string;  // Benchmark-specific numeric metrics
}
```

Example columns from inspected benchmarks:
- `elasticity`: `Bulk modulus MAE`, `Shear modulus MAE`
- `phonons`: `ω_max`, `ω_avg`, `ω_min`, `S`, `F`, `C_V`, `Avg BZ MAE`, `Stability F1`
- `gmtkn55`: `Small systems`, `Large systems`, `Barrier heights`, `Intramolecular NCIs`, `Intermolecular NCIs`, `WTMAD`
- `diatomics`: `Force flips`, `Energy minima`, `Energy inflections`, `ρ(E, repulsion)`, `ρ(E, attraction)`
- `bh9_barriers`: `MAE`

### `ColumnDef`

```typescript
interface ColumnDef {
  name: string;  // Display label
  id: string;    // Key in data rows (same as name for metrics)
}
```

### `TooltipValue`

Column header tooltips are either a plain string or a markdown-rendering object:

```typescript
type TooltipValue =
  | string
  | { value: string; type: "markdown" };
```

The `MLIP` column always has the string `"Model identifier, hover for configuration details."`. The `Score` column always has `"Weighted score across metrics, Higher is better (normalised 0 to 1)."`. Metric columns use the markdown object with units and level of theory.

### `ThresholdDef`

```typescript
interface ThresholdDef {
  good: number;      // Value for full-green color (best end of scale)
  bad: number;       // Value for full-red color (worst end of scale)
  unit: string;      // Physical unit string, e.g. "GPa", "kcal/mol", "-"
  level_of_theory: string | null;  // Reference DFT method, null for physicality tests
}
```

Important: `good` can be less than `bad` (e.g. MAE → good=0, bad=50) OR `good` can equal `bad` reversed for correlation metrics (ρ(E, attraction) → good=1.0, bad=-1.0). The color-coding logic must handle both directions.

### `ModelConfig`

```typescript
interface ModelConfig {
  module: string;           // Python module name, e.g. "mace.calculators"
  class_name: string;       // Class, e.g. "mace_mp"
  device: string;           // "auto", "cpu"
  default_dtype?: string;   // "float32", "float64", "float32-high"
  trained_on_d3: boolean;   // Whether D3 corrections are baked in
  level_of_theory: string;  // e.g. "PBE", "r2SCAN", "ωB97M-V/def2-TZVPD"
  load_path?: string;       // For mattersim
  kwargs?: Record<string, unknown>;     // Constructor kwargs
  d3_kwargs?: Record<string, unknown>;  // D3 correction kwargs
}
```

---

## 3. Figure JSON Files (`figure_*.json`)

These are **complete Plotly figure specifications** ready to pass directly to `Plotly.react()` or `react-plotly.js`. They contain both the `data` (traces) and `layout` objects.

### Schema

```typescript
interface PlotlyFigureFile {
  data: PlotlyTrace[];    // Array of Plotly trace objects (scatter, bar, etc.)
  layout: PlotlyLayout;   // Full Plotly layout spec (title, axes, theme, etc.)
}
```

The `layout` includes:
- A full Plotly template (color scheme, axis styles)
- `title.text` — figure title
- `xaxis.title.text`, `yaxis.title.text` — axis labels
- Full Plotly theme embedded (from `plotly_white` or similar)

### Figure Naming Patterns

```
figure_<description>.json                          # General figures
figure_<model-id>_neb_<path-letter>.json           # NEBs: one per model + path
figure_<N>-leg_s+<strain>.json                     # graphene wetting: per leg count + strain
figure_binding_energies_parity.json                # named by plot type
```

### File Sizes

Most figure files are moderate (under 2 MB) but some are very large:
- `phonon_interactive.json`: ~333 MB — needs special handling (streaming or splitting)
- `figure_bulk_density.json`, `figure_shear_density.json`: >50 MB each — density scatter plots with many points

**API strategy implication**: Figure files must be served from S3, not bundled. The 333 MB phonon file needs special treatment (pre-split by model or lazy-loaded per-tab).

---

## 4. Diatomic Curves (`data/physicality/diatomics/curves/`)

### Directory Structure

```
curves/
└── <model-id>/
    └── <Element1>-<Element2>.json   # e.g. Ac-Ac.json, H-H.json
```

Coverage: Every model × every element pair combination (symmetric, upper-triangle only). Based on 86+ elements, this is approximately 86×87/2 ≈ 3,741 pairs per model × 19 models ≈ **71,000+ files**.

### File Schema

```typescript
interface DiatomicCurveFile {
  pair: string;             // e.g. "Ac-Ac", "H-O"
  element_1: string;        // Element symbol
  element_2: string;        // Element symbol
  distance: number[];       // Bond distance in Angstroms (100 points from 0.18 to 6.0 Å)
  energy: number[];         // Potential energy in eV (same length as distance)
  force_parallel: number[]; // Parallel component of force in eV/Å (same length)
}
```

The distance array spans 0.18 Å to 6.0 Å with 100 uniform samples. Units confirmed from inspection: distances in Ångströms, energy in eV, forces in eV/Å.

---

## 5. Structure Files (xyz and extxyz)

### xyz Files — Per-Structure Snapshots

Present in: `molecular/Wiggle150`, `surfaces/OC157`, `surfaces/S24`, `surfaces/elemental_slab_oxygen_adsorption`, `bulk_crystal/lattice_constants`, `conformers/*`, `physicality/extensivity`, `physicality/locality`

**Format**: Extended XYZ (ASE-compatible). Each file represents one atomic structure for one model.

**Path pattern**: `data/<category>/<benchmark>/<model-id>/<index>.xyz`

Header line format (from OC157 example):
```
Lattice="a11 a12 a13 a21 a22 a23 a31 a32 a33"
Properties=species:S:1:pos:R:3:move_mask:L:1:momenta:R:3
ref_energy=<float>
composition="<formula>"
sys_id=<int>
energy=<float>
pbc="T T T"
```

Atom lines: `<symbol>  <x>  <y>  <z>  <move_mask_T_or_F>  <px>  <py>  <pz>`

The `energy` and `ref_energy` fields contain the MLIP-predicted and reference energies in eV. The `pbc` field indicates periodic boundary conditions (T/F per dimension).

### extxyz Files — NEB Trajectory Bands

Present in: `nebs/li_diffusion/`

**Path pattern**: `data/nebs/li_diffusion/<model-id>/<model-id>-<path-letter>-neb-band.extxyz`

Each extxyz file contains multiple concatenated XYZ frames (one per NEB image). Header line includes:
```
Properties=species:S:1:pos:R:3:spacegroup_kinds:I:1:forces:R:3
config_type=neb
energy=<float>
free_energy=<float>
stress="<9 floats>"
pbc="T T T"
```

Atom lines: `<symbol>  <x>  <y>  <z>  <spacegroup_kind_int>  <fx>  <fy>  <fz>`

The `forces` column contains force vectors in eV/Å. Individual NEB frames have different energies, forming the reaction pathway.

### graphene_wetting structs

**Path pattern**: `data/surfaces/graphene_wetting_under_strain/<model-id>/structs/<N>-leg_s+<strain>_L<length>.xyz`

Standard xyz format, named by geometry parameter.

---

## 6. Assets and Onboarding

### `data/assets/`

Currently contains only: `data/assets/bulk_crystal/phonons/` (empty directory — this appears to be a placeholder for future assets).

The GMTKN55 benchmark directory also has model subdirectories with numbered `.xyz` files (indices 0 through ~1500+), following the standard per-model structure pattern.

### `data/onboarding/`

Contains three tutorial video files:
- `interactive-tables-plots.mp4`
- `tooltips.mp4`
- `weights-thresholds.mp4`

These are served as static files for an onboarding/help UI feature.

---

## 7. Benchmarks With xyz/extxyz Structure Files

The following benchmarks have per-model atomic structure files available for 3D viewing:

| Category | Benchmark | File Type | Notes |
|---|---|---|---|
| `bulk_crystal` | `lattice_constants` | xyz | Per-material (element/compound name) |
| `molecular` | `Wiggle150` | xyz | Indexed by integer |
| `molecular` | `GMTKN55` | xyz | ~1500 files per model |
| `surfaces` | `OC157` | xyz | ~157 indexed structures per model |
| `surfaces` | `S24` | xyz | 24 indexed structures (001–024) |
| `surfaces` | `elemental_slab_oxygen_adsorption` | xyz | Named by element+count, e.g. `Fe54-O.xyz` |
| `surfaces` | `graphene_wetting_under_strain` | xyz | In `structs/` subdirectory |
| `physicality` | `extensivity` | xyz | Single `slabs.xyz` per model |
| `physicality` | `locality` | xyz | `system_ghost.xyz`, `system_random_H.xyz` per model |
| `nebs` | `li_diffusion` | extxyz | NEB bands, 2 paths (b, c) per model |

**Benchmarks without structure files** (metrics/figures only): All conformers, molecular_crystal, molecular_reactions, non_covalent_interactions, supramolecular, thermochemistry, tm_complexes, electric_field, isomers, lanthanides, interstitial, diatomics (has curve JSON instead), phonons.

---

## 8. Benchmark-Specific Special Files

Some benchmarks have additional non-standard files:

| Benchmark | Special Files | Description |
|---|---|---|
| `phonons` | `phonon_interactive.json` | 333 MB interactive Plotly figure — one phonon dispersion per model. Needs lazy loading. |
| `graphene_wetting_under_strain` | Per-model figure JSON files named by geometry parameters | Multiple figures per model |
| `nebs/li_diffusion` | `figure_<model-id>_neb_<b|c>.json` per model | One NEB path figure per model per path |

---

## 9. TypeScript Type Definitions

```typescript
// ============================================================
// MODELS
// ============================================================

export type ModelId =
  | "mace-mp-0a"
  | "mace-mp-0b3"
  | "mace-mpa-0"
  | "mace-omat-0"
  | "mace-matpes-r2scan"
  | "mace-mh-1-omat"
  | "mace-mh-1-omol"
  | "mace-omol"
  | "mace-polar-1-s"
  | "mace-polar-1-m"
  | "mace-polar-1-l"
  | "orb-v3-consv-inf-omat"
  | "orb-v3-consv-omol"
  | "mattersim-5M"
  | "uma-m-1p1-omat"
  | "uma-m-1p1-omol"
  | "uma-s-1p1-omat"
  | "uma-s-1p1-omol"
  | "pet-mad";

export interface ModelConfig {
  module: string;
  class_name: string;
  device: string;
  default_dtype?: string;
  trained_on_d3: boolean;
  level_of_theory: string;
  load_path?: string;
  kwargs?: Record<string, unknown>;
  d3_kwargs?: Record<string, unknown>;
}

// ============================================================
// BENCHMARK CATEGORIES AND BENCHMARKS
// ============================================================

export type BenchmarkCategory =
  | "bulk_crystal"
  | "conformers"
  | "electric_field"
  | "interstitial"
  | "isomers"
  | "lanthanides"
  | "molecular"
  | "molecular_crystal"
  | "molecular_reactions"
  | "nebs"
  | "non_covalent_interactions"
  | "physicality"
  | "supramolecular"
  | "surfaces"
  | "thermochemistry"
  | "tm_complexes";

export interface BenchmarkRef {
  category: BenchmarkCategory;
  benchmarkId: string;              // Directory name, e.g. "elasticity"
  metricsFile: string;              // e.g. "elasticity_metrics_table.json"
  hasStructures: boolean;           // xyz files available for 3D viewer
  hasExtxyz: boolean;               // extxyz NEB trajectories available
  figureFiles: string[];            // List of figure_*.json filenames
  hasLargeInteractiveFile: boolean; // e.g. phonon_interactive.json
}

// ============================================================
// METRICS TABLE FILE (the core data format)
// ============================================================

export interface ColumnDef {
  name: string;
  id: string;
}

export type TooltipValue =
  | string
  | { value: string; type: "markdown" };

export interface ThresholdDef {
  good: number;
  bad: number;
  unit: string;
  level_of_theory: string | null;
}

export interface MetricsTableRow {
  MLIP: string;           // Display name, may include "-D3" suffix
  id: string;             // Canonical model ID (key into model_configs)
  Score: number;          // 0–1 aggregate score
  [metricName: string]: number | string;
}

export interface MetricsTableFile {
  data: MetricsTableRow[];
  columns: ColumnDef[];
  tooltip_header: Record<string, TooltipValue>;
  thresholds: Record<string, ThresholdDef>;
  weights: Record<string, number>;
  model_levels_of_theory: Record<string, string>;
  metric_levels_of_theory: Record<string, string | null>;
  model_configs: Record<string, ModelConfig>;
  model_name_map: Record<string, ModelId>;
}

// ============================================================
// PLOTLY FIGURE FILE
// ============================================================

// These match the Plotly.js types; use plotly.js-dist-min's types
// or declare a minimal interface:
export interface PlotlyFigureFile {
  data: Plotly.Data[];
  layout: Partial<Plotly.Layout>;
}

// ============================================================
// DIATOMIC CURVE FILE
// ============================================================

export interface DiatomicCurveFile {
  pair: string;             // e.g. "H-O"
  element_1: string;
  element_2: string;
  distance: number[];       // Angstroms, 100 points, 0.18–6.0 Å
  energy: number[];         // eV
  force_parallel: number[]; // eV/Å
}

// ============================================================
// API RESPONSE SHAPES
// ============================================================

/** GET /api/benchmarks */
export interface BenchmarksListResponse {
  categories: {
    id: BenchmarkCategory;
    benchmarks: BenchmarkRef[];
  }[];
}

/** GET /api/benchmarks/{category}/{benchmarkId}/metrics */
export type MetricsResponse = MetricsTableFile;

/** GET /api/benchmarks/{category}/{benchmarkId}/figures */
export interface FiguresListResponse {
  figures: string[];  // figure filenames
}

/** GET /api/benchmarks/{category}/{benchmarkId}/figures/{filename} */
export type FigureResponse = PlotlyFigureFile;

/** GET /api/diatomics/{modelId}/{element1}/{element2} */
export type DiatomicCurveResponse = DiatomicCurveFile;

/** GET /api/structures/{category}/{benchmarkId}/{modelId}/{structureId} */
export interface StructureResponse {
  content: string;            // Raw xyz/extxyz file content
  format: "xyz" | "extxyz";
}

/** GET /api/models */
export interface ModelsListResponse {
  models: {
    id: ModelId;
    config: ModelConfig;
    level_of_theory: string;
  }[];
}
```

---

## 10. API Endpoint Design Recommendations

Based on the data structure, the FastAPI backend needs these endpoints:

### Static Index Endpoints

```
GET /api/benchmarks
  → BenchmarksListResponse
  → Derived from directory listing, cacheable indefinitely

GET /api/models
  → ModelsListResponse
  → Derived from any metrics_table.json model_configs, all files agree
```

### Benchmark Data Endpoints

```
GET /api/benchmarks/{category}/{benchmark_id}/metrics
  → MetricsTableFile (full JSON, typically <100 KB)
  → Cacheable: immutable

GET /api/benchmarks/{category}/{benchmark_id}/figures
  → FiguresListResponse (list of available figure filenames)
  → Cacheable: immutable

GET /api/benchmarks/{category}/{benchmark_id}/figures/{filename}
  → PlotlyFigureFile
  → Cache-Control: max-age=86400
  → WARNING: phonon_interactive.json is 333 MB — do NOT serve this inline.
    Redirect to presigned S3 URL or serve in chunks.
  → WARNING: figure_bulk_density.json, figure_shear_density.json are >50 MB.
    Use S3 presigned URL redirect pattern for files > 5 MB.
```

### Structure File Endpoints

```
GET /api/structures/{category}/{benchmark_id}/{model_id}/{structure_id}
  → StructureResponse (raw xyz text)
  → structure_id is the filename stem, e.g. "0", "001", "Fe54-O", "system_ghost"
  → Cache-Control: max-age=86400

GET /api/nebs/{benchmark_id}/{model_id}/{path_letter}
  → StructureResponse (raw extxyz text — multiple frames concatenated)
  → path_letter: "b" or "c"
```

### Diatomic Curves Endpoint

```
GET /api/diatomics/{model_id}/{element1}/{element2}
  → DiatomicCurveFile
  → Filename: {element1}-{element2}.json (must try both orderings if not found)
  → Cache-Control: max-age=86400
```

### Onboarding Assets

```
GET /api/onboarding/videos
  → { videos: string[] }  — list of video filenames

GET /api/onboarding/videos/{filename}
  → Redirect to S3 presigned URL (mp4 files, serve from S3 directly)
```

---

## 11. Key Design Constraints and Observations

### D3 Suffix Pattern

Some benchmarks run models with Grimme D3 dispersion correction. The `data[]` rows show `MLIP: "mace-mp-0a-D3"` but `id: "mace-mp-0a"`. The `model_name_map` provides the canonical → display name mapping. The frontend must use `id` for routing/linking and `MLIP` (from data row) for display.

### Score Direction

Score is always 0–1, higher is better. Threshold `good`/`bad` may run in either direction depending on metric:
- MAE metrics: `good=0`, `bad=50` → lower metric = greener cell
- Correlation metrics (ρ): `good=1.0`, `bad=-1.0` → higher metric = greener cell
- F1 scores: `good=1.0`, `bad=0.0` → higher = greener

The color interpolation formula: `color_fraction = (value - bad) / (good - bad)`, clamped to [0, 1].

### Missing Models Per Benchmark

Not all 19 models appear in every benchmark. Some benchmarks exclude molecular-oriented models from solid-state benchmarks and vice versa. The `data[]` array only includes models that were evaluated.

### Model Config Completeness

`model_configs` in each metrics_table.json is a complete configuration dictionary for every model that appears in that file. Configs are consistent across files for the same model ID.

### Weights = 0 for Sub-metrics

In GMTKN55, the individual sub-category scores have `weight: 0.0` and only `WTMAD` has `weight: 1.0`. This means the Score is derived from WTMAD alone. The frontend weight-adjustment UI should only expose metrics with non-zero weights by default, but allow adjusting any metric that appears in `weights`.

### Large File Alert

`phonon_interactive.json` (333 MB) is the only pathological file. All other files are manageable. Strategy: serve this via S3 presigned URL redirect, never buffer it through the API server. The frontend should lazy-load it on demand (accordion open) rather than fetching on page load.

### xyz File Access Pattern

3D structure viewer loads are per-structure (one file at a time). The API should support single-file fetches, not bulk downloads. Numbering is 0-based integers for most benchmarks, but some use zero-padded 3-digit integers (`001`–`024` for S24) or element names (`Fe54-O`).

---

## 12. Open Questions

1. **Phonon interactive split**: Should `phonon_interactive.json` be pre-split into per-model files server-side, or served from S3 with a presigned URL? The 333 MB file is impractical to load entirely in the browser.

2. **S3 bucket structure**: The MinIO bucket (`mc ls icp/fabian.zills`) mirrors the local `data/` structure exactly, but the path prefix inside the bucket needs confirmation from the deployment architecture doc.

3. **GMTKN55 xyz files**: The `data/molecular/GMTKN55/` directory has model subdirectories with ~1500 numbered xyz files each. Do these have a meaningful label (molecule name) or are they anonymous indexed structures? The metrics table provides no per-structure labels, so the 3D viewer may only show anonymous structures.

4. **Conformer benchmarks structure files**: `conformers/` subdirectories have model subdirectories in the data listing but glob shows no xyz files visible. Confirm whether conformer benchmarks have structure files or only metric tables/figures.

5. **SBH17, PLF547, LNCI16**: These benchmarks appear to have only metrics tables and no structure or figure files beyond the table. Verify.
