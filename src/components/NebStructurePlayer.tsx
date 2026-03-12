'use client';

import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import type { NebFrame } from '@/lib/types';

interface NebStructurePlayerProps {
  frames: NebFrame[];
  currentFrame: number;
  onFrameChange: (index: number) => void;
}

/**
 * Convert JSON NEB frames to a multi-frame XYZ string suitable for 3Dmol.js.
 * Each frame block: atom count, comment line, then one "symbol x y z" line per atom.
 */
function framesToXyz(frames: NebFrame[]): string {
  return frames
    .map((frame) => {
      const n = frame.species.length;
      let comment = '';
      if (frame.lattice) {
        const flat = frame.lattice.flat().join(' ');
        comment = `Lattice="${flat}" pbc="T T T"`;
      }
      const atomLines = frame.species
        .map((sym, i) => {
          const [x, y, z] = frame.positions[i];
          return `${sym} ${x} ${y} ${z}`;
        })
        .join('\n');
      return `${n}\n${comment}\n${atomLines}`;
    })
    .join('\n');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Viewer3Dmol = any;

export default function NebStructurePlayer({
  frames,
  currentFrame,
}: NebStructurePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer3Dmol>(null);

  // Initialise 3Dmol viewer and load all frames when frames array changes
  useEffect(() => {
    if (!containerRef.current || frames.length === 0) return;

    let cancelled = false;

    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const $3Dmol = await import('3dmol' as any);
      if (cancelled) return;

      // Tear down any existing viewer
      if (viewerRef.current) {
        try {
          viewerRef.current.clear();
        } catch {
          // ignore
        }
        viewerRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      const viewer: Viewer3Dmol = $3Dmol.createViewer(containerRef.current, {
        backgroundColor: 'transparent',
      });
      viewerRef.current = viewer;

      const xyzMultiframe = framesToXyz(frames);
      viewer.addModelsAsFrames(xyzMultiframe, 'xyz');
      viewer.setStyle({}, { sphere: { radius: 0.3 }, stick: { radius: 0.15 } });

      if (frames[0].lattice) {
        // Add unit cell to first model (model 0)
        const model = viewer.getModel(0);
        if (model) {
          viewer.addUnitCell(model, { box: { color: 'grey', linewidth: 1 } });
        }
      }

      viewer.zoomTo();
      viewer.render();
    })();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames]);

  // Scrub to the requested frame when currentFrame changes
  useEffect(() => {
    if (!viewerRef.current || frames.length === 0) return;
    try {
      viewerRef.current.setFrame(currentFrame);
      viewerRef.current.render();
    } catch {
      // viewer may not be ready yet
    }
  }, [currentFrame, frames.length]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '500px',
        position: 'relative',
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: 'transparent',
      }}
    />
  );
}
