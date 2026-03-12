'use client';

import { useState } from 'react';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import { useDiatomicIndex, useDiatomicCurves } from '@/lib/api';
import PeriodicTable from '@/components/PeriodicTable';
import DiatomicChart from '@/components/DiatomicChart';

function computePair(e1: string, e2: string): string {
  // Pairs are stored alphabetically: "Ac-H" not "H-Ac"
  return [e1, e2].sort().join('-');
}

export default function DiatomicsPage() {
  const [element1, setElement1] = useState<string | null>(null);
  const [element2, setElement2] = useState<string | null>(null);

  const { index, isLoading: indexLoading } = useDiatomicIndex();

  const pair =
    element1 && element2 ? computePair(element1, element2) : null;

  const { curves, isLoading: curvesLoading } = useDiatomicCurves(pair);

  function handleSelectElement(symbol: string) {
    if (!element1) {
      // First selection
      setElement1(symbol);
      setElement2(null);
    } else if (symbol === element1) {
      // Clicking element1 deselects it (reset)
      setElement1(null);
      setElement2(null);
    } else if (!element2) {
      // Second selection
      setElement2(symbol);
    } else {
      // Both already selected — clicking anything resets to new element1
      setElement1(symbol);
      setElement2(null);
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          Diatomic Curves
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select two elements to view and compare diatomic energy curves across all MLIP models.
          Elements without diatomic data are grayed out. After selecting the first element, only
          valid pair partners remain enabled.
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        {indexLoading ? (
          <Skeleton variant="rectangular" width="100%" height={220} sx={{ borderRadius: 1 }} />
        ) : (
          <PeriodicTable
            availablePairs={index}
            selectedElement1={element1}
            selectedElement2={element2}
            onSelectElement={handleSelectElement}
          />
        )}
      </Paper>

      {/* Selection status chips */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Selected:
        </Typography>
        {element1 ? (
          <Chip
            label={element1}
            color="primary"
            size="small"
            onDelete={() => { setElement1(null); setElement2(null); }}
          />
        ) : (
          <Typography variant="body2" color="text.disabled">
            (none)
          </Typography>
        )}
        {element2 && (
          <Chip
            label={element2}
            color="secondary"
            size="small"
            onDelete={() => setElement2(null)}
          />
        )}
      </Box>

      {/* Chart area */}
      <Paper sx={{ p: 2, minHeight: 120 }}>
        {!pair && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 120,
            }}
          >
            <Typography variant="body1" color="text.secondary">
              Select two elements to view diatomic curves
            </Typography>
          </Box>
        )}

        {pair && curvesLoading && (
          <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 1 }} />
        )}

        {pair && !curvesLoading && (
          <DiatomicChart curves={curves} pair={pair} />
        )}
      </Paper>
    </Container>
  );
}
