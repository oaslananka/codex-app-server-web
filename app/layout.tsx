import type { Metadata } from 'next';
import './globals.css';
import '../src/styles/control-center.css';
import '../src/styles/control-center-layout.css';
import '../src/styles/control-center-panels.css';
import '../src/styles/control-center-overlays.css';
import '../src/styles/control-center-responsive.css';

export const metadata: Metadata = {
  title: 'Codex Control Center',
  description: 'Next.js + Fastify + WebSocket powered Codex workspace',
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
