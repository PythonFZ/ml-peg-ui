'use client';

import { use, useState, useCallback, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import LeaderboardTable from '@/components/LeaderboardTable';
import TableSkeleton from '@/components/TableSkeleton';
import FigureDrawer from '@/components/FigureDrawer';
import { useBenchmarkTable, useBenchmarkFigures } from '@/lib/api';

interface BenchmarkPageProps {
  params: Promise<{ category: string; benchmark: string }>;
}

export default function BenchmarkPage({ params }: BenchmarkPageProps) {
  const { benchmark } = use(params);
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
    filterModel: string | null; // null = all models (column click), string = single model (cell click)
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

  if (isLoading) {
    return <TableSkeleton />;
  }

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
