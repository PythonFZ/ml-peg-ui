'use client';

import { use } from 'react';
import { usePathname } from 'next/navigation';
import { Box } from '@mui/material';
import { CategoryTabs } from '@/components/CategoryTabs';
import { BenchmarkSubTabs } from '@/components/BenchmarkSubTabs';
import { useCategories } from '@/lib/api';

interface CategoryLayoutProps {
  children: React.ReactNode;
  params: Promise<{ category: string }>;
}

export default function CategoryLayout({ children, params }: CategoryLayoutProps) {
  const { category } = use(params);
  const { categories } = useCategories();
  const pathname = usePathname();

  // Derive active benchmark from pathname: /<category>/<benchmark>
  const segments = pathname.split('/').filter(Boolean);
  const activeBenchmark = segments.length >= 2 ? segments[1] : '';

  // Find current category to get its benchmarks
  const currentCategory = categories.find((c) => c.slug === category);
  const benchmarks = currentCategory?.benchmarks ?? [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <CategoryTabs categories={categories} activeCategory={category} />
      {benchmarks.length > 0 && (
        <BenchmarkSubTabs
          benchmarks={benchmarks}
          activeBenchmark={activeBenchmark}
          categorySlug={category}
        />
      )}
      <Box sx={{ flex: 1, overflow: 'hidden', p: 0 }}>
        {children}
      </Box>
    </Box>
  );
}
