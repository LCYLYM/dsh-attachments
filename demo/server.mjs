/** Integration fixture: REAL file storage/HTTP/UI, STUB DSH workspace registry, NO model. */
import http from 'node:http';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { AttachmentStore } from '../lib/store.js';
import { createHandler, API, reply } from '../lib/http.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=path.resolve(process.env.BA_DEMO_ROOT??path.join(os.tmpdir(),'better-attach-demo'));
await fs.mkdir(data,{recursive:true});
const sessions=new Map();for(const id of ['conversation-a','conversation-b']){const p=path.join(data,id);await fs.mkdir(p,{recursive:true});sessions.set(id,p);}
const registryFile=path.join(data,'fixture-workspaces.json');let workspaces=[];try{workspaces=JSON.parse(await fs.readFile(registryFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const store=new AttachmentStore({stateRoot:path.join(data,'records'),workspaceRoot:path.join(data,'imports'),resolveSession:id=>sessions.get(id),registerWorkspace:async folder=>{let workspace=workspaces.find(w=>w.path===folder);const created=!workspace;if(!workspace){workspace={workspaceId:randomUUID(),path:folder,title:path.basename(folder),sessionIds:[]};workspaces.push(workspace);await fs.writeFile(registryFile,JSON.stringify(workspaces,null,2));}return{workspace,created};}});
const handler=createHandler(store);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.gif':'image/gif','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://local');
  if(u.pathname.startsWith(API))return handler(req,res);
  if(u.pathname==='/fixture/workspaces')return reply(res,200,{workspaces,fixture:true});
  if(u.pathname==='/fixture/info')return reply(res,200,{fixture:true,model:false,dataRoot:data});
  let name=u.pathname==='/'?'demo/index.html':u.pathname.slice(1);
  if(!/^(demo\/|lib\/|src\/|docs\/assets\/)/.test(name)||name.includes('..')||name.includes('\\')){res.writeHead(404);res.end();return;}
  try{const file=path.join(root,name);const buf=await fs.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]??'application/octet-stream','cache-control':'no-store'});res.end(buf);}catch{res.writeHead(404);res.end('Not found');}
});
const port=Number(process.env.PORT??4173);server.listen(port,'127.0.0.1',()=>console.log(`Better Attach integration fixture: http://127.0.0.1:${server.address().port}\nREAL storage: ${data}\nDSH registry is a fixture, not the real runtime. No model is called.`));
