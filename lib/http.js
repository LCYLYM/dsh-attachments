import { pipeline } from 'node:stream/promises';
import { AttachError, assert, VERSION } from './policy.js';
export const API = '/community-multimedia-webui-input/v2';
const localAddress = ip => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip);
export function checkRequest(req) {
  assert(localAddress(req.socket?.remoteAddress), 'local-only', 'This candidate accepts loopback requests only. Remote authentication is not implicitly inherited from DSH.', 403);
  let host; try { host = new URL('http://' + req.headers.host); } catch { throw new AttachError('host', 'Invalid Host', 403); }
  assert(['localhost', '127.0.0.1', '[::1]'].includes(host.hostname), 'host', 'Only a loopback Host is allowed', 403);
  assert(req.headers['x-better-attach'] === '1', 'csrf', 'Missing same-origin request header', 403);
  const origin = req.headers.origin;
  if (origin) {
    let u; try { u = new URL(origin); } catch { throw new AttachError('origin', 'Invalid origin', 403); }
    assert(['http:', 'https:'].includes(u.protocol) && u.host === req.headers.host, 'origin', 'Cross-origin requests are not allowed', 403);
  }
  assert(!req.headers['sec-fetch-site'] || ['same-origin', 'none'].includes(req.headers['sec-fetch-site']), 'origin', 'Cross-site requests are not allowed', 403);
}
async function jsonBody(req) {
  let length = 0; const chunks = [];
  for await (const chunk of req) { length += chunk.length; assert(length <= 4 * 1024 ** 2, 'body-limit', 'Manifest exceeds 4 MiB', 413); chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); }
  catch { throw new AttachError('json', 'Invalid JSON'); }
}
export function reply(res, status, data) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(JSON.stringify(data));
}
export function createHandler(store) {
  return async (req, res) => {
    try {
      checkRequest(req);
      const url = new URL(req.url, 'http://local'), rest = url.pathname.slice(API.length);
      assert(url.pathname === API || url.pathname.startsWith(API + '/'), 'route', 'Unknown route', 404);
      const session = req.headers['x-ba-session'];
      if (req.method === 'GET' && rest === '/health') return reply(res, 200, { ok: true, version: VERSION, localOnly: true, workspaceRegistration: typeof store.registerWorkspace === 'function', liveVerification: 'not-attested' });
      if (req.method === 'GET' && rest === '/diagnostics') return reply(res, 200, { ok: true, cwd: await store.sessionRoot(session), workspaceRegistration: typeof store.registerWorkspace === 'function' });
      if (req.method === 'POST' && rest === '/workspaces/register') { assert(session === '@workspace-import', 'workspace-scope', 'Use the dedicated workspace scope', 403); return reply(res, 200, { ok: true, ...await store.registerExisting((await jsonBody(req)).path) }); }
      if (req.method === 'POST' && rest === '/batches') {
        const input = await jsonBody(req);
        assert(input.sessionId === session, 'session-mismatch', 'Session header and body differ', 403);
        return reply(res, 200, { ok: true, ...await store.create(input) });
      }
      if (req.method === 'GET' && rest === '/history') return reply(res, 200, { ok: true, receipts: await store.history(session) });
      if (req.method === 'POST' && rest === '/cleanup/session') return reply(res, 200, { ok: true, ...await store.cleanSession(session, (await jsonBody(req)).confirm) });
      if (req.method === 'POST' && rest === '/cleanup/abandoned') { await store.sessionRoot(session); return reply(res, 200, { ok: true, ...await store.cleanAbandoned() }); }
      const match = /^\/batches\/([a-f\d-]+)(?:\/(commit|files\/([0-9]+)))?$/.exec(rest);
      assert(match, 'route', 'Unknown route', 404);
      const [,id,op,index] = match;
      if (req.method === 'GET' && !op) return reply(res, 200, { ok: true, ...store.status(await store.get(id, session)) });
      if (req.method === 'DELETE' && !op) return reply(res, 200, { ok: true, ...await store.cancel(id, session) });
      if (req.method === 'POST' && op === 'commit') return reply(res, 200, { ok: true, ...await store.commit(id, session) });
      if (req.method === 'PUT' && index !== undefined) return reply(res, 200, { ok: true, ...await store.put(id, session, Number(index), req) });
      if (req.method === 'GET' && index !== undefined) {
        const { handle, meta } = await store.openFile(id, session, Number(index));
        const bounded = url.searchParams.get('preview') === '1';
        // Every download remains octet-stream. Browser UI decides safe image/text rendering from a Blob.
        res.writeHead(200, { 'content-type': 'application/octet-stream', 'content-disposition': "attachment; filename*=UTF-8''" + encodeURIComponent(meta.path.split('/').at(-1)), 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; sandbox" });
        try { await pipeline(handle.createReadStream(bounded ? { start: 0, end: 128 * 1024 - 1 } : {}), res); }
        finally { await handle.close().catch(() => {}); }
        return;
      }
      throw new AttachError('method', 'Method not allowed', 405);
    } catch (e) {
      if (res.headersSent) { res.destroy(); return; }
      reply(res, e.status ?? 500, { ok: false, error: { code: e.code ?? 'internal', message: e instanceof AttachError ? e.message : 'Storage operation failed; inspect host logs' } });
      if (!(e instanceof AttachError)) console.error('[better-attach]', e);
    }
  };
}
