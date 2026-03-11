// Update this map when new models are added to the benchmark suite
export const MODEL_LINKS: Record<string, string | undefined> = {
  // MACE family
  'mace-mp-0a': 'https://github.com/ACEsuit/mace-mp',
  'mace-mp-0b': 'https://github.com/ACEsuit/mace-mp',
  'mace-mp-0b3': 'https://github.com/ACEsuit/mace-mp',
  'mace-mpa-0': 'https://github.com/ACEsuit/mace-mp',
  'mace-omat-0': 'https://github.com/ACEsuit/mace-mp',
  'mace-off-s': 'https://github.com/ACEsuit/mace-off',
  'mace-off-m': 'https://github.com/ACEsuit/mace-off',
  'mace-off-l': 'https://github.com/ACEsuit/mace-off',

  // ORB family
  'orb-v1': 'https://github.com/orbital-materials/orb-models',
  'orb-v2': 'https://github.com/orbital-materials/orb-models',
  'orb-v3': 'https://github.com/orbital-materials/orb-models',
  'orb-v3-consv-inf-omat': 'https://github.com/orbital-materials/orb-models',
  'orb-v3-consv-inf': 'https://github.com/orbital-materials/orb-models',

  // MatterSim
  'mattersim-1m': 'https://github.com/microsoft/mattersim',
  'mattersim-5m': 'https://github.com/microsoft/mattersim',
  'mattersim-5M': 'https://github.com/microsoft/mattersim',

  // UMA (Meta)
  'uma-s-1': 'https://huggingface.co/facebook/uma',
  'uma-s-1p1': 'https://huggingface.co/facebook/uma',
  'uma-s-1p1-omat': 'https://huggingface.co/facebook/uma',
  'uma-m-1': 'https://huggingface.co/facebook/uma',

  // SevenNet
  'sevennet-0': 'https://github.com/MDIL-SNU/SevenNet',
  'sevennet-mf-omtrain': 'https://github.com/MDIL-SNU/SevenNet',
  'sevennet-l3i8': 'https://github.com/MDIL-SNU/SevenNet',

  // CHGNet
  'chgnet-0.3.0': 'https://github.com/CederGroupHub/chgnet',

  // M3GNet
  'm3gnet-ms': 'https://github.com/materialsvirtuallab/matgl',

  // eSEN / EquiformerV2
  'esen-s-omat': 'https://huggingface.co/fairchem/eSEN-30M-OAT',
  'esen-sm-omat': 'https://huggingface.co/fairchem/eSEN-30M-OAT',
  'eqv2-s-dens': 'https://github.com/FAIR-Chem/fairchem',
  'eqv2-m-omat': 'https://github.com/FAIR-Chem/fairchem',

  // ALIGNN
  'alignn-ff': 'https://github.com/usnistgov/alignn',
};
