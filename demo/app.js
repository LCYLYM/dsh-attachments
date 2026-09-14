import { AttachmentManager, mountToolbar, mountRail, bindDrops, chooseFiles, showHistory, reviewDialog, button, el, dialog, t, notice } from '../lib/ui.js';
import { modelMessage } from '../lib/policy.js';
window.BETTER_ATTACH_LOCALE='zh';let sessionId='conversation-a';const drafts=new Map(),$=s=>document.querySelector(s);
const manager=new AttachmentManager({isEditable:()=>!$('#send').disabled,onOpenWorkspace:async workspace=>{await updateWorkspaces();notice(`工作区 ${workspace.title} 已注册到演示夹具；这里不创建真实 DSH 对话。`);}});
mountToolbar($('#toolbar'),manager,()=>sessionId);mountRail($('#rail'),manager,()=>sessionId);
$('#sidebar-import').append(button(t('import'),()=>chooseFiles(manager,'@workspace-import',true,'workspace'),'ba-button ba-quiet ba-sidebar-button','folder'));
bindDrops({manager,getSession:()=>sessionId,getSidebar:()=>$('#sidebar'),getConversation:()=>$('#conversation'),nativeImages:true});
// Explicit native-event witness, not a fake native model adapter.
let nativeDrops=0;document.addEventListener('drop',e=>{if(e.defaultPrevented)return;if([...(e.dataTransfer?.files??[])].length){e.preventDefault();nativeDrops++;notice('原生图片事件已放行（测试见证）。夹具没有 DSH 图像/模型通道，不伪造回复。');}});
document.addEventListener('dragover',e=>{if([...(e.dataTransfer?.types??[])].includes('Files'))e.preventDefault();});
async function projectSelection(){
  const files=[['aurora-ui/README.md','# Aurora UI\n\nLocal test project.\n\nThe folder stays structured when attached.'],['aurora-ui/src/App.tsx','export function App() {\n  return <main>Hello, attachments.</main>;\n}\n'],['aurora-ui/src/theme.css',':root { color-scheme: light dark; }\n'],['aurora-ui/package.json','{"name":"aurora-ui","private":true}\n'],['aurora-ui/.env','DEMO_SECRET=not-a-real-secret\n']].map(([path,text])=>({path,file:new File([text],path.split('/').at(-1),{type:'text/plain',lastModified:0})}));
  return{files,directories:['aurora-ui','aurora-ui/src','aurora-ui/empty'],skipped:[{path:'aurora-ui/node_modules/',reason:'generated',directory:true}],folder:true,emptyDirectoriesSupported:true};
}
$('#sample-project').onclick=async()=>reviewDialog(manager,sessionId,await projectSelection());
$('#sample-files').onclick=async()=>{
  const png=await(await fetch('/demo/preview-fixture.png')).blob();
  const selection={files:[{path:'layout-review.png',file:new File([png],'layout-review.png',{type:'image/png',lastModified:0})},{path:'design-notes.md',file:new File(['# Design review\n\n- Keep the file structure.\n- Review before copying.\n- Do not hijack native image drops.\n'],'design-notes.md',{type:'text/markdown',lastModified:0})}],directories:[],skipped:[],folder:false};
  await reviewDialog(manager,sessionId,selection);
};
$('#send').onclick=async()=>{
  const sid=sessionId,text=$('#draft').value,records=[...manager.records.values()].filter(r=>r.sessionId===sid&&!r.removed&&!r.sent);
  if(!records.length&&!text.trim()){notice('先选择一些文件，再验证传输。');return;}
  $('#send').disabled=true;
  try{
    const receipts=[];for(const r of records)receipts.push({text:await manager.serialize(r.id),count:r.mode==='path'?0:r.selection.files.length});
    for(const r of records){r.sent=true;r.removed=true;}
    drafts.set(sid,'');if(sessionId===sid)$('#draft').value='';
    const msg=el('article','receipt-message');msg.append(el('h3','',`真实落盘完成 · ${receipts.reduce((s,r)=>s+r.count,0)} 个文件`),el('p','fixture-response','未连接模型。这是服务器返回的文件清单，不是 AI 的模拟回复。'));
    for(const receipt of receipts)msg.append(el('pre','',receipt.text));$('#messages').append(msg);manager.changed();
  }catch(e){notice(e.name==='AbortError'?t('cancelHint'):e.message);}finally{$('#send').disabled=false;}
};
$('#draft').addEventListener('input',()=>drafts.set(sessionId,$('#draft').value));
for(const b of document.querySelectorAll('[data-session]'))b.onclick=()=>{drafts.set(sessionId,$('#draft').value);sessionId=b.dataset.session;$('#draft').value=drafts.get(sessionId)??'';document.querySelectorAll('[data-session]').forEach(n=>n.classList.toggle('selected',n===b));$('#conversation-title').textContent=b.dataset.session==='conversation-a'?'附件交互验收':'另一段对话';manager.changed();};
$('#new-chat').onclick=()=>document.querySelector('[data-session="conversation-b"]').click();
$('#theme').onclick=()=>document.body.classList.toggle('ba-dark');
$('#locale').onclick=()=>{window.BETTER_ATTACH_LOCALE=window.BETTER_ATTACH_LOCALE==='zh'?'en':'zh';$('#locale').textContent=window.BETTER_ATTACH_LOCALE==='zh'?'EN':'中文';mountToolbar($('#toolbar'),manager,()=>sessionId);manager.changed();};
$('#test-note').onclick=()=>{const v=dialog('验收范围','同一套 UI、上传客户端、HTTP 路由和文件存储。');v.body.append(el('p','','实际运行：选择、预览、目录检查、字节上传、哈希、取消、重试、工作区副本、附件记录。'),el('p','','替身：DSH 的工作区注册表。未运行：真实 DSH 启动、模型对话、macOS Finder / Windows Explorer 人工拖拽。'))};
async function updateWorkspaces(){const response=await fetch('/fixture/workspaces'),data=await response.json();for(const w of data.workspaces){if(!document.getElementById('w-'+w.workspaceId)){const row=el('div','workspace-row',`▱  ${w.title}`);row.id='w-'+w.workspaceId;row.title=w.path;$('#workspaces').append(row);}}}
manager.subscribe(()=>{if([...manager.records.values()].some(r=>r.target==='workspace'&&r.receipt))void updateWorkspaces();});
await updateWorkspaces();
window.__BA_FIXTURE__={manager,get sessionId(){return sessionId},get nativeDrops(){return nativeDrops},projectSelection,reviewDialog};
