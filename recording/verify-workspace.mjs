/** Real host registration; browser drag events are synthesized and never claim OS acceptance. */
import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {chromium} from 'playwright';import {fixtureTree,dispatchDrop,safeOrigin} from './record.mjs';
const original=await fs.realpath(process.env.WORKSPACE_FIXTURE),tree=await fixtureTree(path.dirname(original));
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[],uploads=[];
const snapshot=async(dir)=>{const result=[];for(const item of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,item.name);result.push(item.isDirectory()?[item.name,await snapshot(p)]:[item.name,createHash('sha256').update(await fs.readFile(p)).digest('hex')]);}return result;};
const before=await snapshot(original);
try{
 const c=await browser.newContext({storageState:process.env.RECORD_STORAGE_STATE,viewport:{width:1280,height:800},locale:'zh-CN'}),page=await c.newPage();
 page.on('request',r=>{if(/\/batches(?:\/|$)/.test(new URL(r.url()).pathname)&&['POST','PUT'].includes(r.method()))uploads.push(r.method());});
 await page.goto(safeOrigin(process.env.DSH_URL).href);const marker=page.locator('[data-better-attach-sidebar]');await marker.waitFor();
 const close=async()=>page.locator('.ba-dialog-head .ba-icon').click();
 for(const mode of ['copy','path']){
  await page.locator('[data-better-attach-toolbar] .ba-icon').click();await page.locator(`.ba-dialog input[value="${mode}"]`).check();await close();
  const b=await marker.boundingBox();await page.evaluate(dispatchDrop,{x:b.x+20,y:b.y+12,tree:tree.filter(n=>n.name===path.basename(original)),phase:'drop'});
  const view=page.locator('.ba-dialog');await view.waitFor();assert.equal(await view.locator('.ba-file-list,input[type=checkbox],input[type=radio]').count(),0);
  await view.locator('input[type=text]').fill(original);await view.locator('.ba-primary').click();await page.getByRole('dialog',{name:'工作区已添加',exact:true}).waitFor();assert.equal(await page.locator('.ba-path').innerText(),original);await close();
  checks.push({name:`${mode} conversation mode registers original workspace`,status:'PASS'});
 }
 const b=await marker.boundingBox();await page.evaluate(({x,y,original})=>{
  const file=new File([],'folder'),dt=new DataTransfer();Object.defineProperty(file,'path',{value:original});dt.items.add(file);
  document.elementFromPoint(x,y).dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,clientX:x,clientY:y,dataTransfer:dt}));
 },{x:b.x+20,y:b.y+12,original});await page.getByRole('dialog',{name:'工作区已添加',exact:true}).waitFor();assert.equal(await page.locator('.ba-path').innerText(),original);await close();checks.push({name:'explicit absolute drop metadata registers original directly',status:'PASS'});
 assert.deepEqual(uploads,[]);assert.deepEqual(await snapshot(original),before);checks.push({name:'workspace registration uploads no file batches and preserves original tree',status:'PASS'});
 await fs.writeFile('artifacts/workspace-registration.json',JSON.stringify({realDSH:true,syntheticOSDrop:true,originalPathMatches:true,fileBatchRequests:uploads.length,originalTreeUnchanged:true,checks,clientSHA256:createHash('sha256').update(await fs.readFile('lib/client.js')).digest('hex')},null,2));console.log('PASS '+checks.length+' workspace checks');
}finally{await browser.close();}
