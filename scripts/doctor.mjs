/** Read-only package/runtime checks. A successful probe is NOT a native DSH acceptance test. */
import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const checks=[];const check=(name,ok,detail='')=>checks.push({name,ok:!!ok,detail});
const pkg=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
for(const file of ['lib/index.js','lib/client.js','src/dsh-client.js','lib/ui.css','cordis.patch.yml','LICENSE','README.md','README.zh.md','docs/COMPATIBILITY.md']){try{await fs.access(path.join(root,file));check('packaged:'+file,true);}catch{check('packaged:'+file,false);}}
check('identity-preserved',pkg.name==='dsh-multimedia-webui-input');
check('explicit-prerelease',pkg.version.includes('-rc.')&&pkg.publishConfig?.tag==='next');
check('zero-third-party-runtime-dependencies',!Object.keys(pkg.dependencies??{}).length);
const host=await import('../lib/index.js');check('host-apply',typeof host.apply==='function');
const client=await fs.readFile(path.join(root,'lib/client.js'),'utf8');check('client-loader',client.includes("window.__ModuleLoader__.load({id:'dsh-multimedia-webui-input'"));
check('no-whole-draft-fallback',!client.includes('input.setDraft('));
const getArg=name=>{const i=process.argv.indexOf(name);return i<0?undefined:process.argv[i+1];};
const url=getArg('--url'),session=getArg('--session');let runtimeProbe='not-requested';
if(url){
  try{
    const base=new URL(url);if(!['http:','https:'].includes(base.protocol)||base.username||base.password)throw new Error('Supply a plain DSH root URL without credentials');
    const headers={'x-better-attach':'1',...(session?{'x-ba-session':session}:{})};
    for(const route of ['/health',...(session?['/diagnostics']:[])]){
      const result=await fetch(new URL('/community-multimedia-webui-input/v2'+route,base),{headers,signal:AbortSignal.timeout(5000)});
      const value=await result.json();check('read-only-runtime:'+route,result.ok&&value.ok,JSON.stringify(value));
    }
    runtimeProbe=checks.filter(c=>c.name.startsWith('read-only-runtime:')).every(c=>c.ok)?'passed-read-only':'failed';
  }catch(e){check('read-only-runtime',false,e.message);runtimeProbe='failed';}
}
const report={version:pkg.version,node:process.version,platform:process.platform,checks,runtimeProbe,nativeDSHCertified:false,clientSHA256:createHash('sha256').update(client).digest('hex')};
await fs.mkdir(path.join(root,'artifacts'),{recursive:true});await fs.writeFile(path.join(root,'artifacts/doctor.json'),JSON.stringify(report,null,2)+'\n');
for(const c of checks)console.log(`${c.ok?'PASS':'FAIL'} ${c.name}${c.detail?' — '+c.detail:''}`);
console.log('Native DSH certification: NOT asserted. See docs/COMPATIBILITY.md.');
if(checks.some(c=>!c.ok))process.exitCode=1;
