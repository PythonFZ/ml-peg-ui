'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useNebFrames } from '@/lib/api';
import { NEB_BANDS, NEB_LI_DIFFUSION_MODELS } from '@/lib/neb-constants';

const NebViewer = dynamic(() => import('./NebViewer'), { ssr: false });

interface NebBenchmarkViewerProps {
  benchmarkSlug: string;
}

export default function NebBenchmarkViewer({ benchmarkSlug }: NebBenchmarkViewerProps) {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedBand, setSelectedBand] = useState<string>('b');

  // Map benchmark slug back to the API benchmark name
  const apiBenchmark = benchmarkSlug.replace(/-/g, '_');

  const { frames, isLoading, error } = useNebFrames(
    apiBenchmark,
    selectedModel,
    selectedBand
  );

  // TODO: when more NEB benchmarks are added, load models dynamically from API
  const models = NEB_LI_DIFFUSION_MODELS;

  return (
    <Box sx={{ p: 2, overflow: 'auto', height: '100%' }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            alignItems: 'center',
            mb: selectedModel ? 3 : 0,
          }}
        >
          <FormControl sx={{ minWidth: 280 }} size="small">
            <InputLabel id="neb-model-label">Model</InputLabel>
            <Select
              labelId="neb-model-label"
              value={selectedModel ?? ''}
              label="Model"
              onChange={(e) => setSelectedModel(e.target.value || null)}
            >
              <MenuItem value="">
                <em>Select a model</em>
              </MenuItem>
              {models.map((model) => (
                <MenuItem key={model} value={model}>
                  {model}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Band
            </Typography>
            <ToggleButtonGroup
              value={selectedBand}
              exclusive
              onChange={(_e, val) => {
                if (val !== null) setSelectedBand(val);
              }}
              size="small"
              aria-label="NEB band"
            >
              {NEB_BANDS.map((band) => (
                <ToggleButton key={band} value={band} aria-label={`Band ${band}`}>
                  {band.toUpperCase()}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </Box>

        {!selectedModel && (
          <Typography color="text.secondary" variant="body2" sx={{ mt: 2 }}>
            Select a model above to view the NEB trajectory.
          </Typography>
        )}

        {selectedModel && isLoading && (
          <Box>
            <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 1, mb: 2 }} />
            <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
          </Box>
        )}

        {selectedModel && error && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            Failed to load NEB frames for model &quot;{selectedModel}&quot;. The model or band data
            may not be available.
          </Typography>
        )}

        {selectedModel && !isLoading && !error && frames.length > 0 && (
          <NebViewer frames={frames} band={selectedBand} />
        )}
      </Paper>
    </Box>
  );
}
