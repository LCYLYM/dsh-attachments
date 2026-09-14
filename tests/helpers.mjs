import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { AttachmentStore } from '../lib/store.js';
export async function fixture(t, options={}) {
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'ba-test-'));
  const dirs={a:path.join(root,'a'),b:path.join(root,'b')};for(const dir of Object.values(dirs))await fs.mkdir(dir);
  const registry=new Map();let calls=0;
  const config={stateRoot:path.join(root,'records'),workspaceRoot:path.join(root,'workspaces'),resolveSession:id=>dirs[id],registerWorkspace:async p=>{calls++;if(!registry.has(p))registry.set(p,{workspaceId:randomUUID(),path:p,title:path.basename(p)});return{workspace:registry.get(p),created:calls===1};},...options};
  const store=new AttachmentStore(config);await store.ready;
  t.after(()=>fs.rm(root,{recursive:true,force:true}));
  return{root,dirs,registry,store,config,get calls(){return calls;},restart:()=>new AttachmentStore(config)};
}
export function plan({id=randomUUID(),sessionId='a',target='conversation',names=['project/a.txt','project/empty.txt'],contents=['hello',''],directories=['project','project/vacant']}={}) {
  const buffers=contents.map(s=>Buffer.from(s));
  return{request:{id,sessionId,target,files:names.map((p,i)=>({path:p,size:buffers[i].length,type:'text/plain',lastModified:0})),directories},buffers};
}
export async function upload(store,p){await store.create(p.request);for(let i=0;i<p.buffers.length;i++)await store.put(p.request.id,p.request.sessionId,i,Readable.from([p.buffers[i]]));return store.commit(p.request.id,p.request.sessionId);}
export const code=expected=>error=>error.code===expected;
export async function until(fn){for(let i=0;i<400;i++){if(fn())return;await new Promise(r=>setTimeout(r,5));}throw new Error('Timed out waiting for test condition');}
