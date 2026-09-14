import { readPreferences, writePreferences, fileGlyph } from './preferences.js';
import { VERSION, formatBytes, previewKind, isRaster, modelMessage, assert } from './policy.js';
import { captureDrop, isExternalFiles, pickList, readDrop, reviewSelection, selectionLabel } from './intake.js';
import { AttachClient } from './client-api.js';
const messages = {
  zh: {
    files:'添加文件', folder:'添加文件夹', history:'附件记录', close:'关闭', cancel:'取消', retry:'重试', reattach:'再次附加', retryPrepare:'重试保存', existing:'使用主机原目录', existingHint:'输入运行 DSH 的主机上的绝对路径。这不会上传或复制文件，也不能读取浏览器没有提供的本机路径。', register:'添加原目录', remove:'移除', undo:'撤销', preview:'预览', download:'下载', search:'筛选文件…', empty:'尚无附件', ready:'发送时复制', uploading:'正在传输', committed:'已保存', error:'传输失败', cancelled:'已暂停', removed:'已移除附件', add:'添加到对话', import:'导入为工作区', inspect:'检查导入内容', fileCount:'个文件', folderCount:'个目录', skipped:'已跳过', sensitive:'包含敏感文件（明确确认后才导入）', folderHint:'保留目录结构；只在发送时复制，不改动原文件。', workspaceHint:'浏览器无法提供原目录路径。这里创建主机上的独立副本，并注册为工作区，不会链接到原文件夹。', copyHint:'这是路径附件，预览不等于模型已收到原生图片。单独拖入图片可使用 DSH 原生图像通道。', excludedHint:'默认忽略依赖、缓存和常见敏感文件。不等同于完整 .gitignore 或秘密扫描。', scanning:'正在读取目录…', dropChat:'添加到这段对话', dropWorkspace:'导入文件夹为工作区', dropSub:'松开后检查内容，不会立即复制', importSuccess:'工作区已添加', openWorkspace:'打开工作区', path:'副本位置', imported:'导入成功', noSession:'请先打开一个可编辑的对话', noNative:'此选择为路径附件；原生图像请单独拖入输入框。', unavailable:'预览不可用', textLimit:'仅预览前 128 KiB；代码、HTML 和 SVG 只作为文本展示。', noPreview:'此格式不在浏览器内执行或解析。可以下载原文件。', imagesLimit:'图片超过 20 MiB，仅提供下载。', historyHint:'这是本插件已落盘的附件，不代表模型消息已成功发送。删除会使旧消息中的路径失效。', clear:'清理当前对话附件', confirmDelete:'删除已保存的附件？', deleteHint:'只删除 Better Attach v2 在当前对话创建的副本。原文件和工作区导入不会被删除。旧版附件不在清理范围内。', confirm:'确认删除', cleanup:'附件副本已清理', remaining:'展开其余文件', browserMemory:'未发送选择只保留在此浏览器页面；刷新会丢失选择。', blocked:'当前输入已锁定，附件未添加。', readFailure:'目录读取失败', workspaceUnavailable:'当前 DSH 缺少工作区注册能力；不会假装添加成功。', archiveTitle:'已保存附件', noMatch:'没有匹配文件', duplicates:'这个选择已经在草稿中', cancelHint:'暂停保留已完成文件。重试继续，不会重复创建副本。', inspectFolder:'查看文件夹', preparing:'正在确认…', includeNote:'已跳过的依赖目录不会递归读取；敏感文件可单独确认。', newCopy:'新建独立副本', inspectSkipped:'查看跳过项', continue:'继续', tooManyDrafts:'草稿附件总量过大，请先发送或移除部分附件。'
  },
  en: {
    files:'Attach files', folder:'Attach folder', history:'Attachments', close:'Close', cancel:'Cancel', retry:'Retry', reattach:'Attach again', retryPrepare:'Retry saving', existing:'Use existing host directory', existingHint:'Enter an absolute path on the machine running DSH. No files are uploaded or copied. This cannot reveal a browser-local original path.', register:'Add original directory', remove:'Remove', undo:'Undo', preview:'Preview', download:'Download', search:'Filter files…', empty:'No attachments yet', ready:'Copied on send', uploading:'Transferring', committed:'Saved', error:'Transfer failed', cancelled:'Paused', removed:'Attachment removed', add:'Add to conversation', import:'Import as workspace', inspect:'Review import', fileCount:'files', folderCount:'directories', skipped:'Skipped', sensitive:'Include sensitive files (explicit consent)', folderHint:'Preserves the folder structure. Copies only when you send. Originals stay untouched.', workspaceHint:'Browsers do not reveal original directory paths. This creates an independent copy on the host and registers it as a workspace; it does not link your original folder.', copyHint:'Path attachment: seeing a preview does not mean the model received a native image. Drop images separately to use DSH’s native image channel.', excludedHint:'Dependencies, caches and common sensitive names are excluded by default. This is not a full .gitignore parser or secret scanner.', scanning:'Reading directory…', dropChat:'Attach to this conversation', dropWorkspace:'Import folder as workspace', dropSub:'Release to review. Nothing is copied yet.', importSuccess:'Workspace added', openWorkspace:'Open workspace', path:'Copy location', imported:'Import complete', noSession:'Open an editable conversation first', noNative:'This selection is a path attachment. Drop images separately for native image input.', unavailable:'Preview unavailable', textLimit:'Showing at most 128 KiB. Code, HTML and SVG are displayed only as text.', noPreview:'This format is not executed or parsed in the browser. Download the original file instead.', imagesLimit:'Images over 20 MiB are download-only.', historyHint:'These files were saved by this plugin. That is not proof a model message was sent. Deleting them breaks paths in earlier messages.', clear:'Clean this conversation’s attachments', confirmDelete:'Delete saved attachments?', deleteHint:'Only Better Attach v2 copies for this conversation are deleted. Originals, imported workspaces and legacy attachments are untouched.', confirm:'Confirm deletion', cleanup:'Attachment copies removed', remaining:'Show remaining files', browserMemory:'Unsent selections live in this browser page. Refreshing loses them.', blocked:'The composer is locked. Nothing was attached.', readFailure:'Could not read directory', workspaceUnavailable:'This DSH instance has no workspace registration capability. Nothing was registered.', archiveTitle:'Saved attachments', noMatch:'No matching files', duplicates:'This selection is already in the draft', cancelHint:'Pause retains completed files. Retry continues without creating a second copy.', inspectFolder:'Inspect folder', preparing:'Preparing…', includeNote:'Skipped dependency folders are not traversed. Sensitive files can be explicitly included.', newCopy:'Independent copy', inspectSkipped:'Inspect skipped entries', continue:'Continue', tooManyDrafts:'Too many draft attachments. Send or remove some first.'
  }
};
Object.assign(messages.zh,{settings:'附件设置',mode:'文件处理方式',copyMode:'复制副本',pathMode:'引用路径',modeHint:'复制模式在发送时保存副本；引用模式只引用主机原文件，后续编辑会影响读取内容。',theme:'外观',plain:'原生 · 无图',official:'官网风格 · 蓝色渐变',character:'DSH 娘 · 自定义图片',copyPath:'复制路径',pathCopied:'路径已复制',reference:'引用原路径',pathHint:'浏览器不能提供绝对路径。请填写 DSH 主机上的文件或目录路径；不上传、不复制。',pathLabel:'主机绝对路径',referenceReady:'引用原文件',addPath:'添加路径引用',saveFailed:'设置保存失败',nativeHint:'独立图片使用 DSH 原生视觉附件。文件夹中的图片保留目录结构，作为路径读取。',themeHint:'背景只用于附件面板，不遮挡对话正文；切回无图立即还原。',hostPicker:'选择主机目录',pathMissing:'路径引用已失效，请重新添加',pathDrop:'松开后确认原路径，不复制文件',emptyDirectory:'这是主机目录引用，请通过 DSH 文件工具浏览目录。'});
Object.assign(messages.en,{settings:'Attachment settings',mode:'File handling',copyMode:'Copy files',pathMode:'Reference paths',modeHint:'Copy mode saves files on send. Path mode references originals; later edits affect what is read.',theme:'Appearance',plain:'Native · no image',official:'Official-inspired · blue',character:'DSH character · custom image',copyPath:'Copy path',pathCopied:'Path copied',reference:'Reference original path',pathHint:'Browsers do not expose absolute paths. Enter a file or directory path on the DSH host. Nothing is uploaded or copied.',pathLabel:'Absolute host path',referenceReady:'Original path',addPath:'Add path reference',saveFailed:'Could not save settings',nativeHint:'Standalone images use native DSH vision attachments. Images inside folders preserve structure and are read by path.',themeHint:'Backgrounds decorate attachment panels only. Choose no image to restore the native appearance.',hostPicker:'Choose host directory',pathMissing:'Path reference is unavailable; add it again',pathDrop:'Release to confirm the original path. No copying.',emptyDirectory:'Host directory reference. Browse its contents with DSH file tools.'});
export function language() { return globalThis.BETTER_ATTACH_LOCALE ?? (/^zh/i.test(globalThis.navigator?.language ?? '') ? 'zh' : 'en'); }
export function t(key) { return messages[language()]?.[key] ?? messages.en[key] ?? key; }
export function el(tag, className = '', text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
const icons = {
  folder:'M2 5h7l2 2h11v13H2z M2 7V4h7l2 3', file:'M6 2h8l4 4v16H6z M14 2v5h4', clip:'M8 12l7-7a4 4 0 0 1 6 6L10 22a6 6 0 0 1-8-8L13 3 M7 16l9-9', close:'M6 6l12 12M6 18L18 6', arrow:'M12 3v13M6 10l6 6 6-6 M4 17v4h16v-4', clock:'M12 8v5l3 2 M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18', chevron:'M9 5l7 7-7 7', check:'M5 12l4 4L19 6', image:'M3 3h18v18H3z M3 16l5-5 4 4 3-3 6 6 M16 7h.01', info:'M12 11v6M12 7h.01 M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20', undo:'M8 4L3 9l5 5 M4 9h9a7 7 0 0 1 0 14'
};
Object.assign(icons,{code:'M8 5l-6 7 6 7 M16 5l6 7-6 7 M14 2l-4 20',document:'M6 2h8l4 4v16H6z M9 11h6 M9 15h6 M9 18h4',table:'M3 3h18v18H3z M3 9h18 M9 3v18 M3 15h18',archive:'M4 3h16v18H4z M10 3v3h4v3h-4v3h4v3h-4v4h4',audio:'M9 18V5l11-2v13 M9 18a3 3 0 1 1-3-3h3 M20 16a3 3 0 1 1-3-3h3',video:'M3 5h13v14H3z M16 9l6-4v14l-6-4',settings:'M4 6h16 M4 12h16 M4 18h16 M9 3v6 M15 9v6 M9 15v6',link:'M10 14l4-4 M8 16l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0 M16 8l1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0'});
export function icon(name) { const svg = document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('viewBox','0 0 24 24'); svg.setAttribute('fill','none'); svg.setAttribute('stroke','currentColor'); svg.setAttribute('stroke-width','1.6'); svg.setAttribute('stroke-linecap','round'); svg.setAttribute('stroke-linejoin','round'); svg.setAttribute('aria-hidden','true'); const p = document.createElementNS(svg.namespaceURI,'path'); p.setAttribute('d',icons[name] ?? icons.file); svg.append(p); return svg; }
export function button(label, action, className = 'ba-button', glyph) { const b = el('button',className); b.type='button'; if(glyph)b.append(icon(glyph)); b.append(el('span','',label)); b.addEventListener('click',action); return b; }
export function notice(message, actionLabel, action) {
  let region = document.querySelector('.ba-toasts'); if(!region){region=el('div','ba-toasts'); region.setAttribute('aria-live','polite'); document.body.append(region);}
  const row=el('div','ba-toast'); row.append(el('span','',message)); if(actionLabel)row.append(button(actionLabel,()=>{action();row.remove();},'ba-button ba-link')); row.append(button(t('close'),()=>row.remove(),'ba-icon','close')); region.append(row);
  const timer=setTimeout(()=>row.remove(),9000); row.addEventListener('mouseenter',()=>clearTimeout(timer),{once:true});row.addEventListener('focusin',()=>clearTimeout(timer),{once:true});
  return () => {clearTimeout(timer);row.remove();};
}
export function dialog(title, description = '') {
  const previous=document.activeElement, d=el('dialog','ba-dialog'); d.setAttribute('aria-label',title);
  const head=el('header','ba-dialog-head'), titleWrap=el('div'); titleWrap.append(el('h2','',title)); if(description)titleWrap.append(el('p','ba-muted',description));
  head.append(titleWrap,button(t('close'),()=>d.close(),'ba-icon','close'));
  const body=el('div','ba-dialog-body'),footer=el('footer','ba-dialog-foot'); d.append(head,body,footer); document.body.append(d);
  const cleanups=[]; d.addEventListener('close',()=>{cleanups.forEach(f=>f()); d.remove(); if(previous?.isConnected)previous.focus();},{once:true}); d.showModal();
  return {d,body,footer,cleanups};
}
async function saveBlob(blob,name) { const url=URL.createObjectURL(blob), a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
export async function showPreview(item, loadBlob) {
  const view=dialog(item.path ?? item.name,formatBytes(item.size ?? item.file?.size ?? 0));
  const loading=el('p','ba-muted',t('preparing'));view.body.append(loading);
  try {
    const kind=previewKind(item), size=item.size??item.file?.size??0;
    const meta=item.file ?? item;
    const download=async()=>{try{await saveBlob(item.file ?? await loadBlob(false), (item.path??item.name).split('/').at(-1));}catch(e){notice(e.message);}};
    view.footer.append(button(t('download'),download,'ba-button','arrow'));
    if(kind==='download'||(kind==='image'&&size>20*1024**2)){loading.textContent=t(kind==='image'?'imagesLimit':'noPreview');return;}
    const blob=item.file ? (kind==='text'?item.file.slice(0,128*1024):item.file) : await loadBlob(kind==='text');
    if(!view.d.isConnected)return;
    loading.remove();
    if(kind==='text'){
      const pre=el('pre','ba-text'); pre.textContent=await blob.text(); view.body.append(pre,el('p','ba-caption',t('textLimit')));
    }else{
      const typed=blob.type===meta.type?blob:new Blob([blob],{type:meta.type});const url=URL.createObjectURL(typed);view.cleanups.push(()=>URL.revokeObjectURL(url));
      const img=el('img','ba-image');img.src=url;img.alt=item.path??item.name;img.onerror=()=>{img.replaceWith(el('p','ba-error',t('unavailable')));};view.body.append(img);
    }
  }catch(e){loading.textContent=e.message;loading.className='ba-error';}
}
export function fileList(selection, onPreview) {
  const wrap=el('div','ba-browser'),search=el('input','ba-search');search.type='search';search.placeholder=t('search');search.setAttribute('aria-label',t('search'));
  const list=el('div','ba-file-list');list.setAttribute('role','list');let limit=150;
  const populated=new Set();for(const f of selection.files){const parts=f.path.split('/');parts.pop();while(parts.length){populated.add(parts.join('/'));parts.pop();}}
  const rows=[...selection.files.map((f,i)=>({...f,index:i,isFile:true})),...selection.directories.filter(d=>!populated.has(d)).map(path=>({path,isFile:false}))].sort((a,b)=>a.path.localeCompare(b.path));
  const render=()=>{
    const query=search.value.toLocaleLowerCase(),filtered=rows.filter(f=>f.path.toLocaleLowerCase().includes(query));list.replaceChildren();
    for(const item of filtered.slice(0,limit)){
      const row=el('div','ba-file-row');row.setAttribute('role','listitem');
      const b=button(item.path,()=>item.isFile&&onPreview(item),'ba-file-name',item.isFile?fileGlyph(item):'folder');
      b.title=item.path; if(!item.isFile)b.disabled=true;row.append(b,el('span','ba-file-size',item.isFile?formatBytes(item.file?.size??item.size):'—'));list.append(row);
    }
    if(!filtered.length)list.append(el('p','ba-muted',t('noMatch')));
    if(filtered.length>limit)list.append(button(`${t('remaining')} (${filtered.length-limit})`,()=>{limit+=150;render();},'ba-button ba-link'));
  };
  search.addEventListener('input',()=>{limit=150;render();});render();wrap.append(search,list);return wrap;
}
export class AttachmentManager {
  constructor({ onAdd = () => {}, onRemove = () => {}, isEditable = () => true, onOpenWorkspace, onNativeImages, pickHostDirectory, nativeImages = false } = {}) {
    Object.assign(this,{onAdd,onRemove,isEditable,onOpenWorkspace,onNativeImages,pickHostDirectory,nativeImages}); this.preferences=readPreferences();this.records=new Map();this.listeners=new Set();this.epoch=0;this.destroyed=false;
  }
  setPreferences(value){this.preferences=writePreferences({...this.preferences,...value});document.documentElement.dataset.baTheme=this.preferences.theme;this.changed();}
  async addPath(sessionId,input){
    assert(this.isEditable(sessionId),'locked',t('blocked'));
    const {reference}=await this.client(sessionId).json('/references',{method:'POST',body:{path:input}});
    return this.attachPathReference(sessionId,reference);
  }
  async attachPathReference(sessionId,reference){
    assert(!this.destroyed&&this.isEditable(sessionId)&&reference.sessionId===sessionId,'locked',t('blocked'));
    const r={id:'path:'+reference.id,sessionId,target:'conversation',mode:'path',reference,label:reference.name,status:'referenceReady',selection:{folder:reference.directory,files:[],directories:[],plan:{bytes:0}},urls:[],removed:false};
    this.records.set(r.id,r);try{await this.onAdd(r);}catch(e){this.records.delete(r.id);throw e;}this.changed();return r;
  }
  changed(){this.epoch++;this.listeners.forEach(f=>f());}
  subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
  client(sessionId){return new AttachClient(sessionId,{onProgress:r=>{
    if(r.receipt&&!r.bytesReleased){
      r.selection.files=r.receipt.files.map(f=>({...f}));r.urls.forEach(u=>URL.revokeObjectURL(u));r.urls=[];r.thumb=null;r.bytesReleased=true;
    }
    this.changed();
  }});}
  async attachSaved(sessionId,receipt){
    assert(this.isEditable(sessionId)&&receipt.sessionId===sessionId,'locked',t('blocked'));
    let r=this.records.get(receipt.id);
    if(!r){const selection={files:receipt.files.map(f=>({...f})),directories:receipt.directories,folder:receipt.directories.length>0,plan:{files:receipt.files,directories:receipt.directories,bytes:receipt.bytes}};
      r={id:receipt.id,sessionId,target:'conversation',selection,label:selectionLabel(selection),status:'committed',loaded:receipt.bytes,error:'',receipt,urls:[],bytesReleased:true};this.records.set(r.id,r);}
    await this.onAdd(r);r.removed=false;r.sent=false;this.changed();return r;
  }

  async stage(sessionId,selection,target='conversation') {
    assert(!this.destroyed && sessionId && (target==='workspace'||this.isEditable(sessionId)), 'locked', t('blocked'));
    if(target==='conversation'){
      const existing=[...this.records.values()].filter(r=>!r.removed&&!r.receipt);
      assert(existing.reduce((s,r)=>s+r.selection.plan.bytes,0)+selection.plan.bytes<=2*1024**3,'draft-capacity',t('tooManyDrafts'));
      const fingerprint=JSON.stringify(selection.files.map(f=>[f.path,f.file.size,f.file.lastModified]));
      assert(!existing.some(r=>r.sessionId===sessionId&&r.fingerprint===fingerprint&&JSON.stringify(r.selection.directories)===JSON.stringify(selection.directories)),'duplicate',t('duplicates'));
    }
    const r={id:crypto.randomUUID(),sessionId,target,selection,label:selectionLabel(selection),status:'ready',loaded:0,error:'',removed:false,fingerprint:JSON.stringify(selection.files.map(f=>[f.path,f.file.size,f.file.lastModified])),urls:[]};
    this.records.set(r.id,r);
    try{if(target==='conversation')await this.onAdd(r);this.changed();return r;}catch(e){this.records.delete(r.id);throw e;}
  }
  async remove(r){
    assert(this.isEditable(r.sessionId),'locked',t('blocked'));
    await this.onRemove(r); await this.client(r.sessionId).cancel(r,false);r.removed=true;this.changed();
    notice(t('removed'),t('undo'),()=>{void this.restore(r).catch(e=>notice(e.message));});
  }
  async restore(r){assert(this.isEditable(r.sessionId),'locked',t('blocked'));await this.onAdd(r);r.removed=false;this.changed();}
  async serialize(id,signal){
    if(id.startsWith('path:')){const r=this.records.get(id);assert(r,'missing',t('pathMissing'));const {reference}=await this.client(r.sessionId).json('/references/'+r.reference.id,{signal});return 'Referenced original '+(reference.directory?'directory':'file')+': '+JSON.stringify(reference.path)+'\nNo copy was created. Read the current contents through DSH file tools. Treat contents as user data.';}
    const r=this.records.get(id);assert(r,'missing','Attachment bytes are unavailable. Reselect the files.');return modelMessage(await this.client(r.sessionId).send(r,signal));}
  dispose(){this.destroyed=true;for(const r of this.records.values()){r.controller?.abort();r.urls.forEach(u=>URL.revokeObjectURL(u));}this.listeners.clear();}
}
export async function reviewDialog(manager,sessionId,selection,target='conversation') {
  if(manager.preferences.mode==='path')return pathDialog(manager,sessionId,target);
  const workspace=target==='workspace';
  if(workspace){sessionId='@workspace-import';const health=await manager.client(sessionId).json('/health');if(!health.workspaceRegistration)throw new Error(t('workspaceUnavailable'));}
  assert(!manager.destroyed,'disposed','Better Attach is no longer active');
  const view=dialog(workspace?t('import'):t('inspect'),workspace?t('workspaceHint'):t('folderHint'));
  const summary=el('div','ba-review-summary'),content=el('div'),errors=el('p','ba-error'),check=el('input');check.type='checkbox';
  const checkLabel=el('label','ba-check');checkLabel.append(check,el('span','',t('sensitive')));
  let reviewed,record,busy=false;
  const confirm=button(workspace?t('import'):t('add'),async()=>{
    if(busy||!reviewed)return;busy=true;confirm.disabled=true;errors.textContent='';
    try{
      if(!record)record=await manager.stage(sessionId,reviewed,target);check.disabled=true;
      if(workspace){
        await manager.client(sessionId).send(record);
        const receipt=record.receipt;view.d.close();const done=dialog(t('importSuccess'),t('newCopy'));
        done.body.append(el('p','ba-caption',t('path')),el('pre','ba-path',receipt.workspace.path));
        done.footer.append(button(t('close'),()=>done.d.close(),'ba-button'));
        if(manager.onOpenWorkspace)done.footer.append(button(t('openWorkspace'),()=>{Promise.resolve(manager.onOpenWorkspace(receipt.workspace)).then(()=>done.d.close()).catch(e=>notice(e.message));},'ba-button ba-primary','folder'));
      }else view.d.close();
    }catch(e){errors.textContent=e.name==='AbortError'?t('cancelHint'):e.message;confirm.textContent=t('retry');}
    finally{busy=false;confirm.disabled=!reviewed;}
  },'ba-button ba-primary',workspace?'folder':'clip');
  const cancel=button(t('cancel'),()=>{if(busy)record?.controller?.abort();else view.d.close();},'ba-button');
  view.d.addEventListener('cancel',e=>{if(busy){e.preventDefault();record?.controller?.abort();}});
  view.d.querySelector('.ba-dialog-head .ba-icon').addEventListener('click',e=>{if(busy){e.stopImmediatePropagation();record?.controller?.abort();}},{capture:true});
  const paint=()=>{
    summary.replaceChildren();content.replaceChildren();errors.textContent='';reviewed=null;
    try{
      reviewed=reviewSelection(selection,check.checked);
      if(workspace){const roots=new Set([...reviewed.files.map(f=>f.path),...reviewed.directories].map(x=>x.split('/')[0]));assert(roots.size===1&&reviewed.directories.includes([...roots][0]),'workspace-folder','Drop exactly one folder to create one workspace.');}
      summary.append(icon(workspace||selection.folder?'folder':'clip'),el('strong','ba-review-title',selectionLabel(reviewed)),el('span','ba-muted',`${reviewed.files.length} ${t('fileCount')} · ${formatBytes(reviewed.plan.bytes)}`));
      content.append(fileList(reviewed,item=>showPreview({...item,type:item.file.type})));
      if(reviewed.skipped.length){const details=el('details','ba-skipped');details.append(el('summary','',`${t('skipped')} ${reviewed.skipped.length} · ${t('inspectSkipped')}`));const p=el('pre');p.textContent=reviewed.skipped.slice(0,200).map(x=>`${x.path} · ${x.reason}`).join('\n');details.append(p);content.append(details);}
    }catch(e){reviewed=null;errors.textContent=e.message;}
    confirm.disabled=!reviewed;
  };
  check.addEventListener('change',paint);view.body.append(summary,content,checkLabel,el('p','ba-caption',t('excludedHint')),el('p','ba-caption',t('includeNote')),el('p','ba-caption',t('copyHint')),errors);
  if(workspace)view.footer.append(button(t('existing'),()=>registerExisting(manager),'ba-button ba-link'));
  view.footer.append(cancel,confirm);paint();
  if(workspace){const progress=el('progress','ba-progress');progress.hidden=true;progress.max=100;progress.value=0;view.body.append(progress);const un=manager.subscribe(()=>{if(record){progress.hidden=false;progress.value=record.selection.plan.bytes?record.loaded/record.selection.plan.bytes*100:0;check.disabled=!!record;}});view.cleanups.push(un,()=>{if(busy)record?.controller?.abort();});}
  return view;
}
export function chooseFiles(manager,sessionId,folder=false,target='conversation'){
  if(manager.preferences.mode==='path')return pathDialog(manager,sessionId,target);
  const input=el('input','ba-hidden');input.type='file';input.multiple=true;if(folder)input.setAttribute('webkitdirectory','');document.body.append(input);
  input.addEventListener('change',()=>{const files=[...input.files];input.remove();if(!folder&&target==='conversation'&&manager.onNativeImages&&files.every(isRaster)){try{manager.onNativeImages(sessionId,files);}catch(e){notice(e.message);}return;}const selection=pickList(files);if(selection.files.length)void reviewDialog(manager,sessionId,selection,target).catch(e=>notice(e.message));},{once:true});
  input.addEventListener('cancel',()=>input.remove(),{once:true});input.click();
}
export function mountToolbar(node,manager,getSession){
  node.classList.add('ba-toolbar');const render=()=>node.replaceChildren(button(t('files'),()=>chooseFiles(manager,getSession()),'ba-button ba-quiet','clip'),button(t('folder'),()=>chooseFiles(manager,getSession(),true),'ba-button ba-quiet','folder'),button(t('history'),()=>{void showHistory(manager,getSession()).catch(e=>notice(e.message));},'ba-button ba-quiet','clock'),button(t('settings'),()=>{const view=dialog(t('settings'));view.cleanups.push(mountSettings(view.body,manager));},'ba-icon','settings'));
  render();return()=>node.replaceChildren();
}
export function recordCard(manager,r){
  if(r.mode==='path')return pathCard(manager,r);
  const card=el('article','ba-card');card.dataset.record=r.id;card.dataset.status=r.status;
  const pict=el('div','ba-card-glyph');
  const image=r.selection.files.length===1&&r.selection.files[0].file&&isRaster(r.selection.files[0].file)&&r.selection.files[0].file.size<=20*1024**2;
  if(image){if(!r.thumb){r.thumb=URL.createObjectURL(r.selection.files[0].file);r.urls.push(r.thumb);}const img=el('img');img.src=r.thumb;img.alt='';pict.append(img);}else pict.append(icon(r.selection.folder?'folder':fileGlyph(r.selection.files[0])));
  const main=el('div','ba-card-main'),name=button(r.label,()=>{const v=dialog(r.label,`${r.selection.files.length} ${t('fileCount')} · ${formatBytes(r.selection.plan.bytes)}`);v.body.append(fileList(r.selection,item=>showPreview({...item,type:item.file?.type??item.type},bounded=>manager.client(r.sessionId).blob(r.receipt,item.index,bounded))));},'ba-card-title');name.title=r.label;
  main.append(name,el('div','ba-card-meta',`${r.selection.files.length} ${t('fileCount')} · ${formatBytes(r.selection.plan.bytes)} · ${t(r.status)}`));
  if(r.status==='uploading'){const p=el('progress','ba-progress');p.max=r.selection.plan.bytes||1;p.value=r.loaded;main.append(p);}
  if(r.error)main.append(el('div','ba-error',r.error));
  if(['error','cancelled'].includes(r.status))main.append(button(t('retryPrepare'),()=>{void manager.client(r.sessionId).send(r).catch(e=>notice(e.message));},'ba-button ba-link')); 
  const actions=el('div','ba-card-actions');
  if(r.status==='uploading')actions.append(button(t('cancel'),()=>r.controller?.abort(),'ba-icon','close'));
  else actions.append(button(t('remove'),()=>manager.remove(r).catch(e=>notice(e.message)),'ba-icon','close'));
  card.append(pict,main,actions);return card;
}
export function mountRail(node,manager,getSession,getVisible){
  node.classList.add('ba-rail');
  const render=()=>{
    const previous=document.activeElement,focusId=previous?.closest('[data-record]')?.dataset.record,focusText=previous?.textContent;
    node.replaceChildren();const ids=getVisible?.();
    for(const r of manager.records.values())if(r.sessionId===getSession()&&r.target==='conversation'&&(!ids?!r.removed:ids.includes(r.id)))node.append(recordCard(manager,r));
    if(focusId&&focusText){const card=node.querySelector(`[data-record="${focusId}"]`);[...(card?.querySelectorAll('button')??[])].find(b=>b.textContent===focusText)?.focus({preventScroll:true});}
  };
  render();const un=manager.subscribe(render);return()=>{un();node.replaceChildren();};
}
export async function showHistory(manager,sessionId){
  if(!sessionId)throw new Error(t('noSession'));
  const view=dialog(t('archiveTitle'),t('historyHint'));view.body.append(el('p','ba-muted',t('preparing')));
  const client=manager.client(sessionId),result=await client.json('/history');if(!view.d.isConnected)return;view.body.replaceChildren();
  const savedPaths=await client.json('/references');if(!view.d.isConnected)return;
  if(!result.receipts.length&&!savedPaths.references.length)view.body.append(el('p','ba-muted',t('empty')));
  for(const ref of savedPaths.references){const row=el('div','ba-history-card');row.append(el('strong','',ref.name),el('p','ba-caption',ref.path),button(t('reattach'),async()=>{try{const {reference}=await client.json('/references/'+ref.id);await manager.attachPathReference(sessionId,reference);view.d.close();}catch(e){notice(e.message);}},'ba-button ba-link','link'));view.body.append(row);}

  for(const receipt of result.receipts){const details=el('details','ba-history-card');details.append(el('summary','',`${receipt.files[0]?.path.split('/')[0]??'Folder'} · ${receipt.files.length} ${t('fileCount')} · ${formatBytes(receipt.bytes)}`),el('p','ba-caption',receipt.committedAt),button(t('reattach'),()=>{void manager.attachSaved(sessionId,receipt).then(()=>view.d.close()).catch(e=>notice(e.message));},'ba-button ba-link','clip'));
    details.addEventListener('toggle',()=>{if(details.open&&!details.dataset.loaded){details.dataset.loaded='1';details.append(fileList({files:receipt.files,directories:receipt.directories},item=>showPreview(item,bounded=>client.blob(receipt,item.index,bounded))));}},{once:false});view.body.append(details);
  }
  view.footer.append(button(t('clear'),()=>{const confirm=dialog(t('confirmDelete'),t('deleteHint'));confirm.footer.append(button(t('cancel'),()=>confirm.d.close(),'ba-button'),button(t('confirm'),async()=>{try{await client.json('/cleanup/session',{method:'POST',body:{confirm:'DELETE ATTACHMENTS'}});confirm.d.close();view.d.close();notice(t('cleanup'));}catch(e){notice(e.message);}},'ba-button ba-danger'));},'ba-button ba-danger'));
}
/** Geometry comes from a mounted sidebar marker, never an assumed left pixel threshold. */
export function sidebarContainer(marker){
  let result=marker;for(let n=marker;n&&n!==document.body;n=n.parentElement){const r=n.getBoundingClientRect();if(r.width<=600&&r.width>=40&&r.height>=innerHeight*.45)result=n;else if(r.width>600)break;}return result;
}
export function bindDrops({manager,getSession,getSidebar,getConversation,nativeImages=true}){
  const overlay=el('div','ba-drop-overlay');overlay.hidden=true;overlay.setAttribute('aria-hidden','true');document.body.append(overlay);
  let scanController=null,hideTimer=null,suppressed=false;
  const hide=()=>{overlay.hidden=true;clearTimeout(hideTimer);};
  const within=(node,e)=>{if(!node)return false;const r=node.getBoundingClientRect();return r.width>0&&r.height>0&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;};
  const target=e=>{
    if(e.target?.closest?.('dialog,[aria-modal="true"]'))return null;
    const sidebar=getSidebar?.();if(within(sidebar,e))return{kind:'workspace',node:sidebar};
    const conv=getConversation?.();if(within(conv,e))return{kind:'conversation',node:conv};return null;
  };
  const show=(destination)=>{const r=destination.node.getBoundingClientRect();Object.assign(overlay.style,{left:r.left+6+'px',top:r.top+6+'px',width:Math.max(0,r.width-12)+'px',height:Math.max(0,r.height-12)+'px'});overlay.replaceChildren(icon(destination.kind==='workspace'?'folder':'clip'),el('strong','',t(destination.kind==='workspace'?'dropWorkspace':'dropChat')),el('span','',t(manager.preferences.mode==='path'?'pathDrop':'dropSub')));overlay.hidden=false;};
  const over=e=>{
    if(!isExternalFiles(e.dataTransfer))return;const dest=target(e);if(!dest||suppressed)return;
    if(dest.kind==='conversation'&&(!getSession()||!manager.isEditable(getSession())))return;
    const items=[...(e.dataTransfer.items??[])].filter(i=>i.kind==='file');
    if(manager.preferences.mode!=='path'&&dest.kind==='conversation'&&nativeImages&&items.length&&items.every(i=>isRaster(i)))return;
    e.preventDefault();e.dataTransfer.dropEffect='copy';show(dest);clearTimeout(hideTimer);hideTimer=setTimeout(hide,200);
  };
  const drop=e=>{
    const dest=target(e);hide();if(!isExternalFiles(e.dataTransfer)||!dest)return;
    if(suppressed){e.preventDefault();e.stopImmediatePropagation();suppressed=false;return;}
    const captured=captureDrop(e.dataTransfer);
    if(manager.preferences.mode!=='path'&&dest.kind==='conversation'&&nativeImages&&!captured.hasDirectory&&captured.files.length&&captured.files.every(isRaster))return;
    e.preventDefault();e.stopImmediatePropagation();
    const sessionId=dest.kind==='workspace'?'@workspace-import':getSession();
    if(dest.kind==='conversation'&&(!sessionId||!manager.isEditable(sessionId))){notice(t('blocked'));return;}
    if(manager.preferences.mode==='path'){pathDialog(manager,sessionId,dest.kind);return;}
    // Bind destination before asynchronous directory enumeration. Navigation cannot retarget the result.
    scanController?.abort();const ctrl=new AbortController();scanController=ctrl;
    const dismiss=notice(t('scanning'),t('cancel'),()=>ctrl.abort());
    void readDrop(captured,{signal:ctrl.signal}).then(s=>{ctrl.signal.throwIfAborted();return reviewDialog(manager,sessionId,s,dest.kind);}).catch(error=>{if(error.name!=='AbortError')notice(error.message);}).finally(()=>{dismiss();if(scanController===ctrl)scanController=null;});
  };
  const key=e=>{if(e.key==='Escape'&&!overlay.hidden){suppressed=true;hide();scanController?.abort();}};
  const end=()=>{hide();suppressed=false;};
  document.addEventListener('dragover',over,true);document.addEventListener('drop',drop,true);document.addEventListener('keydown',key,true);document.addEventListener('dragend',end,true);window.addEventListener('blur',end);
  return()=>{scanController?.abort();hide();overlay.remove();document.removeEventListener('dragover',over,true);document.removeEventListener('drop',drop,true);document.removeEventListener('keydown',key,true);document.removeEventListener('dragend',end,true);window.removeEventListener('blur',end);};
}

export function registerExisting(manager) {
  const view=dialog(t('existing'),t('existingHint')), label=el('label','ba-caption',t('path')), input=el('input','ba-search'),error=el('p','ba-error');
  input.type='text';input.placeholder='/absolute/path/on/dsh-host';input.setAttribute('aria-label',t('path'));label.append(input);view.body.append(label,error);
  const submit=button(t('register'),async()=>{submit.disabled=true;error.textContent='';try{
    const value=await manager.client('@workspace-import').json('/workspaces/register',{method:'POST',body:{path:input.value.trim()}});
    notice(t('importSuccess'));view.d.close();if(manager.onOpenWorkspace)await manager.onOpenWorkspace(value.workspace);
  }catch(e){error.textContent=e.message;}finally{submit.disabled=false;}},'ba-button ba-primary','folder');
  view.footer.append(button(t('cancel'),()=>view.d.close(),'ba-button'),submit);input.focus();return view;
}

export function mountSettings(node,manager){
  node.classList.add('ba-settings','ba-toolbar');
  const render=()=>{
    const focused=node.contains(document.activeElement)?document.activeElement.value:null;
    node.replaceChildren();const hero=el('div','ba-settings-hero');hero.append(el('strong','','Better Attach'),el('p','ba-muted',t('nativeHint')));node.append(hero);
    for(const [key,values] of [['mode',['copy','path']],['theme',['plain','official','character']]]){
      const group=el('fieldset','ba-options');group.append(el('legend','',t(key)));
      for(const value of values){const label=el('label','ba-option'),radio=el('input');radio.type='radio';radio.name='ba-'+key;radio.value=value;radio.checked=manager.preferences[key]===value;radio.addEventListener('change',()=>{try{manager.setPreferences({[key]:value});}catch(e){notice(t('saveFailed')+': '+e.message);}});label.append(radio,el('span','',t(key==='mode'?value+'Mode':value)));group.append(label);}
      group.append(el('p','ba-caption',t(key+'Hint')));node.append(group);
    }
    if(focused)[...node.querySelectorAll('input')].find(x=>x.value===focused)?.focus();
  };render();const un=manager.subscribe(render);return()=>{un();node.replaceChildren();};
}
export function pathDialog(manager,sessionId,target='conversation'){
  if(target==='workspace')return registerExisting(manager);
  const view=dialog(t('reference'),t('pathHint')),input=el('input','ba-search'),error=el('p','ba-error');input.placeholder='/absolute/path';input.setAttribute('aria-label',t('pathLabel'));view.body.append(input,error);
  const submit=button(t('addPath'),async()=>{submit.disabled=true;try{await manager.addPath(sessionId,input.value.trim());view.d.close();}catch(e){error.textContent=e.message;}finally{submit.disabled=false;}},'ba-button ba-primary','link');
  view.footer.append(button(t('cancel'),()=>view.d.close(),'ba-button'),submit);input.focus();return view;
}
export function pathCard(manager,r){
  const card=el('article','ba-card');card.dataset.record=r.id;const glyph=el('div','ba-card-glyph');glyph.append(icon(r.reference.directory?'folder':fileGlyph(r.reference)));
  const main=el('div','ba-card-main');main.append(button(r.label,async()=>{
    if(r.reference.directory){const view=dialog(r.label,t('emptyDirectory'));view.body.append(el('pre','ba-path',r.reference.path));return;}
    const client=manager.client(r.sessionId);const mime={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp'}[r.reference.name.split('.').at(-1).toLowerCase()]??'';
    await showPreview({...r.reference,type:mime},async bounded=>{const res=await fetch(client.base+'/references/'+r.reference.id+'/file'+(bounded?'?preview=1':''),{headers:client.headers()});if(!res.ok)throw new Error(t('pathMissing'));return res.blob();});
  },'ba-card-title'),el('p','ba-card-meta',t('referenceReady')+' · '+r.reference.path));card.append(glyph,main,button(t('copyPath'),async()=>{try{await navigator.clipboard.writeText(r.reference.path);notice(t('pathCopied'));}catch(e){notice(e.message);}},'ba-icon','link'),button(t('remove'),()=>manager.remove(r).catch(e=>notice(e.message)),'ba-icon','close'));return card;
}
