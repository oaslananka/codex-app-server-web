import { describe, expect, it, vi } from 'vitest';
import { buildInitialState } from '../../src/lib/codex-runtime/runtime-state';
import { ThreadService } from '../../src/lib/codex-runtime/services/thread-service';
import { RuntimeStore } from '../../src/lib/codex-runtime/store';

describe('ThreadService', () => {
  it('falls back to thread/read when thread/resume loses the rollout', async () => {
    const store = new RuntimeStore(buildInitialState());
    store.patch({
      threads: [
        {
          id: '019d3144-50cf-75d2-95d5-7eda39430211',
          title: 'Recovered thread',
          status: { type: 'idle' },
        },
      ],
      visibleThreads: [
        {
          id: '019d3144-50cf-75d2-95d5-7eda39430211',
          title: 'Recovered thread',
          status: { type: 'idle' },
        },
      ],
    });

    const requestCompat = vi.fn(async (method: string) => {
      if (method === 'thread/resume') {
        throw {
          code: -32600,
          message: 'no rollout found for thread id 019d3144-50cf-75d2-95d5-7eda39430211',
        };
      }

      if (method === 'thread/read') {
        return {
          thread: {
            id: '019d3144-50cf-75d2-95d5-7eda39430211',
            title: 'Recovered thread',
            turns: [
              {
                items: [
                  {
                    id: 'user-1',
                    type: 'userMessage',
                    text: 'hello',
                    createdAt: '2026-03-28T01:00:00Z',
                  },
                  {
                    id: 'assistant-1',
                    type: 'agentMessage',
                    role: 'assistant',
                    text: 'world',
                    createdAt: '2026-03-28T01:00:01Z',
                  },
                ],
              },
            ],
          },
        };
      }

      throw new Error(`Unexpected method: ${method}`);
    }) as <T = unknown>(
      canonicalMethod: string,
      params?: unknown,
      fallbacks?: readonly string[],
    ) => Promise<T>;

    const service = new ThreadService(store, {
      requestCompat,
      markRequestSupported: vi.fn(),
      markRequestUnsupported: vi.fn(),
      toast: vi.fn(),
    });

    await service.selectThread('019d3144-50cf-75d2-95d5-7eda39430211');

    expect(requestCompat).toHaveBeenCalledWith(
      'thread/resume',
      { threadId: '019d3144-50cf-75d2-95d5-7eda39430211', includeTurns: true },
      ['thread/read', 'thread/get', 'session/open'],
    );
    expect(requestCompat).toHaveBeenCalledWith(
      'thread/read',
      { threadId: '019d3144-50cf-75d2-95d5-7eda39430211', includeTurns: true },
      ['thread/get'],
    );

    const snapshot = store.getState();
    expect(snapshot.chatEntries).toHaveLength(2);
    expect(snapshot.chatEntries[0]?.content).toBe('hello');
    expect(snapshot.chatEntries[1]?.content).toBe('world');
  });
});
