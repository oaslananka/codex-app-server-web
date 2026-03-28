'use client';

import { useEffect, useRef } from 'react';
import { useControlCenterActions, useControlCenterState } from '../ControlCenterContext';

export function TerminalPanel() {
  const state = useControlCenterState();
  const actions = useControlCenterActions();
  const outputRef = useRef<HTMLDivElement | null>(null);
  const isRunning = state.terminal.terminalRunning;
  const hasOutput = state.terminal.terminalOutput.length > 0;

  useEffect(() => {
    const node = outputRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [state.terminal.terminalOutput]);

  return (
    <div
      className={`panel${state.shell.activeTab === 'terminal' ? ' active' : ''}`}
      id="panel-terminal"
    >
      <div id="terminal-panel">
        <div className="term-toolbar">
          <div className="term-command-group">
            <div className="term-field-label">Run command</div>
            <input
              type="text"
              id="term-cmd"
              name="term-cmd"
              placeholder="Start a new shell command in the active workspace"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={state.terminal.terminalCommand}
              onChange={(event) => actions.terminal.setCommand(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void actions.terminal.run();
                }
              }}
            />
          </div>

          <div className="term-toolbar-side">
            <div className="term-meta-group">
              <div className="term-field-label">Directory</div>
              <input
                type="text"
                id="term-cwd"
                name="term-cwd"
                placeholder="Working directory"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={state.terminal.terminalCwd}
                onChange={(event) => actions.terminal.setCwd(event.target.value)}
              />
            </div>

            <div className="term-size-pills" aria-label="Terminal size">
              <label className="term-size-pill">
                <span>Cols</span>
                <input
                  type="number"
                  min={40}
                  max={300}
                  value={state.terminal.terminalSize.cols}
                  onChange={(event) =>
                    actions.terminal.setSize(
                      Number(event.target.value || 120),
                      state.terminal.terminalSize.rows,
                    )
                  }
                />
              </label>
              <label className="term-size-pill">
                <span>Rows</span>
                <input
                  type="number"
                  min={10}
                  max={120}
                  value={state.terminal.terminalSize.rows}
                  onChange={(event) =>
                    actions.terminal.setSize(
                      state.terminal.terminalSize.cols,
                      Number(event.target.value || 32),
                    )
                  }
                />
              </label>
            </div>

            <div className="term-action-group">
              <button
                type="button"
                className="btn-term btn-run"
                id="btn-term-run"
                onClick={() => actions.terminal.run()}
                disabled={isRunning}
              >
                ▶ Run
              </button>
              <button
                type="button"
                className="btn-term btn-kill"
                id="btn-term-kill"
                disabled={!isRunning}
                onClick={() => actions.terminal.stop()}
              >
                ■ Kill
              </button>
            </div>
          </div>
        </div>

        <div className="term-output-card">
          <div className="term-output-header">
            <div className="term-output-title">Output</div>
            <div className="term-output-meta">
              <span className={`term-state-badge${isRunning ? ' running' : ''}`}>
                {isRunning ? 'Running' : 'Idle'}
              </span>
              <span className="term-output-count">
                {hasOutput ? `${state.terminal.terminalOutput.length} lines` : 'No output yet'}
              </span>
            </div>
          </div>

          <div id="term-output" ref={outputRef}>
            {hasOutput ? (
              state.terminal.terminalOutput.map((line) => (
                <div key={line.id} className={`term-line-${line.channel}`}>
                  {line.text}
                </div>
              ))
            ) : (
              <div className="terminal-empty-state">
                Run a command to stream stdout, stderr, and exit status here.
              </div>
            )}
          </div>
        </div>

        <div className="term-stdin">
          <div className="term-stdin-copy">
            <div className="term-stdin-label">Process input</div>
            <div className="term-stdin-help">
              Send text to the running command after it starts.
            </div>
          </div>
          <input
            type="text"
            id="term-stdin-input"
            name="term-stdin-input"
            placeholder={isRunning ? 'Type input for the running command' : 'Start a command to enable process input'}
            disabled={!isRunning}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            value={state.terminal.terminalStdin}
            onChange={(event) => actions.terminal.setStdin(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void actions.terminal.write();
              }
            }}
          />
          <button
            type="button"
            className="btn-sm btn-primary"
            id="btn-term-write"
            disabled={!isRunning}
            onClick={() => actions.terminal.write()}
          >
            Send input
          </button>
        </div>
      </div>
    </div>
  );
}
