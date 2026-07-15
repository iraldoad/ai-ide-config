#!/usr/bin/env node

import path from 'node:path';
import { getStack, listStacks, stackIds } from '../src/stacks.mjs';
import { promptForStack } from '../src/prompt.mjs';
import { initStack, printReport } from '../src/init.mjs';
import { runSkillsAdd, SKILLS_ADD_COMMAND } from '../src/skills.mjs';

function printUsage() {
  const stacks = listStacks()
    .map((s) => `  init-${s.id}`.padEnd(18) + `# shortcut for init --stack ${s.id}`)
    .join('\n');

  console.log(`Usage:
  ai-ide-config init [dir] [--stack <name>] [--force] [--dry-run] [--skip-skills]
  ai-ide-config init-<stack> [dir] [--force] [--dry-run] [--skip-skills]

Options:
  --stack <name>   Skip interactive prompt (e.g. angular)
  --force          Overwrite existing files
  --dry-run        Show what would be written
  --skip-skills    Do not run: ${SKILLS_ADD_COMMAND}

Stacks:
${listStacks()
  .map((s) => `  ${s.id.padEnd(12)} ${s.label}`)
  .join('\n')}

Shortcuts:
${stacks}
`);
}

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  const args = [...argv];
  /** @type {{ command: string | null, targetDir: string, stackId: string | null, force: boolean, dryRun: boolean, skipSkills: boolean, help: boolean }} */
  const result = {
    command: null,
    targetDir: process.cwd(),
    stackId: null,
    force: false,
    dryRun: false,
    skipSkills: false,
    help: false,
  };

  const positionals = [];

  while (args.length > 0) {
    const token = args.shift();

    if (token === '--help' || token === '-h') {
      result.help = true;
      continue;
    }
    if (token === '--force') {
      result.force = true;
      continue;
    }
    if (token === '--dry-run') {
      result.dryRun = true;
      continue;
    }
    if (token === '--skip-skills') {
      result.skipSkills = true;
      continue;
    }
    if (token === '--stack') {
      const value = args.shift();
      if (!value) {
        throw new Error('--stack requires a value');
      }
      result.stackId = value;
      continue;
    }
    if (token.startsWith('-')) {
      throw new Error(`Unknown option: ${token}`);
    }
    positionals.push(token);
  }

  result.command = positionals[0] ?? null;
  if (positionals[1]) {
    result.targetDir = path.resolve(positionals[1]);
  }

  return result;
}

/**
 * Resolve stack id from command name like init-angular.
 * @param {string} command
 * @returns {string | null}
 */
function stackFromInitAlias(command) {
  const match = /^init-(.+)$/.exec(command);
  if (!match) return null;
  return match[1];
}

async function main() {
  let parsed;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (parsed.help || !parsed.command) {
    printUsage();
    process.exitCode = parsed.help ? 0 : 1;
    return;
  }

  let stackId = parsed.stackId;

  if (parsed.command === 'init') {
    // stackId may already be set via --stack
  } else {
    const aliasStack = stackFromInitAlias(parsed.command);
    if (aliasStack) {
      if (stackId && stackId !== aliasStack) {
        console.error(
          `Conflicting stacks: command is init-${aliasStack} but --stack ${stackId} was passed.`,
        );
        process.exitCode = 1;
        return;
      }
      stackId = aliasStack;
    } else {
      console.error(`Unknown command: ${parsed.command}`);
      printUsage();
      process.exitCode = 1;
      return;
    }
  }

  if (!stackId) {
    try {
      stackId = await promptForStack();
    } catch (err) {
      console.error(err.message);
      process.exitCode = 1;
      return;
    }
  }

  const stack = getStack(stackId);
  if (!stack) {
    console.error(
      `Unknown stack "${stackId}". Available: ${stackIds().join(', ')}`,
    );
    process.exitCode = 1;
    return;
  }

  try {
    const report = initStack({
      stack,
      targetDir: parsed.targetDir,
      force: parsed.force,
      dryRun: parsed.dryRun,
    });

    console.log(
      `${parsed.dryRun ? '[dry-run] ' : ''}Scaffolding ${stack.label} AI IDE config into ${parsed.targetDir}`,
    );
    printReport(report, { dryRun: parsed.dryRun });

    runSkillsAdd(parsed.targetDir, {
      dryRun: parsed.dryRun,
      skip: parsed.skipSkills,
    });
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}

main();
