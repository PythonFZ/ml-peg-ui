'use client';

import { Box, Skeleton } from '@mui/material';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export default function TableSkeleton({ rows = 10, columns = 6 }: TableSkeletonProps) {
  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Header row */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} variant="rectangular" width={i === 0 ? 180 : 110} height={36} />
        ))}
      </Box>
      {/* Data rows */}
      {Array.from({ length: rows }, (_, r) => (
        <Box key={r} sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} variant="rectangular" width={c === 0 ? 180 : 110} height={28} />
          ))}
        </Box>
      ))}
    </Box>
  );
}
