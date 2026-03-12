'use client';

import { Box } from '@mui/material';
import { CategoryTabs } from '@/components/CategoryTabs';
import SummaryTable from '@/components/SummaryTable';
import { useCategories } from '@/lib/api';
import { useFilterContext } from '@/lib/filter-context';

export default function Home() {
  const { categories, isLoading } = useCategories();
  const { selectedModels } = useFilterContext();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <CategoryTabs categories={categories} activeCategory="summary" />
      <Box sx={{ flex: 1, overflow: 'hidden', p: 0 }}>
        {!isLoading && (
          <SummaryTable categories={categories} selectedModels={selectedModels} />
        )}
      </Box>
    </Box>
  );
}
