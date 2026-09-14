import { LIMITS, assert, validatePlan, exclusionReason } from './policy.js';
/** Capture DataTransfer synchronously: drag store access expires after the drop callback. */
export function captureDrop(transfer) {
  const items = [...(transfer?.items ?? [])].filter(i => i.kind === 'file');
  const entries = items.map(i => i.webkitGetAsEntry?.() ?? null);
  const files = [...(transfer?.files ?? [])];
  return { entries, files, hasDirectory: entries.some(e => e?.isDirectory) };
}
export function isExternalFiles(transfer) { return [...(transfer?.types ?? [])].includes('Files') || [...(transfer?.items ?? [])].some(i => i.kind === 'file'); }
export function pickList(fileList) {
  const files = [...fileList].map(file => ({ path: file.webkitRelativePath || file.name, file }));
  const directories = new Set();
  for (const f of files) { const p = f.path.split('/'); p.pop(); while (p.length) { directories.add(p.join('/')); p.pop(); } }
  return { files, directories: [...directories], skipped: [], folder: directories.size > 0, emptyDirectoriesSupported: false };
}
/** Sequential traversal bounds handles/memory; drains all readEntries() batches, not just the first 100. */
export async function readDrop(captured, { signal, onScan = () => {}, skipDefaults = true } = {}) {
  if (!captured.entries.some(Boolean)) return pickList(captured.files);
  const result = { files: [], directories: [], skipped: [], folder: captured.hasDirectory, emptyDirectoriesSupported: true };
  let seen = 0;
  const check = () => { signal?.throwIfAborted(); assert(++seen <= LIMITS.entries, 'too-many', 'Folder has too many entries'); };
  async function walk(entry, prefix = '') {
    check(); const path = prefix + entry.name;
    assert(path.split('/').length <= LIMITS.depth, 'too-deep', 'Folder is too deep');
    const reason = exclusionReason(path);
    if (skipDefaults && reason && entry.isDirectory) { result.skipped.push({ path: path + '/', reason, directory: true }); return; }
    if (entry.isFile) {
      const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
      signal?.throwIfAborted(); result.files.push({ path, file });
      assert(result.files.length <= LIMITS.files, 'too-many', 'Too many files');
    } else if (entry.isDirectory) {
      result.directories.push(path);
      const reader = entry.createReader();
      for (;;) {
        signal?.throwIfAborted();
        const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
        if (!batch.length) break;
        for (const child of batch) await walk(child, path + '/');
      }
    }
    if (seen % 32 === 0) { onScan(seen); await new Promise(r => setTimeout(r, 0)); }
  }
  // Preserve file-only items on browsers returning null for some mixed entries.
  for (let i = 0; i < captured.entries.length; i++) {
    const e = captured.entries[i];
    if (e) await walk(e);
    else if (captured.files[i]) result.files.push({ path: captured.files[i].name, file: captured.files[i] });
  }
  return result;
}
export function reviewSelection(selection, includeSensitive = false) {
  const skipped = [...(selection.skipped ?? [])];
  const allow = path => { const reason = exclusionReason(path); if (!reason || (reason === 'sensitive' && includeSensitive)) return true; skipped.push({ path, reason }); return false; };
  const files = selection.files.filter(x => allow(x.path));
  const directories = selection.directories.filter(allow);
  const plan = validatePlan({ files: files.map(x => ({ path: x.path, size: x.file.size, type: x.file.type, lastModified: x.file.lastModified })), directories });
  return { ...selection, files, directories, skipped, plan };
}
export function selectionLabel(selection) {
  const roots = new Set([...selection.files.map(x => x.path), ...selection.directories].map(x => x.split('/')[0]));
  return roots.size === 1 ? [...roots][0] : `${selection.files.length} files`;
}

/** Only native absolute-path metadata identifies a host directory; entry.fullPath is virtual. */
export function workspaceDrop(transfer) {
  const items=[...(transfer?.items??[])].filter(i=>i.kind==='file');
  const files=[...(transfer?.files??[])];
  assert(Math.max(items.length,files.length)<=1,'workspace-folder','Drop one directory to add a workspace');
  const entry=items[0]?.webkitGetAsEntry?.();
  assert(!entry?.isFile,'workspace-folder','A workspace must be a directory');
  const file=files[0]??items[0]?.getAsFile?.();
  const absolute=value=>typeof value==='string'&&!value.includes('\0')&&(/^(?:\/|[A-Za-z]:[\\/])/.test(value));
  let path=absolute(file?.path)?file.path:null;
  const uris=(transfer?.getData?.('text/uri-list')??'').split(/\r?\n/).filter(s=>s.trim()&&!s.startsWith('#'));
  if(!path&&uris.length){
    assert(uris.length===1,'workspace-folder','Drop one directory to add a workspace');
    const url=new URL(uris[0]);assert(url.protocol==='file:'&&(!url.hostname||url.hostname==='localhost'),'workspace-path','Use a directory on the DSH host');
    path=decodeURIComponent(url.pathname);if(/^\/[A-Za-z]:\//.test(path))path=path.slice(1);
    assert(absolute(path),'workspace-path','Use an absolute host directory');
  }
  return{path,name:entry?.name??file?.name??''};
}
