'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { useCategories } from '@/lib/api';
import TableSkeleton from '@/components/TableSkeleton';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { category } = use(params);
  const router = useRouter();
  const { categories, isLoading, error } = useCategories();

  useEffect(() => {
    if (isLoading) return;
    const found = categories.find((c) => c.slug === category);
    if (found && found.benchmarks.length > 0) {
      router.replace(`/${category}/${found.benchmarks[0].slug}`);
    }
  }, [categories, isLoading, category, router]);

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Failed to load categories. Please try again.</Typography>
      </Box>
    );
  }

  const found = categories.find((c) => c.slug === category);
  if (!found) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Category "{category}" not found.</Typography>
      </Box>
    );
  }

  // Redirecting — show skeleton while router.replace completes
  return <TableSkeleton />;
}
