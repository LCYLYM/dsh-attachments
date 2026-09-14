import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('LF and CRLF source checkouts produce identical client bundles',async t=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'ba-build-'));t.after(()=>fs.rm(temp,{recursive:true,force:true}));
 const sources=['lib/policy.js','lib/preferences.js','lib/intake.js','lib/client-api.js','lib/ui.js','src/dsh-client.js','lib/ui.css','assets/logo.svg'];
 for(const file of [...sources,'assets/character.jpg','scripts/build.mjs']){const dest=path.join(temp,file);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(path.join(root,file),dest);}
 const build=()=>execFileSync(process.execPath,[path.join(temp,'scripts/build.mjs')],{stdio:'pipe'});
 for(const file of sources){const dest=path.join(temp,file);await fs.writeFile(dest,(await fs.readFile(dest,'utf8')).replace(/\r\n?/g,'\n'));}
 build();const lf=await fs.readFile(path.join(temp,'lib/client.js'));
 for(const file of sources){const dest=path.join(temp,file);await fs.writeFile(dest,(await fs.readFile(dest,'utf8')).replace(/\n/g,'\r\n'));}
 build();assert.deepEqual(await fs.readFile(path.join(temp,'lib/client.js')),lf);
});
