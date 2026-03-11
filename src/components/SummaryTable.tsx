'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { Box, Link } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import type { ApiEnvelope, Category, MetricsRow } from '@/lib/types';
import { normalizeScore, viridisR, textColorForViridis } from '@/lib/color';
import { formatSigFigs } from '@/lib/format';
import { MODEL_LINKS } from '@/lib/model-links';
import TableSkeleton from '@/components/TableSkeleton';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

interface SummaryTableProps {
  categories: Category[];
}

export default function SummaryTable({ categories }: SummaryTableProps) {
  const { allSlugs, benchmarkData, isLoading } = useSummaryData(categories);

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

  // Build summary rows: one row per model with avg Score per category + overall
  const summaryRows = useMemo(() => {
    return allModelIds.map((modelId) => {
      const row: Record<string, string | number | null> = {
        id: modelId,
        MLIP: modelId,
      };

      let overallSum = 0;
      let overallCount = 0;

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
          overallSum += catAvg;
          overallCount++;
        }
      }

      row['overall'] = overallCount > 0 ? overallSum / overallCount : null;

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
  }, [allModelIds, categoryBenchmarks, benchmarkRowMap, benchmarkData]);

  // Compute min/max Score across all rows for normalization (use 0=bad, 1=good range)
  // Category Score columns: normalize between 0 and 1 (higher is better)
  const SCORE_GOOD = 1.0;
  const SCORE_BAD = 0.0;

  const columns: GridColDef[] = useMemo(() => {
    const mlipCol: GridColDef = {
      field: 'MLIP',
      headerName: 'MLIP',
      width: 180,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => {
        const url = MODEL_LINKS[params.row.id];
        if (url) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Link href={url} target="_blank" rel="noopener" underline="hover">
                {params.value}
              </Link>
              <GitHubIcon sx={{ fontSize: 14, opacity: 0.6 }} />
            </Box>
          );
        }
        return params.value;
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

  if (summaryRows.length === 0) {
    return (
      <Box sx={{ p: 2, color: 'text.secondary' }}>
        No data available. Ensure the API server is running.
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
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
        rows={summaryRows}
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
      />
    </Box>
  );
}
