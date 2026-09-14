/** Launch the real published DSH CLI with an isolated temporary Home and fixture plugin. */
import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cli=process.argv[2];if(!cli)throw new Error('Usage: node scripts/live-dsh-smoke.mjs /absolute/path/to/dsh [version]');
const temp=await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(),'ba-live-'))),result=path.join(temp,'result.json');
const home=path.join(temp,'home'),profile=path.join(home,'profiles/web');await fs.mkdir(profile,{recursive:true});
await fs.writeFile(path.join(profile,'package.json'),JSON.stringify({name:'ba-live-profile',private:true,dependencies:{'dsh-multimedia-webui-input':'file:'+root},dsh:{profile:{bundles:['@deepseek-ai/dsh-base','@deepseek-ai/dsh-web-app','dsh-multimedia-webui-input']}}}));
await fs.mkdir(path.join(profile,'node_modules'),{recursive:true});await fs.symlink(root,path.join(profile,'node_modules/dsh-multimedia-webui-input'),'junction');
await fs.writeFile(path.join(profile,'cordis.yml'),'[]\n');
const fixture=path.join(temp,'fixture');await fs.mkdir(fixture);await fs.writeFile(path.join(fixture,'package.json'),JSON.stringify({name:'ba-test-fixture',type:'module',private:true}));await fs.copyFile(path.join(root,'scripts/live-fixture.mjs'),path.join(fixture,'index.mjs'));
await fs.writeFile(path.join(profile,'cordis.patch.yml'),JSON.stringify([{id:'community-multimedia-webui-input',config:{storageRoot:path.join(temp,'storage')}},{insert:[{id:'ba-live-fixture',name:path.join(fixture,'index.mjs'),config:{root:temp,result}}]}],null,2));
const child=spawn(process.execPath,[path.resolve(cli),'web','--no-open','--port','0'],{env:{...process.env,DSH_HOME:home},stdio:['ignore','pipe','pipe']});let logs='';child.stdout.on('data',b=>logs+=b);child.stderr.on('data',b=>logs+=b);
let report;
try{for(let i=0;i<180;i++){try{report=JSON.parse(await fs.readFile(result));break;}catch{}if(child.exitCode!==null)break;await new Promise(r=>setTimeout(r,250));}
 if(!report)report={ok:false,error:'Fixture did not complete within 45 seconds'};
 report.clientSHA256=createHash('sha256').update(await fs.readFile(path.join(root,'lib/client.js'))).digest('hex');report.nodeVersion=process.version;report.os=process.platform;report.realDSH=true;report.dshVersion=process.argv[3]??'see lockfile';report.testedAt=new Date().toISOString();report.browser='Not covered by this host-only test';report.logs=logs.replace(/token=\S+/g,'token=REDACTED');
 await fs.mkdir(path.join(root,'artifacts'),{recursive:true});await fs.writeFile(path.join(root,'artifacts/live-dsh.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));process.exitCode=report.ok?0:1;
}finally{child.kill('SIGTERM');await new Promise(resolve=>{if(child.exitCode!==null)resolve();else{child.once('exit',resolve);setTimeout(()=>{child.kill('SIGKILL');resolve();},2500).unref();}});await fs.rm(temp,{recursive:true,force:true});}
