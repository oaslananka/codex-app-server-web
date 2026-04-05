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

function summarizeHtmlLikeError(message: string) {
  const compact = message.replace(/\s+/g, ' ').trim();
  const hasHtmlDocument = /<html[\s>]/i.test(message) || /<body[\s>]/i.test(message);

  if (!hasHtmlDocument) {
    return message.length > 600 ? `${message.slice(0, 597)}...` : message;
  }

  const statusMatch = compact.match(/status\s+(\d{3}\s+[A-Za-z ]+)/i);
  const statusText = statusMatch?.[1]?.trim();
  const statusLabel = statusText ? `Request failed with status ${statusText}` : 'Request failed';
  const isCloudflareChallenge =
    /cloudflare/i.test(compact) ||
    /challenge-error-text/i.test(compact) ||
    /enable javascript and cookies to continue/i.test(compact);

  if (isCloudflareChallenge) {
    return `${statusLabel}: remote service returned an HTML challenge page instead of API JSON. This usually means auth expired or the request was blocked upstream.`;
  }

  return `${statusLabel}: remote service returned HTML instead of API JSON.`;
}

export function normalizeError(error: unknown, fallback = 'Unknown error') {
  if (error instanceof Error) {
    return normalizeError(error.message || fallback, fallback);
  }

  if (typeof error === 'string') {
    return summarizeHtmlLikeError(error || fallback);
  }

  if (error && typeof error === 'object') {
    const maybeMessage = Reflect.get(error, 'message');
    if (typeof maybeMessage === 'string' && maybeMessage) {
      return summarizeHtmlLikeError(maybeMessage);
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
