'use client';

import { Box, Skeleton } from '@mui/material';

export default function FigureSkeleton() {
  return (
    <Box sx={{ width: '100%' }}>
      <Skeleton variant="rectangular" width="100%" height={400} />
    </Box>
  );
}
