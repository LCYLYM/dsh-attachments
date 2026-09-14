import { AttachmentManager, mountToolbar, mountRail, bindDrops, sidebarContainer, chooseFiles, showHistory, button, el, t, notice } from '../lib/ui.js';
import { assert } from '../lib/policy.js';
export const SOURCE = 'multimedia-webui-input';
/** Public state uses clipboard offsets; scoped edit spans use one detect character per chip. */
export function detectOffset(state, offset) {
  return offset - state.occurrences.filter(o => o.offset < offset).reduce((n,o) => n + (o.length ?? 1) - 1, 0);
}
export function addReference(input, record) {
  const state=input.state.getSnapshot();assert(state.phase==='plain','locked',t('blocked'));
  if(state.occurrences.some(o=>o.source===SOURCE&&o.ref===record.id))return;
  const end=detectOffset(state,state.draft.length);
  const ok=input.insertReference({source:SOURCE,ref:record.id,label:record.label,appearance:record.selection.folder?'folder':'file',clipboardText:`[Better Attach: ${record.label}; ${record.id}]`},{start:end,end,draftRev:state.draftRev});
  assert(ok===true,'draft-changed','Draft changed while the attachment was added. Please retry.');
}
export function removeReference(input, record, editSpan) {
  assert(typeof editSpan==='function','edit-contract','Safe localized editing is unavailable; delete the reference in the composer instead.');
  // Never setDraft: modern Lexical implementations rebuild every reference when doing that.
  for (;;) {
    const state=input.state.getSnapshot();assert(state.phase==='plain','locked',t('blocked'));
    const occurrence=state.occurrences.filter(o=>o.source===SOURCE&&o.ref===record.id).at(-1);
    if(!occurrence)return;
    const start=detectOffset(state,occurrence.offset), before=state.draftRev;
    assert(editSpan({text:'',span:{start,end:start+1,draftRev:before}})===true,'draft-changed','The composer rejected this edit. No whole-draft fallback was used.');
    assert(input.state.getSnapshot().draftRev!==before,'edit-contract','The host reported an edit without advancing the draft.');
  }
}
export function createDshPlugin(React,cssText){
  const h=React.createElement;
  const inject=['slots','conversation','sessions','inputTriggers'];
  function apply(ctx){
    const sessions=ctx.get('sessions'),conversation=ctx.get('conversation'),triggers=ctx.get('inputTriggers');
    assert(typeof sessions?.scope==='function'&&typeof conversation?.input?.for==='function'&&typeof triggers?.registerSource==='function','client-contract','Better Attach: incompatible DSH client services. No DOM patch was applied.');
    const inputFor=id=>{const scope=sessions.scope(id);assert(scope,'session-unavailable',t('noSession'));return conversation.input.for(scope);};
    let sidebarMarker=null,composerMarker=null,activeSession=null;
    const current=()=>{const value=sessions.list?.getSnapshot?.().current;return typeof value==='string'?value:activeSession;};
    const manager=new AttachmentManager({
      nativeImages:true,
      isEditable:id=>{try{return inputFor(id).state.getSnapshot().phase==='plain';}catch{return false;}},
      onAdd:r=>addReference(inputFor(r.sessionId),r),
      onRemove:r=>removeReference(inputFor(r.sessionId),r,request=>sessions.scope(r.sessionId).bail('slash/input-insert-text',request)),
      onOpenWorkspace:workspace=>{const ui=ctx.get('uiWorkspace');assert(typeof ui?.openWorkspace==='function','navigation-unavailable','Workspace was registered. Open it from the native sidebar.');return ui.openWorkspace(workspace.workspaceId);}
    });
    ctx.effect(()=>{
      const style=el('style');style.dataset.betterAttach='v2';style.textContent=cssText;document.head.append(style);
      const unload=e=>{if([...manager.records.values()].some(r=>!r.removed&&!r.receipt)){e.preventDefault();e.returnValue='';}};
      window.addEventListener('beforeunload',unload);
      return()=>{window.removeEventListener('beforeunload',unload);style.remove();manager.dispose();};
    },'better-attach: browser lifetime');
    ctx.effect(()=>triggers.registerSource({trigger:'@',name:SOURCE,order:1000,candidates:async()=>[],onPick:()=>undefined,codec:{clipboardText:ref=>{const r=manager.records.get(ref);return r?`[Better Attach: ${r.label}; ${ref}]`:`[Missing Better Attach: ${ref}]`;},serialize:(ref,signal)=>manager.serialize(ref,signal)}}),'better-attach: attachment codec');
    function Toolbar(props){const ref=React.useRef(null);React.useEffect(()=>{const node=ref.current;composerMarker=node;activeSession=props.baSessionId;const clear=mountToolbar(ref.current,manager,()=>props.baSessionId);return()=>{if(composerMarker===node)composerMarker=null;clear();};},[props.baSessionId]);return h('div',{ref,'data-better-attach-toolbar':''});}
    function Rail(props){const ref=React.useRef(null);React.useEffect(()=>{
      const input=inputFor(props.baSessionId),clear=mountRail(ref.current,manager,()=>props.baSessionId,()=>input.state.getSnapshot().occurrences.filter(o=>o.source===SOURCE).map(o=>o.ref));
      const unsub=input.state.subscribe(()=>manager.changed());return()=>{unsub();clear();};
    },[props.baSessionId]);return h('div',{ref});}
    function Sidebar(props){const ref=React.useRef(null);React.useEffect(()=>{const node=ref.current;sidebarMarker=node;const b=button(t('import'),()=>chooseFiles(manager,'@workspace-import',true,'workspace'),'ba-button ba-quiet ba-sidebar-button','folder');if(props.wide===false)b.querySelector('span').className='ba-hidden';b.title=t('import');ref.current.replaceChildren(b);return()=>{if(sidebarMarker===node)sidebarMarker=null;};},[props.wide]);return h('div',{ref,'data-better-attach-sidebar':''});}
    function Settings(){const ref=React.useRef(null);React.useEffect(()=>{
      const node=ref.current;node.classList.add('ba-toolbar');node.append(el('p','ba-muted','Better Attach · 0.2.0-rc.1 · loopback-only integration candidate'),button(t('history'),()=>showHistory(manager,current()).catch(e=>notice(e.message)),'ba-button','clock'),button(t('import'),()=>chooseFiles(manager,'@workspace-import',true,'workspace'),'ba-button','folder'),el('p','ba-caption',t('browserMemory')));return()=>node.replaceChildren();
    },[]);return h('section',{ref});}
    ctx.inject(['slots','conversation','sessions','inputTriggers'],scope=>{
      scope.slots.inject('conversation.input.left',()=>scope.slots.register({name:'conversation.input.left',id:'better-attach-toolbar',order:-100,inject:id=>({baSessionId:id})},Toolbar));
      scope.slots.inject('conversation.input.dock',()=>scope.slots.register({name:'conversation.input.dock',id:'better-attach-rail',order:5,inject:id=>({baSessionId:id})},Rail));
      // A list slot: never replace the native workspaces or settings single-owner seats.
      scope.slots.inject('sidebar.footer.action',()=>scope.slots.register({name:'sidebar.footer.action',id:'better-attach-workspace',order:20},Sidebar));
      scope.slots.inject('settings.section',()=>scope.slots.register({name:'settings.section',id:'attachments',order:20,label:()=> 'Better Attach'},Settings));
    });
    const getConversation=()=>{
      if(!composerMarker)return null;const sidebar=sidebarMarker?sidebarContainer(sidebarMarker):null,sr=sidebar?.getBoundingClientRect();
      let best=composerMarker.closest('[data-composer-card]')??composerMarker;
      for(let n=best;n&&n!==document.body;n=n.parentElement){const r=n.getBoundingClientRect();if(sr&&r.left<sr.right-2)break;if(r.width>300&&r.height>150)best=n;}
      return best;
    };
    ctx.effect(()=>bindDrops({manager,getSession:current,getSidebar:()=>sidebarMarker?sidebarContainer(sidebarMarker):null,getConversation,nativeImages:true}),'better-attach: destination-aware drop');
    // Exposed only as a return value for contract tests, not a global UI backdoor.
    return {manager,inputFor};
  }
  return {inject,apply};
}
