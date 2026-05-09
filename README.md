# codex-app-server-web

`codex-app-server-web` is an independent, open-source web interface for Codex app-server workflows. It provides a browser-based control center for working with threads, chat, terminal sessions, files, configuration, approvals, MCP visibility, and runtime diagnostics while staying compatible with existing app-server backends.

This project is independent and community-maintained. It is not affiliated with, endorsed by, or maintained by OpenAI.

**Overview**

The goal of this repository is to make Codex app-server workflows easier to inspect and operate from the browser without changing the backend protocol. It is designed for developer-facing use cases where you want a practical UI for session management, approvals, diagnostics, and workspace interaction, while keeping protocol compatibility and schema-driven behavior intact.

The personal GitHub repository is the source repository:
`https://github.com/oaslananka/codex-app-server-web`.
The organization repository is the CI/CD and release authority:
`https://github.com/oaslananka-lab/codex-app-server-web`.
Both repositories should carry the same content refs, while GitHub Actions run
from the organization mirror.

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
- Node.js 24 LTS for local development, CI, and release automation

**Project Structure**

- [`app/`](./app): Next.js app shell, layout, and entry routes
- [`src/components/`](./src/components): Codex control center UI, overlays, panels, and shared UI primitives
- [`src/lib/`](./src/lib): Runtime, transport, protocol-facing logic, and supporting utilities
- [`src/styles/`](./src/styles): Control center styling, responsive behavior, and overlay/panel presentation
- [`scripts/`](./scripts): Manifest generation, smoke tooling, vendor sync, and local backend helpers
- [`tests/unit/`](./tests/unit): Unit coverage for runtime behavior, protocol handling, overlays, and panel utilities
- [`.github/workflows/ci.yml`](./.github/workflows/ci.yml): Organization CI/CD and release-authority validation workflow
- [`azure-pipelines.yml`](./azure-pipelines.yml): Secondary Azure validation pipeline
- [`TECH_DEBT.md`](./TECH_DEBT.md): Explicitly accepted debt and known boundaries

**Local Development**

Install dependencies and start the app with a local Codex backend:

```bash
corepack enable
corepack prepare pnpm@11.0.9 --activate
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

By default the UI binds to `127.0.0.1`, the Codex backend target is
`ws://127.0.0.1:40000`, and browser WebSocket/API access requires the local
HttpOnly SameSite cookie created by the UI server. Non-browser local clients can
set `CODEX_UI_TOKEN` and send `Authorization: Bearer <token>`.

LAN exposure is opt-in. To expose the UI beyond loopback, set `UI_HOST`,
`ALLOWED_HOSTS`, `ALLOWED_ORIGINS`, and `CODEX_UI_TOKEN` explicitly for the LAN
address. `SHOW_LAN_URLS=1` only controls display of LAN URLs; it does not grant
access.

**Useful Commands**

```bash
pnpm dev
pnpm start
pnpm start:prod
pnpm start:mock-codex
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
pnpm lint
pnpm protocol:manifest:check
pnpm protocol:drift:check
pnpm repo:hygiene:check
pnpm security:scan
pnpm release:state
pnpm smoke
```

**CI/CD and Repository Mirror**

- The personal repository at `oaslananka/codex-app-server-web` is the source/original content repository.
- The organization repository at `oaslananka-lab/codex-app-server-web` is kept in sync and is the GitHub Actions CI/CD, release, and security-gate authority.
- Branches, tags, releases, and active PR state should be mirrored between the personal and organization repositories when repository automation changes are made.
- Azure remains supported through [`azure-pipelines.yml`](./azure-pipelines.yml) only as a secondary validation path; it must not publish, release, or mirror over either GitHub repository in this topology.
- The mirror procedure is documented in [`docs/automation/repository-mirror.md`](./docs/automation/repository-mirror.md).
- Protocol metadata can be validated locally with `pnpm protocol:manifest:check` before opening a change.
- Protocol drift is gated with `pnpm protocol:drift:check`; upstream artifact sync is documented in [`docs/automation/upstream-codex-sync.md`](./docs/automation/upstream-codex-sync.md).
- Dependency updates are grouped by Dependabot for npm and GitHub Actions through [`.github/dependabot.yml`](./.github/dependabot.yml).
- GitHub Release is the first guarded release target and is managed by
  release-please from the organization repository. Release assets include the
  package tarball, CycloneDX SBOM, SHA256 checksums, and GitHub artifact
  attestations. The release flow is documented in [`docs/RELEASE.md`](./docs/RELEASE.md).

**Local Security Model**

- UI and backend defaults are loopback-only.
- `/api/health` is unauthenticated and intentionally returns only a basic status.
- `/api/config`, `/api/uploads`, and `/ws` require local auth.
- WebSocket upgrades enforce exact `/ws` path matching, Host allowlisting, Origin
  allowlisting, local token authentication, JSON-RPC shape validation, message
  size limits, and buffered byte limits.
- Uploads are limited to common raster image formats. SVG uploads are disabled
  by default.
- Production CSP keeps `object-src`, `base-uri`, and `frame-ancestors` locked
  down and limits `connect-src` to the local UI origins.

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
