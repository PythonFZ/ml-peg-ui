import useSWR from 'swr';
import type { ApiEnvelope, BenchmarkTableResponse, Category, FigureListResponse, FigureResponse } from './types';

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
  const { data, isLoading, error } = useSWR<BenchmarkTableResponse>(
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

export function useBenchmarkFigures(slug: string | null) {
  const { data, isLoading, error } = useSWR<FigureListResponse>(
    slug ? `/api/v1/benchmarks/${slug}/figures` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return {
    figures: data?.data ?? [],
    isLoading,
    error,
  };
}

export function useFigureData(benchmarkSlug: string | null, figureSlug: string | null) {
  const { data, isLoading, error } = useSWR<FigureResponse>(
    benchmarkSlug && figureSlug
      ? `/api/v1/benchmarks/${benchmarkSlug}/figures/${figureSlug}`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return {
    figureData: data?.data ?? null,
    isLoading,
    error,
  };
}
