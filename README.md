# codex-app-server-web

`codex-app-server-web` is an open source web interface for the OpenAI Codex app-server protocol. It provides a browser-based control center for threads, chat, terminal access, files, configuration, approvals, MCP visibility, and runtime diagnostics while preserving protocol compatibility with Codex app-server backends.

## Repositories

- Primary repository: `git@ssh.dev.azure.com:v3/oaslananka/open-source/codex-app-server-web`
- Public mirror: `https://github.com/oaslananka/codex-app-server-web.git`
- GitHub profile: `https://github.com/oaslananka`

Azure DevOps is the source of truth for CI/CD, build validation, and release flow. GitHub is maintained as the public open source mirror for discoverability, issue visibility, and community collaboration.

## Stack

- Next.js App Router
- React
- Fastify
- WebSocket proxying with `ws`
- TypeScript
- pnpm
- Node.js 20+ with CI validated on Node 22

## What it does

- Connects to a Codex app-server over WebSocket
- Renders thread/chat/terminal/files/config/info surfaces in the browser
- Supports approval flows, including richer approval rendering for advanced payloads
- Exposes schema-driven config editing with generic fallback behavior
- Includes smoke and unit testing for protocol-facing runtime behavior

## Local development

```bash
pnpm install
pnpm dev
```

Useful commands:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm smoke
pnpm start:mock-codex
```

## Git remotes

Recommended local remote layout for this project:

- `origin` -> Azure DevOps primary repository
- `github` -> public GitHub mirror

## CI/CD

- Azure DevOps handles the main CI/CD pipeline for this project.
- An Azure pipeline definition is included in [azure-pipelines.yml](./azure-pipelines.yml).
- GitHub Actions is intentionally reduced to manual dispatch so the GitHub mirror does not act as the primary automation system.

## Open source collaboration

This repository is intended to be open source and community-friendly.

- Contributions should prefer incremental, protocol-safe improvements.
- Backward compatibility with the Codex app-server contract should be preserved.
- Schema-backed configuration behavior should not be regressed.
- Issues, pull requests, and documentation improvements are welcome through the public GitHub mirror.

## Notes for contributors

- Run `pnpm typecheck`, `pnpm test`, and `pnpm build` before proposing changes.
- If you touch runtime behavior, add or update tests under `tests/unit`.
- If you change protocol metadata, validate it with `pnpm protocol:manifest:check`.
