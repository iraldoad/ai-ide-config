import fs from 'node:fs';
import path from 'node:path';
import { sharedTemplatesDir, stackTemplatesDir } from './paths.mjs';
import { ensureExactPnpmEngines } from './package-manager.mjs';

const GITIGNORE = '.gitignore';
const GITIGNORE_ENTRIES = ['.cursor/', '.agents/'];

/**
 * Recursively collect relative file paths under dir.
 * @param {string} dir
 * @param {string} [base]
 * @returns {string[]}
 */
function listFiles(dir, base = dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(absolute, base));
    } else if (entry.isFile()) {
      files.push(path.relative(base, absolute));
    }
  }

  return files;
}

/**
 * @typedef {{ created: string[], skipped: string[], overwritten: string[], updated: string[] }} CopyReport
 */

/**
 * Whether .gitignore already ignores a directory entry (with or without trailing slash).
 * @param {string} content
 * @param {string} entry e.g. ".cursor/" or ".agents/"
 */
function hasIgnoreEntry(content, entry) {
  const name = entry.replace(/\/$/, '').replace(/^\./, '\\.');
  return new RegExp(`(?:^|\\n)\\s*${name}\\/?\\s*(?:\\n|$)`).test(content);
}

/**
 * Create .gitignore with required entries, or append any that are missing.
 * @param {string} targetDir
 * @param {{ dryRun?: boolean }} options
 * @param {CopyReport} report
 */
function ensureGitignore(targetDir, options, report) {
  const filePath = path.join(targetDir, GITIGNORE);
  const exists = fs.existsSync(filePath);

  if (!exists) {
    if (options.dryRun) {
      report.created.push(`${GITIGNORE} (${GITIGNORE_ENTRIES.join(', ')})`);
      return;
    }
    fs.writeFileSync(filePath, `${GITIGNORE_ENTRIES.join('\n')}\n`, 'utf8');
    report.created.push(GITIGNORE);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const missing = GITIGNORE_ENTRIES.filter(
    (entry) => !hasIgnoreEntry(content, entry),
  );

  if (missing.length === 0) {
    report.skipped.push(
      `${GITIGNORE} (${GITIGNORE_ENTRIES.join(', ')} already listed)`,
    );
    return;
  }

  if (options.dryRun) {
    report.updated.push(`${GITIGNORE} (append ${missing.join(', ')})`);
    return;
  }

  const separator = content.length === 0 || content.endsWith('\n') ? '' : '\n';
  fs.writeFileSync(
    filePath,
    `${content}${separator}${missing.join('\n')}\n`,
    'utf8',
  );
  report.updated.push(`${GITIGNORE} (appended ${missing.join(', ')})`);
}

/**
 * Copy all files from sourceRoot into targetDir.
 * @param {string} sourceRoot
 * @param {string} targetDir
 * @param {{ force?: boolean, dryRun?: boolean }} options
 * @param {CopyReport} report
 */
function copyTree(sourceRoot, targetDir, options, report) {
  const relativeFiles = listFiles(sourceRoot);

  for (const relative of relativeFiles) {
    const from = path.join(sourceRoot, relative);
    const to = path.join(targetDir, relative);
    const exists = fs.existsSync(to);

    if (exists && !options.force) {
      report.skipped.push(relative);
      continue;
    }

    if (options.dryRun) {
      if (exists) {
        report.overwritten.push(relative);
      } else {
        report.created.push(relative);
      }
      continue;
    }

    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);

    if (exists) {
      report.overwritten.push(relative);
    } else {
      report.created.push(relative);
    }
  }
}

/**
 * Scaffold shared .cursor config + stack templates into targetDir.
 * @param {{ stack: { id: string, agentsDir: string }, targetDir: string, force?: boolean, dryRun?: boolean }} opts
 * @returns {CopyReport}
 */
export function initStack(opts) {
  const { stack, targetDir, force = false, dryRun = false } = opts;
  const options = { force, dryRun };
  /** @type {CopyReport} */
  const report = {
    created: [],
    skipped: [],
    overwritten: [],
    updated: [],
  };

  const shared = sharedTemplatesDir();
  const stackDir = stackTemplatesDir(stack.agentsDir);

  if (!fs.existsSync(shared)) {
    throw new Error(`Shared templates missing: ${shared}`);
  }
  if (!fs.existsSync(stackDir)) {
    throw new Error(`Stack templates missing for "${stack.id}": ${stackDir}`);
  }

  copyTree(shared, targetDir, options, report);
  copyTree(stackDir, targetDir, options, report);
  ensureGitignore(targetDir, options, report);
  ensureExactPnpmEngines(targetDir, options, report);

  return report;
}

export function printReport(report, { dryRun = false } = {}) {
  const prefix = dryRun ? '[dry-run] ' : '';

  const sections = [
    ['Created', report.created],
    ['Updated', report.updated],
    ['Overwritten', report.overwritten],
    ['Skipped (already exists)', report.skipped],
  ];

  for (const [label, files] of sections) {
    if (!files || files.length === 0) continue;
    console.log(`${prefix}${label}:`);
    for (const file of files) {
      console.log(`  ${file}`);
    }
  }

  if (
    report.created.length === 0 &&
    report.overwritten.length === 0 &&
    report.skipped.length === 0 &&
    (report.updated?.length ?? 0) === 0
  ) {
    console.log(`${prefix}Nothing to do.`);
  }
}
