# AGENTS.md — Angular

Project instructions for coding agents. Prefer the nearest `AGENTS.md` to the file being edited.

Angular/TypeScript standards: `.cursor/rules/angular-20.mdc`. Keep this file project-specific — do not duplicate those rules.

## At a glance

- Project: `<PROJECT_NAME>`
- Angular: `<VERSION>` (standalone) · SSR: `<yes|no>`
- Styling: `<Tailwind|SCSS|…>`
- Package manager: `pnpm` only — never `npm` or `yarn`
- Domains: `<DOMAIN_LIST>`

## Commands

Inspect `package.json` if a script name differs.

| Action | Command |
|--------|---------|
| Install | `pnpm install` |
| Dev | `pnpm start` |
| Test | `pnpm test` |
| Lint | `pnpm lint` |
| Build | `pnpm build` |

Run lint/build (and tests when relevant) before committing. Fix failures you introduce.

## Hard rules

- Do not add dependencies unless asked
- Prefer existing shared components/services over new ones
- Match existing folder and file layout
- Never commit secrets or API keys

## Architecture

- App: `src/app/`
- Features: `<PATHS>`
- Shared UI (prefer these): `<COMPONENTS>`
- Path aliases: `<e.g. @app/*>`
- API pattern: `<methods, response shape, error helper>`
- Models: `<naming / base types>`
- Guards / interceptors / env: `<PATHS>`

## Done checklist

- [ ] Lint and build pass
- [ ] Tests updated when behavior changes
- [ ] No secrets in the diff
