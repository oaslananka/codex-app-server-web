# Changelog

## [1.1.0](https://github.com/oaslananka-lab/codex-app-server-web/compare/codex-app-server-web-v1.0.0...codex-app-server-web-v1.1.0) (2026-05-09)


### Features

* add JSON schemas for McpServerStatusUpdatedNotification, ThreadRealtimeTranscriptUpdatedNotification, ThreadShellCommandParams, and ThreadShellCommandResponse ([6cd64ac](https://github.com/oaslananka-lab/codex-app-server-web/commit/6cd64ac2fc5ab9fd6bcb5bf58ebe00690306f740))
* add new request and notification methods to official manifest ([6f3259a](https://github.com/oaslananka-lab/codex-app-server-web/commit/6f3259a6138729fa5fe848b2a026dbb5cbafeb4f))
* enhance error handling and add apps availability hint utility ([47443bb](https://github.com/oaslananka-lab/codex-app-server-web/commit/47443bbe7558e1a62ae00a0bcb5a2f6909e1ec64))
* enhance file and thread services with improved path resolution and error handling ([748e2e5](https://github.com/oaslananka-lab/codex-app-server-web/commit/748e2e5d13a4a27085982817be129d6020bfb38d))
* enhance JSON schemas with threadId, model, and modelProvider fields ([6d31219](https://github.com/oaslananka-lab/codex-app-server-web/commit/6d312196036210f47aa0f1e318611eacc489f5bd))
* generate TypeScript types for AgentPath, FuzzyFileSearchMatchType, CommandExecutionSource, ExperimentalFeatureEnablementSetParams, ExperimentalFeatureEnablementSetResponse, FsChangedNotification, FsUnwatchParams, FsUnwatchResponse, FsWatchParams, FsWatchResponse, HookPromptFragment, MarketplaceLoadErrorInfo, McpServerStartupState, McpServerStatusUpdatedNotification, NetworkDomainPermission, NetworkUnixSocketPermission, NonSteerableTurnKind, ThreadRealtimeTranscriptUpdatedNotification, ThreadShellCommandParams, and ThreadShellCommandResponse ([6cd64ac](https://github.com/oaslananka-lab/codex-app-server-web/commit/6cd64ac2fc5ab9fd6bcb5bf58ebe00690306f740))
* implement lazy loading for apps with enhanced error handling and loading states ([032d304](https://github.com/oaslananka-lab/codex-app-server-web/commit/032d304bc3c40cb4f67924193896d2796392763b))


### Bug Fixes

* address codeql security findings ([a7969f0](https://github.com/oaslananka-lab/codex-app-server-web/commit/a7969f083dd45d40f79e63f3d096f517267281d1))
* adjust overlays component to support toast dismissal ([6d31219](https://github.com/oaslananka-lab/codex-app-server-web/commit/6d312196036210f47aa0f1e318611eacc489f5bd))
* make upstream schema sync deterministic ([f1f3b04](https://github.com/oaslananka-lab/codex-app-server-web/commit/f1f3b04cdb34bed0eafdb75f36719e32132d9e34))
* modify modal component to handle open state correctly ([6d31219](https://github.com/oaslananka-lab/codex-app-server-web/commit/6d312196036210f47aa0f1e318611eacc489f5bd))
* preserve new threads before first user message ([7662afc](https://github.com/oaslananka-lab/codex-app-server-web/commit/7662afc1f7bb61e3393fbb7c76f0ebb318e94b04))
* preserve thread state before first user message ([63c3fed](https://github.com/oaslananka-lab/codex-app-server-web/commit/63c3fede8dbfc897635687a7449b41f4d71bd5b4))
* sanitize browser log console output ([69cce00](https://github.com/oaslananka-lab/codex-app-server-web/commit/69cce00933421a8bb0d4e9faf03c8651ab0332f1))
* **security:** pin patched transitive dependencies ([0a5b76f](https://github.com/oaslananka-lab/codex-app-server-web/commit/0a5b76f379130a43740c47c23fec3851e1ae64c7))
* **server:** set local auth cookie on rendered pages ([75e0026](https://github.com/oaslananka-lab/codex-app-server-web/commit/75e00269b1ba50dde91b0ac60982ae89f7ea1734))
* stabilize upstream sync validation ([a6a95d3](https://github.com/oaslananka-lab/codex-app-server-web/commit/a6a95d3ff1c998e8186a82277f96afd6301f20b5))
* standardize checkout step parameters in azure-pipelines.yml ([4992f76](https://github.com/oaslananka-lab/codex-app-server-web/commit/4992f76b890d5c400ef339a04e016691a4096f38))
* update endpoint for githubMirror repository in azure-pipelines.yml ([b931f28](https://github.com/oaslananka-lab/codex-app-server-web/commit/b931f280e3b0827e2c0690ee0b74d4701b8f9a25))
* update githubMirror endpoint in azure-pipelines.yml ([8fe660a](https://github.com/oaslananka-lab/codex-app-server-web/commit/8fe660a96ee84e069f20c3a3e65cc0c9e6542063))
* update import path for routes types in next-env.d.ts ([89a05a7](https://github.com/oaslananka-lab/codex-app-server-web/commit/89a05a78883f5d6f2545582cef9ac679602f6d96))
* update websocket client to improve reconnection logic with exponential backoff ([6d31219](https://github.com/oaslananka-lab/codex-app-server-web/commit/6d312196036210f47aa0f1e318611eacc489f5bd))
