import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tests=(await fs.readdir(path.join(root,'tests'))).filter(f=>f.endsWith('.test.mjs')).sort().map(f=>path.join(root,'tests',f));
if(!tests.length)throw new Error('No tests were packaged');
const result=spawnSync(process.execPath,['--test',...tests],{cwd:root,stdio:'inherit'});
process.exitCode=result.status??1;
