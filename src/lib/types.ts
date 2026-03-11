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

export interface Threshold {
  good: number;
  bad: number;
  unit?: string;
}

export interface ColumnDescriptor {
  name: string;
  id: string;
}

export interface ColumnTooltip {
  value: string;
  type: string;
}

export interface BenchmarkMeta {
  count: number;
  columns: ColumnDescriptor[];
  thresholds: Record<string, Threshold>;
  tooltip_header: Record<string, ColumnTooltip | string>;
  weights: Record<string, number>;
}

export interface BenchmarkTableResponse {
  data: MetricsRow[];
  meta: BenchmarkMeta;
}

export interface FigureItem {
  slug: string;
  name: string;
}

export interface FigureListResponse {
  data: FigureItem[];
  meta: { count: number };
}

export interface FigureResponse {
  data: Record<string, unknown>;  // Raw Plotly JSON (has data, layout keys)
}
