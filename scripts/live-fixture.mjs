/** Only mounted by live-dsh-smoke.mjs in a disposable test profile. */
import * as fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
export const inject=['webServer','workspaceController','sessionController','sessions','clientModules'];
export async function apply(ctx,config){
 const checks=[];const run=async(name,fn)=>{await fn();checks.push({name,status:'passed'});};
 try{
  const base='http://127.0.0.1:'+ctx.webServer.port,api=base+'/community-multimedia-webui-input/v2';
  const call=async(route,{session='@workspace-import',method='GET',body,raw=false}={})=>{const res=await fetch(api+route,{method,headers:{'x-better-attach':'1','x-ba-session':session,...(body&&!raw?{'content-type':'application/json'}:{})},body:body?(raw?body:JSON.stringify(body)):undefined});const data=await res.json();assert.equal(res.status,200,JSON.stringify(data));return data;};
  await run('real client boot graph includes Better Attach with resolvable dependencies',async()=>{
    const graph=ctx.clientModules.graph(),entry=graph.entries.find(e=>e.id==='dsh-multimedia-webui-input');assert.ok(entry);
    for(const dep of entry.inject)assert.ok(graph.entries.some(e=>e.id===dep),'missing dependency '+dep);
    const res=await fetch(base+entry.url);assert.equal(res.status,200);const code=await res.text();assert.ok(code.includes('Reference original path'));assert.ok(code.includes('ba-settings-hero'));
  });
  const cwd=path.join(config.root,'workspace');await fs.mkdir(cwd,{recursive:true});
  let session;
  await run('real DSH session creation',async()=>{session=(await ctx.sessionController.create({cwd})).sessionId;assert.ok(ctx.sessions.get(session));});
  await run('registered plugin HTTP health',async()=>{const h=await call('/health');assert.equal(h.workspaceRegistration,true);});
  const bytes=Buffer.from('Better Attach live DSH integration\n中文验证\n'),id=randomUUID();
  await run('copy mode upload and commit into real session cwd',async()=>{
   await call('/batches',{session,method:'POST',body:{id,sessionId:session,target:'conversation',files:[{path:'demo/readme.txt',size:bytes.length,type:'text/plain',lastModified:0}],directories:['demo','demo/empty']}});
   await call('/batches/'+id+'/files/0',{session,method:'PUT',body:bytes,raw:true});
   const receipt=await call('/batches/'+id+'/commit',{session,method:'POST'});
   assert.deepEqual(await fs.readFile(path.join(receipt.root,'demo/readme.txt')),bytes);assert.ok((await fs.stat(path.join(receipt.root,'demo/empty'))).isDirectory());
  });
  await run('history uses the real session',async()=>{assert.equal((await call('/history',{session})).receipts.length,1);});
  const original=path.join(cwd,'original.txt');await fs.writeFile(original,'original');let reference;
  await run('path mode references original without copying',async()=>{reference=(await call('/references',{session,method:'POST',body:{path:original}})).reference;assert.equal(reference.path,original);const res=await fetch(api+'/references/'+reference.id+'/file',{headers:{'x-better-attach':'1','x-ba-session':session}});assert.equal(await res.text(),'original');await fs.writeFile(original,'edited');assert.equal((await call('/references/'+reference.id,{session})).reference.size,6);});
  await run('original directory registers with real DSH workspace controller',async()=>{const r=await call('/workspaces/register',{method:'POST',body:{path:cwd}});assert.ok(r.workspace.workspaceId);assert.equal(r.workspace.path,cwd);});
  await run('folder copy registers as real DSH workspace',async()=>{const wid=randomUUID();await call('/batches',{method:'POST',body:{id:wid,sessionId:'@workspace-import',target:'workspace',files:[{path:'imported/a.txt',size:bytes.length,type:'text/plain',lastModified:0}],directories:['imported','imported/empty']}});await call('/batches/'+wid+'/files/0',{method:'PUT',body:bytes,raw:true});const r=await call('/batches/'+wid+'/commit',{method:'POST'});assert.ok(r.workspace.workspaceId);assert.deepEqual(await fs.readFile(path.join(r.workspace.path,'a.txt')),bytes);});
  await run('session cleanup preserves path originals',async()=>{await call('/cleanup/session',{session,method:'POST',body:{confirm:'DELETE ATTACHMENTS'}});assert.equal(await fs.readFile(original,'utf8'),'edited');});
  await fs.writeFile(config.result,JSON.stringify({ok:true,checks},null,2));
 }catch(e){await fs.writeFile(config.result,JSON.stringify({ok:false,checks,error:e.stack},null,2));}
}
