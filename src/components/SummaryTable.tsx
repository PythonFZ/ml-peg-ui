'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { Box, Button, Link, Slider, Tooltip, Typography } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import type { ApiEnvelope, Category, MetricsRow } from '@/lib/types';
import { normalizeScore, viridisR, textColorForViridis } from '@/lib/color';
import { formatSigFigs } from '@/lib/format';
import { MODEL_LINKS, MODEL_METADATA } from '@/lib/model-links';
import TableSkeleton from '@/components/TableSkeleton';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/** Short descriptions for each benchmark category (mirrors official site) */
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  molecular_reactions: 'Barrier heights of small molecules, proton transfer, and reaction energies',
  electric_field: 'Response of molecular systems to external electric fields',
  non_covalent_interactions: 'Binding energies and geometries of non-covalently bound complexes',
  molecular: 'Energetics and structures of small molecular systems',
  physicality: 'Physical properties: diatomics, extensivity, and locality checks',
  molecular_crystal: 'Lattice energies and structures of molecular crystals',
  thermochemistry: 'Heats of formation and atomization energies',
  conformers: 'Relative energies of molecular conformers',
  isomers: 'Energy ordering of constitutional and structural isomers',
  bulk_crystal: 'Lattice constants, elastic properties, and phonon frequencies of bulk crystals',
  lanthanides: 'Energetics of lanthanide-containing systems',
  supramolecular: 'Binding energies of large host–guest and supramolecular complexes',
  surfaces: 'Surface energies and adsorption on crystalline surfaces',
  nebs: 'Nudged elastic band transition-state pathways and barrier heights',
  tm_complexes: 'Energetics and spin states of transition-metal complexes',
  onboarding: 'Introductory benchmark for getting started with ML-PEG',
};

/** Fetch all benchmark tables for all categories in parallel via one SWR key */
function useSummaryData(categories: Category[]) {
  // Collect all benchmark slugs across all categories
  const allSlugs: Array<{ categorySlug: string; benchmarkSlug: string }> = useMemo(
    () =>
      categories.flatMap((cat) =>
        cat.benchmarks.map((b) => ({ categorySlug: cat.slug, benchmarkSlug: b.slug }))
      ),
    [categories]
  );

  const key = allSlugs.length > 0 ? ['summary', ...allSlugs.map((s) => s.benchmarkSlug)] : null;

  const { data, isLoading, error } = useSWR<
    Array<{ benchmarkSlug: string; rows: MetricsRow[] }>
  >(
    key,
    async () => {
      const results = await Promise.all(
        allSlugs.map(async ({ benchmarkSlug }) => {
          const res: ApiEnvelope<MetricsRow[]> = await fetcher(
            `/api/v1/benchmarks/${benchmarkSlug}/table`
          );
          return { benchmarkSlug, rows: res.data ?? [] };
        })
      );
      return results;
    },
    { revalidateOnFocus: false }
  );

  return { allSlugs, benchmarkData: data ?? [], isLoading, error };
}

function ModelTooltipContent({ modelId, displayName }: { modelId: string; displayName: string }) {
  const metadata = MODEL_METADATA[modelId];
  const url = MODEL_LINKS[modelId];
  return (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="body2" fontWeight={600}>{displayName}</Typography>
      {metadata?.architecture && (
        <Typography variant="caption" display="block">Architecture: {metadata.architecture}</Typography>
      )}
      {metadata?.params && (
        <Typography variant="caption" display="block">Parameters: {metadata.params}</Typography>
      )}
      {metadata?.training && (
        <Typography variant="caption" display="block">Training: {metadata.training}</Typography>
      )}
      {url && (
        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
          {url.includes('huggingface') ? 'HuggingFace' : 'GitHub'}: {url}
        </Typography>
      )}
      {!metadata && !url && (
        <Typography variant="caption" color="text.secondary">No additional info available</Typography>
      )}
    </Box>
  );
}

interface SummaryTableProps {
  categories: Category[];
  selectedModels?: string[];
  columnVisibilityModel?: Record<string, boolean>;
}

export default function SummaryTable({ categories, selectedModels = [], columnVisibilityModel }: SummaryTableProps) {
  const { allSlugs, benchmarkData, isLoading } = useSummaryData(categories);
  const [categoryWeights, setCategoryWeights] = useState<Record<string, number>>({});

  // Build a map: categorySlug -> list of benchmark slugs
  const categoryBenchmarks = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const cat of categories) {
      map.set(
        cat.slug,
        cat.benchmarks.map((b) => b.slug)
      );
    }
    return map;
  }, [categories]);

  // Build a map: benchmarkSlug -> rows
  const benchmarkRowMap = useMemo(() => {
    const map = new Map<string, MetricsRow[]>();
    for (const { benchmarkSlug, rows } of benchmarkData) {
      map.set(benchmarkSlug, rows);
    }
    return map;
  }, [benchmarkData]);

  // Collect all unique model ids across all benchmarks
  const allModelIds = useMemo(() => {
    const ids = new Set<string>();
    for (const { rows } of benchmarkData) {
      for (const row of rows) {
        ids.add(row.id);
      }
    }
    return Array.from(ids).sort();
  }, [benchmarkData]);

  // Build summary rows: one row per model with avg Score per category + weighted overall
  const summaryRows = useMemo(() => {
    return allModelIds.map((modelId) => {
      const row: Record<string, string | number | null> = {
        id: modelId,
        MLIP: modelId,
      };

      let weightedOverallSum = 0;
      let totalOverallWeight = 0;

      for (const [catSlug, benchSlugs] of categoryBenchmarks) {
        let catSum = 0;
        let catCount = 0;
        for (const benchSlug of benchSlugs) {
          const rows = benchmarkRowMap.get(benchSlug) ?? [];
          const modelRow = rows.find((r) => r.id === modelId);
          if (modelRow && modelRow.Score != null && typeof modelRow.Score === 'number') {
            catSum += modelRow.Score;
            catCount++;
          }
        }
        const catAvg = catCount > 0 ? catSum / catCount : null;
        row[catSlug] = catAvg;
        if (catAvg != null) {
          const catWeight = categoryWeights[catSlug] ?? 1;
          weightedOverallSum += catWeight * catAvg;
          totalOverallWeight += catWeight;
        }
      }

      row['overall'] = totalOverallWeight > 0 ? weightedOverallSum / totalOverallWeight : null;

      // Set MLIP display name from any benchmark row
      for (const { rows } of benchmarkData) {
        const modelRow = rows.find((r) => r.id === modelId);
        if (modelRow?.MLIP) {
          row['MLIP'] = modelRow.MLIP;
          break;
        }
      }

      return row as MetricsRow & Record<string, number | string | null>;
    });
  }, [allModelIds, categoryBenchmarks, benchmarkRowMap, benchmarkData, categoryWeights]);

  // Apply model filter when active
  const filteredSummaryRows = useMemo(
    () =>
      selectedModels.length > 0
        ? summaryRows.filter((row) => selectedModels.includes(row.MLIP as string))
        : summaryRows,
    [summaryRows, selectedModels]
  );

  // Compute min/max Score across all rows for normalization (use 0=bad, 1=good range)
  // Category Score columns: normalize between 0 and 1 (higher is better)
  const SCORE_GOOD = 1.0;
  const SCORE_BAD = 0.0;

  // Determine which category columns are visible (for weight sliders)
  const visibleCategories = useMemo(() => {
    if (!columnVisibilityModel) return categories;
    return categories.filter((cat) => columnVisibilityModel[cat.slug] !== false);
  }, [categories, columnVisibilityModel]);

  const columns: GridColDef[] = useMemo(() => {
    const mlipCol: GridColDef = {
      field: 'MLIP',
      headerName: 'MLIP',
      width: 180,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => {
        const url = MODEL_LINKS[params.row.id];
        return (
          <Tooltip
            title={<ModelTooltipContent modelId={params.row.id} displayName={params.value as string} />}
            arrow
            placement="right"
            enterDelay={300}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'default' }}>
              {url ? (
                <Link href={url} target="_blank" rel="noopener" underline="hover">
                  {params.value}
                </Link>
              ) : (
                params.value
              )}
              {url && <GitHubIcon sx={{ fontSize: 14, opacity: 0.6 }} />}
            </Box>
          </Tooltip>
        );
      },
    };

    const overallCol: GridColDef = {
      field: 'overall',
      headerName: 'Overall Score',
      width: 120,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => {
        const value = params.value as number | null;
        if (value == null) {
          return (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(128,128,128,0.3) 4px, rgba(128,128,128,0.3) 8px)',
              }}
            >
              {'\u2014'}
            </Box>
          );
        }
        const norm = normalizeScore(value, SCORE_GOOD, SCORE_BAD);
        const bg = viridisR(norm);
        const color = textColorForViridis(norm);
        return (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: bg,
              color,
              fontWeight: 600,
            }}
          >
            {formatSigFigs(value)}
          </Box>
        );
      },
    };

    const categoryCols: GridColDef[] = categories.map((cat) => ({
      field: cat.slug,
      headerName: cat.name,
      width: 130,
      sortable: true,
      renderHeader: () => {
        const description = CATEGORY_DESCRIPTIONS[cat.slug];
        if (description) {
          return (
            <Tooltip title={description} arrow>
              <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{cat.name}</span>
            </Tooltip>
          );
        }
        return <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{cat.name}</span>;
      },
      renderCell: (params: GridRenderCellParams) => {
        const value = params.value as number | null;
        if (value == null) {
          return (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(128,128,128,0.3) 4px, rgba(128,128,128,0.3) 8px)',
              }}
            >
              {'\u2014'}
            </Box>
          );
        }
        const norm = normalizeScore(value, SCORE_GOOD, SCORE_BAD);
        const bg = viridisR(norm);
        const color = textColorForViridis(norm);
        return (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: bg,
              color,
            }}
          >
            {formatSigFigs(value)}
          </Box>
        );
      },
    }));

    return [mlipCol, overallCol, ...categoryCols];
  }, [categories]);

  if (isLoading || (categories.length > 0 && benchmarkData.length < allSlugs.length)) {
    return <TableSkeleton rows={12} columns={categories.length + 2 || 8} />;
  }

  if (filteredSummaryRows.length === 0 && selectedModels.length > 0) {
    return (
      <Box sx={{ p: 2, color: 'text.secondary' }}>
        No models match the current filter.
      </Box>
    );
  }

  if (summaryRows.length === 0) {
    return (
      <Box sx={{ p: 2, color: 'text.secondary' }}>
        No data available. Ensure the API server is running.
      </Box>
    );
  }

  const totalSummaryWidth = 180 + 120 + categories.length * 130;

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
      }}
    >
      <Box
        sx={{
          minWidth: totalSummaryWidth,
          minHeight: 400,
          '& .MuiDataGrid-columnHeader[data-field="MLIP"], & .MuiDataGrid-cell[data-field="MLIP"]': {
            position: 'sticky',
            left: 0,
            zIndex: 4,
            backgroundColor: 'background.paper',
          },
          '& .MuiDataGrid-cell[data-field="MLIP"]': {
            zIndex: 3,
            backgroundColor: 'background.paper',
          },
          '& .MuiDataGrid-cell': {
            padding: 0,
          },
        }}
      >
        <DataGrid
          rows={filteredSummaryRows}
          columns={columns}
          getRowId={(row) => row.id}
          disableRowSelectionOnClick
          disableColumnMenu
          density="compact"
          sortingOrder={['asc', 'desc']}
          initialState={{
            sorting: {
              sortModel: [{ field: 'overall', sort: 'desc' }],
            },
            pagination: { paginationModel: { pageSize: 100 } },
          }}
          pageSizeOptions={[25, 50, 100]}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={() => {}}
        />
        {/* Category weight sliders row */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            pt: 1,
            pb: 0.5,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          {/* Label for MLIP column */}
          <Tooltip title="How much each category contributes to the overall score (0 = excluded, 1 = full weight)" arrow>
            <Box sx={{ minWidth: 180, width: 180, flexShrink: 0, display: 'flex', alignItems: 'center', pl: 1, pt: 1 }}>
              <Typography variant="caption" fontWeight={600}>Category weights</Typography>
            </Box>
          </Tooltip>
          {/* Spacer for Overall Score column */}
          <Box sx={{ minWidth: 120, width: 120, flexShrink: 0 }} />
          {/* Per-category weight slider — only visible categories */}
          {visibleCategories.map((cat) => {
            const weight = categoryWeights[cat.slug] ?? 1;
            return (
              <Box
                key={cat.slug}
                sx={{
                  minWidth: 130,
                  width: 130,
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  px: 0.5,
                  gap: 0.25,
                }}
              >
                <Slider
                  orientation="vertical"
                  min={0}
                  max={1}
                  step={0.05}
                  size="small"
                  value={weight}
                  sx={{ height: 56 }}
                  aria-label={`${cat.name} category weight`}
                  onChange={(_e, val) =>
                    setCategoryWeights((prev) => ({ ...prev, [cat.slug]: val as number }))
                  }
                />
                <Typography variant="caption" sx={{ lineHeight: 1.2 }}>
                  {weight.toFixed(2)}
                </Typography>
              </Box>
            );
          })}
          {/* Reset button */}
          <Box sx={{ minWidth: 80, display: 'flex', alignItems: 'flex-start', pt: 1, pl: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setCategoryWeights({})}
            >
              Reset
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
