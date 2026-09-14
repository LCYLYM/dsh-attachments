/** Overlay a REAL existing checkout without touching .git or deleting unshipped files.
 * Dry-run by default. --apply creates a sibling backup first. --restore <backup> reverses it.
 */
import * as fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
const source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
async function exists(p){try{await fs.lstat(p);return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}}
async function refuseLinks(root,relative){let p=root;for(const part of relative.split(path.sep)){p=path.join(p,part);if(await exists(p)){const st=await fs.lstat(p);if(st.isSymbolicLink())throw new Error('Refusing symlink: '+p);}}}
if(args[0]==='--restore'){
 const backup=path.resolve(args[1]??'');const plan=JSON.parse(await fs.readFile(path.join(backup,'overlay-manifest.json'),'utf8'));
 const target=await fs.realpath(plan.target);if(!await exists(path.join(target,'.git')))throw new Error('Original checkout is missing');
 for(const item of plan.files){await refuseLinks(target,item.path);const dest=path.join(target,item.path);if(item.existed){await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(path.join(backup,'files',item.path),dest);}else await fs.rm(dest,{force:true});}
 console.log('Restored listed paths; unlisted files and .git were not touched.');
}else{
 const target=await fs.realpath(args[0]??'.');if(target===source||target.startsWith(source+path.sep)||source.startsWith(target+path.sep))throw new Error('Source and destination must be separate, non-nested directories');
 if(!await exists(path.join(target,'.git')))throw new Error('Pass an existing Git checkout, not an empty folder.');
 const pkg=JSON.parse(await fs.readFile(path.join(target,'package.json'),'utf8'));if(pkg.name!=='dsh-multimedia-webui-input')throw new Error('Unexpected target package identity');
 const files=[];async function walk(dir=''){for(const entry of await fs.readdir(path.join(source,dir),{withFileTypes:true})){if(['.git','node_modules','__pycache__','.DS_Store'].includes(entry.name))continue;const relative=path.join(dir,entry.name);if(entry.isDirectory())await walk(relative);else if(entry.isFile()&&!/\.(zip|tgz)$/.test(entry.name))files.push(relative);else if(entry.isSymbolicLink())throw new Error('Source symlink not accepted');}}
 await walk();for(const file of files)await refuseLinks(target,file);
 const plan={source,target,createdAt:new Date().toISOString(),files:await Promise.all(files.map(async file=>({path:file,existed:await exists(path.join(target,file))})))};
 if(!args.includes('--apply'))console.log(JSON.stringify({dryRun:true,...plan},null,2));
 else{
  const backup=await fs.mkdtemp(path.join(path.dirname(target),path.basename(target)+'-before-better-attach-'));
  for(const item of plan.files)if(item.existed){const dest=path.join(backup,'files',item.path);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(path.join(target,item.path),dest);}
  await fs.writeFile(path.join(backup,'overlay-manifest.json'),JSON.stringify(plan,null,2));
  for(const item of plan.files){const dest=path.join(target,item.path);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(path.join(source,item.path),dest);}
  console.log('Overlay applied. Review git diff before committing. Backup: '+backup);console.log('Restore: node scripts/overlay.mjs --restore "'+backup+'"');
 }
}
