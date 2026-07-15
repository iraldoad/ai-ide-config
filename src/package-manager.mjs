import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

/**
 * Resolve pnpm version without using the target project as cwd.
 * Running inside a project with `devEngines.packageManager.version: "^…"`
 * makes Corepack/pnpm refuse to start.
 * @returns {string | null} installed pnpm version (e.g. "11.13.0")
 */
export function detectPnpmVersion() {
  const result = spawnSync('pnpm --version', {
    cwd: os.tmpdir(),
    encoding: 'utf8',
    shell: true,
    env: process.env,
  });

  if (result.status !== 0) {
    return null;
  }

  const version = (result.stdout ?? '').trim().split(/\s+/)[0];
  return /^\d+\.\d+\.\d+/.test(version) ? version : null;
}

/**
 * True if version is not an exact x.y.z (e.g. ^11.13.0, >=11).
 * @param {string | undefined} version
 */
function isRangeOrInvalid(version) {
  if (!version || typeof version !== 'string') return true;
  return !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version.trim());
}

/**
 * Pin packageManager / devEngines to an exact pnpm version so Corepack/pnpm
 * do not fail on ranges like "^11.13.0" (from `pnpm init`).
 *
 * @param {string} targetDir
 * @param {{ dryRun?: boolean }} options
 * @param {{ created: string[], updated: string[], skipped: string[] }} report
 */
export function ensureExactPnpmEngines(targetDir, options, report) {
  const pkgPath = path.join(targetDir, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    report.skipped.push('package.json (missing — skipped packageManager pin)');
    return;
  }

  const version = detectPnpmVersion();
  if (!version) {
    report.skipped.push('package.json (pnpm not found — skipped packageManager pin)');
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const expectedPackageManager = `pnpm@${version}`;
  const currentDevVersion = pkg.devEngines?.packageManager?.version;
  const needsPackageManager = pkg.packageManager !== expectedPackageManager;
  const needsDevEngines =
    !pkg.devEngines?.packageManager ||
    pkg.devEngines.packageManager.name !== 'pnpm' ||
    isRangeOrInvalid(currentDevVersion) ||
    currentDevVersion !== version;

  if (!needsPackageManager && !needsDevEngines) {
    report.skipped.push('package.json (packageManager already exact)');
    return;
  }

  if (options.dryRun) {
    report.updated.push(
      `package.json (pin packageManager to ${expectedPackageManager})`,
    );
    return;
  }

  pkg.packageManager = expectedPackageManager;
  pkg.devEngines = {
    ...pkg.devEngines,
    packageManager: {
      name: 'pnpm',
      version,
      onFail: 'download',
    },
  };

  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
  report.updated.push(
    `package.json (pinned packageManager to ${expectedPackageManager})`,
  );
}
