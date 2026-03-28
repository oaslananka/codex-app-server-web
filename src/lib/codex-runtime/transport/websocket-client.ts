import { RpcMethodUnavailableError, TransportDisconnectedError } from '../errors';
import { createBrowserLogger } from '../../logging/browser-logger';

type PendingRequest = {
  method: string;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
};

type ControlHandler = (type: string, payload: Record<string, unknown>) => void;
type NotificationHandler = (params: Record<string, unknown>) => void;
type ServerRequestHandler = (params: Record<string, unknown>) => Promise<unknown> | unknown;

const logger = createBrowserLogger('runtime:ws');

export class WebsocketRpcClient {
  private ws: WebSocket | null = null;

  private rpcId = 1;

  private initializeRequestId: number | null = null;

  private readonly pending = new Map<number, PendingRequest>();

  private readonly notificationHandlers = new Map<string, Set<NotificationHandler>>();

  private readonly serverRequestHandlers = new Map<string, ServerRequestHandler>();

  private readonly controlHandlers = new Set<ControlHandler>();

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly wsUrl: string;

  constructor(wsUrl?: string) {
    const wsScheme = typeof location !== 'undefined' && location.protocol === 'https:' ? 'wss' : 'ws';
    this.wsUrl = wsUrl ?? `${wsScheme}://${location.host}/ws`;
  }

  connect() {
    if (this.ws) {
      this.failPendingRequests(new TransportDisconnectedError('WebSocket transport reconnecting'));
      this.ws.onclose = null;
      this.ws.close();
    }

    try {
      this.ws = new WebSocket(this.wsUrl);
      logger.debug('Opening websocket connection', { url: this.wsUrl });
    } catch (error) {
      logger.error('Failed to create websocket connection', error);
      this.emitControl('error', { message: error instanceof Error ? error.message : 'Failed to connect' });
      return;
    }

    this.ws.onopen = () => {
      logger.info('Websocket connection opened', { url: this.wsUrl });
      this.emitControl('connected', { url: this.wsUrl });
      const initializeId = this.rpcId++;
      this.initializeRequestId = initializeId;
      this.sendRaw({
        jsonrpc: '2.0',
        id: initializeId,
        method: 'initialize',
        params: {
          clientInfo: { name: 'codex-app-server-web', version: '2.0.0' },
          capabilities: { experimentalApi: true },
        },
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data));
        if (message?.__ctrl) {
          logger.trace('Received control frame', message);
          this.emitControl(String(message.type ?? 'unknown'), message as Record<string, unknown>);
          return;
        }
        logger.trace('Received rpc frame', {
          id: typeof message?.id === 'number' ? message.id : undefined,
          method: typeof message?.method === 'string' ? message.method : undefined,
          kind:
            typeof message?.method === 'string'
              ? typeof message?.id === 'number'
                ? 'server-request-or-notification'
                : 'notification'
              : 'response',
        });
        this.handleMessage(message);
      } catch (error) {
        logger.error('Malformed websocket payload', error);
        this.emitControl('error', { message: error instanceof Error ? error.message : 'Malformed websocket payload' });
      }
    };

    this.ws.onerror = () => {
      logger.error('Websocket transport emitted an error event');
      this.emitControl('error', { message: 'WebSocket connection error' });
    };

    this.ws.onclose = (event) => {
      this.ws = null;
      this.initializeRequestId = null;
      this.failPendingRequests(
        new TransportDisconnectedError(
          event.reason || 'WebSocket transport disconnected',
          event.code,
        ),
      );
      logger.warn('Websocket connection closed', {
        code: event.code,
        reason: event.reason,
      });
      this.emitControl('disconnected', { code: event.code, reason: event.reason });
      this.scheduleReconnect();
    };

    this.emitControl('connecting', { url: this.wsUrl });
  }

  reconnect() {
    this.clearReconnectTimer();
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendRaw({ __ctrl: true, type: 'reconnect' });
      return;
    }
    this.connect();
  }

  async request(method: string, params: unknown = undefined) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const id = this.rpcId++;
    const payload = { jsonrpc: '2.0', id, method, params };
    logger.trace('Sending rpc request', { id, method, params });
    return await new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { method, resolve, reject });
      this.sendRaw(payload);
    });
  }

  onNotification(method: string, handler: NotificationHandler) {
    if (!this.notificationHandlers.has(method)) {
      this.notificationHandlers.set(method, new Set());
    }
    this.notificationHandlers.get(method)?.add(handler);
    return () => this.notificationHandlers.get(method)?.delete(handler);
  }

  onServerRequest(method: string, handler: ServerRequestHandler) {
    this.serverRequestHandlers.set(method, handler);
  }

  onControl(handler: ControlHandler) {
    this.controlHandlers.add(handler);
    return () => this.controlHandlers.delete(handler);
  }

  private emitControl(type: string, payload: Record<string, unknown>) {
    this.controlHandlers.forEach((handler) => handler(type, payload));
  }

  private handleMessage(message: Record<string, unknown>) {
    if (typeof message.id === 'number' && (Reflect.has(message, 'result') || Reflect.has(message, 'error'))) {
      if (message.id === this.initializeRequestId) {
        this.initializeRequestId = null;
        if (message.error) {
          logger.error('Initialize request failed', message.error);
          const errorPayload = message.error as Record<string, unknown>;
          this.emitControl('readyError', {
            message: typeof errorPayload.message === 'string' ? errorPayload.message : 'Initialize failed',
          });
        } else {
          logger.info('Initialize request completed');
          this.emitControl('ready', {
            result: (message.result ?? {}) as Record<string, unknown>,
          });
        }
      }

      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) {
        logger.warn('RPC request failed', {
          id: message.id,
          error: message.error,
        });
        const errorPayload = message.error as Record<string, unknown>;
        const messageText = typeof errorPayload.message === 'string' ? errorPayload.message : 'RPC request failed';
        const error =
          errorPayload.code === -32601
            ? new RpcMethodUnavailableError(pending.method, messageText)
            : Object.assign(new Error(messageText), { code: errorPayload.code, data: errorPayload.data });
        pending.reject(error);
        return;
      }
      logger.trace('Resolved rpc response', { id: message.id });
      pending.resolve(message.result);
      return;
    }

    if (typeof message.id === 'number' && typeof message.method === 'string') {
      const serverHandler = this.serverRequestHandlers.get(message.method);
      if (!serverHandler) {
        logger.warn('No server request handler registered', { method: message.method });
        this.sendRaw({
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32601,
            message: `No handler registered for ${message.method}`,
          },
        });
        return;
      }

      Promise.resolve(serverHandler((message.params ?? {}) as Record<string, unknown>))
        .then((result) => {
          logger.trace('Server request resolved', { id: message.id, method: message.method });
          this.sendRaw({ jsonrpc: '2.0', id: message.id, result });
        })
        .catch((error) => {
          logger.error('Server request handler failed', error, {
            id: message.id,
            method: message.method,
          });
          this.sendRaw({
            jsonrpc: '2.0',
            id: message.id,
            error: { code: -32000, message: error instanceof Error ? error.message : 'Server request failed' },
          });
        });
      return;
    }

    if (typeof message.method === 'string') {
      logger.trace('Dispatching notification', { method: message.method });
      this.notificationHandlers.get(message.method)?.forEach((handler) => handler((message.params ?? {}) as Record<string, unknown>));
    }
  }

  private sendRaw(payload: unknown) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(payload));
  }

  private failPendingRequests(error: Error) {
    if (!this.pending.size) return;
    const pending = [...this.pending.values()];
    this.pending.clear();
    pending.forEach((request) => request.reject(error));
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer != null) {
      globalThis.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer != null) return;
    this.reconnectTimer = globalThis.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 1500);
  }
}
