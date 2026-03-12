'use client';

import { useMemo } from 'react';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { Box, Link, Tooltip } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import type { MetricsRow, BenchmarkMeta } from '@/lib/types';
import { normalizeScore, viridisR, textColorForViridis } from '@/lib/color';
import { formatSigFigs } from '@/lib/format';
import { MODEL_LINKS } from '@/lib/model-links';

interface LeaderboardTableProps {
  rows: MetricsRow[];
  meta: BenchmarkMeta;
  onCellClick?: (benchmarkSlug: string, modelName: string) => void;
  onColumnHeaderClick?: (benchmarkSlug: string) => void;
  activeBenchmarkSlug?: string;
  slugsWithFigures?: Set<string> | null;
  columnVisibilityModel?: Record<string, boolean>;
}

const MLIP_WIDTH = 180;
const SCORE_WIDTH = 100;

function HatchedCell() {
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

export default function LeaderboardTable({
  rows,
  meta,
  onCellClick,
  onColumnHeaderClick,
  activeBenchmarkSlug,
  slugsWithFigures,
  columnVisibilityModel,
}: LeaderboardTableProps) {
  const isClickable = Boolean(
    slugsWithFigures?.has(activeBenchmarkSlug ?? '')
  );

  const columns: GridColDef[] = useMemo(() => {
    const mlipCol: GridColDef = {
      field: 'MLIP',
      headerName: 'MLIP',
      width: MLIP_WIDTH,
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

    const scoreCol: GridColDef = {
      field: 'Score',
      headerName: 'Score',
      width: SCORE_WIDTH,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => {
        const value = params.value as number | null;
        if (value == null) return <HatchedCell />;

        const threshold = meta.thresholds['Score'];
        if (threshold) {
          const norm = normalizeScore(value, threshold.good, threshold.bad);
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
        }
        return formatSigFigs(value);
      },
    };

    const metricCols: GridColDef[] = meta.columns
      .filter((col) => col.id !== 'MLIP' && col.id !== 'Score' && col.id !== 'id')
      .map((col) => ({
        field: col.id,
        headerName: col.name,
        width: 110,
        sortable: true,
        renderHeader: () => {
          const tip = meta.tooltip_header[col.id];
          const tipText = tip
            ? typeof tip === 'string'
              ? tip
              : tip.value
            : undefined;
          if (tipText) {
            return (
              <Tooltip title={tipText} arrow>
                <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{col.name}</span>
              </Tooltip>
            );
          }
          return <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{col.name}</span>;
        },
        renderCell: (params: GridRenderCellParams) => {
          const value = params.value as number | null;
          if (value == null) return <HatchedCell />;

          const threshold = meta.thresholds[col.id];
          if (threshold) {
            const norm = normalizeScore(value, threshold.good, threshold.bad);
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
          }
          return formatSigFigs(value);
        },
      }));

    return [mlipCol, scoreCol, ...metricCols];
  }, [meta]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 400,
        // Remove cell padding to allow colored cells to fill completely
        '& .MuiDataGrid-cell': {
          padding: 0,
          cursor: isClickable ? 'pointer' : 'default',
          ...(isClickable && {
            '&:hover': { filter: 'brightness(0.92)' },
          }),
        },
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        disableRowSelectionOnClick
        disableColumnMenu
        disableColumnResize
        density="compact"
        sortingOrder={['asc', 'desc']}
        pageSizeOptions={[25, 50, 100]}
        initialState={{
          pagination: { paginationModel: { pageSize: 100 } },
        }}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={() => {}}
        onCellClick={(params, event) => {
          if (!isClickable) return;
          if (
            params.field === 'MLIP' ||
            params.field === 'id' ||
            params.field === '__check__'
          )
            return;
          event.stopPropagation();
          onCellClick?.(activeBenchmarkSlug ?? '', params.row.MLIP);
        }}
        onColumnHeaderClick={(params, event) => {
          if (!isClickable) return;
          if (params.field === 'MLIP' || params.field === 'id' || params.field === '__check__') return;
          event.stopPropagation();
          onColumnHeaderClick?.(activeBenchmarkSlug ?? '');
        }}
      />
    </Box>
  );
}
