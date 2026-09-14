import { modelMessage, AttachError } from './policy.js';
export const API = '/community-multimedia-webui-input/v2';
export class AttachClient {
  constructor(sessionId, { base = API, onProgress = () => {} } = {}) { this.sessionId = sessionId; this.base = base; this.onProgress = onProgress; }
  headers(extra = {}) { return { 'x-better-attach': '1', 'x-ba-session': this.sessionId, ...extra }; }
  async json(route, { signal, method = 'GET', body } = {}) {
    const response = await fetch(this.base + route, { method, signal, headers: this.headers(body ? { 'content-type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined });
    let result; try { result = await response.json(); } catch { throw new AttachError('http', `Attachment host returned HTTP ${response.status}`); }
    if (!response.ok || result.ok !== true) throw new AttachError(result.error?.code ?? 'http', result.error?.message ?? `HTTP ${response.status}`, response.status);
    return result;
  }
  put(route, file, signal, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const abort = () => xhr.abort();
      xhr.open('PUT', this.base + route);
      for (const [key,value] of Object.entries(this.headers({ 'content-type': 'application/octet-stream' }))) xhr.setRequestHeader(key, value);
      xhr.upload.onprogress = e => onProgress(e.loaded);
      xhr.onload = () => { signal?.removeEventListener('abort', abort); let data; try { data = JSON.parse(xhr.responseText); } catch {} if (xhr.status >= 200 && xhr.status < 300 && data?.ok) resolve(data); else reject(new AttachError(data?.error?.code ?? 'upload', data?.error?.message ?? `Upload failed (${xhr.status})`)); };
      xhr.onerror = () => { signal?.removeEventListener('abort', abort); reject(new AttachError('network', 'Connection lost. Retry keeps already completed files.')); };
      xhr.onabort = () => { signal?.removeEventListener('abort', abort); reject(new DOMException('Transfer cancelled', 'AbortError')); };
      signal?.addEventListener('abort', abort, { once: true });
      if (signal?.aborted) { signal.removeEventListener('abort', abort); reject(new DOMException('Transfer cancelled', 'AbortError')); return; }
      xhr.send(file);
    });
  }
  async send(record, signal) {
    if (record.receipt) return record.receipt;
    if (record.inflight) return record.inflight;
    const ctrl = new AbortController(); record.controller = ctrl;
    const abort = () => ctrl.abort(); signal?.addEventListener('abort', abort, { once: true }); if (signal?.aborted) ctrl.abort();
    record.status = 'uploading'; record.error = ''; this.onProgress(record);
    record.inflight = (async () => {
      try {
        const created = await this.json('/batches', { method: 'POST', signal: ctrl.signal, body: { id: record.id, sessionId: this.sessionId, target: record.target, ...record.selection.plan } });
        if (created.receipt && created.status === 'committed') { record.receipt = created.receipt; record.status = 'committed'; this.onProgress(record); return record.receipt; }
        const received = new Set(created.received), sizes = record.selection.files.map((f,i) => received.has(i) ? f.file.size : 0);
        let cursor = 0;
        const progress = () => { record.loaded = sizes.reduce((s,x) => s+x,0); this.onProgress(record); };
        progress();
        const worker = async () => { while (cursor < record.selection.files.length) {
          ctrl.signal.throwIfAborted(); const i = cursor++; if (received.has(i)) continue;
          await this.put(`/batches/${record.id}/files/${i}`, record.selection.files[i].file, ctrl.signal, n => { sizes[i] = n; progress(); });
          sizes[i] = record.selection.files[i].file.size; progress();
        } };
        if (created.status !== 'registering') {
          const jobs = Array.from({ length: Math.min(2, record.selection.files.length) }, worker);
          try { await Promise.all(jobs); } catch (e) { ctrl.abort(); await Promise.allSettled(jobs); throw e; }
        }
        record.receipt = await this.json(`/batches/${record.id}/commit`, { method: 'POST', signal: ctrl.signal });
        record.status = 'committed'; record.loaded = record.selection.plan.bytes; this.onProgress(record); return record.receipt;
      } catch (e) {
        record.status = e.name === 'AbortError' ? 'cancelled' : 'error'; record.error = e.message; this.onProgress(record); throw e;
      } finally { record.inflight = null; record.controller = null; signal?.removeEventListener('abort', abort); }
    })();
    return record.inflight;
  }
  async cancel(record, discard = false) {
    record.controller?.abort(); await record.inflight?.catch(() => {});
    if (discard && !record.receipt) await this.json(`/batches/${record.id}`, { method: 'DELETE' }).catch(e => { if (!['not-found','already-committed'].includes(e.code)) throw e; });
  }
  async blob(receipt, index, bounded = false) {
    const response = await fetch(`${this.base}/batches/${receipt.id}/files/${index}${bounded ? '?preview=1' : ''}`, { headers: this.headers() });
    if (!response.ok) { let error; try { error = await response.json(); } catch {} throw new Error(error?.error?.message ?? `HTTP ${response.status}`); }
    return response.blob();
  }
}
