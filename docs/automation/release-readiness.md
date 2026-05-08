# Release Readiness

This repository is an app/control-plane project. It must not publish to npm,
PyPI, DockerHub, GHCR, a marketplace, or any other registry unless a repository
owner explicitly adds that release surface and the CI release-state check detects
it.

Run the release-state check before any publish attempt:

```bash
pnpm release:state
```

The check is intentionally blocking when no configured production publish target
exists. A safe production path should be added as an explicit guarded CI or Azure
release stage before publishing, with:

- validation gates that already passed from clean source,
- least-privilege credentials stored in the CI provider,
- release artifact checksums and SBOM output where artifacts are produced,
- provenance or artifact attestations where the platform supports them,
- a post-publish smoke target that can be verified without exposing secrets.

Until that release surface exists, the correct publish result is:

```text
no configured publish target
```
