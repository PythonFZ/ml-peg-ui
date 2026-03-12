'use client';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const FAQ_ITEMS = [
  {
    question: 'What is ML-PEG?',
    answer:
      'ML-PEG (Machine Learning Potential Energy Generator) benchmarks machine learning interatomic potentials (MLIPs) across diverse chemical systems including molecular, crystalline, and surface structures.',
  },
  {
    question: 'How are scores calculated?',
    answer:
      'Each metric is normalized to [0, 1] using Good/Bad thresholds defined per benchmark. The Score is a weighted average of all normalized metrics. Higher is better — a score of 1 represents perfect performance, 0 represents the worst expected performance.',
  },
  {
    question: 'How do thresholds work?',
    answer:
      'Good = best expected value, Bad = worst expected value for a given metric. Values are clamped to [0, 1] after normalization. You can adjust thresholds using the controls below each table to reflect your domain expectations.',
  },
  {
    question: 'How can I add my model?',
    answer:
      'Contact the ML-PEG team or submit a pull request to the GitHub repository with your model\'s benchmark results. See the GitHub link in the top navigation bar for the repository and contribution guidelines.',
  },
  {
    question: 'What benchmarks are included?',
    answer:
      'ML-PEG covers a wide range of chemical systems: molecular conformers, bulk crystals, surfaces, diatomics, NEB (nudged elastic band) trajectories, thermochemistry, non-covalent interactions, and more. Use the category tabs at the top of the page to explore the full list.',
  },
];

export function FaqSection() {
  return (
    <Box sx={{ mt: 4, mb: 4, px: 2 }}>
      <Typography variant="h6" gutterBottom>
        Frequently Asked Questions
      </Typography>
      {FAQ_ITEMS.map((item) => (
        <Accordion key={item.question} disableGutters elevation={0} variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body1" fontWeight={500}>
              {item.question}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary">
              {item.answer}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
