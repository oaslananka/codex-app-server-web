# Repository Mirror

The source repository is:

```text
https://github.com/oaslananka/codex-app-server-web
```

The organization CI/CD and release authority is:

```text
https://github.com/oaslananka-lab/codex-app-server-web
```

The personal repository remains the source/original content repository. The
organization repository exists so GitHub Actions CI/CD, release, deployment,
provenance, SBOM, Codecov, registry submission, and security gates can run from
the organization account while carrying the same repository content.

## Required Sync Shape

- Keep `main` aligned between personal and organization repositories.
- Keep active work branches aligned between personal and organization
  repositories.
- Push tags to both repositories.
- Keep releases aligned after the organization release authority creates or
  updates a release.
- Create matching active PRs in both repositories when CI must run from the
  organization repository.
- Do not keep superseded bot PRs or stale branches open after the replacement
  branch already includes their content.
- Remove stale bot or agent suggestion comments from PRs, or minimize submitted
  review timeline items that cannot be deleted.
- Do not run release, deployment, provenance, SBOM, Codecov, registry
  submission, or security-gate side effects from the personal repository.

## Local Remote Setup

```bash
git remote add personal https://github.com/oaslananka/codex-app-server-web.git
git remote add org https://github.com/oaslananka-lab/codex-app-server-web.git
```

If `origin` already points to the personal repository, keep it as the source
remote and add only `org`.

## Sync Commands

```bash
git fetch personal --prune --tags
git fetch org --prune --tags
git push org refs/remotes/personal/main:refs/heads/main
git push org --tags
```

Open a draft PR in the organization repository for the same branch and title as
the personal PR, then run the organization workflow:

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
