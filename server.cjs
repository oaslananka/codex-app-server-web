#!/usr/bin/env node
/**
 * codex-app-server-web server
 * - Fastify: API endpoints + security/rate limit
 * - Next.js: frontend rendering (App Router)
 * - WebSocket proxy: browser <-> Codex app server
 *
 * Environment variables:
 *   CODEX_HOST  — Codex app server host (default: localhost)
 *   CODEX_PORT  — Codex app server port (default: 40000)
 *   PORT        — Preferred port to listen on (default: 1989)
 *   PORT_FALLBACK — Fallback port if preferred port is unavailable (default: 1990)
 *   CODEX_PATH  — Unix socket path   (overrides host/port if set)
 *   RATE_LIMIT_MAX — Max requests per window for each IP (default: 120)
 *   RATE_LIMIT_TIME_WINDOW_MS — Rate limit window in milliseconds (default: 60000)
 */

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const Fastify = require('fastify');
const fastifyHelmet = require('@fastify/helmet');
const fastifyRateLimit = require('@fastify/rate-limit');
const next = require('next');
const { WebSocketServer, WebSocket } = require('ws');
const { createRateLimiter } = require('./src/lib/rate-limit.cjs');
const { resolveNextRuntimeMode } = require('./src/lib/next-runtime.cjs');
const { createNodeLogger } = require('./src/lib/logging/node-logger.cjs');

const logger = createNodeLogger('server');
const connectionLogger = logger.child('connection');

// ── Configuration ────────────────────────────────────────────────────────────
const parsePort = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsed) && parsed > 0 && parsed < 65536 ? parsed : fallback;
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const CODEX_HOST = process.env.CODEX_HOST || 'localhost';
const CODEX_PORT = parsePort(process.env.CODEX_PORT, 40000);
const SERVER_PORT = parsePort(process.env.PORT, 1989);
const FALLBACK_PORT = parsePort(process.env.PORT_FALLBACK, 1990);
const CODEX_SOCK = process.env.CODEX_PATH || null; // e.g. /tmp/codex.sock
const RATE_LIMIT_MAX = parsePositiveInt(process.env.RATE_LIMIT_MAX, 120);
const RATE_LIMIT_TIME_WINDOW_MS = parsePositiveInt(process.env.RATE_LIMIT_TIME_WINDOW_MS, 60_000);
const UPLOAD_BODY_LIMIT_BYTES = parsePositiveInt(
  process.env.UPLOAD_BODY_LIMIT_BYTES,
  20 * 1024 * 1024,
);
const NODE_ENV = process.env.NODE_ENV || 'production';
const UPLOADS_DIR = path.join(os.tmpdir(), 'codex-app-server-web-uploads');
const MAX_BROWSER_BUFFER_SIZE = 100;
const UPLOAD_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour
const MAX_CODEX_RECONNECT_DELAY_MS = 30_000;
const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.bmp',
  '.ico',
  '.avif',
]);
const IMAGE_MIME_BY_EXTENSION = new Map([
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.svg', 'image/svg+xml'],
  ['.bmp', 'image/bmp'],
  ['.ico', 'image/x-icon'],
  ['.avif', 'image/avif'],
]);
const isImagePayloadForExtension = (ext, mimeType, buffer) => {
  const expectedMime = IMAGE_MIME_BY_EXTENSION.get(ext);
  if (!expectedMime || mimeType.toLowerCase() !== expectedMime) {
    return false;
  }

  if (ext === '.svg') {
    const textPrefix = buffer.subarray(0, 256).toString('utf8').trimStart().toLowerCase();
    return textPrefix.startsWith('<svg') || textPrefix.startsWith('<?xml');
  }

  if (ext === '.png') {
    return buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
  }
  if (ext === '.jpg' || ext === '.jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8;
  }
  if (ext === '.gif') {
    const signature = buffer.subarray(0, 6).toString('ascii');
    return signature === 'GIF87a' || signature === 'GIF89a';
  }
  if (ext === '.webp') {
    return (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  if (ext === '.bmp') return buffer.subarray(0, 2).toString('ascii') === 'BM';
  if (ext === '.ico') return buffer.subarray(0, 4).equals(Buffer.from([0x00, 0x00, 0x01, 0x00]));
  if (ext === '.avif') return buffer.subarray(4, 12).toString('ascii') === 'ftypavif';
  return false;
};
const RESOLVED_UPLOADS_DIR = path.resolve(UPLOADS_DIR);
const prerenderManifestPath = path.join(__dirname, '.next', 'prerender-manifest.json');
const appPagePath = path.join(__dirname, 'app', 'page.tsx');
const hasBuildArtifacts = fs.existsSync(prerenderManifestPath);
const hasStaleBuildArtifacts =
  hasBuildArtifacts &&
  fs.existsSync(appPagePath) &&
  fs.statSync(appPagePath).mtimeMs > fs.statSync(prerenderManifestPath).mtimeMs;
const runtimeMode = resolveNextRuntimeMode({
  nodeEnv: NODE_ENV,
  hasBuildArtifacts,
  hasStaleBuildArtifacts,
});
const IS_DEV = runtimeMode.dev;
let activeServerPort = SERVER_PORT;
const isRecoverableListenError = (err) => err.code === 'EADDRINUSE' || err.code === 'EACCES';
const isWebSocketRateLimited = createRateLimiter({
  max: RATE_LIMIT_MAX,
  windowMs: RATE_LIMIT_TIME_WINDOW_MS,
});

const isPrivateIpv4 = (address) =>
  /^10\./.test(address) ||
  /^192\.168\./.test(address) ||
  /^172\.(1[6-9]|2\d|3[0-1])\./.test(address);

const getLanAddresses = () => {
  const excludedPrefixes = ['br-', 'docker', 'veth', 'tailscale', 'virbr', 'cni', 'flannel'];
  const addresses = new Set();

  for (const [name, entries] of Object.entries(os.networkInterfaces())) {
    if (excludedPrefixes.some((prefix) => name.startsWith(prefix))) {
      continue;
    }

    for (const entry of entries ?? []) {
      if (entry.family !== 'IPv4' || entry.internal || !isPrivateIpv4(entry.address)) {
        continue;
      }

      addresses.add(entry.address);
    }
  }

  return [...addresses];
};

if (runtimeMode.reason === 'missing-build-artifacts') {
  logger.warn(
    '[!] Next build artifacts not found (.next/prerender-manifest.json). Falling back to dev mode.',
  );
}

if (runtimeMode.reason === 'stale-build-artifacts') {
  logger.warn(
    '[!] Next build artifacts are stale compared to source files. Falling back to dev mode.',
  );
}

const cspDirectives = {
  defaultSrc: ["'self'"],
  baseUri: ["'self'"],
  objectSrc: ["'none'"],
  frameAncestors: ["'self'"],
  imgSrc: ["'self'", 'data:', 'blob:'],
  fontSrc: ["'self'", 'data:'],
  styleSrc: ["'self'", "'unsafe-inline'"],
  scriptSrc: IS_DEV
    ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
    : ["'self'", "'unsafe-inline'"],
  connectSrc: ["'self'", 'ws:', 'wss:', 'http:', 'https:'],
  upgradeInsecureRequests: null,
};

// ── Fastify app ──────────────────────────────────────────────────────────────
const app = Fastify({ logger: false, disableRequestLogging: true });
const webApp = next({
  dev: IS_DEV,
  dir: __dirname,
  hostname: '0.0.0.0',
  port: SERVER_PORT,
  httpServer: app.server,
});
const handleNext = webApp.getRequestHandler();

app.register(fastifyHelmet, {
  global: true,
  contentSecurityPolicy: {
    directives: cspDirectives,
  },
  crossOriginOpenerPolicy: IS_DEV ? false : undefined,
  crossOriginEmbedderPolicy: false,
  originAgentCluster: IS_DEV ? false : undefined,
  xFrameOptions: { action: 'sameorigin' },
});

const registerApiRoutes = () => {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true, mode: 0o700 });

  app.register(
    async function apiRoutes(api) {
      await api.register(fastifyRateLimit, {
        max: RATE_LIMIT_MAX,
        timeWindow: RATE_LIMIT_TIME_WINDOW_MS,
        keyGenerator: (req) => req.ip || 'unknown',
      });

      api.get('/health', async () => {
        const mem = process.memoryUsage();
        return {
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptimeSec: Number(process.uptime().toFixed(2)),
          pid: process.pid,
          memory: {
            rss: mem.rss,
            heapTotal: mem.heapTotal,
            heapUsed: mem.heapUsed,
            external: mem.external,
          },
          serverPort: activeServerPort,
        };
      });

      api.get('/config', async () => {
        return {
          codex: CODEX_SOCK
            ? { type: 'unix', path: CODEX_SOCK }
            : { type: 'tcp', host: CODEX_HOST, port: CODEX_PORT },
          serverPort: activeServerPort,
        };
      });

      api.post(
        '/uploads',
        {
          bodyLimit: UPLOAD_BODY_LIMIT_BYTES,
          config: {
            rateLimit: {
              max: Math.max(1, Math.min(RATE_LIMIT_MAX, 30)),
              timeWindow: RATE_LIMIT_TIME_WINDOW_MS,
            },
          },
        },
        // The route is protected by @fastify/rate-limit via the route config above.
        // lgtm[js/missing-rate-limiting]
        async (req, reply) => {
          const body = req.body && typeof req.body === 'object' ? req.body : null;
          const fileName = path.basename(String(body?.name || 'upload.bin'));
          const mimeType = String(body?.mimeType || '');
          const dataBase64 = typeof body?.dataBase64 === 'string' ? body.dataBase64 : '';

          if (!fileName || !dataBase64) {
            reply.code(400);
            return { error: 'name and dataBase64 are required' };
          }

          if (!mimeType.startsWith('image/')) {
            reply.code(400);
            return { error: 'Only image uploads are supported' };
          }

          let buffer;
          try {
            buffer = Buffer.from(dataBase64, 'base64');
          } catch (_) {
            reply.code(400);
            return { error: 'Invalid base64 payload' };
          }

          if (!buffer.byteLength || buffer.byteLength > UPLOAD_BODY_LIMIT_BYTES) {
            reply.code(400);
            return { error: 'Upload size is invalid or exceeds limit' };
          }

          const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
          const ext = path.extname(safeName).toLowerCase();
          if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
            reply.code(400);
            return { error: `Unsupported image extension: ${ext}` };
          }
          if (!isImagePayloadForExtension(ext, mimeType, buffer)) {
            reply.code(400);
            return { error: 'Image payload does not match declared type' };
          }
          const uploadPath = path.resolve(
            UPLOADS_DIR,
            `${Date.now()}-${crypto.randomUUID()}${ext}`,
          );
          if (!uploadPath.startsWith(`${RESOLVED_UPLOADS_DIR}${path.sep}`)) {
            reply.code(400);
            return { error: 'Invalid upload path' };
          }
          // codeql[js/http-to-file-access]
          fs.writeFileSync(uploadPath, buffer, { mode: 0o600, flag: 'wx' });

          return {
            ok: true,
            name: safeName,
            mimeType,
            size: buffer.byteLength,
            path: uploadPath,
          };
        },
      );
    },
    { prefix: '/api' },
  );
};

// ── WebSocket proxy server ────────────────────────────────────────────────────
const wss = new WebSocketServer({ noServer: true });

wss.on('error', (err) => {
  if (isRecoverableListenError(err)) {
    return;
  }
  logger.error('WebSocket server error', err);
});

app.server.on('upgrade', (req, socket, head) => {
  const requestUrl = req.url || '';
  const queryIndex = requestUrl.indexOf('?');
  const pathname = queryIndex === -1 ? requestUrl : requestUrl.slice(0, queryIndex);

  if (pathname !== '/ws') {
    return;
  }

  const clientIp = req.socket.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  if (isWebSocketRateLimited(Array.isArray(clientIp) ? clientIp[0] : clientIp)) {
    socket.write('HTTP/1.1 429 Too Many Requests\r\nConnection: close\r\n\r\n');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

wss.on('connection', (browserWs, req) => {
  const clientIp = req.socket.remoteAddress;
  connectionLogger.info('Browser connected', { clientIp });

  let codexWs = null;
  let reconnectTimer = null;
  let browserBuffer = []; // messages queued before codex is ready
  let codexConnectionId = 0;
  let reconnectAttempt = 0;
  let browserClosing = false;

  // Helper: send JSON to browser
  const sendBrowser = (obj) => {
    if (browserWs.readyState === WebSocket.OPEN) {
      browserWs.send(typeof obj === 'string' ? obj : JSON.stringify(obj));
    }
  };

  // Internal control messages (not JSON-RPC)
  const ctrl = (type, data = {}) => sendBrowser({ __ctrl: true, type, ...data });

  const clearReconnectTimer = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const scheduleReconnect = () => {
    if (reconnectTimer || browserWs.readyState !== WebSocket.OPEN) {
      return;
    }

    const baseDelay = Math.min(
      1500 * Math.pow(1.5, reconnectAttempt),
      MAX_CODEX_RECONNECT_DELAY_MS,
    );
    const jitter = Math.random() * 500;
    const delay = baseDelay + jitter;
    reconnectAttempt++;

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (browserWs.readyState === WebSocket.OPEN && !codexWs) {
        connectCodex();
      }
    }, delay);
  };

  // ── Connect to Codex ────────────────────────────────────────────────────
  const connectCodex = () => {
    if (
      codexWs &&
      (codexWs.readyState === WebSocket.CONNECTING || codexWs.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    clearReconnectTimer();

    const wsUrl = CODEX_SOCK ? `ws+unix://${CODEX_SOCK}:` : `ws://${CODEX_HOST}:${CODEX_PORT}`;
    const connectionId = ++codexConnectionId;

    connectionLogger.info('Connecting to Codex backend', { wsUrl });
    ctrl('connecting', { url: wsUrl });

    try {
      codexWs = new WebSocket(wsUrl, { handshakeTimeout: 5000 });
    } catch (err) {
      ctrl('error', { message: `Failed to create connection: ${err.message}` });
      return;
    }

    const currentCodexWs = codexWs;

    currentCodexWs.on('open', () => {
      if (codexWs !== currentCodexWs || connectionId !== codexConnectionId) {
        return;
      }
      connectionLogger.info('Codex backend connected');
      reconnectAttempt = 0;
      clearReconnectTimer();
      ctrl('connected', { url: wsUrl });

      // Flush buffered messages
      for (const msg of browserBuffer) {
        currentCodexWs.send(msg);
      }
      browserBuffer = [];
    });

    currentCodexWs.on('message', (data) => {
      if (codexWs !== currentCodexWs || connectionId !== codexConnectionId) {
        return;
      }
      sendBrowser(data.toString());
    });

    currentCodexWs.on('error', (err) => {
      if (codexWs !== currentCodexWs || connectionId !== codexConnectionId) {
        return;
      }
      connectionLogger.error('Codex websocket error', err);
      ctrl('error', { message: err.message });
    });

    currentCodexWs.on('close', (code, reason) => {
      if (codexWs !== currentCodexWs || connectionId !== codexConnectionId) {
        return;
      }
      const closeDetails = {
        code,
        reason: reason.toString(),
      };
      const browserSessionEnded = browserClosing || browserWs.readyState !== WebSocket.OPEN;
      if (browserSessionEnded) {
        connectionLogger.info(
          'Codex backend disconnected after browser session ended',
          closeDetails,
        );
      } else {
        connectionLogger.warn('Codex backend disconnected', closeDetails);
      }
      const isManualReconnect = code === 4001;
      codexWs = null;
      if (!isManualReconnect && !browserSessionEnded) {
        ctrl('disconnected', { code, reason: reason.toString() });
        scheduleReconnect();
      }
    });
  };

  connectCodex();

  // ── Browser → Codex ──────────────────────────────────────────────────────
  browserWs.on('message', (rawData) => {
    const data = rawData.toString();

    // Intercept internal control commands from the UI
    try {
      const msg = JSON.parse(data);
      if (msg.__ctrl) {
        if (msg.type === 'reconnect') {
          clearReconnectTimer();
          reconnectAttempt = 0;
          const previousCodexWs = codexWs;
          codexWs = null;
          if (previousCodexWs && previousCodexWs.readyState !== WebSocket.CLOSED) {
            previousCodexWs.close(4001, 'manual-reconnect');
          }
          connectCodex();
        }
        return;
      }
    } catch (_) {
      /* not JSON or not a control message */
    }

    if (codexWs && codexWs.readyState === WebSocket.OPEN) {
      codexWs.send(data);
    } else {
      // Buffer while connecting, with a size cap to prevent memory leaks
      if (browserBuffer.length < MAX_BROWSER_BUFFER_SIZE) {
        browserBuffer.push(data);
      } else {
        connectionLogger.warn('Browser buffer full, dropping message');
      }
    }
  });

  browserWs.on('close', () => {
    connectionLogger.info('Browser disconnected');
    browserClosing = true;
    clearReconnectTimer();
    reconnectAttempt = 0;
    if (codexWs) codexWs.close();
  });

  browserWs.on('error', (err) => {
    connectionLogger.error('Browser websocket error', err);
  });
});

const renderBanner = (port) => {
  const lanAddresses = process.env.SHOW_LAN_URLS === '1' ? getLanAddresses() : [];
  logger.info('codex-app-server-web ready', { url: `http://localhost:${port}` });
  for (const lanAddress of lanAddresses) {
    logger.info('LAN address available', { url: `http://${lanAddress}:${port}` });
  }
  if (CODEX_SOCK) {
    logger.info('Codex backend target', { socket: CODEX_SOCK });
  } else {
    logger.info('Codex backend target', { wsUrl: `ws://${CODEX_HOST}:${CODEX_PORT}` });
  }
};

const startListening = async (port) => {
  try {
    const address = await app.listen({ port, host: '0.0.0.0' });
    const maybePort = Number.parseInt(address.split(':').at(-1), 10);
    activeServerPort = Number.isFinite(maybePort) ? maybePort : port;
    renderBanner(activeServerPort);
  } catch (err) {
    if (port !== FALLBACK_PORT && isRecoverableListenError(err)) {
      logger.warn(
        `\n[!] Port ${port} kullanilamadi (${err.code}). ${FALLBACK_PORT} deneniyor...\n`,
      );
      return startListening(FALLBACK_PORT);
    }

    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${port} zaten kullanimda.`);
    } else {
      logger.error('Server error', err);
    }
    process.exit(1);
  }
};

const registerNextRoutes = () => {
  app.all('/*', async (req, reply) => {
    await handleNext(req.raw, reply.raw);
    reply.hijack();
  });
};

const bootstrap = async () => {
  await webApp.prepare();
  registerApiRoutes();
  registerNextRoutes();
  await startListening(SERVER_PORT);
};

bootstrap().catch((err) => {
  logger.error('Startup error', err);
  process.exit(1);
});

// Periodic cleanup of uploaded temp files older than 1 hour
setInterval(
  () => {
    try {
      if (!fs.existsSync(UPLOADS_DIR)) return;
      const now = Date.now();
      for (const file of fs.readdirSync(UPLOADS_DIR)) {
        const filePath = path.join(UPLOADS_DIR, file);
        try {
          const stat = fs.statSync(filePath);
          if (now - stat.mtimeMs > UPLOAD_MAX_AGE_MS) {
            fs.unlinkSync(filePath);
          }
        } catch {
          /* ignore per-file cleanup errors */
        }
      }
    } catch {
      /* ignore cleanup errors */
    }
  },
  15 * 60 * 1000,
); // Run every 15 minutes
