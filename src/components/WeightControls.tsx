'use client';

import { useState } from 'react';
import { Box, Button, Slider, TextField, Typography } from '@mui/material';
import type { ColumnDescriptor, Threshold } from '@/lib/types';

export interface WeightControlsProps {
  columns: ColumnDescriptor[]; // metric columns only (no MLIP/Score/id)
  weights: Record<string, number>; // current weights (API defaults merged with overrides)
  thresholds: Record<string, Threshold>; // current thresholds (API defaults merged with overrides)
  onWeightChange: (colId: string, value: number) => void;
  onThresholdChange: (colId: string, threshold: Threshold) => void;
  onReset: () => void;
  mlipWidth?: number; // default 180
  scoreWidth?: number; // default 100
  metricWidth?: number; // default 110
}

export default function WeightControls({
  columns,
  weights,
  thresholds,
  onWeightChange,
  onThresholdChange,
  onReset,
  mlipWidth = 180,
  scoreWidth = 100,
  metricWidth = 110,
}: WeightControlsProps) {
  // Local state for threshold input text (to avoid re-rendering on every keystroke)
  const [localThresholds, setLocalThresholds] = useState<
    Record<string, { good: string; bad: string }>
  >({});

  function getGoodStr(colId: string): string {
    if (localThresholds[colId]?.good !== undefined) return localThresholds[colId].good;
    return thresholds[colId]?.good?.toString() ?? '';
  }

  function getBadStr(colId: string): string {
    if (localThresholds[colId]?.bad !== undefined) return localThresholds[colId].bad;
    return thresholds[colId]?.bad?.toString() ?? '';
  }

  function handleGoodChange(colId: string, val: string) {
    setLocalThresholds((prev) => ({
      ...prev,
      [colId]: { good: val, bad: prev[colId]?.bad ?? thresholds[colId]?.bad?.toString() ?? '' },
    }));
  }

  function handleBadChange(colId: string, val: string) {
    setLocalThresholds((prev) => ({
      ...prev,
      [colId]: { good: prev[colId]?.good ?? thresholds[colId]?.good?.toString() ?? '', bad: val },
    }));
  }

  function handleThresholdBlur(colId: string) {
    const good = parseFloat(getGoodStr(colId));
    const bad = parseFloat(getBadStr(colId));
    if (!isNaN(good) && !isNaN(bad)) {
      const unit = thresholds[colId]?.unit;
      onThresholdChange(colId, { good, bad, ...(unit ? { unit } : {}) });
    }
    // Clear local buffer so display reverts to canonical value if input was invalid
    setLocalThresholds((prev) => {
      const next = { ...prev };
      delete next[colId];
      return next;
    });
  }

  function handleReset() {
    setLocalThresholds({});
    onReset();
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        pt: 1,
        pb: 0.5,
        borderTop: 1,
        borderColor: 'divider',
        overflowX: 'visible',
      }}
    >
      {/* Spacer for MLIP column */}
      <Box sx={{ minWidth: mlipWidth, width: mlipWidth, flexShrink: 0 }} />

      {/* Spacer for Score column */}
      <Box sx={{ minWidth: scoreWidth, width: scoreWidth, flexShrink: 0 }} />

      {/* Per-metric control boxes */}
      {columns.map((col) => {
        const weight = weights[col.id] ?? 1;
        return (
          <Box
            key={col.id}
            sx={{
              minWidth: metricWidth,
              width: metricWidth,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              px: 0.5,
              gap: 0.25,
            }}
          >
            <Slider
              orientation="vertical"
              min={0}
              max={1}
              step={0.05}
              size="small"
              value={weight}
              sx={{ height: 56 }}
              aria-label={`${col.name} weight`}
              onChange={(_e, val) => onWeightChange(col.id, val as number)}
            />
            <Typography variant="caption" sx={{ lineHeight: 1.2 }}>
              {weight.toFixed(2)}
            </Typography>
            <TextField
              type="number"
              size="small"
              label="G"
              value={getGoodStr(col.id)}
              onChange={(e) => handleGoodChange(col.id, e.target.value)}
              onBlur={() => handleThresholdBlur(col.id)}
              sx={{ width: 65 }}
              inputProps={{ step: 'any', 'aria-label': `${col.name} good threshold` }}
            />
            <TextField
              type="number"
              size="small"
              label="B"
              value={getBadStr(col.id)}
              onChange={(e) => handleBadChange(col.id, e.target.value)}
              onBlur={() => handleThresholdBlur(col.id)}
              sx={{ width: 65 }}
              inputProps={{ step: 'any', 'aria-label': `${col.name} bad threshold` }}
            />
          </Box>
        );
      })}

      {/* Reset button */}
      <Box sx={{ minWidth: 80, display: 'flex', alignItems: 'flex-start', pt: 1, pl: 1 }}>
        <Button variant="outlined" size="small" onClick={handleReset}>
          Reset
        </Button>
      </Box>
    </Box>
  );
}
