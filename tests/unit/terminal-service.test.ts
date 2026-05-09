import { describe, expect, it } from 'vitest';
import { buildShellCommand } from '../../src/lib/codex-runtime/services/terminal-service';

describe('buildShellCommand', () => {
  it('uses PowerShell on Windows', () => {
    expect(buildShellCommand('Get-Location', 'win32')).toEqual([
      'powershell.exe',
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      'Get-Location',
    ]);
  });

  it('uses bash login-compatible command execution on Unix platforms', () => {
    expect(buildShellCommand('pwd', 'linux')).toEqual(['bash', '-lc', 'pwd']);
    expect(buildShellCommand('pwd', 'darwin')).toEqual(['bash', '-lc', 'pwd']);
    expect(buildShellCommand('pwd', 'unknown')).toEqual(['bash', '-lc', 'pwd']);
  });
});
