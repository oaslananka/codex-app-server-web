import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { resolveNextRuntimeMode } = require('../../src/lib/next-runtime.cjs');

describe('resolveNextRuntimeMode', () => {
  it('falls back to dev mode when NODE_ENV=production and build artifacts are missing', () => {
    const result = resolveNextRuntimeMode({
      nodeEnv: 'production',
      hasBuildArtifacts: false,
    });

    expect(result.dev).toBe(true);
    expect(result.reason).toBe('missing-build-artifacts');
  });

  it('stays in production mode when build artifacts exist', () => {
    const result = resolveNextRuntimeMode({
      nodeEnv: 'production',
      hasBuildArtifacts: true,
    });

    expect(result.dev).toBe(false);
    expect(result.reason).toBe('production');
  });

  it('uses dev mode in non-production environments', () => {
    const result = resolveNextRuntimeMode({
      nodeEnv: 'development',
      hasBuildArtifacts: false,
    });

    expect(result.dev).toBe(true);
    expect(result.reason).toBe('non-production');
  });

  it('falls back to dev mode when build artifacts are stale', () => {
    const result = resolveNextRuntimeMode({
      nodeEnv: 'production',
      hasBuildArtifacts: true,
      hasStaleBuildArtifacts: true,
    });

    expect(result.dev).toBe(true);
    expect(result.reason).toBe('stale-build-artifacts');
  });
});
