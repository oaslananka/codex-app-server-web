# Repository Mirror

The canonical source, CI/CD, and release authority is:

```text
https://github.com/oaslananka-lab/codex-app-server-web
```

The optional personal showcase mirror is:

```text
https://github.com/oaslananka/codex-app-server-web
```

The organization repository owns GitHub Actions CI/CD, release, deployment,
provenance, SBOM, registry submission, and security gates. The personal
repository is a showcase mirror only and must not publish.

## Required Sync Shape

- Keep `main` aligned between the organization repository and the personal
  mirror when a personal mirror exists.
- Push release tags to both repositories.
- Keep personal mirror release refs advisory; GitHub Release assets are created
  by the organization repository.
- Open PRs only in the organization repository unless a separate showcase review
  is intentionally needed.
- Do not keep superseded automation PRs or stale branches open after the
  replacement branch already includes their content.
- Remove stale automated suggestion comments from PRs, or minimize submitted
  review timeline items that cannot be deleted.
- Do not run release, deployment, provenance, SBOM, Codecov, registry
  submission, or security-gate side effects from the personal repository.

## Local Remote Setup

```bash
git remote add personal https://github.com/oaslananka/codex-app-server-web.git
git remote add org https://github.com/oaslananka-lab/codex-app-server-web.git
```

If `origin` points to the organization repository, keep it as the canonical
remote and add `personal` only when the showcase mirror is used.

## Sync Commands

```bash
git fetch personal --prune --tags
git fetch org --prune --tags
git push personal refs/remotes/org/main:refs/heads/main
git push personal --tags
```

Open a draft PR in the organization repository and run the organization
workflow:

```bash
gh workflow run "Org CI Validation" \
  --repo oaslananka-lab/codex-app-server-web \
  --ref automation/upstream-sync-and-release-readiness
```

If GitHub Actions, Codecov, Socket, GitGuardian, Snyk, or another external check
is blocked by account, billing, quota, or organization policy, record the exact
run URL or status URL and do not publish from a local machine.

Azure may remain configured as a secondary validation pipeline, but it is not
the canonical CI/CD, release, deployment, or mirror authority for this topology.
