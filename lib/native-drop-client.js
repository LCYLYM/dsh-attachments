/** Native path capture never changes the browser's drag target or paints UI. */
export function isWorkspaceDrag(event, sidebar) {
  if (!event.isTrusted || document.visibilityState !== 'visible' || !sidebar?.isConnected || sidebar.ownerDocument !== document || !document.querySelector('[data-better-attach-sidebar]')) return false;
  const rect = sidebar.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
}
export function nativeWorkspaceDrops(manager, onDrop, onError) {
  const client = manager.client('@workspace-import');
  let available = false, disposed = false, operation = null;
  const refresh = () => client.json('/native-drop').then(value => { available = value.available; }).catch(() => { available = false; });
  void refresh();
  const refreshTimer = setInterval(refresh, 15000);
  const cancel = () => {
    const current = operation; operation = null;
    if (current?.id) void client.json('/native-drop/' + current.id, { method: 'DELETE' }).catch(() => {});
    current?.controller.abort();
  };
  return {
    get active() { return operation !== null; },
    arm(event, sidebar) {
      // Finder can retain keyboard focus throughout a valid drag into Chrome.
      // Trust this page's native drag event and its mounted sidebar bounds instead.
      if (!available || disposed || operation || !isWorkspaceDrag(event, sidebar)) return;
      const current = { controller: new AbortController(), id: null, resolving: false }; operation = current;
      current.ready = client.json('/native-drop', { method: 'POST', body: {} }).then(async ({ id }) => {
        current.id = id;
        if (disposed || operation !== current) { await client.json('/native-drop/' + id, { method: 'DELETE' }); return null; }
        return id;
      }).catch(error => { current.error = error; return null; });
    },
    async drop(name) {
      const current = operation;
      if (!current || current.resolving) return false;
      current.resolving = true;
      try {
        const id = await current.ready;
        if (!id || disposed || operation !== current) { if (current.error) throw current.error; return false; }
        await client.json('/native-drop/' + id, { method: 'POST', body: { name }, signal: current.controller.signal });
        const result = await client.json('/native-drop/' + id, { signal: current.controller.signal });
        if (disposed || operation !== current) return false;
        if (result.state !== 'dropped') throw new Error('未取得本次拖放的原目录路径，请重新拖入。');
        await onDrop(result.path); return true;
      } catch (error) {
        if (!disposed && error.name !== 'AbortError') onError(error);
        return false;
      } finally { if (operation === current) cancel(); }
    },
    cancel,
    cancelUncommitted() { if (!operation?.resolving) cancel(); },
    dispose() { disposed = true; clearInterval(refreshTimer); cancel(); }
  };
}
