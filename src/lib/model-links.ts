// Update this map when new models are added to the benchmark suite

export interface ModelMetadata {
  architecture?: string;
  params?: string;
  training?: string;
}

export const MODEL_METADATA: Record<string, ModelMetadata | undefined> = {
  // MACE family
  'mace-mp-0a': { architecture: 'MACE', params: '~5M', training: 'MPtrj' },
  'mace-mp-0b': { architecture: 'MACE', params: '~5M', training: 'MPtrj' },
  'mace-mp-0b3': { architecture: 'MACE', params: '~5M', training: 'MPtrj + sAlex' },
  'mace-mpa-0': { architecture: 'MACE', params: '~5M', training: 'MPtrj + sAlex' },
  'mace-omat-0': { architecture: 'MACE', training: 'OMat24' },
  'mace-off-s': { architecture: 'MACE', training: 'SPICE' },
  'mace-off-m': { architecture: 'MACE', training: 'SPICE' },
  'mace-off-l': { architecture: 'MACE', training: 'SPICE' },

  // ORB family
  'orb-v1': { architecture: 'ORB' },
  'orb-v2': { architecture: 'ORB' },
  'orb-v3': { architecture: 'ORB' },
  'orb-v3-consv-inf-omat': { architecture: 'ORB', training: 'OMat24' },
  'orb-v3-consv-inf': { architecture: 'ORB' },

  // MatterSim
  'mattersim-1m': { architecture: 'MatterSim', params: '~1M' },
  'mattersim-5m': { architecture: 'MatterSim', params: '~5M' },
  'mattersim-5M': { architecture: 'MatterSim', params: '~5M' },

  // UMA (Meta)
  'uma-s-1': { architecture: 'EquiformerV2', training: 'OC20+OMat' },
  'uma-s-1p1': { architecture: 'EquiformerV2', training: 'OC20+OMat' },
  'uma-s-1p1-omat': { architecture: 'EquiformerV2', training: 'OC20+OMat' },
  'uma-m-1': { architecture: 'EquiformerV2', training: 'OC20+OMat' },

  // SevenNet
  'sevennet-0': { architecture: 'SevenNet' },
  'sevennet-mf-omtrain': { architecture: 'SevenNet', training: 'MPtrj+OMat' },
  'sevennet-l3i8': { architecture: 'SevenNet' },

  // CHGNet
  'chgnet-0.3.0': { architecture: 'CHGNet', params: '~400K', training: 'MPtrj' },

  // M3GNet
  'm3gnet-ms': { architecture: 'M3GNet', training: 'MPtrj' },

  // eSEN / EquiformerV2
  'esen-s-omat': { architecture: 'eSEN', training: 'OAT' },
  'esen-sm-omat': { architecture: 'eSEN', training: 'OAT' },
  'eqv2-s-dens': { architecture: 'EquiformerV2', training: 'OC20' },
  'eqv2-m-omat': { architecture: 'EquiformerV2', training: 'OMat24' },

  // ALIGNN
  'alignn-ff': { architecture: 'ALIGNN' },
};

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
