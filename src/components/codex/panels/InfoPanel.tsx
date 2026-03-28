'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  clearBrowserLogs,
  getRecentBrowserLogs,
  subscribeToBrowserLogs,
  type BrowserLogEntry,
} from '../../../lib/logging/browser-logger';
import { LOG_LEVEL_PRIORITY, type LogLevel } from '../../../lib/logging/shared';
import { Skeleton } from '../../ui';
import { useControlCenterActions, useControlCenterState } from '../ControlCenterContext';
import type { ActiveInfoCategory, ActiveInfoTab } from './types';
import {
  getExperimentalFeatureDisplayName,
  getExperimentalFeatureKey,
  splitExperimentalFeatures,
} from './experimental-feature-utils';

function getMcpStatusClass(status?: string) {
  if (status === 'running') return 'running';
  if (status === 'starting') return 'starting';
  return 'error';
}

export function InfoPanel() {
  const state = useControlCenterState();
  const actions = useControlCenterActions();
  const integrationWarnings = state.info.integrationWarnings.filter(
    (warning) => warning.context === 'info',
  );
  const isInitialInfoLoading =
    state.shell.activeTab === 'info' && !state.info.infoHydrated && !state.info.infoError;
  const [searchQuery, setSearchQuery] = useState('');
  const [browserLogs, setBrowserLogs] = useState<BrowserLogEntry[]>(getRecentBrowserLogs);
  const [logFilter, setLogFilter] = useState<LogLevel>('trace');
  const modelsRef = useRef<HTMLDivElement | null>(null);
  const mcpRef = useRef<HTMLDivElement | null>(null);
  const pluginsRef = useRef<HTMLDivElement | null>(null);
  const appsRef = useRef<HTMLDivElement | null>(null);
  const skillsRef = useRef<HTMLDivElement | null>(null);

  const defaultInfoTabByCategory: Record<ActiveInfoCategory, ActiveInfoTab> = {
    session: 'models',
    workspace: 'apps',
    integrations: 'mcp',
    settings: 'skills',
  };

  useEffect(() => {
    const unsubscribe = subscribeToBrowserLogs(setBrowserLogs);
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    setLogFilter(state.shell.logSettings.level === 'silent' ? 'error' : state.shell.logSettings.level);
  }, [state.shell.logSettings.level]);

  useEffect(() => {
    if (state.shell.activeTab !== 'info') return;

    const refs: Record<ActiveInfoTab, RefObject<HTMLDivElement | null>> = {
      models: modelsRef,
      mcp: mcpRef,
      plugins: pluginsRef,
      apps: appsRef,
      skills: skillsRef,
    };
    const node = refs[state.shell.activeInfoTab].current;
    if (!node) return;

    requestAnimationFrame(() => {
      node.scrollIntoView({ block: 'start', behavior: 'smooth' });
      node.focus({ preventScroll: true });
    });
  }, [state.shell.activeInfoTab, state.shell.activeTab]);

  const infoCategories: Array<{ id: ActiveInfoCategory; label: string }> = [
    { id: 'session', label: 'Session' },
    { id: 'workspace', label: 'Workspace' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'settings', label: 'Settings' },
  ];
  const { documented: documentedExperimentalFeatures, backendOnly: backendOnlyExperimentalFeatures } =
    splitExperimentalFeatures(state.info.experimentalFeatures);
  const filteredLogs = browserLogs
    .filter((entry) => LOG_LEVEL_PRIORITY[entry.level] >= LOG_LEVEL_PRIORITY[logFilter])
    .slice(-120)
    .reverse();

  return (
    <div className={`panel${state.shell.activeTab === 'info' ? ' active' : ''}`} id="panel-info">
      <div id="info-panel">
        <div className="info-nav" role="tablist" aria-label="Info sections">
          {infoCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              role="tab"
              className={`info-nav-tab${state.shell.activeInfoCategory === category.id ? ' active' : ''}`}
              aria-selected={state.shell.activeInfoCategory === category.id}
              onClick={() => actions.shell.openInfoTab(defaultInfoTabByCategory[category.id])}
            >
              {category.label}
            </button>
          ))}
        </div>
        {state.info.infoLoading || isInitialInfoLoading ? (
          <div className="loading">
            <Skeleton lines={5} />
            <div>Loading info…</div>
          </div>
        ) : state.info.infoError ? (
          <div className="panel-error">Could not load info: {state.info.infoError}</div>
        ) : (
          <>
            {integrationWarnings.length ? (
              <div className="integration-warning-card" role="status" aria-live="polite">
                <div className="integration-warning-title">
                  Some integrations are unavailable. Codex can continue without them.
                </div>
                <div className="integration-warning-list">
                  {integrationWarnings.map((warning) => (
                    <div key={warning.id} className="integration-warning-item">
                      {warning.message}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {state.shell.activeInfoCategory === 'session' ? (
              <>
                <div className="info-grid">
                  <div className="info-section">
                    <div className="info-section-title">Account</div>
                    <div className="account-info">
                      <div className="account-email">{state.account.accountEmail}</div>
                      {state.account.accountPlan ? (
                        <div className="account-plan">{state.account.accountPlan}</div>
                      ) : null}
                      <div className="config-help">
                        Commentary is currently{' '}
                        <strong>{state.shell.showCommentary ? 'visible' : 'hidden'}</strong>.
                      </div>
                    </div>
                    {state.account.loggedIn ? (
                      <button
                        type="button"
                        className="btn-sm btn-outline"
                        style={{ marginTop: '8px' }}
                        onClick={actions.info.logout}
                      >
                        Sign Out
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-sm btn-primary"
                        style={{ marginTop: '8px' }}
                        onClick={actions.info.startLogin}
                      >
                        Sign In
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-sm btn-outline"
                      style={{ marginTop: '8px' }}
                      onClick={() => actions.info.loadAuthStatus()}
                    >
                      Auth Status
                    </button>
                    {state.account.authStatus.loading ? (
                      <div className="config-help">Loading auth status…</div>
                    ) : null}
                    {state.account.authStatus.error ? (
                      <div className="config-help">{state.account.authStatus.error}</div>
                    ) : null}
                    {state.account.authStatus.content ? (
                      <pre className="info-code-block">{state.account.authStatus.content}</pre>
                    ) : null}
                  </div>

                  <div
                    className="info-section"
                    id="info-section-models"
                    ref={modelsRef}
                    tabIndex={-1}
                  >
                    <div className="info-section-title">Models</div>
                    {state.chat.models.length === 0 ? (
                      <div className="empty-inline">No models are available.</div>
                    ) : (
                      state.chat.models.map((model, index) => (
                        <div
                          key={model.id || model.displayName || `model-${index}`}
                          className="info-card"
                        >
                          <div className="info-card-name">{model.displayName || model.id}</div>
                          <div className="info-card-sub">{model.id}</div>
                          {model.description ? (
                            <div className="info-card-sub">{model.description}</div>
                          ) : null}
                          <div className="info-card-meta">
                            {model.isDefault ? (
                              <span className="info-tag default">DEFAULT</span>
                            ) : null}
                            {model.hidden ? <span className="info-tag">HIDDEN</span> : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : null}

            {state.shell.activeInfoCategory === 'workspace' ? (
              <>
                <div className="info-grid">
                  <div className="info-section">
                    <div className="info-section-title">Workspace Overview</div>
                    <div className="stack-actions">
                      <button
                        type="button"
                        className="btn-sm btn-primary"
                        onClick={() => actions.info.loadSummary()}
                      >
                        Summary
                      </button>
                      <button
                        type="button"
                        className="btn-sm btn-outline"
                        onClick={() => actions.info.loadGitDiff()}
                      >
                        Git Diff
                      </button>
                      <button
                        type="button"
                        className="btn-sm btn-outline"
                        onClick={() => actions.info.startReview()}
                      >
                        Start Review
                      </button>
                    </div>
                    {state.info.workspaceSummary.loading ? (
                      <div className="config-help">Building summary…</div>
                    ) : null}
                    {state.info.workspaceSummary.error ? (
                      <div className="config-help">{state.info.workspaceSummary.error}</div>
                    ) : null}
                    {state.info.workspaceSummary.content ? (
                      <pre className="info-code-block">{state.info.workspaceSummary.content}</pre>
                    ) : null}
                    {state.info.gitDiff.loading ? (
                      <div className="config-help">Loading git diff…</div>
                    ) : null}
                    {state.info.gitDiff.error ? (
                      <div className="config-help">{state.info.gitDiff.error}</div>
                    ) : null}
                    {state.info.gitDiff.content ? (
                      <pre className="info-code-block">{state.info.gitDiff.content}</pre>
                    ) : null}
                    {state.thread.review.reviewThreadId ? (
                      <div className="info-tag active">
                        Review thread: {state.thread.review.reviewThreadId}
                      </div>
                    ) : null}
                    {state.thread.review.error ? (
                      <div className="config-help">{state.thread.review.error}</div>
                    ) : null}
                  </div>

                  <div className="info-section" id="info-section-apps" ref={appsRef} tabIndex={-1}>
                    <div className="info-section-title">Apps</div>
                    {state.info.apps.length === 0 ? (
                      <div className="empty-inline">The app list is empty.</div>
                    ) : (
                      state.info.apps.map((app, index) => (
                        <div key={app.id || app.name || `app-${index}`} className="info-card">
                          <div className="info-card-name">{app.name}</div>
                          <div className="info-card-sub">{app.description || app.id}</div>
                          <div className="info-card-meta">
                            {app.connected ? (
                              <span className="info-tag active">CONNECTED</span>
                            ) : null}
                            {app.enabled ? (
                              <span className="info-tag active">ENABLED</span>
                            ) : (
                              <span className="info-tag">DISABLED</span>
                            )}
                            {app.version ? <span className="info-tag">{app.version}</span> : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="info-section">
                  <div className="info-section-title">Fuzzy File Search</div>
                  <div className="stack-actions search-row">
                    <input
                      className="search-inline"
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search for a file or path"
                    />
                    <button
                      type="button"
                      className="btn-sm btn-primary"
                      onClick={() => actions.info.runFuzzySearch(searchQuery)}
                    >
                      Search
                    </button>
                  </div>
                  {state.info.fuzzySearch.loading ? (
                    <div className="config-help">Searching…</div>
                  ) : null}
                  {state.info.fuzzySearch.error ? (
                    <div className="config-help">{state.info.fuzzySearch.error}</div>
                  ) : null}
                  <div className="search-results">
                    {state.info.fuzzySearch.results.map((result) => (
                      <button
                        key={`${result.path}-${result.score ?? 'na'}`}
                        type="button"
                        className="search-result-card"
                        onClick={() => actions.info.openFuzzyResult(result.path)}
                      >
                        <strong>{result.path}</strong>
                        {typeof result.score === 'number' ? (
                          <span>score: {result.score.toFixed(2)}</span>
                        ) : null}
                        {result.preview ? <span>{result.preview}</span> : null}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            {state.shell.activeInfoCategory === 'integrations' ? (
              <>
                <div className="info-grid">
                  <div className="info-section" id="info-section-mcp" ref={mcpRef} tabIndex={-1}>
                    <div className="info-section-title">MCP Servers</div>
                    {state.info.infoMcpServers.length === 0 ? (
                      <div className="empty-inline">No MCP servers are visible.</div>
                    ) : (
                      state.info.infoMcpServers.map((server, index) => (
                        <div
                          key={`${server.id || server.name || 'mcp'}-${index}`}
                          className="mcp-item"
                        >
                          <div className={`mcp-dot ${getMcpStatusClass(server.status)}`} />
                          <div className="mcp-name">{server.name || server.id}</div>
                          <div className="mcp-status">{server.status || 'unknown'}</div>
                        </div>
                      ))
                    )}
                    <button
                      type="button"
                      className="btn-sm btn-outline"
                      style={{ marginTop: '6px' }}
                      onClick={actions.info.reloadMcp}
                    >
                      ↻ Reload MCP
                    </button>
                  </div>

                  <div className="info-section">
                    <div className="info-section-title">External Agents</div>
                    <div className="stack-actions">
                      <button
                        type="button"
                        className="btn-sm btn-primary"
                        onClick={() => actions.info.detectExternalAgents()}
                      >
                        Detect
                      </button>
                      <button
                        type="button"
                        className="btn-sm btn-outline"
                        onClick={() => actions.info.importExternalAgents()}
                      >
                        Import
                      </button>
                    </div>
                    {state.info.externalAgents.loading ? (
                      <div className="config-help">Scanning configuration…</div>
                    ) : null}
                    {state.info.externalAgents.error ? (
                      <div className="config-help">{state.info.externalAgents.error}</div>
                    ) : null}
                    {state.info.externalAgents.importedCount ? (
                      <div className="info-tag active">
                        Imported {state.info.externalAgents.importedCount} entries
                      </div>
                    ) : null}
                    <pre className="info-code-block">
                      {JSON.stringify(state.info.externalAgents.items, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="info-grid">
                  <div
                    className="info-section"
                    id="info-section-plugins"
                    ref={pluginsRef}
                    tabIndex={-1}
                  >
                    <div className="info-section-title">Plugins</div>
                    {state.info.plugins.length === 0 ? (
                      <div className="empty-inline">No plugins found.</div>
                    ) : (
                      state.info.plugins.map((plugin, index) => {
                        const pluginId = plugin.id || plugin.name || `plugin-${index}`;
                        const installed = plugin.installed !== false;
                        const enabled = installed && plugin.enabled !== false;
                        return (
                          <div key={pluginId} className="info-card">
                            <div className="info-card-name">{plugin.name || pluginId}</div>
                            <div className="info-card-sub">
                              {[plugin.marketplaceName, plugin.description]
                                .filter(Boolean)
                                .join(' · ')}
                            </div>
                            <div className="info-card-meta">
                              <span className={`info-tag${enabled ? ' active' : ''}`}>
                                {installed ? (enabled ? 'INSTALLED' : 'DISABLED') : 'AVAILABLE'}
                              </span>
                            </div>
                            <div className="stack-actions">
                              <button
                                type="button"
                                className={`btn-sm ${installed ? 'btn-outline' : 'btn-primary'}`}
                                onClick={() =>
                                  installed
                                    ? actions.info.removePlugin(pluginId)
                                    : actions.info.installPlugin(pluginId)
                                }
                              >
                                {installed ? 'Uninstall' : 'Install'}
                              </button>
                              <button
                                type="button"
                                className="btn-sm btn-outline"
                                onClick={() => actions.info.loadPluginDetail(pluginId)}
                              >
                                Details
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="info-section">
                    <div className="info-section-title">Plugin Detail</div>
                    {state.info.pluginDetail ? (
                      <div className="info-card">
                        <div className="info-card-name">{state.info.pluginDetail.name}</div>
                        <div className="info-card-sub">{state.info.pluginDetail.description}</div>
                        {state.info.pluginDetail.apps.length ? (
                          <div className="capability-list">
                            {state.info.pluginDetail.apps.map((app, index) => (
                              <span
                                key={app.id || app.name || `plugin-app-${index}`}
                                className="info-tag"
                              >
                                {app.name}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {state.info.pluginDetail.mcpServers.length ? (
                          <pre className="info-code-block">
                            {state.info.pluginDetail.mcpServers.join('\n')}
                          </pre>
                        ) : null}
                      </div>
                    ) : (
                      <div className="empty-inline">
                        Plugin details will appear here after you select one.
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}

            {state.shell.activeInfoCategory === 'settings' ? (
              <>
                <div className="info-grid">
                  <div className="info-section">
                    <div className="info-section-title">Skills Guide</div>
                    <div className="info-card">
                      <div className="info-card-name">How skills work in Codex</div>
                      <div className="info-card-sub">
                        Skills package instructions, optional resources, and helper scripts so
                        Codex can apply repeatable workflows in the app, CLI, and IDE extension.
                      </div>
                      <div className="capability-list">
                        <span className="info-tag active">SKILL.md</span>
                        <span className="info-tag">scripts/</span>
                        <span className="info-tag">references/</span>
                        <span className="info-tag">assets/</span>
                      </div>
                      <pre className="info-code-block">{`my-skill/
├── SKILL.md
├── scripts/
├── references/
└── assets/`}</pre>
                    </div>
                    <div className="info-card">
                      <div className="info-card-name">Usage model</div>
                      <div className="info-card-sub">
                        Codex can use a skill when you explicitly ask for it, or automatically when
                        the task matches the skill description.
                      </div>
                      <div className="capability-list">
                        <span className="info-tag active">Explicit invocation</span>
                        <span className="info-tag active">Automatic matching</span>
                        <span className="info-tag">Shared across app / CLI / IDE</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="info-section"
                    id="info-section-skills"
                    ref={skillsRef}
                    tabIndex={-1}
                  >
                    <div className="info-section-title">Skills</div>
                    <div className="config-help" style={{ marginBottom: '10px' }}>
                      Toggle the skills currently available to this Codex environment.
                    </div>
                    {state.info.skills.length === 0 ? (
                      <div className="empty-inline">No skills found.</div>
                    ) : (
                      state.info.skills.map((skill, index) => {
                        const skillId = skill.id || skill.name || `skill-${index}`;
                        const enabled = skill.enabled !== false;
                        return (
                          <div key={skillId} className="info-card">
                            <div className="info-card-name">{skill.name || skillId}</div>
                            <div className="info-card-sub">
                              {skill.description || 'No description available.'}
                            </div>
                            <label className="toggle-row">
                              <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(event) =>
                                  actions.info.setSkillEnabled(
                                    skillId,
                                    skill.name,
                                    event.target.checked,
                                  )
                                }
                              />
                              <span>{enabled ? 'Enabled' : 'Disabled'}</span>
                            </label>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="info-section">
                    <div className="info-section-title">Experimental</div>
                    {state.info.experimentalFeatures.length === 0 ? (
                      <div className="empty-inline">No experimental features are available.</div>
                    ) : (
                      <>
                        <div className="config-help" style={{ marginBottom: '10px' }}>
                          Documented feature flags can be toggled here. Backend-only or structured
                          feature entries are shown separately to avoid writing invalid config
                          shapes.
                        </div>
                        {documentedExperimentalFeatures.length > 0 ? (
                          <>
                            <div className="info-card-name" style={{ marginBottom: '8px' }}>
                              Documented config flags
                            </div>
                            {documentedExperimentalFeatures.map((feature, index) => {
                              const featureKey = getExperimentalFeatureKey(feature, index);
                              const toggleValue = feature.enabled ?? feature.value;
                              const isBooleanFeature = typeof toggleValue === 'boolean';
                              const enabled = isBooleanFeature ? toggleValue : false;
                              const featureName = getExperimentalFeatureDisplayName(
                                feature,
                                featureKey,
                              );
                              return (
                                <div key={featureKey} className="info-card">
                                  <div className="info-card-name">{featureName}</div>
                                  <div className="info-card-sub">
                                    {feature.description || 'Experimental feature'}
                                  </div>
                                  <div className="info-card-meta">
                                    {feature.stage ? (
                                      <span className="info-tag">{feature.stage.toUpperCase()}</span>
                                    ) : null}
                                    {typeof feature.defaultEnabled === 'boolean' ? (
                                      <span className="info-tag">
                                        Default {feature.defaultEnabled ? 'ON' : 'OFF'}
                                      </span>
                                    ) : null}
                                    <span className="info-tag">features.{featureKey}</span>
                                  </div>
                                  {isBooleanFeature ? (
                                    <label className="toggle-row">
                                      <input
                                        type="checkbox"
                                        checked={enabled}
                                        onChange={(event) =>
                                          actions.info.setExperimentalFeatureEnabled(
                                            featureKey,
                                            event.target.checked,
                                          )
                                        }
                                      />
                                      <span>{enabled ? 'On' : 'Off'}</span>
                                    </label>
                                  ) : (
                                    <>
                                      <div className="info-card-meta">
                                        <span className="info-tag">STRUCTURED CONFIG</span>
                                      </div>
                                      <div className="config-help">
                                        This setting uses a structured value and should be edited
                                        from the Config panel instead of a simple toggle.
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </>
                        ) : null}
                        {backendOnlyExperimentalFeatures.length > 0 ? (
                          <>
                            <div
                              className="info-card-name"
                              style={{ marginTop: documentedExperimentalFeatures.length ? '14px' : 0 }}
                            >
                              Backend-only entries
                            </div>
                            <div className="config-help" style={{ marginBottom: '8px' }}>
                              These entries came from the backend feature list but are not currently
                              in the public config reference. Treat them as informational unless you
                              have a specific rollout note for them.
                            </div>
                            {backendOnlyExperimentalFeatures.map((feature, index) => {
                              const featureKey = getExperimentalFeatureKey(feature, index);
                              const featureName = getExperimentalFeatureDisplayName(
                                feature,
                                featureKey,
                              );
                              return (
                                <div key={featureKey} className="info-card">
                                  <div className="info-card-name">{featureName}</div>
                                  <div className="info-card-sub">
                                    {feature.description || 'Backend-discovered feature entry'}
                                  </div>
                                  <div className="info-card-meta">
                                    <span className="info-tag">BACKEND ONLY</span>
                                    <span className="info-tag">{featureKey}</span>
                                    {feature.stage ? (
                                      <span className="info-tag">{feature.stage.toUpperCase()}</span>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>

                <div className="info-section">
                  <div className="info-section-title">Coverage Snapshot</div>
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <span className="metric-label">Requests</span>
                      <strong>
                        {state.info.protocolCoverage.requests.implemented}/
                        {state.info.protocolCoverage.requests.total}
                      </strong>
                    </div>
                    <div className="metric-card">
                      <span className="metric-label">Notifications</span>
                      <strong>
                        {state.info.protocolCoverage.notifications.implemented}/
                        {state.info.protocolCoverage.notifications.total}
                      </strong>
                    </div>
                    <div className="metric-card">
                      <span className="metric-label">Server Requests</span>
                      <strong>
                        {state.info.protocolCoverage.serverRequests.implemented}/
                        {state.info.protocolCoverage.serverRequests.total}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <div className="info-section-title">Runtime Logs</div>
                  <div className="info-card">
                    <div className="info-card-name">Live browser/runtime log stream</div>
                    <div className="info-card-sub">
                      Captures client-side Codex UI and runtime events. Server logs still flow to
                      the terminal via <code>CODEX_LOG_LEVEL</code>.
                    </div>
                    <div className="stack-actions" style={{ marginTop: '10px', marginBottom: '10px' }}>
                      <select
                        className="config-value"
                        style={{ maxWidth: '180px' }}
                        value={logFilter}
                        onChange={(event) => setLogFilter(event.target.value as LogLevel)}
                      >
                        <option value="trace">Trace+</option>
                        <option value="debug">Debug+</option>
                        <option value="info">Info+</option>
                        <option value="warn">Warn+</option>
                        <option value="error">Error only</option>
                      </select>
                      <button
                        type="button"
                        className="btn-sm btn-outline"
                        onClick={() => clearBrowserLogs()}
                      >
                        Clear logs
                      </button>
                    </div>
                    {filteredLogs.length === 0 ? (
                      <div className="empty-inline">No logs at this level yet.</div>
                    ) : (
                      <div className="runtime-log-list">
                        {filteredLogs.map((entry) => (
                          <div key={entry.id} className={`runtime-log-entry level-${entry.level}`}>
                            <div className="runtime-log-head">
                              <span className={`runtime-log-level level-${entry.level}`}>
                                {entry.level.toUpperCase()}
                              </span>
                              <span className="runtime-log-scope">{entry.scope}</span>
                              <span className="runtime-log-time">{entry.timestamp}</span>
                            </div>
                            <div className="runtime-log-message">{entry.message}</div>
                            {entry.details.length ? (
                              <pre className="runtime-log-details">
                                {entry.details.join('\n\n')}
                              </pre>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
