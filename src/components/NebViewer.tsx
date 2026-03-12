'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Stack,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { useColorScheme } from '@mui/material/styles';
import type { NebFrame } from '@/lib/types';

// Both are client-only; load dynamically to avoid SSR issues
const NebStructurePlayer = dynamic(() => import('./NebStructurePlayer'), {
  ssr: false,
});
const PlotlyChart = dynamic(() => import('./PlotlyChart'), { ssr: false });

interface NebViewerProps {
  frames: NebFrame[];
  band: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPlotlyThemeOverrides(mode: string | undefined): Record<string, any> {
  const isDark = mode === 'dark';
  return {
    paper_bgcolor: isDark ? '#121212' : '#ffffff',
    plot_bgcolor: isDark ? '#1e1e1e' : '#fafafa',
    font: { color: isDark ? '#e0e0e0' : '#212121' },
    xaxis: { gridcolor: isDark ? '#333' : '#e0e0e0' },
    yaxis: { gridcolor: isDark ? '#333' : '#e0e0e0' },
  };
}

export default function NebViewer({ frames, band }: NebViewerProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const { mode } = useColorScheme();

  // Reset to frame 0 when frames data changes (new model selected)
  useEffect(() => {
    setCurrentFrame(0);
    setIsPlaying(false);
  }, [frames]);

  // Auto-play: advance one frame every 500 ms
  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;
    const id = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % frames.length);
    }, 500);
    return () => clearInterval(id);
  }, [isPlaying, frames.length]);

  const energies = frames.map((f) => f.energy);
  const themeOverrides = getPlotlyThemeOverrides(mode);

  const chartData = [
    {
      x: frames.map((_, i) => i),
      y: energies,
      mode: 'lines+markers',
      type: 'scatter',
      name: `Band ${band.toUpperCase()}`,
      line: { color: mode === 'dark' ? '#90caf9' : '#1565c0' },
      marker: { size: 6 },
    },
    {
      x: [currentFrame],
      y: [energies[currentFrame] ?? 0],
      mode: 'markers',
      type: 'scatter',
      name: 'Current frame',
      marker: { size: 12, color: 'red', symbol: 'circle' },
      showlegend: false,
    },
  ];

  const chartLayout = {
    ...themeOverrides,
    xaxis: {
      title: 'Reaction Coordinate (frame)',
      ...themeOverrides.xaxis,
    },
    yaxis: {
      title: 'Energy (eV)',
      ...themeOverrides.yaxis,
    },
    margin: { t: 20, r: 20, b: 50, l: 60 },
    legend: { orientation: 'h', y: -0.2 },
  };

  return (
    <Box>
      {/* Side-by-side layout: 3D viewer (left) + energy chart (right) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
          mb: 2,
        }}
      >
        {/* Left: 3D Structure Player */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            3D Structure
          </Typography>
          <NebStructurePlayer
            frames={frames}
            currentFrame={currentFrame}
            onFrameChange={setCurrentFrame}
          />
        </Box>

        {/* Right: Energy profile chart */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Energy Profile
          </Typography>
          <PlotlyChart data={chartData} layout={chartLayout} />
        </Box>
      </Box>

      {/* Playback controls */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ px: 1 }}>
        <IconButton
          onClick={() => setIsPlaying((p) => !p)}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          size="small"
          color="primary"
        >
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>

        <Slider
          min={0}
          max={frames.length - 1}
          value={currentFrame}
          onChange={(_e, val) => {
            setIsPlaying(false);
            setCurrentFrame(val as number);
          }}
          sx={{ flex: 1 }}
          aria-label="Frame scrubber"
        />

        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          Frame {currentFrame + 1} / {frames.length}
        </Typography>
      </Stack>
    </Box>
  );
}
