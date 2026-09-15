import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (process.platform !== 'darwin') {
  throw new Error('Native path bridge currently builds on macOS. Windows browser-host integration is pending.');
} else {
  for (const arch of process.argv.includes('--all') ? ['arm64', 'x64'] : [process.arch]) {
  const output = path.join(root, 'native/bin', `drop-bridge-darwin-${arch}`);
  await fs.mkdir(path.dirname(output), { recursive: true });
  const target = arch === 'x64' ? 'x86_64-apple-macosx11.0' : 'arm64-apple-macosx11.0';
  const build = spawnSync('/usr/bin/swiftc', ['-O', '-target', target, path.join(root, 'native/macos/DropBridge.swift'), '-o', output], { stdio: 'inherit' });
  if (build.status !== 0) throw new Error('Native receiver compilation failed');
  console.log(`Built native helper for darwin-${arch}`);
  }
}
