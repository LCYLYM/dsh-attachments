import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { randomUUID } from 'node:crypto';
import { access, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assert } from './policy.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Browser-owned drop, one native snapshot ticket, no public socket or persisted paths. */
export class NativeDropBridge {
  constructor() { this.state = 'starting'; this.child = null; this.active = null; this.disposed = false; }
  async start() {
    if (this.disposed) return;
    let command, args;
    if (process.platform === 'darwin') {
      command = path.join(root, 'native', 'bin', `drop-bridge-darwin-${process.arch}`); args = [];
      try { await access(command); } catch { this.state = 'missing-binary'; return; }
    } else if (process.platform === 'win32') {
      this.state = 'browser-host-integration-required'; return;
    } else { this.state = 'unsupported-platform'; return; }
    if (this.disposed) return;
    const child = this.child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    child.stdin.on('error', () => this.failed());
    // Runtime diagnostics never contain dragged paths or clipboard data.
    child.stderr.on('data', () => { this.lastDiagnostic = 'native-helper-error'; });
    child.once('error', () => this.failed()); child.once('exit', () => this.failed());
    const lines = createInterface({ input: child.stdout });
    lines.on('line', line => {
      if (line.length > 32768) { this.failed(); child.kill(); return; }
      let value; try { value = JSON.parse(line); } catch { this.failed(); child.kill(); return; }
      if (value.state === 'ready' && value.protocol === 2) { this.state = 'ready'; return; }
      const active = this.active;
      if (!active || value.id !== active.id || active.result) return;
      if (value.state === 'dropped' && typeof value.path === 'string' && path.isAbsolute(value.path) && !value.path.includes('\0')) {
        this.finish({ state: 'dropped', path: value.path });
      } else if (value.state === 'cancelled') this.finish({ state: 'cancelled' });
    });
    this.startTimer = setTimeout(() => { if (this.state === 'starting') { this.failed(); child.kill(); } }, 20000);
    this.startTimer.unref();
  }
  status() { return { available: this.state === 'ready', state: this.state, platform: process.platform }; }
  failed() { if (!this.disposed) this.state = 'unavailable'; this.finish({ state: 'unavailable' }); }
  send(value) { if (this.child?.stdin.writable) this.child.stdin.write(JSON.stringify(value) + '\n'); }
  arm() {
    assert(this.state === 'ready' && !this.disposed, 'native-unavailable', 'Native workspace drop is unavailable; choose the host directory', 503);
    assert(!this.active, 'native-busy', 'Another workspace drag is active', 409);
    const id = randomUUID();
    this.active = { id, result: null, waiting: null };
    this.expireTimer = setTimeout(() => this.cancel(id), 16000); this.expireTimer.unref();
    this.send({ op: 'arm', id });
    return { id };
  }
  resolve(id, name) {
    assert(this.active?.id === id, 'native-ticket', 'Workspace drag expired', 404);
    assert(typeof name === 'string' && name.length > 0 && name.length <= 1024 && !/[\0\/\\]/.test(name), 'native-name', 'Drop one named directory');
    assert(!this.active.resolving, 'native-ticket', 'Workspace drag already resolved', 409);
    this.active.resolving = true;
    this.send({ op: 'resolve', id, name });
  }
  finish(result) {
    const active = this.active; if (!active || active.result) return;
    clearTimeout(this.expireTimer); active.result = result;
    active.waiting?.(result);
    // An abandoned tab must not retain paths or block other tabs indefinitely.
    this.retentionTimer = setTimeout(() => { if (this.active === active) this.active = null; }, 5000);
    this.retentionTimer.unref();
  }
  cancel(id) {
    if (this.active?.id !== id) return;
    this.send({ op: 'cancel', id }); this.finish({ state: 'cancelled' });
    this.active = null; clearTimeout(this.retentionTimer);
  }
  async consume(id, signal) {
    const active = this.active;
    assert(active?.id === id, 'native-ticket', 'Workspace drag expired', 404);
    assert(!active.waiting, 'native-ticket', 'Workspace drag already has a consumer', 409);
    const cancel = () => this.cancel(id);
    signal?.addEventListener('abort', cancel, { once: true });
    try {
      if (signal?.aborted) { cancel(); return { state: 'cancelled' }; }
      const value = active.result ?? await new Promise(resolve => { active.waiting = resolve; });
      if (value.state === 'dropped') {
        assert((await stat(value.path)).isDirectory(), 'native-directory', 'Dropped directory is no longer available');
      }
      return value;
    } finally {
      signal?.removeEventListener('abort', cancel);
      if (this.active === active) this.active = null;
      clearTimeout(this.retentionTimer);
    }
  }
  dispose() {
    this.disposed = true; this.state = 'stopped';
    if (this.active) this.cancel(this.active.id);
    clearTimeout(this.startTimer); clearTimeout(this.expireTimer); clearTimeout(this.retentionTimer);
    this.child?.stdin.end(); this.child?.kill();
  }
}
