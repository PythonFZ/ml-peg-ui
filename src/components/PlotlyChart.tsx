// This component is ONLY imported via next/dynamic — never directly.
// Lazy-loaded on first drawer open to avoid Plotly bundle in initial page JS.

import Plotly from 'plotly.js-basic-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';

const Plot = createPlotlyComponent(Plotly);

interface PlotlyChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  layout: Record<string, any>;
}

export default function PlotlyChart({ data, layout }: PlotlyChartProps) {
  return (
    <Plot
      data={data}
      layout={layout}
      config={{ displayModeBar: 'hover' }}
      useResizeHandler
      style={{ width: '100%', height: '400px' }}
    />
  );
}
