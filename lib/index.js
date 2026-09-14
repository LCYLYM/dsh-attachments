/** Cordis host plugin. Public contracts checked against upstream master on 2026-09-14. */
import path from 'node:path';
import os from 'node:os';
import { AttachmentStore } from './store.js';
import { createHandler, API } from './http.js';
import { assert } from './policy.js';
export const name = 'community-multimedia-webui-input';
export const inject = ['webServer', 'sessions'];
export function apply(ctx, config = {}) {
  const web = ctx.get('webServer'), sessions = ctx.get('sessions');
  assert(typeof web?.register === 'function' && typeof sessions?.get === 'function', 'host-contract', 'Better Attach requires webServer.register and sessions.get');
  const root = path.resolve(config.storageRoot ?? path.join(process.env.DSH_HOME || path.join(os.homedir(), '.dsh'), 'better-attach'));
  const store = new AttachmentStore({
    stateRoot: path.join(root, 'records'), workspaceRoot: path.join(root, 'workspaces'),
    resolveSession: async id => {
      const s = sessions.get(id) ?? await ctx.get('sessionController')?.inspect(id);
      assert(s?.header?.origin !== 'subagent', 'subagent-readonly', 'Attachments to subagents are not supported by this candidate', 409);
      return s?.header?.cwd;
    },
  });
  // Resolve lazily: the optional workspace service can mount/unmount after this plugin.
  Object.defineProperty(store, 'registerWorkspace', { configurable: true, get() {
    const controller = ctx.get('workspaceController');
    return typeof controller?.create === 'function' ? cwd => controller.create({ path: cwd }) : undefined;
  } });
  ctx.effect(() => web.register({ kind: 'prefix', path: API, handler: createHandler(store) }), 'better-attach: HTTP route');
  ctx.effect(() => {
    // Pending-only cleanup; committed imports/workspaces never auto-delete.
    const timer = setInterval(() => store.cleanAbandoned().catch(e => console.error('[better-attach:cleanup]', e)), 60 * 60 * 1000); timer.unref?.();
    return () => clearInterval(timer);
  }, 'better-attach: stale pending cleanup');
  return store;
}
export default { name, inject, apply };
