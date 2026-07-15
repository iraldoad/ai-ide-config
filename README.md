# ai-ide-config

Scaffold shared Cursor IDE / agent setup into a project: shared `.cursor` rules/commands, plus stack-specific `AGENTS.md` and stack rules when needed.

## Install / run

No global install required:

```bash
npx ai-ide-config init
```

From a local checkout:

```bash
cd ai-ide-config
npm link
cd /path/to/your-project
npx ai-ide-config init
```

## Usage

```bash
# Interactive: pick a stack
npx ai-ide-config init

# Non-interactive
npx ai-ide-config init --stack angular
npx ai-ide-config init-angular

# Options
npx ai-ide-config init --force        # overwrite existing files
npx ai-ide-config init --dry-run      # preview only
npx ai-ide-config init --skip-skills  # skip angular/skills install
npx ai-ide-config init ./apps/web     # target directory
```

Existing template files are **skipped** unless you pass `--force`.

`.gitignore` is handled specially:

- If missing → create it with `.cursor/` and `.agents/`
- If present → append `.cursor/` and/or `.agents/` only when missing

If `package.json` exists, init pins an **exact** `packageManager` / `devEngines.packageManager` to the installed pnpm version. That avoids Corepack failing on ranges like `^11.13.0` from `pnpm init`.

After scaffolding, the CLI runs:

```bash
pnpx skills add https://github.com/angular/skills
```

(`pnpx` is used instead of `npx` because the skills package requires pnpm via `devEngines`.)

Use `--skip-skills` to skip that step. On `--dry-run`, the command is only printed.

In CI or non-TTY shells, pass `--stack` (or use `init-<stack>`). Interactive prompts require a terminal.

## What gets written

| Path | Source |
|------|--------|
| `.cursor/rules/conventional-commits.mdc` | shared |
| `.cursor/commands/generate-pr-description.md` | shared |
| `.cursor/rules/angular-20.mdc` | angular ([angular.dev](https://angular.dev/assets/context/angular-20.mdc)) |
| `AGENTS.md` | angular |
| `pnpm-workspace.yaml` | angular (`blockExoticSubdeps`, `minimumReleaseAge: 4320`) |
| `.gitignore` | create or append `.cursor/` and `.agents/` |

After init, edit `AGENTS.md` placeholders (`<PROJECT_NAME>`, package manager, domains, paths) for the target repo.

## Stacks

| Id | Label |
|----|-------|
| `angular` | Angular |

### Adding a stack

1. Add `templates/<stack>/AGENTS.md`
2. Register it in [`src/stacks.mjs`](src/stacks.mjs)
3. Document it here

Shared Cursor rules/commands stay under `templates/shared/`.

## License

MIT
