import test from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';
import {API,createHandler,checkRequest} from '../lib/http.js';import {fixture,plan} from './helpers.mjs';
test('loopback, Host, origin and custom header guards reject remote/CSRF requests',()=>{
 const good={socket:{remoteAddress:'127.0.0.1'},headers:{host:'localhost:1234','x-better-attach':'1',origin:'http://localhost:1234','sec-fetch-site':'same-origin'}};checkRequest(good);
 for(const bad of [{...good,socket:{remoteAddress:'10.0.0.1'}},{...good,headers:{...good.headers,host:'evil.example'}},{...good,headers:{...good.headers,origin:'https://evil.example'}},{...good,headers:{...good.headers,'x-better-attach':undefined}},{...good,headers:{...good.headers,'sec-fetch-site':'cross-site'}}])assert.throws(()=>checkRequest(bad));
});
test('real HTTP transfer, download headers, bounded preview, cleanup and failed requests',async t=>{
 const f=await fixture(t);const server=http.createServer(createHandler(f.store));await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));const base=`http://127.0.0.1:${server.address().port}${API}`;
 const headers={'x-better-attach':'1','x-ba-session':'a'};const request=(route,options={})=>fetch(base+route,{...options,headers:{...headers,...options.headers}});
 assert.equal((await request('/health')).status,200);assert.equal((await fetch(base+'/health')).status,403);
 assert.equal((await request('/batches',{method:'POST',body:'bad-json'})).status,400);
 const p=plan({names:['large.txt'],contents:['x'.repeat(200000)],directories:[]});
 let response=await request('/batches',{method:'POST',body:JSON.stringify(p.request)});assert.equal(response.status,200);
 assert.equal((await request(`/batches/${p.request.id}/files/0`,{method:'PUT',body:p.buffers[0]})).status,200);
 assert.equal((await request(`/batches/${p.request.id}/commit`,{method:'POST'})).status,200);
 response=await request(`/batches/${p.request.id}/files/0?preview=1`);assert.equal(response.headers.get('content-type'),'application/octet-stream');assert.match(response.headers.get('content-disposition'),/^attachment/);assert.equal((await response.arrayBuffer()).byteLength,128*1024);
 assert.equal((await request(`/batches/${p.request.id}/files/0`,{headers:{'x-ba-session':'b'}})).status,403);
 assert.equal((await request('/history').then(r=>r.json())).receipts.length,1);
 assert.equal((await request('/diagnostics').then(r=>r.json())).cwd,await import('node:fs/promises').then(fs=>fs.realpath(f.dirs.a)));
 assert.equal((await request('/workspaces/register',{method:'POST',body:JSON.stringify({path:f.dirs.a})})).status,403);
 assert.equal((await request('/cleanup/session',{method:'POST',body:JSON.stringify({confirm:'DELETE ATTACHMENTS'})})).status,200);
});
