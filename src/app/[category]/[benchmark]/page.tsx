'use client';

import { use, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import LeaderboardTable from '@/components/LeaderboardTable';
import TableSkeleton from '@/components/TableSkeleton';
import FigureDrawer from '@/components/FigureDrawer';
import { useBenchmarkTable, useBenchmarkFigures } from '@/lib/api';

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

  const { tableData, meta, isLoading, error } = useBenchmarkTable(benchmark);
  const { figures: figureList } = useBenchmarkFigures(benchmark);

  const hasFigures = figureList.length > 0;
  const slugsWithFigures = useMemo(
    () => (hasFigures ? new Set([benchmark]) : new Set<string>()),
    [benchmark, hasFigures]
  );

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
      <Box sx={{ width: '100%', height: '100%' }} onClick={handlePageClick}>
        <LeaderboardTable
          rows={tableData}
          meta={meta}
          onCellClick={handleCellClick}
          onColumnHeaderClick={handleColumnHeaderClick}
          activeBenchmarkSlug={benchmark}
          slugsWithFigures={slugsWithFigures}
        />
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
