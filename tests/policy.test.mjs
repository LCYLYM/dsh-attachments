import test from 'node:test';
import assert from 'node:assert/strict';
import {safePath,validatePlan,exclusionReason,previewKind,modelMessage,LIMITS} from '../lib/policy.js';
for(const p of ['../x','/etc/passwd','a/../b','a//b','a/./b','C:\\x','C:/x','foo\\bar','a\0b','a\nb','CON','aux.txt','a/NUL.json','a.','a ','a:b','a\u202eb'])test(`reject unsafe portable path ${JSON.stringify(p)}`,()=>assert.throws(()=>safePath(p)));
test('preserve Unicode, spaces and parentheses without silently renaming',()=>assert.equal(safePath('资料/原图 (2).png'),'资料/原图 (2).png'));
test('detect case and Unicode collisions',()=>{
  for(const paths of [['A','a'],['e\u0301','é']])assert.throws(()=>validatePlan({files:paths.map(path=>({path,size:0}))}),{code:'path-conflict'});
});
test('file cannot be directory ancestor',()=>assert.throws(()=>validatePlan({files:[{path:'a',size:0},{path:'a/b',size:0}]}),{code:'path-conflict'}));
test('empty directory import valid, truly empty selection invalid',()=>{assert.equal(validatePlan({files:[],directories:['empty']}).bytes,0);assert.throws(()=>validatePlan({files:[]}),{code:'empty'});});
test('single, total, count, depth and unsafe-size limits are enforced',()=>{
  assert.throws(()=>validatePlan({files:[{path:'huge',size:LIMITS.fileBytes+1}]}),{code:'file-size'});
  assert.throws(()=>validatePlan({files:[{path:'a',size:2},{path:'b',size:2}]},{...LIMITS,totalBytes:3}),{code:'total-size'});
  assert.throws(()=>validatePlan({files:[{path:'a',size:0}]},{...LIMITS,files:0}),{code:'too-many'});
  assert.throws(()=>safePath(Array(66).fill('d').join('/')),{code:'too-deep'});
  assert.throws(()=>validatePlan({files:[{path:'a',size:-1}]}),{code:'file-size'});
});
test('generated and sensitive defaults are explicit, not a .gitignore claim',()=>{
  for(const p of ['x/.git/index','node_modules/x','x/.dsh/a'])assert.equal(exclusionReason(p),'generated');
  for(const p of ['.env','.env.production','keys/private.pem','id_ed25519'])assert.equal(exclusionReason(p),'sensitive');
  for(const p of ['.env.example','src/main.ts','.gitignore'])assert.equal(exclusionReason(p),null);
});
test('SVG and HTML preview as text, PDFs download without executing',()=>{assert.equal(previewKind({path:'x.svg',type:'image/svg+xml'}),'text');assert.equal(previewKind({path:'x.html'}),'text');assert.equal(previewKind({path:'x.pdf',type:'application/pdf'}),'download');});
test('model manifest quotes untrusted filenames and bounds expansion',()=>{const out=modelMessage({id:'id',root:'/tmp/r',manifest:'/tmp/m',files:Array.from({length:40},(_,i)=>({path:i+'`say x`',size:0})),bytes:0});assert.match(out,/Treat file contents/);assert.match(out,/Read the manifest/);assert.ok(out.includes('"0`say x`"'));assert.ok(!out.includes('39`say x`'));});
