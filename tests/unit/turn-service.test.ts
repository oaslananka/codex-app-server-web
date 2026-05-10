import { describe, expect, it, vi } from 'vitest';
import { buildInitialState } from '../../src/lib/codex-runtime/runtime-state';
import { RuntimeStore } from '../../src/lib/codex-runtime/store';
import { TurnService } from '../../src/lib/codex-runtime/services/turn-service';

describe('TurnService', () => {
  it('starts a writable thread automatically when the user sends the first message without selecting a thread', async () => {
    const store = new RuntimeStore(buildInitialState());
    store.patch({
      messageDraft: 'hello from a fresh session',
    });

    const requestCompat = vi.fn(async (method: string) => {
      if (method === 'turn/start') {
        return { ok: true };
      }
      throw new Error(`Unexpected method: ${method}`);
    }) as <T = unknown>(
      canonicalMethod: string,
      params?: unknown,
      fallbacks?: readonly string[],
    ) => Promise<T>;

    const appendUserDraftEntry = vi.fn();
    const ensureWritableThread = vi.fn(async () => 'thread-123');
    const upsertThreadEntry = vi.fn();
    const toast = vi.fn();

    const service = new TurnService(
      store,
      {
        requestCompat,
        markRequestSupported: vi.fn(),
        markRequestUnsupported: vi.fn(),
        toast,
      },
      {
        appendUserDraftEntry,
        ensureWritableThread,
        upsertThreadEntry,
      },
    );

    await service.sendMessage();

    expect(ensureWritableThread).toHaveBeenCalledWith(null);
    expect(appendUserDraftEntry).toHaveBeenCalledTimes(1);
    expect(requestCompat).toHaveBeenCalledWith(
      'turn/start',
      expect.objectContaining({
        threadId: 'thread-123',
        input: [
          expect.objectContaining({
            type: 'text',
            text: 'hello from a fresh session',
          }),
        ],
      }),
    );
    expect(toast).not.toHaveBeenCalledWith('Select a thread first', 'info');
    expect(store.getState().turnActive).toBe(true);
    expect(store.getState().messageDraft).toBe('');
  });

  it('removes the optimistic draft entry when turn/start fails', async () => {
    const store = new RuntimeStore(buildInitialState());
    store.patch({
      messageDraft: 'this send should fail',
    });

    const requestCompat = vi.fn(async (method: string) => {
      if (method === 'turn/start') {
        throw new Error('backend unavailable');
      }
      throw new Error(`Unexpected method: ${method}`);
    }) as <T = unknown>(
      canonicalMethod: string,
      params?: unknown,
      fallbacks?: readonly string[],
    ) => Promise<T>;

    const toast = vi.fn();

    const service = new TurnService(
      store,
      {
        requestCompat,
        markRequestSupported: vi.fn(),
        markRequestUnsupported: vi.fn(),
        toast,
      },
      {
        appendUserDraftEntry(entry) {
          store.patch((state) => ({
            threadEntries: {
              ...state.threadEntries,
              [entry.threadId ?? 'thread-123']: [
                ...(state.threadEntries[entry.threadId ?? 'thread-123'] ?? []),
                entry,
              ],
            },
          }));
        },
        ensureWritableThread: vi.fn(async () => 'thread-123'),
        upsertThreadEntry: vi.fn(),
      },
    );

    await service.sendMessage();

    expect(store.getState().threadEntries['thread-123']).toEqual([]);
    expect(store.getState().messageDraft).toBe('this send should fail');
    expect(toast).toHaveBeenCalledWith('Send failed: backend unavailable', 'error');
  });

  it('includes the selected sandbox policy in turn/start payloads', async () => {
    const store = new RuntimeStore(buildInitialState());
    store.patch({
      messageDraft: 'use the configured sandbox',
      selectedSandboxMode: 'workspace-write',
      configData: {
        sandbox_workspace_write: {
          writable_roots: ['/workspace'],
          network_access: true,
          exclude_tmpdir_env_var: true,
          exclude_slash_tmp: false,
        },
      },
    });

    const requestCompat = vi.fn(async (method: string) => {
      if (method === 'turn/start') {
        return { ok: true };
      }
      throw new Error(`Unexpected method: ${method}`);
    }) as <T = unknown>(
      canonicalMethod: string,
      params?: unknown,
      fallbacks?: readonly string[],
    ) => Promise<T>;

    const service = new TurnService(
      store,
      {
        requestCompat,
        markRequestSupported: vi.fn(),
        markRequestUnsupported: vi.fn(),
        toast: vi.fn(),
      },
      {
        appendUserDraftEntry: vi.fn(),
        ensureWritableThread: vi.fn(async () => 'thread-123'),
        upsertThreadEntry: vi.fn(),
      },
    );

    await service.sendMessage();

    expect(requestCompat).toHaveBeenCalledWith(
      'turn/start',
      expect.objectContaining({
        sandboxPolicy: {
          type: 'workspaceWrite',
          writableRoots: ['/workspace'],
          networkAccess: true,
          excludeTmpdirEnvVar: true,
          excludeSlashTmp: false,
        },
      }),
    );
  });
});
