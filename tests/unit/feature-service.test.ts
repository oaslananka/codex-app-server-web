import { describe, expect, it, vi } from 'vitest';
import { buildInitialState } from '../../src/lib/codex-runtime/runtime-state';
import { RuntimeStore } from '../../src/lib/codex-runtime/store';
import { FeatureService } from '../../src/lib/codex-runtime/services/feature-service';

type RequestCompat = <T = unknown>(
  canonicalMethod: string,
  params?: unknown,
  fallbacks?: readonly string[],
) => Promise<T>;

function createService(requestCompat: RequestCompat) {
  const store = new RuntimeStore(buildInitialState());
  const service = new FeatureService(store, {
    requestCompat,
    markRequestSupported: vi.fn(),
    markRequestUnsupported: vi.fn(),
    toast: vi.fn(),
  });

  return { store, service };
}

describe('FeatureService', () => {
  it('creates stable unique warning ids for config loading failures', async () => {
    const requestCompat = vi.fn(async () => {
      throw new Error('unsupported');
    }) as RequestCompat;
    const { store, service } = createService(requestCompat);

    await service.loadConfig();

    const ids = store.getState().integrationWarnings.map((warning) => warning.id);
    expect(ids).toContain('config:config-read');
    expect(ids).toContain('config:config-requirements');
    expect(ids).toContain('config:mcp-status');
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps info warning ids unique even when multiple warnings share the same source', async () => {
    const requestCompat = vi.fn(async () => {
      throw new Error('unsupported');
    }) as RequestCompat;
    const { store, service } = createService(requestCompat);

    await service.loadInfo();

    const ids = store.getState().integrationWarnings.map((warning) => warning.id);
    expect(ids).toContain('info:experimental-features');
    expect(ids).toContain('info:collaboration-modes');
    expect(new Set(ids).size).toBe(ids.length);
  });
});
