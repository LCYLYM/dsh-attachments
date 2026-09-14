/** Deliberately blocks public/stable release until a maintainer records real native acceptance. */
import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const required=['installAndBoot','ordinaryFileSend','nativeImagePassThrough','folderConversation','folderSidebarCopy','existingHostDirectory','foreignReferencePreservation','failureRetry','nativeOSDirectoryDrop','uninstallNoCorePatch'];
const failures=[];let live;
try{live=JSON.parse(await fs.readFile(path.join(root,'artifacts/native-acceptance.json'),'utf8'));}catch{failures.push('No artifacts/native-acceptance.json. Fill the template only after real DSH tests.');}
if(live){
 if(live.realDSH!==true||live.fixture===true)failures.push('Evidence must come from a real DSH runtime, not this fixture.');
 if(!/^[a-f0-9]{40}$/i.test(live.repositoryCommit??''))failures.push('Exact candidate Git commit is required.');
 for(const k of ['dshVersion','nodeVersion','os','browser','testedAt','tester'])if(!live[k])failures.push('Missing '+k);
 for(const k of required)if(live.checks?.[k]!==true)failures.push('Not verified: '+k);
 if(!Array.isArray(live.evidenceFiles)||!live.evidenceFiles.length)failures.push('Attach redacted logs/screenshots, not only checkboxes.');
 else for(const f of live.evidenceFiles){const absolute=path.resolve(root,f);if(!absolute.startsWith(root+path.sep)){failures.push('Evidence must be inside this checkout');continue;}try{await fs.access(absolute);}catch{failures.push('Missing evidence file: '+f);}}
}
const report={version:'0.3.0-rc.2',publicReleaseReady:!failures.length,reason:failures,scope:'manual native-runtime release gate; not a cryptographic attestation'};
await fs.mkdir(path.join(root,'artifacts'),{recursive:true});await fs.writeFile(path.join(root,'artifacts/release-gate.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(failures.length)process.exitCode=1;
