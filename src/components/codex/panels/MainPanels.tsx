'use client';

import { useControlCenterState } from '../ControlCenterContext';
import { AccountLoginBanner, ChatPanel, ContentTabs, ThreadHeader } from './ChatPanel';
import { ConfigPanel } from './ConfigPanel';
import { FilesPanel } from './FilesPanel';
import { InfoPanel } from './InfoPanel';
import { TerminalPanel } from './TerminalPanel';

export function MainPanels() {
  const state = useControlCenterState();
  let activePanel = <ChatPanel />;

  if (state.shell.activeTab === 'terminal') {
    activePanel = <TerminalPanel />;
  } else if (state.shell.activeTab === 'files') {
    activePanel = <FilesPanel />;
  } else if (state.shell.activeTab === 'config') {
    activePanel = <ConfigPanel />;
  } else if (state.shell.activeTab === 'info') {
    activePanel = <InfoPanel />;
  }

  return (
    <main id="main">
      <ThreadHeader />
      <AccountLoginBanner
        loggedIn={state.account.loggedIn}
        loginInProgress={state.account.loginInProgress}
      />
      <ContentTabs />
      <div id="content-area">{activePanel}</div>
    </main>
  );
}
