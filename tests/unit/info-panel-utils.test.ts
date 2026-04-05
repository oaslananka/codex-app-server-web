import { describe, expect, it } from 'vitest';
import { getAppsAvailabilityHint } from '../../src/components/codex/panels/info-panel-utils';

describe('info panel utils', () => {
  it('returns a clear apps hint for upstream auth/challenge failures', () => {
    const hint = getAppsAvailabilityHint([
      {
        id: 'info:apps',
        context: 'info',
        source: 'apps',
        message:
          'Apps unavailable: Request failed with status 403 Forbidden: remote service returned an HTML challenge page instead of API JSON. This usually means auth expired or the request was blocked upstream.',
      },
    ]);

    expect(hint).toContain('Apps directory');
    expect(hint).toContain('signing in again');
  });

  it('returns an empty hint for unrelated warnings', () => {
    const hint = getAppsAvailabilityHint([
      {
        id: 'info:mcp',
        context: 'info',
        source: 'mcp',
        message: 'MCP servers unavailable: timed out',
      },
    ]);

    expect(hint).toBe('');
  });
});
