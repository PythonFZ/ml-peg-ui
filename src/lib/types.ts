export interface ApiEnvelope<T> {
  data: T;
  meta: { count?: number; columns?: string[] };
}

export interface Category {
  slug: string;
  name: string;
  benchmarks: Array<{ slug: string; name: string }>;
}

export interface MetricsRow {
  id: string;
  MLIP: string;
  Score: number;
  [metric: string]: number | string | null;
}

export interface Model {
  id: string;
  display_name: string;
}
