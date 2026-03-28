import { describe, expect, it } from 'vitest';
import { buildInitialState } from '../../src/lib/codex-runtime/runtime-state';
import { buildDisconnectedRuntimePatch } from '../../src/lib/codex-runtime/runtime-connection';

describe('runtime connection disconnect handling', () => {
  it('clears loading and pending UI state when the transport drops', () => {
    const state = buildInitialState();
    state.turnActive = true;
    state.attachmentUploadInProgress = true;
    state.currentProcId = 'proc-1';
    state.fileLoading = true;
    state.configLoading = true;
    state.infoLoading = true;
    state.terminalRunning = true;
    state.loginInProgress = true;
    state.review = { ...state.review, loading: true, error: 'still pending' };
    state.fuzzySearch = { ...state.fuzzySearch, loading: true, error: 'pending' };
    state.authStatus = { ...state.authStatus, loading: true, error: 'pending' };
    state.gitDiff = { ...state.gitDiff, loading: true, error: 'pending' };
    state.workspaceSummary = { ...state.workspaceSummary, loading: true, error: 'pending' };
    state.externalAgents = { ...state.externalAgents, loading: true, error: 'pending' };
    state.activeApprovalRequest = {
      requestId: 'approval-1',
      method: 'item/tool/call',
      variant: 'tool-call',
      title: 'Approval',
      badge: 'TOOL',
      detail: '{}',
      confirmLabel: 'Allow',
      denyLabel: 'Deny',
    };

    const patch = buildDisconnectedRuntimePatch(state, 'Socket lost');

    expect(patch.connectionState).toBe('offline');
    expect(patch.connectionError).toBe('Socket lost');
    expect(patch.turnActive).toBe(false);
    expect(patch.attachmentUploadInProgress).toBe(false);
    expect(patch.currentProcId).toBeNull();
    expect(patch.activeApprovalRequest).toBeNull();
    expect(patch.fileLoading).toBe(false);
    expect(patch.configLoading).toBe(false);
    expect(patch.infoLoading).toBe(false);
    expect(patch.terminalRunning).toBe(false);
    expect(patch.loginInProgress).toBe(false);
    expect(patch.review?.loading).toBe(false);
    expect(patch.fuzzySearch?.loading).toBe(false);
    expect(patch.authStatus?.loading).toBe(false);
    expect(patch.gitDiff?.loading).toBe(false);
    expect(patch.workspaceSummary?.loading).toBe(false);
    expect(patch.externalAgents?.loading).toBe(false);
  });
});
