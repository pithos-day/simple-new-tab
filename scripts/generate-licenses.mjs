import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const temp = mkdtempSync(join(tmpdir(), 'simple-new-tab-licenses-'));
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const options = {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
};

try {
  for (const file of ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml']) {
    copyFileSync(join(root, file), join(temp, file));
  }

  // license-checker cannot follow pnpm's isolated symlink layout, so scan a
  // temporary hoisted production install instead.
  execFileSync(
    pnpm,
    ['install', '--prod', '--frozen-lockfile', '--node-linker=hoisted', '--ignore-scripts'],
    { ...options, cwd: temp },
  );

  execFileSync(
    pnpm,
    [
      'exec',
      'license-checker',
      '--start',
      temp,
      '--production',
      '--customPath',
      join(root, 'license-checker.json'),
      '--excludePrivatePackages',
      '--out',
      join(root, 'THIRD-PARTY-LICENSES.txt'),
    ],
    options,
  );
} finally {
  rmSync(temp, { recursive: true, force: true });
}
