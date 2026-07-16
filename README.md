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
npx ai-ide-config init --skip-skills  # skip midudev/autoskills install
npx ai-ide-config init ./apps/web     # target directory
```

Existing template files are **skipped** unless you pass `--force`.

`.gitignore` is handled specially:

- If missing → create it with `.cursor/` and `.agents/`
- If present → append `.cursor/` and/or `.agents/` only when missing

If `package.json` exists, init pins an **exact** `packageManager` / `devEngines.packageManager` to the installed pnpm version. That avoids Corepack failing on ranges like `^11.13.0` from `pnpm init`.

After scaffolding, the CLI runs:

```bash
pnpx skills add midudev/autoskills
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

## Publishing to npm

CD publishes to npm when you create a **GitHub Release** (workflow: [`.github/workflows/publish.yml`](.github/workflows/publish.yml)).

### One-time setup

1. Create an [npmjs.com](https://www.npmjs.com) account and verify your email.
2. Create the package on npm (first publish can also create it), or claim the name `ai-ide-config`.
3. In the package settings on npm → **Trusted Publisher**:
   - **Organization or user:** `iraldoad`
   - **Repository:** `ai-ide-config`
   - **Workflow filename:** `publish.yml`
   - Allow **npm publish**
4. No `NPM_TOKEN` secret is required (OIDC Trusted Publishing).

### Release a version

1. Bump `version` in `package.json` (e.g. `0.1.1`).
2. Commit and push.
3. Create a GitHub Release for that commit (e.g. tag `v0.1.1`).
4. The workflow runs `npm publish --access public --provenance`.

After the first successful publish:

```bash
npx ai-ide-config init
```

## License

MIT
