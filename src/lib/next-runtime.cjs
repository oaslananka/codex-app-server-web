'use strict';

function resolveNextRuntimeMode({ nodeEnv, hasBuildArtifacts, hasStaleBuildArtifacts = false }) {
  const normalizedEnv = nodeEnv || 'production';

  if (normalizedEnv !== 'production') {
    return { dev: true, reason: 'non-production' };
  }

  if (!hasBuildArtifacts) {
    return { dev: true, reason: 'missing-build-artifacts' };
  }

  if (hasStaleBuildArtifacts) {
    return { dev: true, reason: 'stale-build-artifacts' };
  }

  return { dev: false, reason: 'production' };
}

module.exports = { resolveNextRuntimeMode };