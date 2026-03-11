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
    modelName: string;
  }>({ open: false, benchmarkSlug: '', benchmarkName: '', modelName: '' });

  const handleCellClick = useCallback(
    (benchmarkSlug: string, modelName: string) => {
      setDrawerState({ open: true, benchmarkSlug, benchmarkName: benchmark, modelName });
    },
    [benchmark]
  );

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
    <Box sx={{ width: '100%', height: '100%' }}>
      <LeaderboardTable
        rows={tableData}
        meta={meta}
        onCellClick={handleCellClick}
        activeBenchmarkSlug={benchmark}
        slugsWithFigures={slugsWithFigures}
      />
      <FigureDrawer
        open={drawerState.open}
        onClose={() => setDrawerState((prev) => ({ ...prev, open: false }))}
        benchmarkSlug={drawerState.benchmarkSlug}
        benchmarkName={drawerState.benchmarkName}
        modelName={drawerState.modelName}
      />
    </Box>
  );
}
