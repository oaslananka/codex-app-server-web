# Repository Mirror

The source repository is:

```text
https://github.com/oaslananka/codex-app-server-web
```

The organization CI/CD mirror is:

```text
https://github.com/oaslananka-lab/codex-app-server-web
```

The personal repository remains the source of truth for content ownership. The
organization repository exists so GitHub Actions CI/CD can run from the
organization account while carrying the same repository content.

## Required Sync Shape

- Keep `main` aligned between personal and organization repositories.
- Keep active work branches aligned between personal and organization
  repositories.
- Push tags to both repositories.
- Create matching active PRs in both repositories when CI must run from the
  organization repository.
- Do not keep superseded bot PRs or stale branches open after the replacement
  branch already includes their content.

## Local Remote Setup

```bash
git remote add personal https://github.com/oaslananka/codex-app-server-web.git
git remote add org https://github.com/oaslananka-lab/codex-app-server-web.git
```

If `origin` already points to the personal repository, keep it as the source
remote and add only `org`.

## Sync Commands

```bash
git fetch origin --prune --tags
git push org main
git push org automation/upstream-sync-and-release-readiness
git push org --tags
```

Open a draft PR in the organization repository for the same branch and title as
the personal PR, then run the organization workflow:

```bash
gh workflow run "Org CI Validation" \
  --repo oaslananka-lab/codex-app-server-web \
  --ref automation/upstream-sync-and-release-readiness
```

If GitHub Actions, Snyk, or another external check is blocked by account,
billing, quota, or organization policy, record the exact run URL or status URL
and do not publish from a local machine.
