/** Standalone local recorder. Never imported or shipped by the production plugin. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import readline from 'node:readline/promises';
const HERE=path.dirname(fileURLToPath(import.meta.url));
export function safeOrigin(value){const u=new URL(value);if(!['http:','https:'].includes(u.protocol)||!['localhost','127.0.0.1','[::1]'].includes(u.hostname))throw new Error('Recording is limited to your local DSH host.');return u;}
export function redact(text){return String(text).replace(/sk-[a-zA-Z0-9_-]+/g,'[REDACTED]').replace(/([?&]token=)[^\s&"']+/g,'$1[REDACTED]');}
export async function fixtureTree(folder){const items=[];for(const entry of await fs.readdir(folder,{withFileTypes:true})){if(entry.name==='.gitkeep')continue;if(entry.isSymbolicLink())throw new Error('Recording fixtures cannot contain symlinks');const file=path.join(folder,entry.name);items.push(entry.isDirectory()?{name:entry.name,directory:true,children:await fixtureTree(file)}:{name:entry.name,base64:(await fs.readFile(file)).toString('base64'),type:entry.name.endsWith('.png')?'image/png':'text/plain'});}return items;}
/** Temporary movable annotation and pointer; no product hooks or service replacements. */
export function installOverlay(){
 const host=document.createElement('div');host.id='ba-recording-overlay';const shadow=host.attachShadow({mode:'open'});document.body.append(host);
 shadow.innerHTML=`<style>:host{position:fixed;inset:0;z-index:2147483646;pointer-events:none;font:14px/1.5 system-ui}aside{position:absolute;left:24px;top:24px;width:270px;padding:15px 18px;border-radius:12px;border:1px solid #ffffff30;background:#182238ed;color:#fff;box-shadow:0 10px 32px #0003;pointer-events:auto;cursor:grab}small{font-size:10px;color:#b4c7ec;letter-spacing:.1em}h3{font-size:16px;margin:6px 0}p{font-size:12px;color:#d3dceb;margin:0}button{margin-top:12px;border:1px solid #ffffff50;border-radius:5px;background:transparent;color:white;padding:4px 10px;cursor:pointer}#pointer{position:absolute;left:0;top:0;width:22px;height:28px;filter:drop-shadow(0 1px 2px #0007)}#tile{position:absolute;left:24px;bottom:24px;background:#fff;color:#263650;border:1px solid #d6ddea;border-radius:9px;padding:10px 16px;box-shadow:0 8px 25px #0002;max-width:240px;font-size:12px}#tile b{display:block}svg{width:22px;height:28px}</style><aside><small>BETTER ATTACH · LIVE</small><h3>准备演示</h3><p>自动化拖放，真实文件与 DSH 调用。</p><button>停止录制</button></aside><div id="tile"><b>演示素材</b><span>仅录制时存在</span></div><div id="pointer"><svg viewBox="0 0 22 28"><path d="M2 2v21l6-6 5 9 4-2-5-8 8-1z" fill="#fff" stroke="#192844" stroke-width="1.5"/></svg></div>`;
 const card=shadow.querySelector('aside'),pointer=shadow.querySelector('#pointer'),tile=shadow.querySelector('#tile');let drag=null;let stopped=false;
 const move=e=>{if(!drag)return;card.style.left=Math.max(0,Math.min(innerWidth-card.offsetWidth,e.clientX-drag.x))+'px';card.style.top=Math.max(0,Math.min(innerHeight-card.offsetHeight,e.clientY-drag.y))+'px';};
 card.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;drag={x:e.clientX-card.offsetLeft,y:e.clientY-card.offsetTop};card.setPointerCapture(e.pointerId);});card.addEventListener('pointermove',move);card.addEventListener('pointerup',()=>drag=null);shadow.querySelector('button').onclick=()=>stopped=true;
 window.__BA_RECORDING__={stopped:()=>stopped,note:(title,text)=>{shadow.querySelector('h3').textContent=title;shadow.querySelector('p').textContent=text;},cursor:(x,y)=>{pointer.style.transform=`translate(${x}px,${y}px)`;},tile:name=>{tile.querySelector('b').textContent=name;},remove:()=>{host.remove();delete window.__BA_RECORDING__;}};
}
/** Real File bytes enter the same drop handler; directory entries emulate the OS enumeration API. */
export function dispatchDrop({x,y,tree,phase,duration=1100}){
 const fileOf=node=>new File([Uint8Array.from(atob(node.base64),c=>c.charCodeAt(0))],node.name,{type:node.type});
 const entryOf=node=>node.directory?{name:node.name,isDirectory:true,isFile:false,createReader(){let done=false;return{readEntries(ok){queueMicrotask(()=>{ok(done?[]:node.children.map(entryOf));done=true;});}};}}:{name:node.name,isFile:true,isDirectory:false,file(ok){queueMicrotask(()=>ok(fileOf(node)));}};
 const dt=new DataTransfer();for(const node of tree)dt.items.add(node.directory?new File([],node.name):fileOf(node));
 const items=tree.map(node=>({kind:'file',type:node.type||'',getAsFile:()=>node.directory?new File([],node.name):fileOf(node),webkitGetAsEntry:()=>entryOf(node)}));
 Object.defineProperty(dt,'items',{value:items});
 const dispatch=(px,py,event)=>{const target=document.elementFromPoint(px,py);if(!target)throw new Error('No visible drop destination');target.dispatchEvent(new DragEvent(event,{bubbles:true,cancelable:true,clientX:px,clientY:py,dataTransfer:dt}));};
 if(phase==='animate')return new Promise((resolve,reject)=>{
   const start=performance.now();
   const tick=now=>{try{
     if(window.__BA_RECORDING__?.stopped())throw new Error('Stopped by user');
     const progress=Math.min(1,(now-start)/duration),ease=progress*progress*(3-2*progress);
     const px=110+(x-110)*ease,py=740+(y-740)*ease;
     window.__BA_RECORDING__?.cursor(px,py);
     if(progress>.65)dispatch(px,py,'dragover');
     if(progress<1)requestAnimationFrame(tick);else{dispatch(x,y,'drop');resolve();}
   }catch(error){reject(error);}};requestAnimationFrame(tick);
 });
 dispatch(x,y,phase);
}
export async function main(){
 const url=safeOrigin(process.env.DSH_URL??'http://127.0.0.1:3080');
 const fixtureRoot=path.resolve(process.env.RECORD_FIXTURES??path.join(HERE,'fixtures'));
 const output=path.join(HERE,'output',new Date().toISOString().replace(/[:.]/g,'-'));await fs.mkdir(output,{recursive:true});
 const {chromium}=await import('playwright');
 const ffmpeg=process.env.FFMPEG??'ffmpeg';if(spawnSync(ffmpeg,['-version'],{stdio:'ignore'}).status!==0)throw new Error('Install ffmpeg, or set FFMPEG to its executable path.');
 const browser=await chromium.launch({headless:process.env.RECORD_HEADLESS==='1',channel:process.env.RECORD_CHANNEL||'chrome'});let context,videoPage,report={status:'incomplete',syntheticOSDrop:true,realDSH:true,steps:[],startedAt:new Date().toISOString()};
 try{
  let target=url.href,storageState;
  if(process.env.RECORD_STORAGE_STATE){storageState=JSON.parse(await fs.readFile(process.env.RECORD_STORAGE_STATE,'utf8'));}
  else {
    const setup=await browser.newContext({viewport:{width:1280,height:800}}),setupPage=await setup.newPage();await setupPage.goto(url.href);
    console.log('在 DSH 配置模型并新建空白对话；准备阶段不录制。');
    const terminal=readline.createInterface({input:process.stdin,output:process.stdout});await terminal.question('准备好后按 Enter：将发送测试消息并创建工作区副本。');terminal.close();
    await setupPage.locator('[data-better-attach-toolbar]').waitFor({state:'visible',timeout:15000});target=setupPage.url();storageState=await setup.storageState();await setup.close();
  }
  context=await browser.newContext({viewport:{width:1280,height:800},locale:'zh-CN',storageState,recordVideo:{dir:output,size:{width:1280,height:800}}});videoPage=await context.newPage();await videoPage.goto(target);
  await videoPage.locator('[data-better-attach-toolbar]').waitFor({state:'visible',timeout:30000});await videoPage.evaluate(installOverlay);
  const assertRunning=async()=>{if(await videoPage.evaluate(()=>window.__BA_RECORDING__?.stopped()))throw new Error('Stopped by user');};
  const wait=async ms=>{await videoPage.waitForTimeout(ms);await assertRunning();};
  const note=async(title,text)=>{await assertRunning();await videoPage.evaluate(([a,b])=>window.__BA_RECORDING__.note(a,b),[title,text]);console.log(title);await wait(1100);};
  const move=async(x,y)=>{await videoPage.mouse.move(x,y,{steps:20});await videoPage.evaluate(([x,y])=>window.__BA_RECORDING__.cursor(x,y),[x,y]);};
  const click=async locator=>{const b=await locator.boundingBox();if(!b)throw new Error('Target is not visible');await move(b.x+b.width/2,b.y+b.height/2);await locator.click();await wait(600);};
  const drop=async(tree,sidebar=false)=>{const marker=videoPage.locator(sidebar?'[data-better-attach-sidebar]':'[data-better-attach-toolbar]');const b=await marker.boundingBox();if(!b)throw new Error('Drop destination unavailable');const end={x:b.x+Math.min(b.width/2,55),y:b.y+b.height/2};await videoPage.evaluate(name=>window.__BA_RECORDING__.tile(name),tree.map(n=>n.name).join(', '));await videoPage.evaluate(dispatchDrop,{...end,tree,phase:'animate'});await wait(1000);};
  const confirm=async()=>{const d=videoPage.locator('.ba-dialog');await d.waitFor({state:'visible'});await click(d.locator('.ba-primary'));await d.waitFor({state:'detached',timeout:60000});};
  const evidence=async(name)=>{await videoPage.screenshot({path:path.join(output,name+'.png')});};
  const send=async(prompt,expected)=>{const input=videoPage.locator('[contenteditable="true"][data-phase="plain"]');await input.click();await input.press('End');await input.pressSequentially(prompt,{delay:45});if(!(await input.innerText()).includes(prompt))throw new Error('Composer text changed before send');const before=await videoPage.locator('body').innerText();await click(videoPage.getByRole('button',{name:/^(发送消息|Send message)$/}));await videoPage.waitForFunction(({expected,before})=>{const text=document.body.innerText;return expected.every(s=>text.split(s).length>before.split(s).length);},{expected,before},{timeout:180000});await videoPage.getByRole('button',{name:/^(停止生成|Stop generating)$/}).waitFor({state:'hidden',timeout:180000});await wait(2200);};
  await note('01 / 附件设置','两种文件处理方式，三个可选外观。');
  await click(videoPage.locator('[data-better-attach-toolbar] .ba-icon'));await videoPage.locator('.ba-dialog input[value="copy"]').check();await videoPage.locator('.ba-dialog input[value="official"]').check();await evidence('01-settings');await click(videoPage.locator('.ba-dialog-head .ba-icon'));
  const tree=await fixtureTree(fixtureRoot);
  await note('02 / 图片进入对话','真实图片进入原生 DSH 图像通道，等待模型识别。');await drop(tree.filter(n=>n.name==='still-life.png'));await send('请识别这张图片中杯子、植物、本子的颜色和种类，用中文简短回答。',['蓝','多肉']);report.steps.push({name:'image',visibleEvidence:true});await evidence('02-image-response');
  await note('03 / 文件进入对话','复制模式在发送时保存文件，由模型读取原文。');await drop(tree.filter(n=>n.name==='note.md'));await confirm();await send('请读取刚添加的便笺，给出项目代号、交付数量和验收口令。',['青岚-731']);report.steps.push({name:'file',visibleEvidence:true});await evidence('03-file-response');
  await note('04 / 文件夹进入对话','一个目录一张卡片，保留文件层级和空目录。');await drop(tree.filter(n=>n.name==='folder'));await videoPage.getByRole('button',{name:'folder/README.md',exact:true}).waitFor();await videoPage.getByRole('button',{name:'folder/src/answer.txt',exact:true}).waitFor();await evidence('04-folder-review');await confirm();await send('请读取刚添加目录中的 README 和它指定的入口文件，回答校验短语。',['纸舟沿河行']);report.steps.push({name:'folder',visibleEvidence:true});await evidence('05-folder-response');
  await note('05 / 文件夹进入侧栏','同一个文件夹投放到侧栏，成为独立工作区副本。');await drop(tree.filter(n=>n.name==='folder'),true);await click(videoPage.locator('.ba-dialog .ba-primary'));await videoPage.getByRole('dialog',{name:/工作区已添加|Workspace added/}).waitFor({state:'visible',timeout:60000});report.steps.push({name:'workspace',successDialog:true});await evidence('06-workspace');await click(videoPage.locator('.ba-dialog-head .ba-icon'));
  await note('06 / 原路径模式','只引用主机原文件；浏览器不公开绝对路径时，需要明确填写。');await click(videoPage.locator('[data-better-attach-toolbar] .ba-icon'));await videoPage.locator('.ba-dialog input[value="path"]').check();await videoPage.locator('.ba-dialog input[value="character"]').check();await evidence('07-path-settings');await click(videoPage.locator('.ba-dialog-head .ba-icon'));await drop(tree.filter(n=>n.name==='note.md'));await videoPage.locator('.ba-dialog input[type="text"], .ba-dialog input.ba-search').fill(path.join(fixtureRoot,'note.md'));await confirm();report.steps.push({name:'path',added:true});await evidence('08-path-card');
  await note('录制完成','以上回复与工作区均来自真实 DSH；说明牌不属于插件。');await wait(2500);report.status='recorded';
 }catch(error){report.error=redact(error.message);console.error(report.error);if(videoPage)await fs.writeFile(path.join(output,'page.txt'),redact(await videoPage.locator('body').innerText())).catch(()=>{});}finally{
  if(videoPage){await videoPage.evaluate(()=>window.__BA_RECORDING__?.remove()).catch(()=>{});const video=videoPage.video();await videoPage.screenshot({path:path.join(output,'last-frame.png')}).catch(()=>{});await context.close();if(video)report.video=path.basename(await video.path());}
  await browser.close();report.finishedAt=new Date().toISOString();await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
 }
 if(report.video){const prefix=report.status==='recorded'?'walkthrough':'incomplete';const input=path.join(output,report.video);for(const [name,args] of [[prefix+'.mp4',['-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart']],[prefix+'.gif',['-vf','fps=25,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse','-loop','0']]]){const result=spawnSync(ffmpeg,['-y','-i',input,...args,path.join(output,name)],{stdio:'ignore'});if(result.status!==0||(await fs.stat(path.join(output,name))).size===0)throw new Error('Video conversion failed: '+name);}
  if(report.status==='recorded'){const assets=path.resolve(HERE,'../docs/assets');await fs.mkdir(assets,{recursive:true});for(const ext of ['gif','mp4'])await fs.copyFile(path.join(output,'walkthrough.'+ext),path.join(assets,'walkthrough.'+ext));for(const file of ['README.md','README.zh.md']){const p=path.resolve(HERE,'..',file);const text=await fs.readFile(p,'utf8');const block=file==='README.zh.md'?'<!-- recording:start -->\n![真实 DSH 操作演示](docs/assets/walkthrough.gif)\n\n[观看 MP4](docs/assets/walkthrough.mp4) · 真实 DSH 与模型调用，自动化拖放。录制范围仅为 DSH 网页。\n<!-- recording:end -->':'<!-- recording:start -->\n![Real DSH walkthrough](docs/assets/walkthrough.gif)\n\n[MP4](docs/assets/walkthrough.mp4) · Automated drag events, real DSH calls.\n<!-- recording:end -->';await fs.writeFile(p,text.replace(/<!-- recording:start -->[\s\S]*?<!-- recording:end -->/,block));}}
 }
 await fs.writeFile(path.join(output,'report.json'),JSON.stringify({...report,converted:!!report.video},null,2));console.log('Output: '+output);if(report.status!=='recorded')process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(e=>{console.error(redact(e.message));process.exitCode=1;});
