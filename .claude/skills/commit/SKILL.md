---
name: commit
version: 1.0.0
description: |
  Analyze git changes and generate a Conventional Commits 1.0.0 message.
  Tags changes with the appropriate type prefix, writes description in noun form.
  When mixed change types are detected, suggests splitting into separate commits.
allowed-tools:
  - Bash
  - AskUserQuestion
---

# /commit — Conventional Commits Message Generator

Generate a Conventional Commits 1.0.0 compliant commit message from current git changes.

## Workflow

### Step 1: Gather changes

Run `git diff --staged` to inspect staged changes.

If nothing is staged, run `git diff HEAD` and notify the user:
> "No staged changes found. Analyzing all unstaged changes instead. Consider running `git add` to stage specific files before committing."

Also run `git status --short` to get a file-level overview.

### Step 2: Classify changes by type

Analyze each changed file and its diff. Assign one of the supported types based on the nature of the change:

| Type | When to use |
|------|-------------|
| `feat` | New feature or capability added |
| `fix` | Bug fix |
| `docs` | Documentation only (README, comments, specs) |
| `style` | Formatting, whitespace, semicolons — no logic change |
| `refactor` | Code restructuring with no behavior change |
| `test` | Adding or modifying tests |
| `chore` | Build scripts, package management, miscellaneous maintenance |
| `build` | Build system or external dependency changes |
| `ci` | CI/CD pipeline configuration |
| `perf` | Performance improvement |
| `revert` | Reverting a previous commit |
| `init` | Initial project setup |
| `wip` | Work in progress — incomplete, temporary commit |
| `hotfix` | Urgent production fix |
| `release` | Release version bump or changelog |
| `config` | Configuration file changes (env, settings, etc.) |
| `ui` | Visual or UX changes |
| `api` | API contract changes |
| `db` | Database schema or migration changes |
| `security` | Security-related fixes or hardening |

### Step 3: Single type vs. mixed types

**If all changes belong to a single type:**
Generate one commit message and output it.

**If changes span multiple types:**
- Group files by their type
- Announce that the changes should be split into separate commits
- Output one commit message per type group, in priority order (feat/fix first, then others)
- For each group, show which files to stage:

```
⚠️  Mixed change types detected. Recommend splitting into separate commits:

─── Commit 1 ──────────────────────────────────────────
Stage: src/feature.ts, src/utils.ts
Message:
feat(core): addition of frame sorting utility

─── Commit 2 ──────────────────────────────────────────
Stage: docs/README.md
Message:
docs: update of README with usage examples
────────────────────────────────────────────────────────
```

### Step 4: Format each commit message

Follow Conventional Commits 1.0.0 strictly:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Rules:**
- `type`: one of the supported types above
- `scope`: optional, lowercase, describes the affected module/area (e.g., `ui`, `parser`, `auth`)
- `description`: **noun form, English, 50 chars or less** — describe *what* was added/changed, not *why*
  - Good: `addition of retry logic`, `removal of deprecated endpoint`
  - Bad: `add retry logic`, `removes deprecated endpoint`
- `body`: optional; explain *why* the change was made, wrap at 72 chars
- `footer`: optional; use for `BREAKING CHANGE:` or issue references like `Closes #42`

**Breaking changes:** Add `!` after type/scope and include `BREAKING CHANGE:` in footer.

```
feat(api)!: redesign of authentication flow

BREAKING CHANGE: token format changed from JWT to opaque string
```

### Step 5: Confirm and commit

Present the generated message(s) and ask the user for approval using AskUserQuestion:

> "위 메시지로 커밋할까요? (단일 타입인 경우) / 위 순서대로 커밋을 진행할까요? (혼합 타입인 경우)"

**If the user approves (single type):**
Run the commit using a HEREDOC:

```bash
git commit -m "$(cat <<'EOF'
<commit message here>
EOF
)"
```

**If the user approves (mixed types):**
For each group in order:
1. Stage the listed files: `git add <files>`
2. Run `git commit -m "..."`
3. Confirm each commit succeeded before proceeding to the next

**If the user declines or requests edits:**
Ask what they'd like to change, update the message, and ask again before committing.

## Examples

### Single type
```
feat(ui): addition of page number preview panel
```

### With body
```
fix(parser): correction of frame sort order for RTL layouts

Frames in right-to-left layouts were sorted incorrectly due to
a sign error in the x-coordinate comparison function.
```

### Mixed types output

```
⚠️  Mixed change types detected. Recommend splitting into separate commits:

─── Commit 1 ──────────────────────────────────────────
Stage: src/code.ts
Message:
fix(frame): correction of off-by-one error in page index

─── Commit 2 ──────────────────────────────────────────
Stage: docs/spec.md, docs/architecture.md
Message:
docs: update of plugin architecture documentation
────────────────────────────────────────────────────────
```
