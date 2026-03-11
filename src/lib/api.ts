import useSWR from 'swr';
import type { ApiEnvelope, Category, MetricsRow } from './types';

export const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useCategories() {
  const { data, isLoading, error } = useSWR<ApiEnvelope<Category[]>>(
    '/api/v1/categories',
    fetcher,
    { revalidateOnFocus: false }
  );
  return {
    categories: data?.data ?? [],
    isLoading,
    error,
  };
}

export function useBenchmarkTable(slug: string | null) {
  const { data, isLoading, error } = useSWR<ApiEnvelope<MetricsRow[]>>(
    slug ? `/api/v1/benchmarks/${slug}/table` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return {
    tableData: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
  };
}
