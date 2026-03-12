'use client';

import dynamic from 'next/dynamic';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Skeleton,
  Typography,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useStructure } from '@/lib/api';

// Mol3DViewer is the dynamic import target — never import directly (SSR-incompatible, large bundle)
const Mol3DViewer = dynamic(() => import('./Mol3DViewer'), { ssr: false });

interface StructureModalProps {
  open: boolean;
  onClose: () => void;
  benchmarkSlug: string;
  model: string;
  filename: string;
}

export default function StructureModal({
  open,
  onClose,
  benchmarkSlug,
  model,
  filename,
}: StructureModalProps) {
  const { structureData, isLoading, error } = useStructure(
    open ? benchmarkSlug : null,
    open ? model : null,
    open ? filename : null,
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Structure: {filename}</span>
        <IconButton onClick={onClose} aria-label="close structure modal" size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {isLoading && (
          <Skeleton variant="rectangular" width="100%" height={500} />
        )}

        {error && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">
              No structure data available for this benchmark / model.
            </Typography>
          </Box>
        )}

        {structureData && (
          <Mol3DViewer
            xyzData={structureData.xyz_string}
            hasPbc={structureData.has_pbc}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
