/** Real DSH drag lifecycle and recording cadence checks; OS events are synthesized. */
import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {chromium} from 'playwright';import {dispatchDrop,installOverlay,safeOrigin} from './record.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[];
const run=async(name,fn)=>{await fn();checks.push({name,status:'PASS'});console.log('PASS '+name);};
try{
 const context=await browser.newContext({storageState:process.env.RECORD_STORAGE_STATE,viewport:{width:1280,height:800},locale:'zh-CN'}),page=await context.newPage();
 await page.goto(safeOrigin(process.env.DSH_URL||'http://127.0.0.1:3189').href);const marker=page.locator('[data-better-attach-toolbar]');await marker.waitFor();
 await marker.locator('.ba-icon').click();await page.locator('.ba-dialog input[value="copy"]').check();await page.locator('.ba-dialog-head .ba-icon').click();
 const b=await marker.boundingBox(),payload={x:b.x+30,y:b.y+12,tree:[{name:'motion.txt',base64:'bW90aW9u',type:'text/plain'}],phase:'dragover'},hint=page.locator('.ba-drop-overlay');
 let sampling,cadence;
 await run('hint remains visible across sparse dragover events without rebuilding content',async()=>{
  await page.evaluate(dispatchDrop,payload);await hint.waitFor({state:'visible'});
  await page.evaluate(()=>{const o=document.querySelector('.ba-drop-overlay');window.probe={rebuilds:0,hiddenFrames:0,frames:0};window.observer=new MutationObserver(rs=>window.probe.rebuilds+=rs.filter(r=>r.type==='childList').length);window.observer.observe(o,{childList:true});const sample=()=>{window.probe.frames++;if(o.hidden)window.probe.hiddenFrames++;window.frame=requestAnimationFrame(sample);};sample();});
  for(let i=0;i<5;i++){await page.waitForTimeout(350);await page.evaluate(dispatchDrop,payload);}
  sampling=await page.evaluate(()=>{cancelAnimationFrame(window.frame);window.observer.disconnect();return window.probe;});assert.equal(sampling.hiddenFrames,0);assert.equal(sampling.rebuilds,0);assert.ok(sampling.frames>20);
 });
 await run('child leaves preserve hint; destination exit clears it',async()=>{
  await marker.dispatchEvent('dragleave',{clientX:payload.x,clientY:payload.y,relatedTarget:null});assert.equal(await hint.isVisible(),true);
  await page.evaluate(dispatchDrop,{...payload,x:1279,y:1});await hint.waitFor({state:'hidden'});
 });
 await run('viewport leave and Escape clear the hint and cancel pending frames',async()=>{
  await page.evaluate(dispatchDrop,payload);await hint.waitFor({state:'visible'});await page.locator('html').dispatchEvent('dragleave',{clientX:0,clientY:0});await hint.waitFor({state:'hidden'});
  await page.evaluate(dispatchDrop,payload);await hint.waitFor({state:'visible'});await page.keyboard.press('Escape');await page.evaluate(dispatchDrop,payload);await page.waitForTimeout(400);assert.equal(await hint.isVisible(),false);await marker.dispatchEvent('dragend');
 });
 await run('conversation and sidebar show the matching destination',async()=>{
  await page.evaluate(dispatchDrop,payload);await hint.waitFor({state:'visible'});assert.match(await hint.innerText(),/对话|conversation/);
  const s=await page.locator('[data-better-attach-sidebar]').boundingBox();await page.evaluate(dispatchDrop,{...payload,x:s.x+20,y:s.y+12});await page.waitForTimeout(80);assert.match(await hint.innerText(),/工作区|workspace/);await marker.dispatchEvent('dragend');
 });
 await run('recording drag moves on animation frames and opens a real file review without hint rebound',async()=>{
  await page.evaluate(installOverlay);await page.evaluate(()=>{const rec=window.__BA_RECORDING__,cursor=rec.cursor;window.motionFrames=[];rec.cursor=(x,y)=>{window.motionFrames.push({time:performance.now(),x,y});cursor(x,y);};});
  await page.evaluate(dispatchDrop,{...payload,phase:'animate'});await page.locator('.ba-dialog').waitFor();assert.match(await page.locator('.ba-dialog').innerText(),/motion.txt/);await page.waitForTimeout(450);assert.equal(await hint.isVisible(),false);
  cadence=await page.evaluate(()=>{const f=window.motionFrames,gaps=f.slice(1).map((x,i)=>x.time-f[i].time).sort((a,b)=>a-b);window.__BA_RECORDING__.remove();return{frames:f.length,p95GapMs:gaps[Math.floor(gaps.length*.95)],maxGapMs:Math.max(...gaps),durationMs:f.at(-1).time-f[0].time};});assert.ok(cadence.frames>=20);assert.ok(cadence.p95GapMs<100);await page.locator('.ba-dialog-head .ba-icon').click();
 });
 const sha=createHash('sha256').update(await fs.readFile('lib/client.js')).digest('hex');await fs.writeFile('artifacts/drag-motion.json',JSON.stringify({realDSH:true,syntheticOSDrop:true,checks,sampling,cadence,clientSHA256:sha},null,2));
}finally{await browser.close();}
