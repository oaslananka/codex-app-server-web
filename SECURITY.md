# Security Policy

## Supported Surface

Security fixes are accepted for the default branch and the latest released source state. This project is an independent Codex app-server web control center and is not an official OpenAI product.

## Reporting

Do not open public issues containing secrets, tokens, private prompts, logs with credentials, or exploit details. Report sensitive findings privately to the repository owner through GitHub security advisories when available, or by a private contact channel listed on the repository profile.

## Expectations

- Do not place OpenAI API keys, ChatGPT tokens, refresh tokens, SSH keys, PATs, registry tokens, Azure service connection credentials, or GitHub App keys in issues, PRs, logs, screenshots, or fixtures.
- Keep terminal execution, file operations, approval handling, auth, MCP, plugin, and workspace behavior protocol-compatible.
- Keep LAN/dev exposure opt-in and documented.
- Run `pnpm repo:hygiene:check`, `pnpm protocol:manifest:check`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before requesting review.
