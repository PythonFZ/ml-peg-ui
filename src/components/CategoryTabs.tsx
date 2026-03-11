'use client';

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useRouter } from 'next/navigation';
import type { Category } from '@/lib/types';

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
}

export function CategoryTabs({ categories, activeCategory }: CategoryTabsProps) {
  const router = useRouter();
  const validValues = ['summary', ...categories.map((c) => c.slug)];
  const raw = activeCategory || 'summary';
  // Use false when value isn't in the tab list (e.g., categories still loading)
  const value = validValues.includes(raw) ? raw : false;

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    router.push(newValue === 'summary' ? '/' : `/${newValue}`);
  };

  return (
    <Tabs
      value={value}
      onChange={handleChange}
      variant="scrollable"
      scrollButtons="auto"
      aria-label="category tabs"
    >
      <Tab label="Summary" value="summary" />
      {categories.map((category) => (
        <Tab
          key={category.slug}
          label={category.name}
          value={category.slug}
        />
      ))}
    </Tabs>
  );
}
