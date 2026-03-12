import useSWR from 'swr';
import type { ApiEnvelope, BenchmarkTableResponse, Category, DiatomicCurvesResponse, DiatomicIndexResponse, FigureListResponse, FigureResponse, Model, NebFramesResponse } from './types';

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

export function useModels() {
  const { data, isLoading, error } = useSWR<ApiEnvelope<Model[]>>(
    '/api/v1/models',
    fetcher,
    { revalidateOnFocus: false }
  );
  return { models: data?.data ?? [], isLoading, error };
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

export function useDiatomicIndex() {
  const { data, isLoading, error } = useSWR<DiatomicIndexResponse>(
    '/api/v1/diatomics/index',
    fetcher,
    { revalidateOnFocus: false }
  );
  return {
    index: data?.data ?? {},
    isLoading,
    error,
  };
}

export function useDiatomicCurves(pair: string | null) {
  const { data, isLoading, error } = useSWR<DiatomicCurvesResponse>(
    pair ? `/api/v1/diatomics/curves/${pair}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return {
    curves: data?.data ?? [],
    isLoading,
    error,
  };
}

export function useNebFrames(benchmark: string, model: string | null, band: string) {
  const { data, isLoading, error } = useSWR<NebFramesResponse>(
    model ? `/api/v1/nebs/${benchmark}/${model}/${band}/frames` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return {
    frames: data?.data ?? [],
    isLoading,
    error,
  };
}

export function useStructure(benchmarkSlug: string | null, model: string | null, filename: string | null) {
  const { data, isLoading, error } = useSWR<import('./types').StructureResponse>(
    benchmarkSlug && model && filename
      ? `/api/v1/structures/${benchmarkSlug}/${model}/${filename}`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return {
    structureData: data?.data ?? null,
    isLoading,
    error,
  };
}
