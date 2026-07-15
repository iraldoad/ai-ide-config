import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { listStacks } from './stacks.mjs';

/**
 * Interactively pick a stack. Throws if stdin is not a TTY.
 * @returns {Promise<string>} stack id
 */
export async function promptForStack() {
  const stacks = listStacks();

  if (!input.isTTY || !output.isTTY) {
    throw new Error(
      'Non-interactive terminal: pass --stack <name> (e.g. --stack angular).',
    );
  }

  const rl = readline.createInterface({ input, output });

  try {
    output.write('Select stack:\n');
    for (let i = 0; i < stacks.length; i++) {
      output.write(`  ${i + 1}) ${stacks[i].label} (${stacks[i].id})\n`);
    }

    while (true) {
      const answer = (await rl.question(`Enter number [1-${stacks.length}]: `)).trim();

      // Empty Enter → default to first stack when only one option.
      if (answer === '' && stacks.length === 1) {
        return stacks[0].id;
      }

      const index = Number.parseInt(answer, 10);

      if (
        Number.isInteger(index) &&
        index >= 1 &&
        index <= stacks.length
      ) {
        return stacks[index - 1].id;
      }

      output.write(`Invalid choice. Enter a number between 1 and ${stacks.length}.\n`);
    }
  } finally {
    rl.close();
  }
}
