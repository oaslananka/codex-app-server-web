import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebsocketRpcClient } from '../../src/lib/codex-runtime/transport/websocket-client';
import { clearBrowserLogs, getRecentBrowserLogs } from '../../src/lib/logging/browser-logger';

class MockWebSocket {
  static readonly OPEN = 1;

  static readonly CLOSED = 3;

  static instances: MockWebSocket[] = [];

  readonly sent: string[] = [];

  readyState = MockWebSocket.OPEN;

  onopen: (() => void) | null = null;

  onmessage: ((event: { data: string }) => void) | null = null;

  onerror: (() => void) | null = null;

  onclose: ((event: { code: number; reason: string }) => void) | null = null;

  constructor(public readonly url: string) {
    MockWebSocket.instances.push(this);
  }

  send(payload: string) {
    this.sent.push(payload);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
  }
}

describe('WebsocketRpcClient', () => {
  const originalWindow = globalThis.window;
  const originalWebSocket = globalThis.WebSocket;
  const originalLocation = globalThis.location;

  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.useFakeTimers();
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: globalThis,
    });
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: {
        protocol: 'http:',
        host: 'localhost:3000',
      },
    });
    Object.defineProperty(globalThis, 'WebSocket', {
      configurable: true,
      value: MockWebSocket,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    clearBrowserLogs();
    if (originalWindow === undefined) {
      Reflect.deleteProperty(globalThis, 'window');
    } else {
      Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
    }
    if (originalWebSocket === undefined) {
      Reflect.deleteProperty(globalThis, 'WebSocket');
    } else {
      Object.defineProperty(globalThis, 'WebSocket', {
        configurable: true,
        value: originalWebSocket,
      });
    }
    if (originalLocation === undefined) {
      Reflect.deleteProperty(globalThis, 'location');
    } else {
      Object.defineProperty(globalThis, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }
  });

  it('rejects all in-flight requests when the transport disconnects', async () => {
    const client = new WebsocketRpcClient('ws://localhost:4000/ws');
    client.connect();

    const socket = MockWebSocket.instances[0];
    expect(socket).toBeDefined();
    if (!socket) {
      throw new Error('Expected websocket instance');
    }

    socket.onopen?.();
    socket.onmessage?.({
      data: JSON.stringify({ jsonrpc: '2.0', id: 1, result: { ok: true } }),
    });

    const pending = client.request('thread/list', {});
    socket.onclose?.({ code: 1006, reason: 'socket lost' });

    await expect(pending).rejects.toThrow(/socket lost|disconnected/i);
  });

  it('rejects requests immediately when the transport is unavailable', async () => {
    const client = new WebsocketRpcClient('ws://localhost:4000/ws');

    await expect(client.request('thread/list', {})).rejects.toThrow(/not connected|disconnected/i);
  });

  it('summarizes upstream HTML challenge errors instead of logging raw pages', async () => {
    const client = new WebsocketRpcClient('ws://localhost:4000/ws');
    client.connect();

    const socket = MockWebSocket.instances[0];
    expect(socket).toBeDefined();
    if (!socket) {
      throw new Error('Expected websocket instance');
    }

    socket.onopen?.();
    socket.onmessage?.({
      data: JSON.stringify({ jsonrpc: '2.0', id: 1, result: { ok: true } }),
    });

    const pending = client.request('app/list', {});
    socket.onmessage?.({
      data: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        error: {
          code: -32603,
          message:
            'failed to list apps: Request failed with status 403 Forbidden: <html><body><span id="challenge-error-text">Enable JavaScript and cookies to continue</span></body></html>',
        },
      }),
    });

    await expect(pending).rejects.toThrow(
      'Request failed with status 403 Forbidden: remote service returned an HTML challenge page instead of API JSON. This usually means auth expired or the request was blocked upstream.',
    );

    const lastLog = getRecentBrowserLogs().at(-1);
    expect(lastLog?.message).toBe('RPC request failed');
    expect(lastLog?.details.join('\n')).not.toContain('<html>');
  });
});
