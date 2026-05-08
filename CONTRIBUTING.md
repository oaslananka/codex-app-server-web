# Contributing

Thanks for helping improve `codex-app-server-web`.

## Local Setup

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install --frozen-lockfile
```

Use the repo-declared package manager. Do not add npm, Yarn, or Bun lockfiles.

## Validation

Run the relevant focused check while editing, then the full local gate before review:

```bash
pnpm format:check
pnpm repo:hygiene:check
pnpm protocol:manifest:check
pnpm protocol:drift:check
pnpm typecheck
pnpm test
pnpm build
```

If you touch protocol artifacts, regenerate them with `pnpm protocol:sync:upstream` and include the drift summary in the PR.

## Pull Requests

- Keep changes focused and reproducible.
- Do not commit private prompts, transcripts, scratch files, `.env` files, generated logs, or local build junk.
- Do not weaken approval, file, terminal, auth, CSP, rate-limit, or WebSocket safety defaults.
- Do not disable tests to make CI pass.
