import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getTopModalId,
  registerModal,
  resetModalStackForTests,
  subscribeToModalStack,
  unregisterModal,
} from '../../src/components/ui/modal-stack';

describe('modal stack', () => {
  const originalDocument = globalThis.document;

  beforeEach(() => {
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: {
        body: {
          dataset: {},
          style: {},
        },
      },
    });
    resetModalStackForTests();
  });

  afterEach(() => {
    resetModalStackForTests();
    if (originalDocument === undefined) {
      Reflect.deleteProperty(globalThis, 'document');
    } else {
      Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: originalDocument,
      });
    }
  });

  it('prefers the highest priority modal and locks body scrolling while any modal is open', () => {
    registerModal('settings', 'settings');
    registerModal('dialog', 'dialog');
    registerModal('approval', 'approval');

    expect(getTopModalId()).toBe('approval');
    expect(globalThis.document.body.dataset.modalOpen).toBe('true');
    expect(globalThis.document.body.style.overflow).toBe('hidden');

    unregisterModal('approval');
    expect(getTopModalId()).toBe('dialog');

    unregisterModal('dialog');
    unregisterModal('settings');
    expect(getTopModalId()).toBeNull();
    expect(globalThis.document.body.dataset.modalOpen).toBe('false');
    expect(globalThis.document.body.style.overflow).toBe('');
  });

  it('notifies subscribers when the modal stack changes', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToModalStack(listener);

    registerModal('settings', 'settings');
    unregisterModal('settings');

    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});
