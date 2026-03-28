import { describe, expect, it, vi } from 'vitest';
import { FileService } from '../../src/lib/codex-runtime/services/file-service';
import { buildInitialState } from '../../src/lib/codex-runtime/runtime-state';
import { RuntimeStore } from '../../src/lib/codex-runtime/store';

describe('FileService Windows paths', () => {
  it('preserves Windows absolute paths when browsing directories', async () => {
    const store = new RuntimeStore(buildInitialState());
    const requestCompatSpy = vi.fn();
    const requestCompat = async <T = unknown>(canonicalMethod: string, params?: unknown) => {
      requestCompatSpy(canonicalMethod, params);
      return { entries: [] } as unknown as T;
    };
    const service = new FileService(store, {
      requestCompat,
      markRequestSupported: vi.fn(),
      markRequestUnsupported: vi.fn(),
      toast: vi.fn(),
    });

    await service.browse('/c:/Users/Admin/Desktop/PROJECTS/codex-web-ui');

    expect(requestCompatSpy).toHaveBeenCalledWith('fs/readDirectory', {
      path: 'c:/Users/Admin/Desktop/PROJECTS/codex-web-ui',
    });

    const state = store.getState();
    expect(state.fileBrowserPath).toBe('c:/Users/Admin/Desktop/PROJECTS/codex-web-ui');
    expect(state.fileBreadcrumb[0]).toEqual({
      label: 'c:/',
      path: 'c:/',
    });
  });
});
