export class RpcMethodUnavailableError extends Error {
  constructor(method: string, message = `RPC method unavailable: ${method}`) {
    super(message);
    this.name = 'RpcMethodUnavailableError';
  }
}

export class TransportDisconnectedError extends Error {
  readonly code?: number;

  constructor(message = 'WebSocket transport disconnected', code?: number) {
    super(message);
    this.name = 'TransportDisconnectedError';
    this.code = code;
  }
}

export function normalizeError(error: unknown, fallback = 'Unknown error') {
  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const maybeMessage = Reflect.get(error, 'message');
    if (typeof maybeMessage === 'string' && maybeMessage) {
      return maybeMessage;
    }
  }

  return fallback;
}

export function isMethodUnavailable(error: unknown) {
  if (error instanceof RpcMethodUnavailableError) {
    return true;
  }

  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = Reflect.get(error, 'code');
  const message = String(Reflect.get(error, 'message') || '');
  return code === -32601 || /method not found/i.test(message) || /not supported/i.test(message);
}

export function isInitializationPendingError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const message = String(Reflect.get(error, 'message') || error || '');
  return /not initialized/i.test(message) || /initializing/i.test(message);
}

export function isRolloutUnavailableError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const message = String(Reflect.get(error, 'message') || error || '');
  return /no rollout found/i.test(message) || /rollout .* not found/i.test(message);
}
