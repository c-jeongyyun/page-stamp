---
name: branch
version: 1.0.0
description: |
  Create a git branch following the project branch naming convention.
  Prompts for type, optional issue number, and description, then creates the branch.
allowed-tools:
  - Bash
  - AskUserQuestion
---

# /branch — Branch Creator

Create a new git branch following the project's branch naming convention.

## Branch Naming Format

```
<type>/<issue-number>-<description>
<type>/<description>        (issue number 없을 때)
```

- 소문자 + 하이픈(-) 구분
- 공백, 대문자, 특수문자 금지

### Types

| 타입 | 용도 |
|------|------|
| `feature` | 새 기능 개발 |
| `bugfix` | 일반 버그 수정 |
| `hotfix` | 프로덕션 긴급 수정 |
| `release` | 배포 준비 |
| `chore` | 빌드, 의존성, 환경 세팅 등 잡무 |
| `refactor` | 리팩터링 |
| `docs` | 문서 작업 |
| `test` | 테스트 추가/수정 |

## Workflow

### Step 1: Gather context

Run `git branch --show-current` to show the current branch.

Run `git status --short` to check for uncommitted changes and inform the user if any exist (do not block — just inform).

### Step 2: Ask the user for branch info

Use AskUserQuestion to ask:

> "브랜치 정보를 입력해주세요.\n\n타입: feature / bugfix / hotfix / release / chore / refactor / docs / test\n이슈 번호 (없으면 생략): \n설명 (영어 소문자, 하이픈 구분): "

If the user provides the information in a single message (e.g., "feature 42 user-login" or "bugfix null-pointer"), parse it directly without asking again.

### Step 3: Validate and construct branch name

Apply these rules to the user's input:

1. **Type** — must be one of the supported types. If not, ask the user to choose a valid type.
2. **Description** — convert to lowercase, replace spaces and underscores with hyphens, strip any characters that are not alphanumeric or hyphens.
3. **Issue number** — digits only; if provided, prepend as `<issue>-` before the description.

Constructed name format:
- With issue: `<type>/<issue>-<description>`
- Without issue: `<type>/<description>`

### Step 4: Confirm with the user

Present the branch name and ask for approval using AskUserQuestion:

> "`<branch-name>` 브랜치를 생성할까요?"

If the user declines or wants edits, ask what to change and reconstruct.

### Step 5: Create and switch to the branch

Run:

```bash
git checkout -b <branch-name>
```

Confirm success and show the current branch with `git branch --show-current`.

If the branch already exists, notify the user:
> "브랜치 `<branch-name>`이 이미 존재합니다. 다른 이름을 사용하거나, 해당 브랜치로 전환하려면 `git checkout <branch-name>`을 실행하세요."

## Examples

```
feature/42-user-login
bugfix/101-null-pointer-error
hotfix/payment-crash
release/v1.2.0
chore/setup-eslint
refactor/auth-service
docs/update-readme
test/add-login-unit-test
```
