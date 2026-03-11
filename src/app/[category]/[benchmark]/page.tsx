'use client';

import { use } from 'react';
import { Box, Typography } from '@mui/material';
import LeaderboardTable from '@/components/LeaderboardTable';
import TableSkeleton from '@/components/TableSkeleton';
import { useBenchmarkTable } from '@/lib/api';

interface BenchmarkPageProps {
  params: Promise<{ category: string; benchmark: string }>;
}

export default function BenchmarkPage({ params }: BenchmarkPageProps) {
  const { benchmark } = use(params);
  const { tableData, meta, isLoading, error } = useBenchmarkTable(benchmark);

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
      <LeaderboardTable rows={tableData} meta={meta} />
    </Box>
  );
}
