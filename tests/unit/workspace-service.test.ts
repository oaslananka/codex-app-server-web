import { describe, expect, it, vi } from 'vitest';
import { buildInitialState } from '../../src/lib/codex-runtime/runtime-state';
import { RuntimeStore } from '../../src/lib/codex-runtime/store';
import { WorkspaceService } from '../../src/lib/codex-runtime/services/workspace-service';

type RequestCompat = <T = unknown>(
  canonicalMethod: string,
  params?: unknown,
  fallbacks?: readonly string[],
) => Promise<T>;

function createService(requestCompat: RequestCompat) {
  const store = new RuntimeStore(buildInitialState());
  const service = new WorkspaceService(store, {
    requestCompat,
    markRequestSupported: vi.fn(),
    markRequestUnsupported: vi.fn(),
    toast: vi.fn(),
  });

  return { store, service };
}

describe('WorkspaceService', () => {
  it('falls back to cwd summary when the active thread has no valid backend id', async () => {
    const requestCompat = vi.fn(async (method: string, params?: unknown) => {
      expect(method).toBe('getConversationSummary');
      expect(params).toEqual({ rolloutPath: '/workspace/project' });
      return { summary: 'cwd summary' };
    }) as RequestCompat;
    const { store, service } = createService(requestCompat);

    store.patch({
      activeThread: {
        id: 'thread:local-snapshot',
        cwd: '/workspace/project',
      },
    });

    await service.loadConversationSummary();

    expect(store.getState().workspaceSummary).toMatchObject({
      content: 'cwd summary',
      source: 'cwd',
      loading: false,
      error: '',
    });
  });

  it('blocks review start for local-only threads before hitting the backend', async () => {
    const requestCompat = vi.fn() as RequestCompat;
    const toast = vi.fn();
    const store = new RuntimeStore(buildInitialState());
    const service = new WorkspaceService(store, {
      requestCompat,
      markRequestSupported: vi.fn(),
      markRequestUnsupported: vi.fn(),
      toast,
    });

    store.patch({
      activeThread: {
        id: 'thread:local-snapshot',
        cwd: '/workspace/project',
      },
    });

    await service.startReview();

    expect(requestCompat).not.toHaveBeenCalled();
    expect(store.getState().review).toEqual({
      loading: false,
      error: 'Review requires an active backend thread.',
      reviewThreadId: null,
    });
    expect(toast).toHaveBeenCalledWith('Review requires an active backend thread.', 'info');
  });
});
