'use client';

import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MobileStepper from '@mui/material/MobileStepper';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const TUTORIAL_KEY = 'mlpeg_tutorial_seen';

const STEPS = [
  {
    title: 'Welcome to ML-PEG',
    content: (
      <Box>
        <Typography variant="body1" gutterBottom>
          ML-PEG is a benchmarking leaderboard for machine learning interatomic potentials (MLIPs)
          evaluated across diverse chemical systems.
        </Typography>
        <Typography variant="body1">
          Each cell shows a benchmark score for a given model. Scores use a viridis colormap:
          <strong> green</strong> indicates good performance,
          <strong> purple</strong> indicates poor performance.
        </Typography>
      </Box>
    ),
  },
  {
    title: 'Explore the Data',
    content: (
      <Box>
        <Typography variant="body1" gutterBottom>
          Click any colored cell to open a detailed Plotly figure showing the underlying data for
          that model and benchmark combination.
        </Typography>
        <Typography variant="body1">
          Hover over column headers to see metric descriptions. Click a column header to view
          figures for all models on that benchmark at once.
        </Typography>
      </Box>
    ),
  },
  {
    title: 'Customize Weights',
    content: (
      <Box>
        <Typography variant="body1" gutterBottom>
          The weight sliders below the table let you adjust how much each metric contributes to
          the overall Score. Set a weight to zero to exclude a metric entirely.
        </Typography>
        <Typography variant="body1">
          Advanced users can also edit the Good/Bad threshold values to change how scores are
          normalized. Click Reset to return to the default weights and thresholds.
        </Typography>
      </Box>
    ),
  },
];

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
}

export function TutorialModal({ open, onClose }: TutorialModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const maxSteps = STEPS.length;

  // Reset to first step when modal opens
  useEffect(() => {
    if (open) setActiveStep(0);
  }, [open]);

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleDone = () => {
    localStorage.setItem(TUTORIAL_KEY, '1');
    onClose();
  };

  const isLast = activeStep === maxSteps - 1;

  return (
    <Dialog open={open} onClose={handleDone} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>{STEPS[activeStep].title}</DialogTitle>
      <DialogContent sx={{ minHeight: 140 }}>{STEPS[activeStep].content}</DialogContent>
      <DialogActions sx={{ flexDirection: 'column', alignItems: 'stretch', px: 3, pb: 2 }}>
        <MobileStepper
          variant="dots"
          steps={maxSteps}
          position="static"
          activeStep={activeStep}
          sx={{ flexGrow: 1, background: 'transparent', px: 0 }}
          nextButton={
            isLast ? (
              <Button size="small" onClick={handleDone} variant="contained">
                Done
              </Button>
            ) : (
              <Button size="small" onClick={handleNext}>
                Next
              </Button>
            )
          }
          backButton={
            <Button size="small" onClick={handleBack} disabled={activeStep === 0}>
              Back
            </Button>
          }
        />
      </DialogActions>
    </Dialog>
  );
}

export function useTutorialModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Only read localStorage inside useEffect to avoid SSR hydration mismatch
    if (!localStorage.getItem(TUTORIAL_KEY)) {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(TUTORIAL_KEY, '1');
    setOpen(false);
  };

  const reopen = () => setOpen(true);

  return { open, dismiss, reopen };
}
