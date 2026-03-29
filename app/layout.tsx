import type { Metadata } from 'next';
import './globals.css';
import '../src/styles/control-center.css';
import '../src/styles/control-center-layout.css';
import '../src/styles/control-center-panels.css';
import '../src/styles/control-center-overlays.css';
import '../src/styles/control-center-responsive.css';

export const metadata: Metadata = {
  title: {
    default: 'Community Codex Control Center',
    template: '%s | Community Codex Control Center',
  },
  description:
    'Independent, open-source browser control center compatible with Codex app-server workflows, including chat, files, terminal, approvals, config, MCP visibility, and runtime diagnostics.',
  applicationName: 'Community Codex Control Center',
  keywords: [
    'Codex',
    'app-server',
    'web UI',
    'control center',
    'developer tools',
    'community-maintained',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link key="github-dark-stylesheet" rel="stylesheet" href="/vendor/github-dark.min.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
