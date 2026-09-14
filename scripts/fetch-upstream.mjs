/** Optional maintainer helper. Network/Git required; this was not successfully run here. */
import {spawnSync} from 'node:child_process';import path from 'node:path';import fs from 'node:fs/promises';
const target=path.resolve(process.argv[2]??'dsh-attachments-upstream');
try{await fs.access(target);throw new Error('Refusing an existing destination');}catch(e){if(e.code!=='ENOENT')throw e;}
const url='https://github.com/LCYLYM/dsh-attachments.git';
const clone=spawnSync('git',['clone','--',url,target],{stdio:'inherit'});if(clone.status!==0)process.exit(clone.status??1);
const rev=spawnSync('git',['-C',target,'rev-parse','HEAD'],{encoding:'utf8'});if(rev.status!==0)process.exit(1);
await fs.writeFile(path.join(target,'.better-attach-baseline.json'),JSON.stringify({url,commit:rev.stdout.trim(),capturedAt:new Date().toISOString()},null,2)+'\n');
console.log('Retrieved actual upstream '+rev.stdout.trim()+'. Apply the candidate with scripts/overlay.mjs after reviewing docs/PROVENANCE.md.');
