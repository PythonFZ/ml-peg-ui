# ML-PEG UI

## Vision
Modern, fast, beautiful web interface for the ML-PEG benchmarking leaderboard — replacing the existing slow Dash app at ml-peg.stfc.ac.uk. A scientific data dashboard for comparing Machine Learning Interatomic Potentials (MLIPs) across dozens of chemical/physical benchmarks.

## Problem
The current ML-PEG site uses Python Dash, which is notoriously slow for interactive data exploration. The UI is outdated, hard to navigate, and lacks modern features like search, filtering, and responsive design.

## Solution
Rebuild as a Next.js + FastAPI monorepo deployed on Vercel:
- **FastAPI backend** serves pre-computed benchmark data from MinIO/S3-compatible storage
- **Next.js frontend** with MUI components, Plotly charts, and modern UX
- **Single Vercel deployment** — API as serverless Python function, frontend as static/SSR

## Tech Stack
- **Frontend**: Next.js (TypeScript), MUI, Plotly.js (react-plotly.js)
- **Backend**: FastAPI (Python)
- **Storage**: MinIO S3-compatible (`mc ls icp/fabian.zills`)
- **Package managers**: bun (JS), uv (Python)
- **Deployment**: Vercel (single project)

## Data Overview
Public data from https://github.com/ddmms/ml-peg (GPL-3.0):
- **53 metrics table JSONs** — model scores per benchmark (small, ~few KB each)
- **239 figure JSONs** — pre-serialized Plotly figures (mostly <2 MB)
- **92K+ diatomic curve JSONs** — small files per element pair per model
- **1 large file**: `phonon_interactive.json` (333 MB) — needs splitting/lazy loading
- **820K xyz files** — atomic structures for 3D viewer (~5.6 MB total)
- **27 extxyz files** — trajectory data for structure viewer
- **14 benchmark categories**, ~50+ individual benchmarks, ~7 active models

## Key Features
1. **Leaderboard table** — MUI DataGrid (not Plotly table), color-coded scores, sortable
2. **Search** — Multi-entry autocomplete for models and benchmarks
3. **Interactive plots** — Click table cell → show Plotly charts (parity, violin, density scatter)
4. **Dark/Light mode** — MUI theme toggle
5. **GitHub links** — Link to model repos and benchmark sources
6. **Responsive** — Works on mobile and desktop
7. **Fast** — Pre-computed data served from S3, no server-side computation

## Architecture
```
ml-peg-ui/
├── api/
│   └── index.py              # FastAPI app (all endpoints)
├── src/ or app/               # Next.js app directory
│   ├── components/            # React components
│   ├── app/                   # Next.js app router pages
│   └── lib/                   # API client, types, utils
├── pyproject.toml             # uv Python project
├── requirements.txt           # Python deps for Vercel
├── package.json               # bun JS project
├── vercel.json                # routing config
└── data/                      # Local dev data (not committed)
```

## Constraints
- Vercel serverless: 500 MB function limit, 10s/60s timeout
- No persistent filesystem — all data from S3
- Pre-computed data only (no live metric computation)
- Same origin for API and frontend (no CORS)

## Users
Researchers and ML engineers comparing MLIP model performance across benchmarks. This is intended to eventually replace the public ml-peg.stfc.ac.uk site.
