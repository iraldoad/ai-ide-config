/** Known stacks. Add an entry + templates/<id>/AGENTS.md for each new stack. */
export const STACKS = {
  angular: {
    id: 'angular',
    label: 'Angular',
    agentsDir: 'angular',
  },
};

export function listStacks() {
  return Object.values(STACKS);
}

export function getStack(id) {
  return STACKS[id] ?? null;
}

export function stackIds() {
  return Object.keys(STACKS);
}
