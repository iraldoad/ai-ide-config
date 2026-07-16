import { spawnSync } from 'node:child_process';

export const SKILLS_ADD_COMMAND =
  'pnpx skills add midudev/autoskills';

/**
 * Install agent skills via the skills CLI (pnpm/pnpx required by devEngines).
 * @param {string} targetDir
 * @param {{ dryRun?: boolean, skip?: boolean }} [options]
 * @returns {{ skipped: boolean, dryRun?: boolean, status?: number | null }}
 */
export function runSkillsAdd(targetDir, options = {}) {
  const { dryRun = false, skip = false } = options;

  if (skip) {
    console.log('Skipping skills install (--skip-skills).');
    return { skipped: true };
  }

  if (dryRun) {
    console.log(`[dry-run] Would run: ${SKILLS_ADD_COMMAND}`);
    return { skipped: false, dryRun: true };
  }

  console.log(`Running: ${SKILLS_ADD_COMMAND}`);

  // Single command string + shell avoids DEP0190 (args + shell:true).
  const result = spawnSync(SKILLS_ADD_COMMAND, {
    cwd: targetDir,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `${SKILLS_ADD_COMMAND} failed with exit code ${result.status ?? 'unknown'}`,
    );
  }

  return { skipped: false, status: result.status };
}
