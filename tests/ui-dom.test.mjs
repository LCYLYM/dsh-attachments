/** DOM simulation tests, not real-browser acceptance. */
import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
import {AttachmentManager,mountSettings,mountToolbar,pathDialog,recordCard,bindDrops} from '../lib/ui.js';
import {createDshPlugin} from '../src/dsh-client.js';
const dom=new JSDOM('<!doctype html><html><head></head><body></body></html>',{url:'http://127.0.0.1:3080',pretendToBeVisual:true});
for(const key of ['document','window','localStorage','HTMLElement','HTMLDialogElement','MouseEvent','Event'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});
globalThis.innerHeight=900;
dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
const reset=()=>{document.body.replaceChildren();localStorage.clear();delete document.documentElement.dataset.baTheme;};
test('mode and appearance controls persist, rerender and restore no-image mode',()=>{reset();const manager=new AttachmentManager(),node=document.createElement('div');document.body.append(node);const dispose=mountSettings(node,manager);node.querySelector('input[value=path]').click();assert.equal(manager.preferences.mode,'path');node.querySelector('input[value=character]').click();assert.equal(document.documentElement.dataset.baTheme,'character');assert.equal(new AttachmentManager().preferences.theme,'character');node.querySelector('input[value=plain]').click();assert.equal(document.documentElement.dataset.baTheme,'plain');dispose();assert.equal(node.childElementCount,0);manager.dispose();});
test('path dialog validates asynchronously and displays errors without dismissing input',async()=>{reset();const manager=new AttachmentManager();manager.addPath=async()=>{throw new Error('Path does not exist');};const view=pathDialog(manager,'session');view.body.querySelector('input').value='/missing';view.footer.querySelector('.ba-primary').click();await new Promise(r=>setTimeout(r,0));assert.match(view.body.textContent,/Path does not exist/);assert.equal(view.d.open,true);assert.equal(view.footer.querySelector('.ba-primary').disabled,false);view.d.close();manager.dispose();});
test('toolbar opens settings with accessible controls and releases subscription',()=>{reset();const manager=new AttachmentManager(),node=document.createElement('div');document.body.append(node);const dispose=mountToolbar(node,manager,()=> 's');node.querySelector('.ba-icon').click();assert.equal(document.querySelectorAll('dialog input[type=radio]').length,5);document.querySelector('dialog').close();dispose();assert.equal(manager.listeners.size,0);manager.dispose();});
test('path cards show original location and use a distinct file icon',()=>{reset();const manager=new AttachmentManager();const card=recordCard(manager,{id:'path:x',sessionId:'s',mode:'path',label:'report.csv',reference:{path:'/work/report.csv',name:'report.csv',directory:false},selection:{},urls:[]});document.body.append(card);assert.match(card.textContent,/\/work\/report.csv/);assert.ok(card.querySelector('svg'));manager.dispose();});
test('path-mode folder drop requests explicit path without enumerating or copying',()=>{reset();const manager=new AttachmentManager();manager.preferences.mode='path';const area=document.createElement('div');document.body.append(area);area.getBoundingClientRect=()=>({left:0,top:0,right:800,bottom:800,width:800,height:800});let enumerated=false;const dt={types:['Files'],items:[{kind:'file',type:'',webkitGetAsEntry:()=>({isDirectory:true,name:'folder',createReader:()=>{enumerated=true;throw new Error('must not enumerate');}}),getAsFile:()=>null}],files:[]};const dispose=bindDrops({manager,getSession:()=> 's',getConversation:()=>area,getSidebar:()=>null});const ev=new dom.window.MouseEvent('drop',{bubbles:true,cancelable:true,clientX:100,clientY:100});Object.defineProperty(ev,'dataTransfer',{value:dt});area.dispatchEvent(ev);assert.equal(ev.defaultPrevented,true);assert.equal(enumerated,false);assert.ok(document.querySelector('dialog input'));document.querySelector('dialog').close();dispose();manager.dispose();});
test('client mounts declared slots, coexists with native image drafts and disposes effects',()=>{reset();const effects=[],registrations=[],native=[];const input={state:{getSnapshot:()=>({phase:'plain',draft:'',draftRev:0,occurrences:[]})},addAttachments:ids=>{native.push(...ids);return true;}};const services={sessions:{scope:()=>({}),list:{getSnapshot:()=>({current:'s'})}},conversation:{input:{for:()=>input},createDrafts:(_id,files)=>files.map((file,i)=>({id:'native'+i,file})),releaseDraftAttachment(){}},inputTriggers:{registerSource:()=>()=>{}},slots:{inject:(_name,fn)=>{effects.push(fn());},register:(options,Component)=>{registrations.push({options,Component});return()=>{};}}};const ctx={get:key=>services[key],effect:fn=>effects.push(fn()),inject:(_deps,fn)=>fn({...ctx,slots:services.slots})};const plugin=createDshPlugin({createElement(){}},'');const {manager}=plugin.apply(ctx);assert.deepEqual(registrations.map(x=>x.options.name),['conversation.input.left','conversation.input.dock','sidebar.footer.action','settings.section']);manager.onNativeImages('s',[{name:'image.png',type:'image/png'}]);assert.deepEqual(native,['native0']);for(const dispose of effects.reverse())dispose?.();assert.equal(document.querySelector('style[data-better-attach]'),null);assert.equal(document.documentElement.hasAttribute('data-ba-theme'),false);});

test('drop hint survives sparse events, preserves content, and clears on leave or cancellation',async()=>{
  reset();const manager=new AttachmentManager(),area=document.createElement('div');document.body.append(area);
  area.getBoundingClientRect=()=>({left:10,top:10,right:800,bottom:800,width:790,height:790});
  const dispose=bindDrops({manager,getSession:()=> 's',getConversation:()=>area,getSidebar:()=>null});
  const dt={types:['Files'],items:[{kind:'file',type:'text/plain'}]};
  const emit=(type,x=100,y=100,target=area)=>{const e=new dom.window.MouseEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y});Object.defineProperty(e,'dataTransfer',{value:dt});target.dispatchEvent(e);return e;};
  const paint=()=>new Promise(resolve=>window.requestAnimationFrame(resolve));
  try{
    assert.equal(emit('dragover').defaultPrevented,true);await paint();const hint=document.querySelector('.ba-drop-overlay'),label=hint.querySelector('strong');
    await new Promise(resolve=>setTimeout(resolve,350));assert.equal(hint.hidden,false);
    emit('dragleave');emit('dragover');await paint();assert.equal(hint.hidden,false);assert.equal(hint.querySelector('strong'),label);
    emit('dragover',900,850);assert.equal(hint.hidden,true);
    emit('dragover');emit('dragend');await paint();assert.equal(hint.hidden,true);
    emit('dragover');await paint();document.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));emit('dragover');await paint();assert.equal(hint.hidden,true);
    emit('dragend');emit('dragover');await paint();assert.equal(hint.hidden,false);
    emit('dragleave',0,0,document.documentElement);assert.equal(hint.hidden,true);
    emit('dragover');dispose();await paint();assert.equal(document.querySelector('.ba-drop-overlay'),null);
  }finally{dispose();manager.dispose();}
});

test('sidebar drop in both attachment modes opens original-directory registration without enumeration',()=>{
 for(const mode of ['copy','path']){
  reset();const manager=new AttachmentManager();manager.preferences.mode=mode;const area=document.createElement('div');document.body.append(area);area.getBoundingClientRect=()=>({left:0,top:0,right:200,bottom:800,width:200,height:800});let enumerated=false;
  const file={name:'project'},dt={types:['Files'],files:[file],items:[{kind:'file',getAsFile:()=>file,webkitGetAsEntry:()=>({name:'project',isDirectory:true,fullPath:'/project',createReader:()=>{enumerated=true;throw new Error('must not enumerate');}})}]};
  const dispose=bindDrops({manager,getSession:()=>null,getSidebar:()=>area,getConversation:()=>null});const ev=new dom.window.MouseEvent('drop',{bubbles:true,cancelable:true,clientX:100,clientY:100});Object.defineProperty(ev,'dataTransfer',{value:dt});area.dispatchEvent(ev);
  assert.equal(ev.defaultPrevented,true);assert.equal(enumerated,false);assert.equal(manager.records.size,0);const view=document.querySelector('dialog');assert.ok(view.querySelector('input[type=text]'));assert.equal(view.querySelector('input[type=checkbox]'),null);assert.equal(view.querySelector('.ba-file-list'),null);view.close();dispose();manager.dispose();
 }
});
