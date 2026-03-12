'use client';

import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface Mol3DViewerProps {
  xyzData: string;
  hasPbc: boolean;
}

export default function Mol3DViewer({ xyzData, hasPbc }: Mol3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !xyzData) return;

    // Dynamic import — NEVER import 3dmol at module level (SSR incompatible, large bundle)
    import('3dmol').then(($3Dmol) => {
      if (!containerRef.current) return;

      // Clean up previous viewer if any
      if (viewerRef.current) {
        viewerRef.current = null;
        containerRef.current.innerHTML = '';
      }

      const viewer = $3Dmol.createViewer(containerRef.current, {
        backgroundColor: 'white',
        backgroundAlpha: 0,
      });

      const model = viewer.addModel(xyzData, 'xyz');

      // Ball-and-stick style per project decision
      viewer.setStyle({}, {
        sphere: { radius: 0.3 },
        stick: { radius: 0.15 },
      });

      // Unit cell wireframe for crystal structures (pbc=T T T)
      if (hasPbc) {
        viewer.addUnitCell(model, {
          box: { color: 'grey', linewidth: 1 },
        });
      }

      viewer.zoomTo();
      viewer.render();

      viewerRef.current = viewer;
    });

    return () => {
      // 3Dmol.js handles its own WebGL cleanup; just clear our reference
      viewerRef.current = null;
    };
  }, [xyzData, hasPbc]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '500px',
        position: 'relative',
      }}
    />
  );
}
