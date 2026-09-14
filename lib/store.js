/** Streamed local storage. The adapter supplies the authoritative live Session cwd. */
import * as fs from 'node:fs/promises';
import { constants, createReadStream } from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { AttachError, assert, validatePlan } from './policy.js';
const OWNER = 'better-attach/v2';
const uuid = s => typeof s === 'string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(s);
const hash = s => createHash('sha256').update(s).digest('hex');
async function atomicJSON(file, data) {
  const temp = file + '.' + randomUUID() + '.tmp';
  try { await fs.writeFile(temp, JSON.stringify(data, null, 2), { flag: 'wx', mode: 0o600 }); await fs.rename(temp, file); }
  finally { await fs.rm(temp, { force: true }).catch(() => {}); }
}
/** Protect every existing descendant, not just the final filename, against symlink substitution. */
export async function safeDirectory(root, relative, create = true) {
  let current = await fs.realpath(root);
  assert(current === path.resolve(root) && !(await fs.lstat(root)).isSymbolicLink(), 'symlink', 'Storage root identity changed', 409);
  for (const p of relative.split(path.sep).filter(Boolean)) {
    assert(p !== '.' && p !== '..', 'unsafe-directory', 'Invalid storage directory');
    current = path.join(current, p);
    if (create) await fs.mkdir(current, { mode: 0o700 }).catch(e => { if (e.code !== 'EEXIST') throw e; });
    const stat = await fs.lstat(current);
    assert(stat.isDirectory() && !stat.isSymbolicLink(), 'symlink', 'Storage contains a symlink or non-directory', 409);
  }
  return current;
}
export class AttachmentStore {
  constructor({ stateRoot, workspaceRoot, resolveSession, registerWorkspace, maxActive = 16, maxReservedBytes = 4 * 1024 ** 3, ttl = 86400000 }) {
    Object.assign(this, { stateRoot: path.resolve(stateRoot), workspaceRoot: path.resolve(workspaceRoot), resolveSession, registerWorkspace, maxActive, maxReservedBytes, ttl });
    this.cache = new Map(); this.locks = new Map(); this.writes = new Map(); this.sealing = new Set(); this.ready = this.init();
  }
  async init() {
    for (const dir of [this.stateRoot, this.workspaceRoot]) {
      await fs.mkdir(dir, { recursive: true, mode: 0o700 });
      assert(!(await fs.lstat(dir)).isSymbolicLink(), 'symlink', 'Storage root must not be a symlink');
    }
    this.stateRoot = await fs.realpath(this.stateRoot); this.workspaceRoot = await fs.realpath(this.workspaceRoot);
  }
  lock(key, task) {
    const prev = this.locks.get(key) ?? Promise.resolve();
    const next = prev.catch(() => {}).then(task); this.locks.set(key, next);
    void next.finally(() => { if (this.locks.get(key) === next) this.locks.delete(key); }).catch(() => {});
    return next;
  }
  async persist(b) {
    return this.lock('meta:' + b.id, () => atomicJSON(path.join(this.stateRoot, b.id + '.json'), b));
  }
  async get(id, sessionId) {
    await this.ready; assert(uuid(id), 'batch-id', 'Invalid batch identity');
    let b = this.cache.get(id);
    if (!b) {
      try { b = JSON.parse(await fs.readFile(path.join(this.stateRoot, id + '.json'), 'utf8')); }
      catch (e) { if (e.code === 'ENOENT') throw new AttachError('not-found', 'Batch not found', 404); throw e; }
      assert(b.owner === OWNER && b.id === id, 'ownership', 'Foreign metadata', 409);
      this.cache.set(id, b);
    }
    assert(b.sessionId === sessionId, 'session-mismatch', 'Attachment belongs to a different session', 403);
    return b;
  }
  async sessionRoot(id) {
    assert(typeof id === 'string' && id.length > 0 && id.length < 200, 'session-id', 'A live session is required');
    if (id === '@workspace-import') { await this.ready; return this.workspaceRoot; }
    const cwd = await this.resolveSession(id);
    assert(typeof cwd === 'string' && path.isAbsolute(cwd), 'session-unavailable', 'Live session has no absolute workspace directory', 409);
    return fs.realpath(cwd);
  }
  async registerExisting(cwd) {
    assert(typeof cwd === 'string' && path.isAbsolute(cwd), 'absolute-path', 'Enter an absolute directory path on the DSH host');
    assert(typeof this.registerWorkspace === 'function', 'workspace-unavailable', 'Host has no workspace registration API', 409);
    const resolved = await fs.realpath(cwd);
    assert((await fs.stat(resolved)).isDirectory(), 'not-directory', 'Workspace must be a directory');
    const value = await this.registerWorkspace(resolved);
    assert(value?.workspace?.workspaceId, 'workspace-contract', 'Host did not return a workspace identity', 502);
    return value;
  }
  async create(request) {
    await this.ready;
    const { id, sessionId, target = 'conversation' } = request;
    assert(uuid(id), 'batch-id', 'Client request id must be a UUID');
    assert(['conversation', 'workspace'].includes(target), 'target', 'Unknown drop destination');
    assert((target === 'workspace') === (sessionId === '@workspace-import'), 'workspace-scope', 'Workspace imports require the dedicated sidebar scope', 403);
    const plan = validatePlan(request), cwd = await this.sessionRoot(sessionId);
    if (target === 'workspace') {
      assert(typeof this.registerWorkspace === 'function', 'workspace-unavailable', 'Host has no workspace registration API', 409);
      const roots = new Set([...plan.files.map(f => f.path), ...plan.directories].map(p => p.split('/')[0]));
      assert(roots.size === 1 && plan.directories.includes([...roots][0]), 'workspace-folder', 'Drop exactly one folder to add one workspace');
    }
    const signature = hash(JSON.stringify({ plan, target, sessionId, cwd }));
    return this.lock('create', async () => {
      try { const existing = await this.get(id, sessionId); assert(existing.signature === signature, 'idempotency-conflict', 'Request id was already used for a different import', 409); assert(existing.status !== 'cancelled', 'cancelled', 'Cancelled imports require a new request id', 409); return this.status(existing); }
      catch (e) { if (e.code !== 'not-found') throw e; }
      await this.loadAll();
      const active = [...this.cache.values()].filter(b => ['staging', 'registering'].includes(b.status));
      assert(active.length < this.maxActive && active.reduce((s,b) => s + b.plan.bytes, 0) + plan.bytes <= this.maxReservedBytes, 'capacity', 'Too many pending imports; cancel or clean abandoned imports first', 429);
      const parent = target === 'conversation' ? await safeDirectory(cwd, '.dsh/tmp/attachments/better-attach-v2'.split('/').join(path.sep)) : await fs.realpath(this.workspaceRoot);
      const stage = path.join(parent, '.' + id + '.pending'), final = path.join(parent, id);
      await fs.mkdir(stage, { mode: 0o700 }); await fs.mkdir(path.join(stage, 'files'), { mode: 0o700 });
      const b = { owner: OWNER, id, sessionId, target, cwd, parent, stage, final, signature, plan, status: 'staging', received: {}, createdAt: Date.now(), updatedAt: Date.now() };
      this.cache.set(id, b);
      try { await this.persist(b); } catch (e) { this.cache.delete(id); await fs.rm(stage, { recursive: true, force: true }); throw e; }
      return this.status(b);
    });
  }
  status(b) { return { id: b.id, target: b.target, status: b.status, received: Object.keys(b.received).map(Number), receipt: b.receipt }; }
  async pinned(b) { assert(await this.sessionRoot(b.sessionId) === b.cwd, 'workspace-changed', 'Session workspace changed; reselect the attachment', 409); }
  async put(id, sessionId, index, stream) {
    const b = await this.get(id, sessionId);
    assert(b.status === 'staging', 'batch-state', 'Import no longer accepts bytes', 409);
    assert(Number.isInteger(index) && index >= 0 && index < b.plan.files.length, 'file-index', 'Unknown file index', 404);
    await this.pinned(b);
    assert(b.status === 'staging' && !this.sealing.has(id), 'batch-state', 'Import is being committed or cancelled', 409);
    const key = id + ':' + index;
    assert(!this.writes.has(key), 'upload-in-progress', 'This file is already uploading', 409);
    const ctrl = new AbortController();
    // Publish writer before the first filesystem await; commit/cancel sees it.
    const record = { ctrl, done: null }; this.writes.set(key, record);
    record.done = this.writeFile(b, index, stream, ctrl.signal).finally(() => this.writes.delete(key));
    return record.done;
  }
  async writeFile(b, index, stream, signal) {
    const meta = b.plan.files[index], base = await safeDirectory(b.parent, path.basename(b.stage) + path.sep + 'files', false);
    const parts = meta.path.split('/'), leaf = parts.pop();
    const parent = await safeDirectory(base, parts.join(path.sep));
    const temporary = path.join(parent, '.ba-' + randomUUID() + '.part'), file = path.join(parent, leaf);
    let handle, loaded = 0; const digest = createHash('sha256');
    const stop = () => stream.destroy?.(new AttachError('cancelled', 'Transfer cancelled', 409));
    signal.addEventListener('abort', stop, { once: true });
    try {
      signal.throwIfAborted();
      handle = await fs.open(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | (constants.O_NOFOLLOW ?? 0), 0o600);
      for await (const chunk of stream) {
        signal.throwIfAborted(); loaded += chunk.length;
        assert(loaded <= meta.size, 'length-mismatch', 'More bytes received than declared', 413);
        digest.update(chunk); await handle.writeFile(chunk);
      }
      assert(loaded === meta.size, 'length-mismatch', 'Incomplete file body', 400);
      const sha256 = digest.digest('hex');
      if (b.received[index]) { assert(b.received[index].sha256 === sha256, 'content-conflict', 'Retry content differs from the completed file', 409); return { index, ...b.received[index] }; }
      signal.throwIfAborted(); assert(b.status === 'staging', 'cancelled', 'Import cancelled', 409);
      await handle.sync(); await handle.close(); handle = null;
      // No overwrite even if another local process creates the destination.
      try { await fs.link(temporary, file); }
      catch (e) {
        if (e.code !== 'EEXIST') throw e;
        const h = await fs.open(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
        try {
          const st = await h.stat();
          assert(st.isFile() && st.nlink === 1 && st.size === loaded, 'content-conflict', 'An unrelated destination exists', 409);
          const actual = createHash('sha256'); for await (const chunk of h.createReadStream({ autoClose: false })) actual.update(chunk);
          assert(actual.digest('hex') === sha256, 'content-conflict', 'An unrelated destination exists', 409);
        } finally { await h.close(); }
      }
      await fs.unlink(temporary);
      b.received[index] = { size: loaded, sha256 }; b.updatedAt = Date.now();
      await this.persist(b); return { index, size: loaded, sha256 };
    } finally { signal.removeEventListener('abort', stop); await handle?.close().catch(() => {}); await fs.rm(temporary, { force: true }).catch(() => {}); }
  }
  async commit(id, sessionId) {
    return this.lock(id, async () => {
      const b = await this.get(id, sessionId);
      if (b.status === 'committed') return b.receipt;
      assert(['staging', 'registering'].includes(b.status), 'batch-state', 'Import cannot be committed', 409);
      assert(![...this.writes.keys()].some(k => k.startsWith(id + ':')), 'upload-in-progress', 'A file is still uploading', 409);
      this.sealing.add(id);
      try {
      await this.pinned(b);
      assert(Object.keys(b.received).length === b.plan.files.length, 'incomplete', 'Not all files have arrived', 409);
      if (b.status === 'staging') {
        const base = await safeDirectory(b.parent, path.basename(b.stage) + path.sep + 'files', false);
        for (const d of b.plan.directories) await safeDirectory(base, d.split('/').join(path.sep));
        const files = b.plan.files.map((f,i) => ({ ...f, ...b.received[i] }));
        const receipt = { id: b.id, sessionId: b.sessionId, target: b.target, root: path.join(b.final, 'files'), manifest: path.join(b.final, 'manifest.json'), files, directories: b.plan.directories, bytes: b.plan.bytes, committedAt: new Date().toISOString() };
        await atomicJSON(path.join(b.stage, 'manifest.json'), { owner: OWNER, ...receipt });
        // Record intended receipt before rename, so restart can reconcile a lost commit response.
        b.receipt = receipt; b.status = 'registering'; await this.persist(b);
      }
      // Reconcile after interruption between metadata write and atomic directory rename.
      try { await safeDirectory(b.parent, path.basename(b.stage), false); await fs.rename(b.stage, b.final); }
      catch (e) { if (e.code !== 'ENOENT') throw e; await safeDirectory(b.parent, path.basename(b.final), false); }
      if (b.target === 'workspace' && !b.receipt.workspace) {
        const root = b.plan.directories.find(d => !d.includes('/'));
        const importedPath = path.join(b.receipt.root, root);
        // Controller.create resolves existing registrations, making retry idempotent.
        const value = await this.registerWorkspace(importedPath);
        assert(value?.workspace?.workspaceId, 'workspace-contract', 'Host did not return a workspace identity', 502);
        b.receipt.workspace = value.workspace;
      }
      b.status = 'committed'; b.updatedAt = Date.now(); await this.persist(b); return b.receipt;
      } finally { this.sealing.delete(id); }
    });
  }
  async cancel(id, sessionId) {
    return this.lock(id, async () => {
      const b = await this.get(id, sessionId);
      assert(b.status !== 'committed' && b.status !== 'registering', 'already-committed', 'Committed files are retained; use explicit attachment cleanup', 409);
      b.status = 'cancelled';
      const writers = [...this.writes.entries()].filter(([k]) => k.startsWith(id + ':')).map(([,v]) => v);
      writers.forEach(w => w.ctrl.abort()); await Promise.allSettled(writers.map(w => w.done));
      await safeDirectory(b.parent, '', false); await fs.rm(b.stage, { recursive: true, force: true });
      await this.persist(b); return { cancelled: true };
    });
  }
  async loadAll() {
    await this.ready;
    for (const file of await fs.readdir(this.stateRoot)) {
      const id = file.replace(/\.json$/, ''); if (!uuid(id) || this.cache.has(id)) continue;
      const b = JSON.parse(await fs.readFile(path.join(this.stateRoot, file), 'utf8'));
      if (b.owner === OWNER && b.id === id) this.cache.set(id, b);
    }
  }
  async history(sessionId) {
    const cwd = await this.sessionRoot(sessionId); await this.loadAll();
    return [...this.cache.values()].filter(b => b.cwd === cwd && b.sessionId === sessionId && b.status === 'committed' && b.target === 'conversation').sort((a,b) => b.createdAt - a.createdAt).map(b => b.receipt);
  }
  async openFile(id, sessionId, index) {
    const b = await this.get(id, sessionId); await this.pinned(b);
    assert(b.status === 'committed', 'batch-state', 'File is not committed', 409);
    const f = b.receipt.files[index]; assert(f, 'file-index', 'Unknown file', 404);
    const parts = f.path.split('/'), leaf = parts.pop();
    const base = await safeDirectory(b.parent, path.basename(b.final) + path.sep + 'files', false);
    const parent = await safeDirectory(base, parts.join(path.sep), false);
    const handle = await fs.open(path.join(parent, leaf), constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    const st = await handle.stat();
    if (!st.isFile() || st.nlink > 1) { await handle.close(); throw new AttachError('unsafe-file', 'Not a private regular file', 409); }
    return { handle, meta: f };
  }
  async cleanSession(sessionId, confirm) {
    assert(confirm === 'DELETE ATTACHMENTS', 'confirmation', 'Explicit cleanup confirmation required');
    const cwd = await this.sessionRoot(sessionId); await this.loadAll(); let files = 0, bytes = 0;
    for (const b of this.cache.values()) {
      if (b.sessionId !== sessionId || b.target !== 'conversation' || b.cwd !== cwd || b.status !== 'committed') continue;
      await this.lock(b.id, async () => {
        await safeDirectory(b.parent, path.basename(b.final), false);
        await fs.rm(b.final, { recursive: true }); files += b.plan.files.length; bytes += b.plan.bytes;
        b.status = 'deleted'; await this.persist(b);
      });
    }
    return { files, bytes };
  }
  async cleanAbandoned(now = Date.now()) {
    await this.loadAll(); let count = 0;
    for (const b of this.cache.values()) if (b.status === 'staging' && now - b.updatedAt > this.ttl && ![...this.writes.keys()].some(k => k.startsWith(b.id + ':'))) { await this.cancel(b.id, b.sessionId); count++; }
    return { count };
  }
}
