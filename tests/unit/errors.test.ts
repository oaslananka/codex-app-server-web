import { describe, expect, it } from 'vitest';
import {
  isInitializationPendingError,
  isMethodUnavailable,
  isRolloutUnavailableError,
  normalizeError,
  RpcMethodUnavailableError,
} from '../../src/lib/codex-runtime/errors';

describe('runtime error helpers', () => {
  it('detects initialization-pending backend errors', () => {
    expect(isInitializationPendingError(new Error('Not initialized'))).toBe(true);
    expect(isInitializationPendingError({ message: 'Backend is initializing' })).toBe(true);
    expect(isInitializationPendingError(new Error('Permission denied'))).toBe(false);
  });

  it('detects unavailable methods and normalizes messages', () => {
    expect(isMethodUnavailable(new RpcMethodUnavailableError('thread/list'))).toBe(true);
    expect(normalizeError({ message: 'Readable failure' })).toBe('Readable failure');
  });

  it('detects rollout/session loss errors that should use thread/read fallback', () => {
    expect(
      isRolloutUnavailableError({
        message: 'no rollout found for thread id 019d3144-50cf-75d2-95d5-7eda39430211',
      }),
    ).toBe(true);
    expect(isRolloutUnavailableError(new Error('permission denied'))).toBe(false);
  });
});
