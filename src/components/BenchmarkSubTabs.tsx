'use client';

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useRouter } from 'next/navigation';

interface BenchmarkSubTabsProps {
  benchmarks: Array<{ slug: string; name: string }>;
  activeBenchmark: string;
  categorySlug: string;
}

export function BenchmarkSubTabs({
  benchmarks,
  activeBenchmark,
  categorySlug,
}: BenchmarkSubTabsProps) {
  const router = useRouter();

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    router.push(`/${categorySlug}/${newValue}`);
  };

  return (
    <Tabs
      value={activeBenchmark}
      onChange={handleChange}
      variant="scrollable"
      scrollButtons="auto"
      aria-label="benchmark tabs"
      textColor="secondary"
      indicatorColor="secondary"
      sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5 } }}
    >
      {benchmarks.map((benchmark) => (
        <Tab
          key={benchmark.slug}
          label={benchmark.name}
          value={benchmark.slug}
        />
      ))}
    </Tabs>
  );
}
