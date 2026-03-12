'use client';

import { use, useState, useCallback, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Box, Tab, Tabs, TextField, Typography } from '@mui/material';
import LeaderboardTable from '@/components/LeaderboardTable';
import TableSkeleton from '@/components/TableSkeleton';
import FigureDrawer from '@/components/FigureDrawer';
import { useBenchmarkTable, useBenchmarkFigures } from '@/lib/api';
import { useFilterContext } from '@/lib/filter-context';

// Custom viewer components — lazy loaded since most benchmarks don't need them
const DiatomicViewer = dynamic(() => import('@/components/DiatomicViewer'), { ssr: false });
const NebBenchmarkViewer = dynamic(() => import('@/components/NebBenchmarkViewer'), { ssr: false });

// Benchmarks that have an additional "Explorer" tab with a custom viewer
const CUSTOM_VIEWERS: Record<string, string> = {
  diatomics: 'diatomic',
  li_diffusion: 'neb',
  li_migration: 'neb',
};

interface BenchmarkPageProps {
  params: Promise<{ category: string; benchmark: string }>;
}

export default function BenchmarkPage({ params }: BenchmarkPageProps) {
  const { benchmark } = use(params);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'explorer'>('leaderboard');
  const [colFilter, setColFilter] = useState('');

  const { tableData, meta, isLoading, error } = useBenchmarkTable(benchmark);
  const { figures: figureList } = useBenchmarkFigures(benchmark);
  const { selectedModels } = useFilterContext();

  const hasFigures = figureList.length > 0;
  const slugsWithFigures = useMemo(
    () => (hasFigures ? new Set([benchmark]) : new Set<string>()),
    [benchmark, hasFigures]
  );

  // Reset column filter when benchmark changes
  useEffect(() => {
    setColFilter('');
  }, [benchmark]);

  // Row filtering: hide non-matching models when model filter is active
  const filteredRows = useMemo(
    () =>
      selectedModels.length > 0
        ? tableData.filter((row) => selectedModels.includes(row.MLIP as string))
        : tableData,
    [tableData, selectedModels]
  );

  // Column visibility: hide columns not matching colFilter; MLIP and Score always visible
  const columnVisibilityModel = useMemo(() => {
    if (!colFilter.trim() || !meta) return {};
    return Object.fromEntries(
      meta.columns
        .filter((col) => col.id !== 'MLIP' && col.id !== 'Score' && col.id !== 'id')
        .map((col) => [col.id, col.name.toLowerCase().includes(colFilter.toLowerCase())])
    );
  }, [colFilter, meta]);

  const [drawerState, setDrawerState] = useState<{
    open: boolean;
    benchmarkSlug: string;
    benchmarkName: string;
    filterModel: string | null;
  }>({ open: false, benchmarkSlug: '', benchmarkName: '', filterModel: null });

  const handleCellClick = useCallback(
    (benchmarkSlug: string, modelName: string) => {
      setDrawerState({ open: true, benchmarkSlug, benchmarkName: benchmark, filterModel: modelName });
    },
    [benchmark]
  );

  const handleColumnHeaderClick = useCallback(
    (benchmarkSlug: string) => {
      setDrawerState({ open: true, benchmarkSlug, benchmarkName: benchmark, filterModel: null });
    },
    [benchmark]
  );

  const handlePageClick = useCallback(() => {
    setDrawerState((prev) => (prev.open ? { ...prev, open: false } : prev));
  }, []);

  const viewerType = CUSTOM_VIEWERS[benchmark.replace(/-/g, '_')];

  // Render custom viewer tab content
  function renderExplorer() {
    if (viewerType === 'diatomic') return <DiatomicViewer />;
    if (viewerType === 'neb') return <NebBenchmarkViewer benchmarkSlug={benchmark} />;
    return null;
  }

  // Render leaderboard tab content
  function renderLeaderboard() {
    if (isLoading) return <TableSkeleton />;

    if (error) {
      return (
        <Box sx={{ p: 3 }}>
          <Typography color="error">
            Failed to load benchmark data. Please check that the API server is running and try again.
          </Typography>
        </Box>
      );
    }

    if (!meta || tableData.length === 0) {
      return (
        <Box sx={{ p: 3 }}>
          <Typography color="text.secondary">No data found for this benchmark.</Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }} onClick={handlePageClick}>
        <Box sx={{ px: 2, pt: 1, pb: 0.5, flexShrink: 0 }}>
          <TextField
            size="small"
            placeholder="Filter columns..."
            value={colFilter}
            onChange={(e) => setColFilter(e.target.value)}
            sx={{ width: 220 }}
            inputProps={{ 'aria-label': 'Filter columns' }}
          />
        </Box>
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <LeaderboardTable
            rows={filteredRows}
            meta={meta}
            onCellClick={handleCellClick}
            onColumnHeaderClick={handleColumnHeaderClick}
            activeBenchmarkSlug={benchmark}
            slugsWithFigures={slugsWithFigures}
            columnVisibilityModel={columnVisibilityModel}
          />
        </Box>
        <FigureDrawer
          open={drawerState.open}
          onClose={() => setDrawerState((prev) => ({ ...prev, open: false }))}
          benchmarkSlug={drawerState.benchmarkSlug}
          benchmarkName={drawerState.benchmarkName}
          filterModel={drawerState.filterModel}
        />
      </Box>
    );
  }

  // No custom viewer — just show the leaderboard directly (no tabs)
  if (!viewerType) {
    return renderLeaderboard();
  }

  // Has custom viewer — show tabs
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Tabs
        value={activeTab}
        onChange={(_e, val) => setActiveTab(val)}
        sx={{ borderBottom: 1, borderColor: 'divider', px: 2, flexShrink: 0 }}
      >
        <Tab label="Leaderboard" value="leaderboard" />
        <Tab label="Explorer" value="explorer" />
      </Tabs>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'leaderboard' && renderLeaderboard()}
        {activeTab === 'explorer' && renderExplorer()}
      </Box>
    </Box>
  );
}
