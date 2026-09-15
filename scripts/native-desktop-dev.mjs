/** Start the real DSH with an isolated profile for manual native drag verification. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv[2]) throw new Error('Pass the path to the real DSH CLI');
const home = path.join(root, 'work/native-desktop/home'), profile = path.join(home, 'profiles/web');
await fs.mkdir(path.join(profile, 'node_modules'), { recursive: true });
await fs.writeFile(path.join(profile, 'package.json'), JSON.stringify({ name: 'better-attach-native-verification', private: true,
  dependencies: { 'dsh-multimedia-webui-input': 'file:' + root },
  dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', 'dsh-multimedia-webui-input'] } } }));
try { await fs.symlink(root, path.join(profile, 'node_modules/dsh-multimedia-webui-input'), 'junction'); } catch (error) { if (error.code !== 'EEXIST') throw error; }
await fs.writeFile(path.join(profile, 'cordis.yml'), '[]\n');
await fs.mkdir(path.join(root, 'work/native-desktop/拖放目录 (原件)'), { recursive: true });
await fs.writeFile(path.join(root, 'work/native-desktop/拖放目录 (原件)/verify.txt'), 'Original directory: native workspace drag verification.\n');
const child = spawn(process.execPath, [path.resolve(process.argv[2]), 'web', '--no-open', '--port', process.argv[3] || '3219'],
  { cwd: root, env: { ...process.env, DSH_HOME: home }, stdio: ['ignore', 'pipe', 'pipe'] });
for (const stream of [child.stdout, child.stderr]) stream.on('data', data => {
  const launch = String(data).match(/http:\/\/127\.0\.0\.1:\d+\/\?token=[^\s]+/);
  if (launch) void fs.writeFile(path.join(root, 'work/native-desktop/launch-url.txt'), launch[0], { mode: 0o600 });
  process.stdout.write(String(data).replace(/token=[^\s&]+/g, 'token=REDACTED'));
});
process.once('SIGINT', () => child.kill()); process.once('SIGTERM', () => child.kill());
child.once('exit', code => { process.exitCode = code || 0; });
