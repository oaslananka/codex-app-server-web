# codex-app-server-web

`codex-app-server-web` is an independent, open-source web interface for Codex app-server workflows. It provides a browser-based control center for working with threads, chat, terminal sessions, files, configuration, approvals, MCP visibility, and runtime diagnostics while staying compatible with existing app-server backends.

This project is independent and community-maintained. It is not affiliated with, endorsed by, or maintained by OpenAI.

**Overview**

The goal of this repository is to make Codex app-server workflows easier to inspect and operate from the browser without changing the backend protocol. It is designed for developer-facing use cases where you want a practical UI for session management, approvals, diagnostics, and workspace interaction, while keeping protocol compatibility and schema-driven behavior intact.

Azure DevOps is the source of truth for CI/CD, release validation, and the primary delivery workflow. GitHub is maintained as the public open-source mirror for discoverability, issue tracking, and community contributions.

**Core Capabilities**

- Browser-based access to conversation threads and live chat activity
- Terminal execution with streamed output and interactive stdin
- File browsing, editing, copy/remove actions, and path-aware navigation
- Schema-driven config editing with generic fallback support for unknown fields
- Approval flows for commands, file changes, permissions, user input, and auth refreshes
- MCP server visibility, plugin inspection, external agent import, and runtime diagnostics
- Workspace utilities such as fuzzy file search, git diff visibility, and review-thread entry points

**Stack**

- Next.js App Router
- React 19
- Fastify
- WebSocket transport with `ws`
- TypeScript
- pnpm
- Node.js 20+

**Project Structure**

- [`app/`](./app): Next.js app shell, layout, and entry routes
- [`src/components/`](./src/components): Codex control center UI, overlays, panels, and shared UI primitives
- [`src/lib/`](./src/lib): Runtime, transport, protocol-facing logic, and supporting utilities
- [`src/styles/`](./src/styles): Control center styling, responsive behavior, and overlay/panel presentation
- [`scripts/`](./scripts): Manifest generation, smoke tooling, vendor sync, and local backend helpers
- [`tests/unit/`](./tests/unit): Unit coverage for runtime behavior, protocol handling, overlays, and panel utilities
- [`azure-pipelines.yml`](./azure-pipelines.yml): Primary CI/CD pipeline definition
- [`TECH_DEBT.md`](./TECH_DEBT.md): Explicitly accepted debt and known boundaries

**Local Development**

Install dependencies and start the app with a local Codex backend:

```bash
pnpm install
pnpm dev
```

If you want a local backend stub for UI work, start the mock app-server in a second terminal:

```bash
pnpm start:mock-codex
```

The UI server can also be started directly without the helper wrapper:

```bash
pnpm start:ui
```

**Useful Commands**

```bash
pnpm dev
pnpm start
pnpm start:prod
pnpm start:mock-codex
pnpm typecheck
pnpm test
pnpm build
pnpm protocol:manifest:check
pnpm smoke
```

**CI/CD**

- Azure DevOps is the authoritative pipeline and release path for this project.
- [`azure-pipelines.yml`](./azure-pipelines.yml) defines the primary validation and delivery flow.
- The GitHub mirror is intentionally secondary and does not replace Azure DevOps as the release source of truth.
- Protocol metadata can be validated locally with `pnpm protocol:manifest:check` before opening a change.

**Contribution Guidance**

- Prefer incremental, protocol-safe improvements over large speculative rewrites.
- Preserve compatibility with existing Codex app-server backends unless a change is intentionally versioned.
- Keep schema-driven config behavior generic enough to handle unknown or forward-compatible fields.
- Add or update focused tests when runtime behavior, transport behavior, or UI state coordination changes.
- Run `pnpm typecheck`, `pnpm test`, and `pnpm build` before proposing a change.
- If you touch protocol-facing metadata, also run `pnpm protocol:manifest:check`.

**Compatibility Goals**

- Remain compatible with Codex app-server workflows and the surrounding Codex / OpenAI ecosystem at the protocol level
- Avoid backend-specific UI assumptions that would break existing app-server integrations
- Preserve approval handling, config schema fallback behavior, and transport semantics where possible
- Improve presentation and operator ergonomics without rebranding the project as an official vendor product

**License**

This project is available under the MIT License. See [`LICENSE`](./LICENSE).
