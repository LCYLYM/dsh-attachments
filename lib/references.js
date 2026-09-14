/** Explicit host-path references; no copies, writes or deletion of referenced files. */
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { assert } from './policy.js';
export class PathReferences {
  constructor(store){this.store=store;this.root=path.join(store.stateRoot,'references');}
  async create(sessionId,input){
    assert(sessionId!=='@workspace-import','scope','Use workspace registration for directories',403);
    await this.store.sessionRoot(sessionId);
    assert(typeof input==='string'&&path.isAbsolute(input),'absolute-path','Enter an absolute path on the DSH host');
    const resolved=await fs.realpath(input),stat=await fs.stat(resolved);
    assert(stat.isFile()||stat.isDirectory(),'file-type','Only regular files and directories can be referenced');
    const record={id:randomUUID(),sessionId,path:resolved,name:path.basename(resolved),directory:stat.isDirectory(),size:stat.size,dev:stat.dev,ino:stat.ino,createdAt:new Date().toISOString()};
    await fs.mkdir(this.root,{recursive:true,mode:0o700});
    await fs.writeFile(path.join(this.root,record.id+'.json'),JSON.stringify(record),{flag:'wx',mode:0o600});
    return record;
  }
  async list(sessionId){
    await this.store.sessionRoot(sessionId);let names;try{names=await fs.readdir(this.root);}catch(e){if(e.code==='ENOENT')return [];throw e;}
    const records=[];for(const name of names){if(!/^[a-f0-9-]{36}\.json$/.test(name))continue;const record=JSON.parse(await fs.readFile(path.join(this.root,name),'utf8'));if(record.sessionId===sessionId)records.push(record);}
    return records.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,200);
  }
  async get(sessionId,id){
    await this.store.sessionRoot(sessionId);
    assert(typeof id==='string'&&/^[a-f0-9-]{36}$/.test(id),'reference-id','Invalid reference');
    const record=JSON.parse(await fs.readFile(path.join(this.root,id+'.json'),'utf8'));
    assert(record.sessionId===sessionId,'session-mismatch','Reference belongs to another session',403);
    const resolved=await fs.realpath(record.path),stat=await fs.stat(resolved);
    assert(resolved===record.path&&stat.dev===record.dev&&stat.ino===record.ino,'path-changed','Referenced path was replaced. Add it again.',409);
    return {...record,size:stat.size};
  }
  async open(sessionId,id){
    const record=await this.get(sessionId,id);assert(!record.directory,'directory','A directory cannot be downloaded');
    const handle=await fs.open(record.path,constants.O_RDONLY|(constants.O_NOFOLLOW??0));
    const stat=await handle.stat();
    if(stat.dev!==record.dev||stat.ino!==record.ino){await handle.close();assert(false,'path-changed','Referenced file was replaced',409);}
    return {handle,record};
  }
}
