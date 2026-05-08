#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

const packageJson = readJson('package.json');
const workflowsDir = path.join(repoRoot, '.github', 'workflows');
const workflowFiles = fs.existsSync(workflowsDir)
  ? fs.readdirSync(workflowsDir).filter((file) => /\.(ya?ml)$/.test(file))
  : [];
const workflowText = workflowFiles
  .map((file) => fs.readFileSync(path.join(workflowsDir, file), 'utf8'))
  .join('\n');
const azureText = exists('azure-pipelines.yml')
  ? fs.readFileSync(path.join(repoRoot, 'azure-pipelines.yml'), 'utf8')
  : '';

const releaseSurfaces = {
  githubRelease: /gh\s+release|softprops\/action-gh-release|actions\/attest|release-please/i.test(
    workflowText,
  ),
  azureReleaseStage: /stage:\s*release|deployment:|environment:/i.test(azureText),
  npmPackage:
    Boolean(packageJson.publishConfig) ||
    Object.keys(packageJson.scripts ?? {}).some((script) => /(^|:)publish($|:)/.test(script)),
  containerImage: exists('Dockerfile') || /ghcr\.io|docker\/build-push-action/i.test(workflowText),
  staticDeployment: /pages|vercel|netlify|azure static web apps/i.test(workflowText + azureText),
};

const configuredTargets = Object.entries(releaseSurfaces)
  .filter(([, enabled]) => enabled)
  .map(([name]) => name);

const result = {
  packageName: packageJson.name,
  packageVersion: packageJson.version,
  releaseSurfaces,
  configuredTargets,
  publishReady: configuredTargets.length > 0,
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

if (configuredTargets.length === 0) {
  process.stderr.write('No configured publish target was detected.\n');
  process.exit(2);
}
