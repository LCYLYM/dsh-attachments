#!/usr/bin/env python3
"""Browser acceptance runner. Optional --in-memory uses an explicit local HTTP test bridge.
It never disables managed browser policies, and never pretends the bridge is native XHR.
Default direct mode is for an unrestricted local development browser.
Requires Python Playwright + Chromium; the plugin/demo itself does not require them.
"""
from __future__ import annotations
import argparse, base64, importlib.metadata, json, os, re, socket, subprocess, tempfile, time, urllib.request, urllib.error
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--in-memory',action='store_true');parser.add_argument('--chromium',default=os.environ.get('CHROMIUM','/usr/bin/chromium'));args=parser.parse_args()
ASSETS=ROOT/'docs/assets';ASSETS.mkdir(parents=True,exist_ok=True)
RESULTS=[];HTTP=[];ERRORS=[]
def passed(name,detail=''):
    RESULTS.append({'name':name,'pass':True,'detail':detail});print('PASS',name,flush=True)
def shot(page,name):
    page.screenshot(path=str(ASSETS/name),animations='disabled')

BRIDGE=r'''
window.__BA_TEST_NET__={failPut:false};
// about:blank is not a secure context; production loopback has native randomUUID.
if(!crypto.randomUUID)crypto.randomUUID=()=>{const a=crypto.getRandomValues(new Uint8Array(16));a[6]=(a[6]&15)|64;a[8]=(a[8]&63)|128;const h=[...a].map(x=>x.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);};
const pack=bytes=>{let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);};
const unpack=b64=>Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
window.fetch=async function(input,options={}){
  const url=String(input);if(!url.startsWith('/'))throw new Error('Test bridge only accepts a local relative route');
  if(options.signal?.aborted)throw new DOMException('Aborted','AbortError');
  let body=options.body;
  const bytes=body instanceof Blob?new Uint8Array(await body.arrayBuffer()):new TextEncoder().encode(body??'');
  const result=await window.__localFixtureHTTP({url,method:options.method??'GET',headers:options.headers??{},body:pack(bytes)});
  if(options.signal?.aborted)throw new DOMException('Aborted','AbortError');
  return new Response(unpack(result.body),{status:result.status,headers:result.headers});
};
// Test-only XHR-shaped bridge; progress/cancellation here is NOT native transport certification.
window.XMLHttpRequest=class{
  constructor(){this.upload={};this.headers={};this.cancelled=false;}
  open(method,url){this.method=method;this.url=url;}
  setRequestHeader(k,v){this.headers[k]=v;}
  abort(){if(this.done||this.cancelled)return;this.cancelled=true;this.onabort?.();}
  async send(body){
    try{
      if(window.__BA_TEST_NET__.failPut&&this.method==='PUT'){window.__BA_TEST_NET__.failPut=false;throw new Error('Injected test transport failure');}
      const response=await fetch(this.url,{method:this.method,headers:this.headers,body});
      if(this.cancelled)return;
      this.status=response.status;this.responseText=await response.text();this.upload.onprogress?.({loaded:body.size,lengthComputable:true,total:body.size});this.done=true;this.onload?.();
    }catch(e){if(!this.cancelled){this.done=true;this.onerror?.(e);}}
  }
};
'''

def main():
  with tempfile.TemporaryDirectory(prefix='better-attach-browser-') as tmp:
    with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
    base=f'http://127.0.0.1:{port}'
    server_log=open(ROOT/'artifacts/browser-server.log','w')
    server=subprocess.Popen(['node','demo/server.mjs'],cwd=ROOT,env={**os.environ,'PORT':str(port),'BA_DEMO_ROOT':tmp},stdout=server_log,stderr=subprocess.STDOUT)
    try:
      for _ in range(100):
        try:urllib.request.urlopen(base+'/fixture/info',timeout=1);break
        except Exception:time.sleep(.05)
      else:raise RuntimeError('Local fixture did not start')
      def bridge(request):
        url=request['url']
        if not url.startswith(('/community-multimedia-webui-input/v2/','/fixture/','/demo/preview-fixture.png')) or '..' in url:
          raise ValueError('Test bridge route not allowed')
        body=base64.b64decode(request.get('body',''))
        if len(body)>4*1024*1024:raise ValueError('Test-only bridge size cap')
        headers={k:str(v) for k,v in request.get('headers',{}).items()}
        req=urllib.request.Request(base+url,data=body if request['method']!='GET' else None,method=request['method'],headers=headers)
        try:r=urllib.request.urlopen(req,timeout=10)
        except urllib.error.HTTPError as e:r=e
        data=r.read();HTTP.append({'method':request['method'],'route':url,'bytesSent':len(body),'status':r.status})
        return {'status':r.status,'headers':dict(r.headers.items()),'body':base64.b64encode(data).decode()}
      with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox'])
        context=browser.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1,locale='zh-CN')
        page=context.new_page();page.set_default_timeout(6000);page.on('pageerror',lambda e:ERRORS.append(str(e)))
        def load():
          if not args.in_memory:
            page.goto(base);page.wait_for_function('window.__BA_FIXTURE__ !== undefined');return
          html=(ROOT/'demo/index.html').read_text()
          html=re.sub(r'<link\b[^>]*>','',html);html=re.sub(r'<script\b[^>]*>.*?</script>','',html,flags=re.S)
          css=(ROOT/'lib/ui.css').read_text()+'\n'+(ROOT/'demo/style.css').read_text()
          html=html.replace('</head>','<style>'+css+'</style></head>')
          html=html.replace('本地集成夹具 · 非真实 DSH','UI 测试桥 · 非真实 DSH')
          page.set_content(html)
          page.add_script_tag(content=BRIDGE)
          source='\n'.join((ROOT/p).read_text() for p in ['lib/policy.js','lib/intake.js','lib/client-api.js','lib/ui.js','demo/app.js'])
          source=re.sub(r'^import .*?;\s*','',source,flags=re.M);source=re.sub(r'\bexport (?=(?:async )?(?:function|class|const|let))','',source)
          page.add_script_tag(content='(async()=>{'+source+'})().catch(e=>{window.__BOOT_ERROR__=String(e);throw e;});')
          page.wait_for_function('window.__BA_FIXTURE__ !== undefined')
        if args.in_memory:page.expose_function('__localFixtureHTTP',bridge)
        load();shot(page,'01-home.png')
        passed('UI boots with real shared modules','In-memory HTML + explicit local HTTP bridge' if args.in_memory else 'Direct browser HTTP')
        page.locator('#sample-project').click();expect(page.get_by_role('dialog')).to_be_visible()
        expect(page.locator('.ba-review-summary')).to_contain_text('4 个文件')
        expect(page.locator('.ba-skipped summary')).to_contain_text('已跳过 2')
        expect(page.locator('.ba-file-name',has_text='aurora-ui/empty')).to_be_visible()
        shot(page,'02-folder-review.png');passed('Preflight excludes .env and node_modules, preserves empty directory')
        page.get_by_role('button',name='添加到对话',exact=True).click();expect(page.locator('.ba-card')).to_have_count(1)
        assert not list((Path(tmp)/'conversation-a').iterdir())
        shot(page,'03-draft-folder.png');passed('Staged conversation folder has not been copied')
        # Native OS picker UI not exercised: Playwright sets the real HTML File input.
        with page.expect_file_chooser() as picker:
          page.get_by_role('button',name='添加文件',exact=True).click()
        picker.value.set_files({'name':'notes.md','mimeType':'text/markdown','buffer':b'# Notes\n<script>window.PREVIEW_XSS=1</script>'})
        expect(page.locator('dialog')).to_be_visible();page.locator('dialog .ba-file-name').click();expect(page.locator('.ba-text')).to_contain_text('<script>')
        assert page.evaluate('window.PREVIEW_XSS??null') is None
        shot(page,'04-text-preview.png');page.keyboard.press('Escape');page.get_by_role('button',name='添加到对话',exact=True).click()
        passed('File picker intake and escaped code preview; Escape closes only the top dialog')
        # Mixed raster/file review uses actual File/Blob and image decoding.
        page.locator('#sample-files').click();page.locator('dialog .ba-file-name',has_text='layout-review.png').click()
        page.wait_for_function('document.querySelector(".ba-image")?.naturalWidth>0')
        shot(page,'05-image-preview.png');page.keyboard.press('Escape');page.get_by_role('button',name='添加到对话',exact=True).click()
        shot(page,'06-attachments.png');passed('Raster preview renders an actual Blob without executing document content')
        # Session scoping uses fixture scopes, not a real DSH session implementation.
        page.locator('[data-session="conversation-b"]').click();expect(page.locator('.ba-card')).to_have_count(0)
        page.locator('[data-session="conversation-a"]').click();expect(page.locator('.ba-card')).to_have_count(3)
        passed('Draft attachments remain scoped during conversation switch')
        # Undo remove through the actual manager, not a forced state update.
        page.locator('.ba-card').first.get_by_role('button',name='移除',exact=True).click();expect(page.locator('.ba-card')).to_have_count(2)
        page.get_by_role('button',name='撤销',exact=True).click();expect(page.locator('.ba-card')).to_have_count(3)
        passed('Remove and undo restore the pending selection')
        # Synthetic DataTransfer with an actual File exercises event pass-through.
        page.evaluate('''()=>{const dt=new DataTransfer();dt.items.add(new File(['fake png bytes'],'image.png',{type:'image/png'}));document.querySelector('#draft').dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt,clientX:800,clientY:800}));}''')
        assert page.evaluate('__BA_FIXTURE__.nativeDrops')==1
        expect(page.locator('dialog')).to_have_count(0);passed('Pure image drop is left to the native-event witness','Witness only, not actual DSH vision')
        page.evaluate('''()=>{const dt=new DataTransfer();dt.setData('text/plain','internal reorder');const e=new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt,clientX:800,clientY:800});window.TEXT_DRAG_PASSED=document.querySelector('#draft').dispatchEvent(e);}''')
        assert page.evaluate('window.TEXT_DRAG_PASSED') is True;passed('Text and internal drags are not hijacked')
        # Actual directory walker with asynchronous FileSystemEntry callbacks, including sidebar destination.
        def drop_folder(sidebar=False,name='dropped-project',delayed=False,over_only=False):
          return page.evaluate('''({sidebar,name,delayed,overOnly})=>{
            const file=new File(['real directory-drop file'], 'main.txt',{type:'text/plain',lastModified:0});
            const leaf={name:'main.txt',isFile:true,isDirectory:false,file:resolve=>delayed?setTimeout(()=>resolve(file),100):resolve(file)};
            const empty={name:'empty',isDirectory:true,createReader:()=>({readEntries:resolve=>resolve([])})};
            const root={name,isDirectory:true,isFile:false,createReader:()=>{let done=false;return{readEntries:resolve=>{if(done)resolve([]);else{done=true;resolve([leaf,empty]);}}}}};
            const dt={types:['Files'],items:[{kind:'file',type:'',webkitGetAsEntry:()=>root}],files:[file]};
            const node=document.querySelector(sidebar?'#sidebar':'#conversation'),r=node.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
            const dispatch=type=>{const e=new DragEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y});Object.defineProperty(e,'dataTransfer',{value:dt});node.dispatchEvent(e);};
            dispatch('dragover');if(!overOnly)dispatch('drop');
          }''',{'sidebar':sidebar,'name':name,'delayed':delayed,'overOnly':over_only})
        drop_folder(sidebar=True,over_only=True);shot(page,'07-sidebar-drop.png')
        drop_folder(sidebar=True)
        expect(page.get_by_role('dialog')).to_be_visible();expect(page.locator('dialog')).to_contain_text('不会链接到原文件夹')
        shot(page,'08-workspace-review.png')
        page.locator('dialog').get_by_role('button',name='导入为工作区',exact=True).click();expect(page.get_by_role('dialog')).to_contain_text('工作区已添加')
        paths=list((Path(tmp)/'imports').glob('*/files/dropped-project/main.txt'));assert len(paths)==1 and paths[0].read_text()=='real directory-drop file'
        assert paths[0].with_name('empty').is_dir();registry=json.loads((Path(tmp)/'fixture-workspaces.json').read_text());assert len(registry)==1
        shot(page,'09-workspace-added.png');page.get_by_role('dialog').get_by_role('button',name='关闭',exact=True).last.click()
        passed('Sidebar directory drop copies a tree then registers one workspace','Real filesystem; fixture workspaceController')
        # Sidebar refuses loose files before a write; preflight errors disable confirmation.
        page.evaluate("""()=>{const dt=new DataTransfer();dt.items.add(new File(['x'],'loose.txt',{type:'text/plain'}));const node=document.querySelector('#sidebar'),r=node.getBoundingClientRect();node.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt,clientX:r.left+20,clientY:r.top+300}));}""")
        expect(page.locator('dialog .ba-error')).to_contain_text('exactly one folder')
        expect(page.locator('dialog').get_by_role('button',name='导入为工作区',exact=True)).to_be_disabled()
        page.keyboard.press('Escape');passed('Loose file dropped on sidebar is rejected before copying')
        drop_folder(sidebar=True,name='not-copied')
        page.get_by_role('button',name='使用主机原目录',exact=True).click()
        page.locator('dialog').last.get_by_role('textbox').fill(str(Path(tmp)/'conversation-b'))
        page.get_by_role('button',name='添加原目录',exact=True).click()
        expect(page.locator('dialog')).to_have_count(1)
        assert len(json.loads((Path(tmp)/'fixture-workspaces.json').read_text()))==2
        assert not list((Path(tmp)/'imports').glob('*/files/not-copied'))
        page.keyboard.press('Escape');passed('Explicit existing-host directory registration creates no imported copy')
        drop_folder(sidebar=True,over_only=True);page.keyboard.press('Escape');drop_folder(sidebar=True,name='cancelled-drop')
        expect(page.locator('dialog')).to_have_count(0);passed('Escape cancels the current drop intent without swallowing future drops')
        # Pin target before async directory enumeration, then switch active conversation.
        drop_folder(name='pinned',delayed=True);page.locator('[data-session="conversation-b"]').click()
        expect(page.locator('dialog')).to_be_visible();page.get_by_role('button',name='添加到对话',exact=True).click();expect(page.locator('.ba-card')).to_have_count(0)
        page.locator('[data-session="conversation-a"]').click();expect(page.locator('.ba-card')).to_have_count(4)
        passed('Async directory scanning cannot silently retarget a different conversation')
        if args.in_memory:
          page.evaluate('__BA_TEST_NET__.failPut=true');page.locator('#send').click();expect(page.locator('.ba-card[data-status="error"]')).to_have_count(1)
          page.locator('.ba-card[data-status="error"]').get_by_role('button',name='重试保存',exact=True).click()
          expect(page.locator('.ba-card[data-status="committed"]')).to_have_count(1)
          passed('Injected transport failure retains selection and resumes existing batch','Failure injected only in test transport shim')
        page.locator('#send').click();expect(page.locator('#messages')).to_contain_text('真实落盘完成')
        assert len(list((Path(tmp)/'conversation-a').glob('.dsh/tmp/attachments/better-attach-v2/*/manifest.json')))==4
        assert page.evaluate('[...__BA_FIXTURE__.manager.records.values()].filter(r=>r.target==="conversation").every(r=>r.receipt&&r.bytesReleased)')
        passed('Send produces real on-disk manifests, then releases browser File bytes')
        page.get_by_role('button',name='附件记录',exact=True).click();expect(page.locator('.ba-history-card')).to_have_count(4)
        page.locator('.ba-history-card').first.locator('summary').click();shot(page,'10-history.png')
        page.locator('.ba-history-card').first.get_by_role('button',name='再次附加',exact=True).click();expect(page.locator('.ba-card')).to_have_count(1)
        page.locator('#send').click();expect(page.locator('.ba-card')).to_have_count(0)
        assert len(list((Path(tmp)/'conversation-a').glob('.dsh/tmp/attachments/better-attach-v2/*/manifest.json')))==4
        passed('Saved history can attach again without another copy')
        page.locator('#theme').click();page.locator('#sample-project').click();shot(page,'11-dark-review.png')
        expect(page.locator('dialog')).to_be_visible();page.keyboard.press('Escape')
        page.emulate_media(reduced_motion='reduce');page.locator('#sample-project').click()
        duration=page.locator('dialog').evaluate('(node)=>getComputedStyle(node).animationDuration');assert all(float(x.rstrip('s'))<=.001 for x in duration.split(', '))
        page.keyboard.press('Escape');passed('Dark skin and reduced-motion behavior render without animation requirement')
        page.set_viewport_size({'width':390,'height':844});page.locator('#sample-project').click();shot(page,'12-mobile-review.png')
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        box=page.locator('dialog').bounding_box();assert box['x']>=0 and box['x']+box['width']<=391
        page.keyboard.press('Escape');assert page.evaluate('document.activeElement.id')=='sample-project'
        passed('390px layout avoids horizontal overflow and dialog focus returns to trigger')
        assert not ERRORS,ERRORS;passed('No uncaught browser JavaScript exceptions',str(len(ERRORS)))
        browser.close()
    finally:
      server.terminate();server.wait(timeout=10);server_log.close()

def report(error=None):
  result={'schema':1,'version':json.loads((ROOT/'package.json').read_text())['version'],'date':'2026-09-14','mode':'in-memory-local-HTTP-bridge' if args.in_memory else 'direct-browser-http','browserNativeXHR':not args.in_memory,'realFilesystem':True,'realDSH':False,'realModel':False,'nativeOSFolderDrag':False,'playwright':importlib.metadata.version('playwright'),'tests':RESULTS,'passed':len(RESULTS),'failure':str(error) if error else None,'pageErrors':ERRORS,'httpRequests':HTTP}
  (ROOT/'artifacts/browser-tests.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
try:main()
except Exception as e:report(e);raise
else:report()
