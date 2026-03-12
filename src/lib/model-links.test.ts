import { describe, it, expect } from 'vitest';
import { MODEL_LINKS, MODEL_METADATA } from './model-links';

describe('MODEL_LINKS (FR-5.1 GitHub links)', () => {
  it('has at least one entry', () => {
    const keys = Object.keys(MODEL_LINKS);
    expect(keys.length).toBeGreaterThan(0);
  });

  it('all defined values are valid https URLs', () => {
    for (const [modelId, url] of Object.entries(MODEL_LINKS)) {
      if (url === undefined) continue;
      expect(url, `MODEL_LINKS["${modelId}"] should be a valid URL`).toMatch(
        /^https?:\/\//
      );
    }
  });

  it('all defined values point to GitHub or HuggingFace', () => {
    for (const [modelId, url] of Object.entries(MODEL_LINKS)) {
      if (url === undefined) continue;
      const isGithub = url.startsWith('https://github.com/');
      const isHuggingFace = url.startsWith('https://huggingface.co/');
      expect(
        isGithub || isHuggingFace,
        `MODEL_LINKS["${modelId}"] = "${url}" should point to GitHub or HuggingFace`
      ).toBe(true);
    }
  });

  it('includes the mace-mp-0a model entry', () => {
    expect(MODEL_LINKS['mace-mp-0a']).toBeDefined();
  });

  it('returns undefined for an unknown model (no broken links)', () => {
    const unknown = MODEL_LINKS['completely-unknown-model-xyz'];
    expect(unknown).toBeUndefined();
  });
});

describe('MODEL_METADATA', () => {
  it('has at least one entry', () => {
    const keys = Object.keys(MODEL_METADATA);
    expect(keys.length).toBeGreaterThan(0);
  });

  it('all MODEL_METADATA keys that have a link also exist in MODEL_LINKS', () => {
    const metadataKeys = Object.keys(MODEL_METADATA);
    const linkKeys = Object.keys(MODEL_LINKS);
    const metadataOnlyKeys = metadataKeys.filter(k => !linkKeys.includes(k));
    // Every model with metadata should also have a link
    expect(
      metadataOnlyKeys,
      `These models have metadata but no link: ${metadataOnlyKeys.join(', ')}`
    ).toHaveLength(0);
  });

  it('all MODEL_LINKS keys also exist in MODEL_METADATA', () => {
    const metadataKeys = Object.keys(MODEL_METADATA);
    const linkKeys = Object.keys(MODEL_LINKS);
    const linksOnlyKeys = linkKeys.filter(k => !metadataKeys.includes(k));
    // Every model with a link should also have metadata
    expect(
      linksOnlyKeys,
      `These models have a link but no metadata: ${linksOnlyKeys.join(', ')}`
    ).toHaveLength(0);
  });
});
