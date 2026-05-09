# Release Readiness

This repository is an app/control-plane project. Its first configured production
release target is GitHub Release from the organization repository. It must not
publish to npm, PyPI, DockerHub, GHCR, a marketplace, or any other registry
unless a repository owner explicitly adds that release surface and the CI
release-state check detects it.

Release, deployment, provenance, SBOM, Codecov, registry submission, and
security-gate side effects must run only from the organization repository:

```text
https://github.com/oaslananka-lab/codex-app-server-web
```

Run the release-state check before any publish attempt:

```bash
pnpm release:state
```

The safe production path is the guarded release job in the organization GitHub
Actions repository. It must publish only after release-please creates a release
and must include:

- validation gates that already passed from clean source,
- least-privilege credentials stored in the CI provider,
- release artifact checksums and SBOM output where artifacts are produced,
- provenance or artifact attestations where the platform supports them.

The release flow is documented in [`../RELEASE.md`](../RELEASE.md).
