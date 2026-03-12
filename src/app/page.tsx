'use client';

import { useMemo, useState } from 'react';
import { Box, TextField } from '@mui/material';
import { CategoryTabs } from '@/components/CategoryTabs';
import SummaryTable from '@/components/SummaryTable';
import { FaqSection } from '@/components/FaqSection';
import { useCategories } from '@/lib/api';
import { useFilterContext } from '@/lib/filter-context';

export default function Home() {
  const { categories, isLoading } = useCategories();
  const { selectedModels } = useFilterContext();
  const [colFilter, setColFilter] = useState('');

  // Column visibility: hide category columns not matching colFilter; MLIP and overall always visible
  const columnVisibilityModel = useMemo(() => {
    if (!colFilter.trim()) return undefined;
    return Object.fromEntries(
      categories.map((cat) => [cat.slug, cat.name.toLowerCase().includes(colFilter.toLowerCase())])
    );
  }, [colFilter, categories]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <CategoryTabs categories={categories} activeCategory="summary" />
      <Box sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {!isLoading && (
          <>
            <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
              <TextField
                size="small"
                placeholder="Filter columns..."
                value={colFilter}
                onChange={(e) => setColFilter(e.target.value)}
                sx={{ width: 220 }}
                inputProps={{ 'aria-label': 'Filter columns' }}
              />
            </Box>
            <SummaryTable
              categories={categories}
              selectedModels={selectedModels}
              columnVisibilityModel={columnVisibilityModel}
            />
            <FaqSection />
          </>
        )}
      </Box>
    </Box>
  );
}
