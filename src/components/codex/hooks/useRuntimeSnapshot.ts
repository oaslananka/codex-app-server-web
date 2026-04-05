'use client';

import { useSyncExternalStore } from 'react';
import type { RuntimeSnapshot } from '../../../lib/codex-ui-runtime';

type RuntimeSnapshotStore = {
  subscribe(listener: (snapshot: RuntimeSnapshot) => void): () => void;
  getSnapshot(): RuntimeSnapshot;
};

const EMPTY_SNAPSHOT: RuntimeSnapshot = {
  connected: false,
  connectionState: 'offline',
  connectionError: '',
  activeThreadId: null,
  activeTab: 'chat',
  activeFilter: 'active',
  searchTerm: '',
  visibleThreads: [],
  activeThread: null,
  activeThreadStatus: { type: 'idle' },
  loggedIn: true,
  loginInProgress: false,
  accountEmail: 'Not connected',
  accountPlan: '',
  showCommentary: false,
  pendingAttachments: [],
  attachmentUploadInProgress: false,
  turnActive: false,
  collaborationMode: 'default',
  collaborationModes: [
    {
      id: 'default',
      label: 'Default',
      description: 'Standard Codex conversation flow.',
      supported: true,
    },
    {
      id: 'plan',
      label: 'Plan',
      description: 'Plan-first collaboration with an explicit planning pass.',
      supported: true,
    },
  ],
  messageDraft: '',
  selectedModel: '',
  selectedEffort: '',
  selectedServiceTier: '',
  selectedSandboxMode: '',
  models: [],
  configData: null,
  configHydrated: false,
  configLoading: false,
  configError: '',
  integrationWarnings: [],
  configMcpServers: [],
  configRequirements: null,
  infoHydrated: false,
  infoLoading: false,
  infoError: '',
  appsHydrated: false,
  appsLoading: false,
  appsError: '',
  infoMcpServers: [],
  skills: [],
  experimentalFeatures: [],
  plugins: [],
  pluginDetail: null,
  apps: [],
  fileBrowserPath: '/',
  fileBreadcrumb: [{ label: '/', path: '/' }],
  fileTree: [],
  fileLoading: false,
  fileError: '',
  currentFilePath: null,
  fileEditorName: 'No file selected',
  fileEditorContent: '',
  fileEditorReadOnly: true,
  fileMetadata: null,
  terminalCommand: '',
  terminalCwd: '',
  terminalStdin: '',
  terminalOutput: [],
  terminalRunning: false,
  terminalSize: { cols: 120, rows: 32 },
  chatEntries: [],
  activeApprovalRequest: null,
  protocolCoverage: {
    requests: { implemented: 0, total: 0, missing: [], extra: [] },
    notifications: { implemented: 0, total: 0, missing: [], extra: [] },
    serverRequests: { implemented: 0, total: 0, missing: [], extra: [] },
  },
  capabilities: {
    requests: {} as RuntimeSnapshot['capabilities']['requests'],
    notifications: {} as RuntimeSnapshot['capabilities']['notifications'],
    serverRequests: {} as RuntimeSnapshot['capabilities']['serverRequests'],
  },
  workspaceSummary: {
    content: '',
    source: 'idle',
    loading: false,
    error: '',
  },
  gitDiff: {
    content: '',
    loading: false,
    error: '',
  },
  authStatus: {
    content: '',
    loading: false,
    error: '',
  },
  fuzzySearch: {
    query: '',
    loading: false,
    error: '',
    results: [],
  },
  review: {
    loading: false,
    error: '',
    reviewThreadId: null,
  },
  externalAgents: {
    loading: false,
    error: '',
    items: [],
    importedCount: 0,
  },
  connectionBanner: {
    visible: false,
    target: '',
    message: '',
  },
};

const subscribeEmptyStore = () => () => undefined;
const getEmptySnapshot = () => EMPTY_SNAPSHOT;

export function useRuntimeSnapshot(runtime: RuntimeSnapshotStore | null): RuntimeSnapshot {
  const subscribe = runtime?.subscribe ?? subscribeEmptyStore;
  const getSnapshot = runtime?.getSnapshot ?? getEmptySnapshot;
  return useSyncExternalStore(subscribe, getSnapshot, getEmptySnapshot);
}
