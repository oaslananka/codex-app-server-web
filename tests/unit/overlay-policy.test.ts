import { describe, expect, it } from 'vitest';
import { resolveOverlayDismissals } from '../../src/components/codex/overlay-policy';

describe('resolveOverlayDismissals', () => {
  it('closes settings when a higher priority overlay is active', () => {
    expect(
      resolveOverlayDismissals({
        approvalOpen: false,
        inputOpen: true,
        settingsOpen: true,
      }),
    ).toEqual({
      closeInput: false,
      closeSettings: true,
    });
  });

  it('closes both input and settings when approval is active', () => {
    expect(
      resolveOverlayDismissals({
        approvalOpen: true,
        inputOpen: true,
        settingsOpen: true,
      }),
    ).toEqual({
      closeInput: true,
      closeSettings: true,
    });
  });

  it('keeps overlays untouched when there is no collision', () => {
    expect(
      resolveOverlayDismissals({
        approvalOpen: false,
        inputOpen: false,
        settingsOpen: true,
      }),
    ).toEqual({
      closeInput: false,
      closeSettings: false,
    });
  });
});
