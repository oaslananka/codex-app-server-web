'use client';

import { createContext, type PropsWithChildren, useContext, useMemo } from 'react';
import type { CollaborationModeValue } from '../../lib/codex-runtime/collaboration';
import type { BrowserLogSettings } from '../../lib/logging/shared';
import type { RuntimeSnapshot, ThreadSummary } from '../../lib/codex-ui-runtime';
import type { InputModalConfig } from '../ui';
import type { ActiveInfoCategory, ActiveInfoTab, TabName } from './panels/types';

export type ControlCenterState = {
  account: {
    accountEmail: string;
    accountPlan: string;
    authStatus: RuntimeSnapshot['authStatus'];
    loggedIn: boolean;
    loginInProgress: boolean;
  };
  shell: {
    activeInfoCategory: ActiveInfoCategory;
    activeInfoTab: ActiveInfoTab;
    activeTab: TabName;
    connectionBanner: RuntimeSnapshot['connectionBanner'];
    logSettings: BrowserLogSettings;
    settingsOpen: boolean;
    showCommentary: boolean;
    turnActive: boolean;
  };
  thread: {
    activeFilter: string;
    activeThread: ThreadSummary | null;
    activeThreadId: string | null;
    activeThreadStatus: RuntimeSnapshot['activeThreadStatus'];
    collaborationMode: CollaborationModeValue;
    collaborationModes: RuntimeSnapshot['collaborationModes'];
    messageDraft: string;
    review: RuntimeSnapshot['review'];
    searchTerm: string;
    visibleThreads: RuntimeSnapshot['visibleThreads'];
  };
  chat: {
    attachmentUploadInProgress: boolean;
    chatEntries: RuntimeSnapshot['chatEntries'];
    configData: RuntimeSnapshot['configData'];
    models: RuntimeSnapshot['models'];
    pendingAttachments: RuntimeSnapshot['pendingAttachments'];
    selectedEffort: string;
    selectedModel: string;
    selectedSandboxMode: string;
    selectedServiceTier: string;
  };
  files: {
    currentFilePath: string | null;
    fileBreadcrumb: RuntimeSnapshot['fileBreadcrumb'];
    fileBrowserPath: string;
    fileEditorContent: string;
    fileEditorName: string;
    fileEditorReadOnly: boolean;
    fileError: string;
    fileLoading: boolean;
    fileMetadata: RuntimeSnapshot['fileMetadata'];
    fileTree: RuntimeSnapshot['fileTree'];
  };
  config: {
    capabilities: RuntimeSnapshot['capabilities'];
    configData: RuntimeSnapshot['configData'];
    configError: string;
    configHydrated: boolean;
    integrationWarnings: RuntimeSnapshot['integrationWarnings'];
    configLoading: boolean;
    configMcpServers: RuntimeSnapshot['configMcpServers'];
    configRequirements: RuntimeSnapshot['configRequirements'];
    connected: boolean;
    protocolCoverage: RuntimeSnapshot['protocolCoverage'];
  };
  info: {
    apps: RuntimeSnapshot['apps'];
    experimentalFeatures: RuntimeSnapshot['experimentalFeatures'];
    externalAgents: RuntimeSnapshot['externalAgents'];
    fuzzySearch: RuntimeSnapshot['fuzzySearch'];
    gitDiff: RuntimeSnapshot['gitDiff'];
    infoError: string;
    infoHydrated: boolean;
    integrationWarnings: RuntimeSnapshot['integrationWarnings'];
    infoLoading: boolean;
    infoMcpServers: RuntimeSnapshot['infoMcpServers'];
    pluginDetail: RuntimeSnapshot['pluginDetail'];
    plugins: RuntimeSnapshot['plugins'];
    protocolCoverage: RuntimeSnapshot['protocolCoverage'];
    skills: RuntimeSnapshot['skills'];
    workspaceSummary: RuntimeSnapshot['workspaceSummary'];
  };
  terminal: {
    terminalCommand: string;
    terminalCwd: string;
    terminalOutput: RuntimeSnapshot['terminalOutput'];
    terminalRunning: boolean;
    terminalSize: RuntimeSnapshot['terminalSize'];
    terminalStdin: string;
  };
};

export type ControlCenterActions = {
  shell: {
    closeSettings: () => void;
    setActiveInfoCategory: (category: ActiveInfoCategory) => void;
    openInfoTab: (tab: ActiveInfoTab) => void;
    openSettings: () => void;
    saveSettings: () => void;
    setActiveTab: (tabName: TabName) => void;
    setLogSettings: (values: Partial<BrowserLogSettings>) => void;
    setSidebarOpen: (isOpen: boolean) => void;
    toggleCommentary: () => void;
  };
  thread: {
    archiveThread: (threadId: string, isArchived?: boolean) => void | Promise<void>;
    compactThread: () => void | Promise<void>;
    filterThreads: (filter: string) => void | Promise<void>;
    forkThread: (threadId: string) => void | Promise<void>;
    newThread: () => void | Promise<void>;
    refreshThreads: () => void | Promise<void>;
    renameThread: (name: string) => void | Promise<void>;
    rollbackThread: () => void | Promise<void>;
    searchThreads: (searchTerm: string) => void | Promise<void>;
    selectThread: (threadId: string) => void | Promise<void>;
    setCollaborationMode: (value: CollaborationModeValue) => void | Promise<void>;
    setMessageDraft: (value: string) => void;
  };
  chat: {
    attachFiles: (files: FileList | File[]) => void;
    changeQuickSession: (values: { serviceTier?: string; sandboxMode?: string }) => void;
    interruptTurn: () => void | Promise<void>;
    openAttachmentPicker: () => void;
    reconnect: () => void;
    removeAttachment: (id: string) => void;
    selectEffort: (value: string) => void;
    selectModel: (value: string) => void;
    sendMessage: () => void | Promise<void>;
    steerTurn: () => void | Promise<void>;
  };
  files: {
    browseFiles: (path?: string) => void | Promise<void>;
    copyPath: (sourcePath: string, destinationPath: string) => void | Promise<void>;
    createDirectory: () => void | Promise<void>;
    createFile: () => void | Promise<void>;
    openFile: (path: string, name?: string) => void | Promise<void>;
    openInputModal: (config: InputModalConfig) => void;
    removePath: (path: string) => void | Promise<void>;
    saveFile: () => void | Promise<void>;
    setEditorContent: (content: string) => void;
    setFilesPath: (path: string) => void;
    toggleDirectory: (path: string) => void | Promise<void>;
  };
  config: {
    reconnect: () => void;
    reloadMcp: () => void;
    saveConfig: (values: Record<string, unknown>) => void | Promise<void>;
  };
  info: {
    cancelLogin: () => void | Promise<void>;
    detectExternalAgents: () => void | Promise<void>;
    importExternalAgents: () => void | Promise<void>;
    installPlugin: (id: string) => void | Promise<void>;
    loadAuthStatus: () => void | Promise<void>;
    loadGitDiff: () => void | Promise<void>;
    loadPluginDetail: (id: string) => void | Promise<void>;
    loadSummary: () => void | Promise<void>;
    logout: () => void;
    openFuzzyResult: (path: string) => void | Promise<void>;
    reloadMcp: () => void;
    removePlugin: (id: string) => void;
    runFuzzySearch: (query: string) => void | Promise<void>;
    setExperimentalFeatureEnabled: (key: string, enabled: boolean) => void;
    setSkillEnabled: (id: string, name: string | undefined, enabled: boolean) => void;
    startLogin: () => void;
    startReview: () => void | Promise<void>;
  };
  terminal: {
    run: () => void | Promise<void>;
    setCommand: (command: string) => void;
    setCwd: (cwd: string) => void;
    setSize: (cols: number, rows: number) => void;
    setStdin: (data: string) => void;
    stop: () => void | Promise<void>;
    write: () => void | Promise<void>;
  };
};

type ControlCenterContextValue = {
  actions: ControlCenterActions;
  state: ControlCenterState;
};

const ControlCenterContext = createContext<ControlCenterContextValue | null>(null);

export type ControlCenterProviderProps = PropsWithChildren<ControlCenterContextValue>;

export function CodexControlCenterProvider({
  actions,
  children,
  state,
}: ControlCenterProviderProps) {
  const value = useMemo(() => ({ state, actions }), [actions, state]);
  return <ControlCenterContext.Provider value={value}>{children}</ControlCenterContext.Provider>;
}

function useControlCenterContext() {
  const context = useContext(ControlCenterContext);
  if (!context) {
    throw new Error('Control center context is not available.');
  }
  return context;
}

export function useControlCenterState() {
  return useControlCenterContext().state;
}

export function useControlCenterActions() {
  return useControlCenterContext().actions;
}
