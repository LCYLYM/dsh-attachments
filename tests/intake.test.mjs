import test from 'node:test';import assert from 'node:assert/strict';
import {captureDrop,readDrop,pickList,reviewSelection,isExternalFiles} from '../lib/intake.js';
const fileEntry=(name,text='x')=>({name,isFile:true,isDirectory:false,file:done=>done(new File([text],name,{type:'text/plain'}))});
function directory(name,pages){return{name,isDirectory:true,isFile:false,createReader(){let i=0;return{readEntries:done=>done(pages[i++]??[])};}};}
test('drain more than 100 directory entries and preserve empty dirs',async()=>{
 const root=directory('p',[Array.from({length:100},(_,i)=>fileEntry('f'+i)),[fileEntry('f100'),directory('empty',[])]]);
 const result=await readDrop({entries:[root],files:[],hasDirectory:true});assert.equal(result.files.length,101);assert.deepEqual(result.directories,['p','p/empty']);
});
test('never enter default-excluded dependency folder',async()=>{
 const root=directory('p',[[{name:'node_modules',isDirectory:true,createReader(){throw new Error('must not traverse');}},fileEntry('.env'),fileEntry('.env.example')]]);
 const raw=await readDrop({entries:[root],files:[],hasDirectory:true});assert.equal(raw.skipped.length,1);
 assert.equal(reviewSelection(raw).files.length,1);assert.equal(reviewSelection(raw,true).files.length,2);assert.equal(raw.skipped[0].reason,'generated');
});
test('aborted scan produces no partial accepted selection',async()=>{const c=new AbortController();c.abort();await assert.rejects(readDrop({entries:[fileEntry('x')],files:[]},{signal:c.signal}),{name:'AbortError'});});
test('picker fallback preserves relative path but admits empty-dir limitation',()=>{const f=new File(['x'],'x');Object.defineProperty(f,'webkitRelativePath',{value:'p/a/x'});const s=pickList([f]);assert.equal(s.files[0].path,'p/a/x');assert.deepEqual(s.directories,['p/a','p']);assert.equal(s.emptyDirectoriesSupported,false);});
test('capture DataTransfer entries synchronously, ignore internal text drags',()=>{let called=0;const dt={types:['Files'],items:[{kind:'file',webkitGetAsEntry(){called++;return directory('p',[]);}}],files:[]};assert.equal(captureDrop(dt).hasDirectory,true);assert.equal(called,1);assert.equal(isExternalFiles({types:['text/plain'],items:[{kind:'string'}]}),false);assert.equal(isExternalFiles(dt),true);});
test('fallback supports browser FileList without directory API',async()=>{const f=new File(['x'],'x.txt');const r=await readDrop({entries:[],files:[f]});assert.equal(r.files[0].file,f);assert.equal(r.emptyDirectoriesSupported,false);});
