'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getBrowserLogSettings,
  subscribeToBrowserLogSettings,
  updateBrowserLogSettings,
} from '../../lib/logging/browser-logger';
import type { RuntimeSnapshot } from '../../lib/codex-ui-runtime';
import { ErrorBoundary, InputModal, type InputModalConfig } from '../ui';
import {
  CodexControlCenterProvider,
  type ControlCenterActions,
  type ControlCenterState,
} from './ControlCenterContext';
import { Header } from './Header';
import { Overlays } from './Overlays';
import { resolveOverlayDismissals } from './overlay-policy';
import { Sidebar } from './Sidebar';
import { MainPanels } from './panels';
import type { ActiveInfoCategory, ActiveInfoTab } from './panels/types';
import { type ShellRuntime, useControlCenterShell } from './hooks/useControlCenterShell';
import { useRuntimeSnapshot } from './hooks/useRuntimeSnapshot';

type RuntimeModule = typeof import('../../lib/codex-ui-runtime');

type ToastEntry = {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
};

type ControlCenterRuntime = RuntimeModule &
  ShellRuntime & {
    subscribe(listener: (snapshot: RuntimeSnapshot) => void): () => void;
    getSnapshot(): RuntimeSnapshot;
  };

async function bootstrapControlCenter() {
  const runtime = await import('../../lib/codex-ui-runtime');
  runtime.initCodexUi();
  return runtime;
}

function getInfoCategoryForTab(tab: ActiveInfoTab): ActiveInfoCategory {
  switch (tab) {
    case 'models':
      return 'session';
    case 'apps':
      return 'workspace';
    case 'mcp':
    case 'plugins':
      return 'integrations';
    case 'skills':
      return 'settings';
    default:
      return 'session';
  }
}

export function CodexControlCenter() {
  const [runtime, setRuntime] = useState<ControlCenterRuntime | null>(null);
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const [logSettings, setLogSettings] = useState(getBrowserLogSettings);
  const [activeInfoTab, setActiveInfoTab] = useState<ActiveInfoTab>('models');
  const [activeInfoCategory, setActiveInfoCategory] = useState<ActiveInfoCategory>('session');
  const [inputModal, setInputModal] = useState<(InputModalConfig & { isOpen: boolean }) | null>(
    null,
  );
  const shell = useControlCenterShell(runtime);
  const snapshot = useRuntimeSnapshot(runtime);
  const integrationWarningCount = snapshot.integrationWarnings.length;

  const openInfoTab = useCallback(
    (tab: ActiveInfoTab) => {
      setActiveInfoTab(tab);
      setActiveInfoCategory(getInfoCategoryForTab(tab));
      shell.setActiveTab('info');
    },
    [shell],
  );

  const openInputModal = useCallback((config: InputModalConfig) => {
    shell.closeSettings();
    setInputModal({
      isOpen: true,
      ...config,
      onConfirm: (value) => {
        config.onConfirm(value);
        setInputModal(null);
      },
    });
  }, [shell.closeSettings]);

  const closeInputModal = useCallback(() => {
    setInputModal(null);
  }, []);

  useEffect(() => {
    void bootstrapControlCenter().then((loadedRuntime) => {
      setRuntime(loadedRuntime as ControlCenterRuntime);
    });
  }, []);

  useEffect(() => {
    if (!runtime?.subscribeToToasts) return;
    const unsubscribe = runtime.subscribeToToasts((toast) => {
      setToasts((current) => [...current, toast].slice(-4));
      window.setTimeout(() => {
        setToasts((current) => current.filter((entry) => entry.id !== toast.id));
      }, 3500);
    });
    return () => {
      unsubscribe();
    };
  }, [runtime]);

  useEffect(() => {
    const unsubscribe = subscribeToBrowserLogSettings(setLogSettings);
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!runtime) {
      return;
    }

    if (shell.activeTab === 'config') {
      void runtime.ensureConfigLoaded?.();
      return;
    }

    if (shell.activeTab === 'info') {
      void runtime.ensureInfoLoaded?.();
    }
  }, [runtime, shell.activeTab]);

  useEffect(() => {
    const { closeInput, closeSettings } = resolveOverlayDismissals({
      approvalOpen: Boolean(snapshot.activeApprovalRequest),
      inputOpen: Boolean(inputModal?.isOpen),
      settingsOpen: shell.settingsOpen,
    });

    if (!closeInput && !closeSettings) {
      return;
    }

    if (closeSettings) {
      shell.closeSettings();
    }

    if (closeInput) {
      setInputModal(null);
    }
  }, [
    inputModal?.isOpen,
    shell.closeSettings,
    shell.settingsOpen,
    snapshot.activeApprovalRequest,
  ]);

  const controlCenterState = useMemo<ControlCenterState>(
    () => ({
      account: {
        accountEmail: snapshot.accountEmail,
        accountPlan: snapshot.accountPlan,
        authStatus: snapshot.authStatus,
        loggedIn: snapshot.loggedIn,
        loginInProgress: snapshot.loginInProgress,
      },
      shell: {
        activeInfoCategory,
        activeInfoTab,
        activeTab: shell.activeTab,
        connectionBanner: snapshot.connectionBanner,
        logSettings,
        settingsOpen: shell.settingsOpen,
        showCommentary: shell.showCommentary,
        turnActive: snapshot.turnActive,
      },
      thread: {
        activeFilter: snapshot.activeFilter,
        activeThread: snapshot.activeThread,
        activeThreadId: snapshot.activeThreadId,
        activeThreadStatus: snapshot.activeThreadStatus,
        collaborationMode: snapshot.collaborationMode,
        collaborationModes: snapshot.collaborationModes,
        messageDraft: snapshot.messageDraft,
        review: snapshot.review,
        searchTerm: snapshot.searchTerm,
        visibleThreads: snapshot.visibleThreads,
      },
      chat: {
        attachmentUploadInProgress: snapshot.attachmentUploadInProgress,
        chatEntries: snapshot.chatEntries,
        configData: snapshot.configData,
        models: snapshot.models,
        pendingAttachments: snapshot.pendingAttachments,
        selectedEffort: snapshot.selectedEffort,
        selectedModel: snapshot.selectedModel,
        selectedSandboxMode: snapshot.selectedSandboxMode,
        selectedServiceTier: snapshot.selectedServiceTier,
      },
      files: {
        currentFilePath: snapshot.currentFilePath,
        fileBreadcrumb: snapshot.fileBreadcrumb,
        fileBrowserPath: snapshot.fileBrowserPath,
        fileEditorContent: snapshot.fileEditorContent,
        fileEditorName: snapshot.fileEditorName,
        fileEditorReadOnly: snapshot.fileEditorReadOnly,
        fileError: snapshot.fileError,
        fileLoading: snapshot.fileLoading,
        fileMetadata: snapshot.fileMetadata,
        fileTree: snapshot.fileTree,
      },
      config: {
        capabilities: snapshot.capabilities,
        configData: snapshot.configData,
        configError: snapshot.configError,
        configHydrated: snapshot.configHydrated,
        integrationWarnings: snapshot.integrationWarnings,
        configLoading: snapshot.configLoading,
        configMcpServers: snapshot.configMcpServers,
        configRequirements: snapshot.configRequirements,
        connected: snapshot.connected,
        protocolCoverage: snapshot.protocolCoverage,
      },
      info: {
        apps: snapshot.apps,
        experimentalFeatures: snapshot.experimentalFeatures,
        externalAgents: snapshot.externalAgents,
        fuzzySearch: snapshot.fuzzySearch,
        gitDiff: snapshot.gitDiff,
        infoError: snapshot.infoError,
        infoHydrated: snapshot.infoHydrated,
        integrationWarnings: snapshot.integrationWarnings,
        infoLoading: snapshot.infoLoading,
        infoMcpServers: snapshot.infoMcpServers,
        pluginDetail: snapshot.pluginDetail,
        plugins: snapshot.plugins,
        protocolCoverage: snapshot.protocolCoverage,
        skills: snapshot.skills,
        workspaceSummary: snapshot.workspaceSummary,
      },
      terminal: {
        terminalCommand: snapshot.terminalCommand,
        terminalCwd: snapshot.terminalCwd,
        terminalOutput: snapshot.terminalOutput,
        terminalRunning: snapshot.terminalRunning,
        terminalSize: snapshot.terminalSize,
        terminalStdin: snapshot.terminalStdin,
      },
    }),
    [
      activeInfoCategory,
      activeInfoTab,
      logSettings,
      shell.activeTab,
      shell.settingsOpen,
      shell.showCommentary,
      snapshot,
    ],
  );

  const controlCenterActions = useMemo<ControlCenterActions>(
    () => ({
      shell: {
        closeSettings: shell.closeSettings,
        openInfoTab,
        openSettings: shell.openSettings,
        saveSettings: shell.saveSettings,
        setActiveTab: shell.setActiveTab,
        setActiveInfoCategory,
        setLogSettings: (values) => {
          updateBrowserLogSettings(values);
        },
        setSidebarOpen: shell.setSidebarOpen,
        toggleCommentary: shell.toggleCommentary,
      },
      thread: {
        archiveThread: (threadId, isArchived) => runtime?.archiveThreadById(threadId, isArchived),
        compactThread: () => runtime?.compactActiveThread(),
        filterThreads: (filter) => runtime?.setThreadFilter(filter),
        forkThread: (threadId) => runtime?.forkThreadById(threadId),
        newThread: () => runtime?.startNewThread(),
        refreshThreads: () => runtime?.refreshThreads(),
        renameThread: (name) => runtime?.renameActiveThread(name),
        rollbackThread: () => runtime?.rollbackActiveThread(),
        searchThreads: (searchTerm) => runtime?.setThreadSearch(searchTerm),
        selectThread: (threadId) => runtime?.selectThreadById(threadId),
        setCollaborationMode: (value) => runtime?.setCollaborationMode(value),
        setMessageDraft: (value) => runtime?.setMessageDraft(value),
      },
      chat: {
        attachFiles: (files) => runtime?.queueAttachmentFiles(files),
        changeQuickSession: (values) => {
          if (typeof values.serviceTier === 'string') {
            runtime?.setSelectedServiceTier(values.serviceTier);
          }
          if (typeof values.sandboxMode === 'string') {
            runtime?.setSelectedSandboxMode(values.sandboxMode);
          }
        },
        interruptTurn: () => runtime?.interruptActiveTurn(),
        openAttachmentPicker: () => runtime?.openImagePicker(),
        reconnect: () => runtime?.reconnectCodex(),
        removeAttachment: (id) => runtime?.removePendingAttachmentById(id),
        selectEffort: (value) => runtime?.setSelectedEffort(value),
        selectModel: (value) => runtime?.setSelectedModel(value),
        sendMessage: () => runtime?.sendChatMessage(),
        steerTurn: () => runtime?.steerActiveTurn(),
      },
      files: {
        browseFiles: (path) => runtime?.browseFilesPath(path),
        copyPath: (sourcePath, destinationPath) =>
          runtime?.copyFilePath(sourcePath, destinationPath),
        createDirectory: () => {
          openInputModal({
            title: 'New Folder',
            label: 'Folder name',
            placeholder: 'folder-name',
            defaultValue: '',
            confirmLabel: 'Create',
            onConfirm: (name) => {
              void runtime?.createNewDir(name);
              closeInputModal();
            },
          });
        },
        createFile: () => {
          openInputModal({
            title: 'New File',
            label: 'File name',
            placeholder: 'file.txt',
            defaultValue: '',
            confirmLabel: 'Create',
            onConfirm: (name) => {
              void runtime?.createNewFile(name);
              closeInputModal();
            },
          });
        },
        openFile: (path, name) => runtime?.openFilePath(path, name),
        openInputModal,
        removePath: (path) => runtime?.removeFilePath(path),
        saveFile: () => runtime?.saveCurrentFile(),
        setEditorContent: (content) => runtime?.setFileEditorContent(content),
        setFilesPath: (path) => runtime?.setFilesPath(path),
        toggleDirectory: (path) => runtime?.toggleFileDirectory(path),
      },
      config: {
        reconnect: () => runtime?.reconnectCodex(),
        reloadMcp: () => runtime?.reloadMcpServers(),
        saveConfig: (values) => runtime?.batchWriteConfig(values),
      },
      info: {
        cancelLogin: () => runtime?.cancelLoginFlow(),
        detectExternalAgents: () => runtime?.detectExternalAgentConfig(),
        importExternalAgents: () => runtime?.importExternalAgentConfig(),
        installPlugin: (id) => runtime?.installPlugin(id),
        loadAuthStatus: () => runtime?.refreshAuthStatus(),
        loadGitDiff: () => runtime?.loadGitDiff(),
        loadPluginDetail: (id) => runtime?.loadPluginDetail(id),
        loadSummary: () => runtime?.loadWorkspaceSummary(),
        logout: () => runtime?.logoutAccount(),
        openFuzzyResult: (path) => {
          shell.setActiveTab('files');
          return runtime?.openFilePath(path);
        },
        reloadMcp: () => runtime?.reloadMcpServers(),
        removePlugin: (id) => runtime?.uninstallPlugin(id),
        runFuzzySearch: (query) => runtime?.runFuzzyFileSearch(query),
        setExperimentalFeatureEnabled: (key, enabled) =>
          runtime?.setExperimentalFeatureEnabled(key, enabled),
        setSkillEnabled: (id, name, enabled) => runtime?.setSkillEnabled(id, name, enabled),
        startLogin: () => runtime?.startLoginFlow(),
        startReview: () => runtime?.startThreadReview(),
      },
      terminal: {
        run: () => runtime?.runTerminalCommand(),
        setCommand: (command) => runtime?.setTerminalCommand(command),
        setCwd: (cwd) => runtime?.setTerminalCwd(cwd),
        setSize: (cols, rows) => runtime?.setTerminalSize(cols, rows),
        setStdin: (data) => runtime?.setTerminalStdin(data),
        stop: () => runtime?.killTerminalProcess(),
        write: () => runtime?.writeTerminalStdin(),
      },
    }),
    [closeInputModal, openInfoTab, openInputModal, runtime, shell],
  );

  return (
    <>
      <CodexControlCenterProvider state={controlCenterState} actions={controlCenterActions}>
        <div id="app">
          <Header
            activeTab={shell.activeTab}
            activeInfoTab={activeInfoTab}
            accountEmail={snapshot.accountEmail}
            accountPlan={snapshot.accountPlan}
            connectionState={snapshot.connectionState}
            integrationWarningCount={integrationWarningCount}
            isSidebarOpen={shell.isSidebarOpen}
            showCommentary={shell.showCommentary}
            onOpenIntegrationWarnings={() => openInfoTab('mcp')}
            onOpenMcp={() => openInfoTab('mcp')}
            onOpenModels={() => openInfoTab('models')}
            onOpenPlugins={() => openInfoTab('plugins')}
            onOpenSettings={shell.openSettings}
            onToggleCommentary={shell.toggleCommentary}
            onToggleSidebar={() => shell.setSidebarOpen(!shell.isSidebarOpen)}
          />
          <Sidebar
            activeFilter={snapshot.activeFilter}
            activeThreadId={snapshot.activeThreadId}
            isOpen={shell.isSidebarOpen}
            onArchiveThread={(threadId, isArchived) =>
              runtime?.archiveThreadById(threadId, isArchived)
            }
            onClose={() => shell.setSidebarOpen(false)}
            onFilterChange={(filter) => runtime?.setThreadFilter(filter)}
            onForkThread={(threadId) => runtime?.forkThreadById(threadId)}
            onNewThread={() => runtime?.startNewThread()}
            onRefreshThreads={() => runtime?.refreshThreads()}
            onSearchChange={(searchTerm) => runtime?.setThreadSearch(searchTerm)}
            onSelectThread={(threadId) => runtime?.selectThreadById(threadId)}
            searchTerm={snapshot.searchTerm}
            threads={snapshot.visibleThreads}
          />
          <ErrorBoundary>
            <MainPanels />
          </ErrorBoundary>
        </div>
      </CodexControlCenterProvider>
      <Overlays
        activeApprovalRequest={snapshot.activeApprovalRequest}
        connectionTarget={snapshot.connectionBanner.target}
        logSettings={logSettings}
        onCloseSettings={shell.closeSettings}
        onDismissApproval={() => runtime?.dismissApprovalRequest()}
        onReconnect={() => runtime?.reconnectCodex()}
        onResolveApproval={(action, values) => runtime?.resolveApprovalRequest(action, values)}
        onUpdateLogSettings={(values) => updateBrowserLogSettings(values)}
        settingsOpen={shell.settingsOpen}
        toasts={toasts}
      />
      {inputModal ? (
        <InputModal
          isOpen={inputModal.isOpen}
          title={inputModal.title}
          label={inputModal.label}
          placeholder={inputModal.placeholder}
          defaultValue={inputModal.defaultValue}
          confirmLabel={inputModal.confirmLabel}
          cancelLabel={inputModal.cancelLabel}
          onConfirm={inputModal.onConfirm}
          onCancel={closeInputModal}
        />
      ) : null}
    </>
  );
}
