// Known NEB model IDs for the li_diffusion benchmark.
// Sourced from data/nebs/li_diffusion/ directory listing.
// A dynamic model-list endpoint is a future enhancement.
export const NEB_LI_DIFFUSION_MODELS: string[] = [
  'mace-matpes-r2scan',
  'mace-mh-1-omat',
  'mace-mh-1-omol',
  'mace-mp-0a',
  'mace-mp-0b3',
  'mace-mpa-0',
  'mace-omat-0',
  'mattersim-5M',
  'orb-v3-consv-inf-omat',
  'orb-v3-consv-omol',
  'pet-mad',
  'uma-m-1p1-omat',
  'uma-s-1p1-omat',
];

// NEB band identifiers — each model has two NEB bands
export const NEB_BANDS: string[] = ['b', 'c'];
