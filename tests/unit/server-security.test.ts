import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const security = require('../../src/lib/server/security.cjs') as Record<string, any>;

const token = 'test-token-123';

function wsRequest(overrides: Record<string, unknown> = {}) {
  return {
    url: '/ws',
    method: 'GET',
    headers: {
      host: '127.0.0.1:1989',
      origin: 'http://127.0.0.1:1989',
      cookie: `codex_ui_token=${token}`,
    },
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  };
}

describe('server security helpers', () => {
  it('uses loopback-only defaults for the local control plane', () => {
    const config = security.createLocalAccessConfig({ PORT: '1989', CODEX_UI_TOKEN: token });

    expect(config.uiHost).toBe('127.0.0.1');
    expect(config.codexBackendUrl).toBe('ws://127.0.0.1:40000');
    expect(config.allowedHosts.has('127.0.0.1:1989')).toBe(true);
    expect(config.allowedOrigins.has('http://127.0.0.1:1989')).toBe(true);
    expect(config.maxWsPayloadBytes).toBe(1_048_576);
    expect(config.maxUploadBytes).toBe(10_485_760);
    expect(security.ALLOWED_IMAGE_EXTENSIONS.has('.svg')).toBe(false);
  });

  it('allows WebSocket upgrades with a valid host, origin, and token', () => {
    const config = security.createLocalAccessConfig({ PORT: '1989', CODEX_UI_TOKEN: token });

    expect(security.validateUpgradeRequest(wsRequest(), config, () => false)).toEqual({ ok: true });
  });

  it('denies invalid WebSocket origins, hosts, and tokens', () => {
    const config = security.createLocalAccessConfig({ PORT: '1989', CODEX_UI_TOKEN: token });

    expect(
      security.validateUpgradeRequest(
        wsRequest({ headers: { host: '127.0.0.1:1989', origin: 'http://evil.test' } }),
        config,
        () => false,
      ),
    ).toMatchObject({ ok: false, statusCode: 403 });

    expect(
      security.validateUpgradeRequest(
        wsRequest({ headers: { host: '192.168.1.9:1989', origin: 'http://127.0.0.1:1989' } }),
        config,
        () => false,
      ),
    ).toMatchObject({ ok: false, statusCode: 403 });

    expect(
      security.validateUpgradeRequest(
        wsRequest({
          headers: {
            host: '127.0.0.1:1989',
            origin: 'http://127.0.0.1:1989',
            cookie: 'codex_ui_token=wrong',
          },
        }),
        config,
        () => false,
      ),
    ).toMatchObject({ ok: false, statusCode: 401 });
  });

  it('rejects missing WebSocket origin headers for browser traffic', () => {
    const config = security.createLocalAccessConfig({ PORT: '1989', CODEX_UI_TOKEN: token });

    expect(
      security.validateUpgradeRequest(
        wsRequest({ headers: { host: '127.0.0.1:1989', cookie: `codex_ui_token=${token}` } }),
        config,
        () => false,
      ),
    ).toMatchObject({ ok: false, statusCode: 403 });
  });

  it('returns deterministic HTTP upgrade rejections', () => {
    expect(security.buildUpgradeRejection(403, 'Forbidden Origin')).toBe(
      'HTTP/1.1 403 Forbidden Origin\r\nConnection: close\r\nContent-Length: 0\r\n\r\n',
    );
  });

  it('validates browser WebSocket payload size and JSON-RPC shape before forwarding', () => {
    const config = security.createLocalAccessConfig({
      PORT: '1989',
      CODEX_UI_TOKEN: token,
      MAX_WS_PAYLOAD_BYTES: '64',
    });

    expect(
      security.validateBrowserWsPayload(
        Buffer.from(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'thread/list' })),
        false,
        config,
      ),
    ).toMatchObject({ ok: true });

    expect(security.validateBrowserWsPayload(Buffer.alloc(65, 'x'), false, config)).toMatchObject({
      ok: false,
      closeCode: 1009,
    });

    expect(security.validateBrowserWsPayload(Buffer.from('{'), false, config)).toMatchObject({
      ok: false,
      closeCode: 1007,
    });

    expect(
      security.validateBrowserWsPayload(
        Buffer.from(JSON.stringify({ method: 'missing-version' })),
        false,
        config,
      ),
    ).toMatchObject({ ok: false, closeCode: 1008 });
  });

  it('validates upload extension, declared mime, magic bytes, and size', () => {
    const validPng = security.decodeBase64Payload(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
      1024,
    );
    expect(validPng).toBeInstanceOf(Buffer);
    expect(security.isImagePayloadForExtension('.png', 'image/png', validPng)).toBe(true);
    expect(security.isImagePayloadForExtension('.png', 'image/jpeg', validPng)).toBe(false);
    expect(security.isImagePayloadForExtension('.png', 'image/png', Buffer.from('not-png'))).toBe(
      false,
    );
    expect(security.decodeBase64Payload(Buffer.alloc(2048).toString('base64'), 16)).toBeNull();

    const svg = security.createUploadFileName('diagram.svg');
    expect(security.ALLOWED_IMAGE_EXTENSIONS.has(svg.extension)).toBe(false);
  });

  it('reconnects only after unexpected backend disconnects while the browser remains open', () => {
    expect(security.shouldReconnectBackend(1006, false)).toBe(true);
    expect(security.shouldReconnectBackend(4001, false)).toBe(false);
    expect(security.shouldReconnectBackend(1006, true)).toBe(false);
  });
});
