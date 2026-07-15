# Generate PR Description

Generate a copy-paste PR description for the current branch.

## Destination branch

Use the destination (base) branch from the text after this command, if provided.

Examples:
- `/generate-pr-description` → base `origin/dev`
- `/generate-pr-description integration-dev-3` → base `origin/integration-dev-3`
- `/generate-pr-description latest-release` → base `origin/latest-release`

Rules:
1. If the user provides a branch name (with or without `origin/`), use that as the base.
2. If none is provided, default to `origin/dev`.
3. If the user did not provide a base and the default looks wrong for the branch (e.g. release / hotfix naming), ask once which destination branch to use, then continue.
4. Normalize short names to remote refs when available (`dev` → `origin/dev`).

## Steps

1. Resolve the destination branch using the rules above.
2. Gather context with git (do **not** create `pr-diff.txt` or other temp files):
   - `git status -sb`
   - `git log --oneline <base>...HEAD`
   - `git diff --stat <base>...HEAD`
   - `git diff <base>...HEAD`
3. Prefer the three-dot range (`<base>...HEAD`) so the description matches what GitHub/Azure DevOps shows for the PR.
4. Infer any Jira key from branch name or commit messages (e.g. `feature-31575`, `CRA10-30756`, `Refs: CRA-10`). If unknown, leave a placeholder.
5. Write the PR description (max ~300 words). Omit empty optional sections.
6. Output **only** the markdown below — no preamble, no tool commentary, no offer to create the PR unless asked.

## Output format

```markdown
# <concise PR title>

## Overview
<1-3 sentences: what this PR does and why>

## Changes
- <high-level change>
- <high-level change>

## Breaking changes
None.
<!-- or a short list -->

## Related
Refs: <JIRA-KEY or leave blank after the colon>
Base: `<destination-branch>`
```

Optional sections — include only when clearly relevant:

```markdown
## Architectural notes
<short note on design/pattern changes>

## Performance
<short note only if there are real perf/ops improvements>
```

## Writing rules

- Focus on why and what, not file-by-file commentary.
- Prefer product/feature language over implementation trivia.
- Do not invent features, tests, or breaking changes not supported by the diff/commits.
- Keep bullets short and specific.
- Match this repo’s ticket style (Jira), not `#123` GitHub issues, unless the commits clearly use GitHub issue numbers.
