'use client';

import type { IntegrationWarning } from '../../../lib/codex-ui-runtime';

export function getAppsAvailabilityHint(warnings: IntegrationWarning[]) {
  const appsWarning = warnings.find((warning) => warning.source === 'apps');
  if (!appsWarning) {
    return '';
  }

  const message = appsWarning.message.toLowerCase();
  const isUpstreamAuthOrChallengeIssue =
    message.includes('html challenge page') ||
    message.includes('blocked upstream') ||
    message.includes('auth expired');

  if (!isUpstreamAuthOrChallengeIssue) {
    return '';
  }

  return 'The Apps directory is currently being blocked by the upstream service. Try signing in again, then retry on a normal browser network without bot protection, proxy rewriting, or strict VPN filtering.';
}
