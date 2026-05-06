# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 절대 규칙

위반하면 안 되는 금지 사항. 예외 없이 적용된다.

### 데이터 및 보안

- **API 키·토큰 하드코딩 금지** — `figma.clientStorage`에 저장하더라도 평문으로 두지 않는다. 플러그인 번들은 누구나 읽을 수 있다.
- **사용자 파일 데이터 외부 전송 금지** — 프레임 이름, 텍스트 내용 등을 외부 서버로 보내는 것은 Figma 정책 위반이다.
- **`innerHTML` 직접 삽입 금지** — Figma 문서 데이터를 `innerHTML`로 넣지 않는다. `textContent` 또는 DOM API를 사용한다.
- **`eval()` / `new Function()` 금지** — Figma CSP에 의해 차단되며 임의 코드 실행 위험이 있다.
- **외부 스크립트 로드 금지** — `<script src="...">` 형태의 외부 CDN 참조는 공급망 공격에 노출된다. 현재 빌드 파이프라인을 통해 모든 JS를 인라인으로 유지한다.
- **UI 입력값 무검증 Figma API 전달 금지** — UI(iframe)는 이론적으로 조작 가능하므로 `code.ts`가 항상 최종 검증 계층이어야 한다.
- **`pnpm audit` 없이 패키지 추가 금지** — 알려진 취약점을 확인한 후에만 패키지를 추가한다.

### 에러 처리

- **Partial Apply 금지** — 여러 프레임에 스탬핑하다가 중간에 실패하면 삽입된 인스턴스를 모두 롤백한 뒤 에러를 표면화한다. 절반만 적용된 상태로 두지 않는다.
- **에러 묵살 금지** — Figma API 호출은 항상 try/catch로 감싼다. 에러가 조용히 사라지게 두지 않는다.

---

## Project Overview

Page Stamp is a **Figma plugin** that automates page numbering on slide designs. It detects frame order (top-left to bottom-right) within a selected section, then inserts Figma component instances containing page numbers into each frame.

## Architecture

### Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Figma Plugin Sandbox + iframe (UI) |
| UI Framework | Preact 10 (`react` → `preact/compat` alias) |
| Language | TypeScript 5 (strict mode) |
| Bundler | esbuild (custom `inlineHtmlPlugin`) |
| Package Manager | pnpm |

### Folder Structure

```text
page-stamp/
├── src/
│   ├── sandbox/
│   │   └── code.ts       # Sandbox (backend) — all Figma API calls
│   └── ui/
│       ├── components/   # Reusable UI components
│       ├── App.tsx       # Root UI component (plugin panel)
│       ├── ui.tsx        # UI entry point; renders <App /> into DOM
│       └── ui.html       # HTML template; bundled JS is inlined here at build time
├── dist/                 # Build output (code.js, ui.html)
├── docs/                 # Architecture, spec, tasks
├── build.mjs             # esbuild pipeline
├── manifest.json         # Figma plugin manifest
├── package.json
└── tsconfig.json
```

### Build Pipeline (`build.mjs`)

Uses esbuild with a custom `inlineHtmlPlugin`:

1. Bundles `src/sandbox/code.ts` → `dist/code.js`
2. Bundles `src/ui/ui.tsx` → inline JS, then injects into `src/ui/ui.html` → `dist/ui.html`

For full architecture, message flow, and data model details, refer to [`docs/architecture.md`](docs/architecture.md).

## Commands

```bash
pnpm build       # One-time build → dist/code.js + dist/ui.html
pnpm watch       # Watch mode for active development
pnpm typecheck   # TypeScript type check (no emit)
```

No test or lint commands are configured yet.

## Conventions

- **TypeScript strict mode** — `strict: true` is enabled; no implicit any, no unchecked types
- **Preact with React syntax** — write standard React/JSX; esbuild aliases `react` → `preact/compat` and `react-dom` → `preact/compat` at build time. Do not import from `preact` directly.
- **Branch** — Run the `/branch` skill before starting any task to create a dedicated branch. Never work directly on `main` or `develop`.
- **Merge Strategy** — `develop` → `main`: 기본 merge. Feature 등 기타 브랜치 → `develop`: squash merge.
- **TDD** — Write tests first, then implement. Move to the next step only after all tests pass.
- **Lint & Format** — Run ESLint and Prettier after every task.
- **Code Review** — After every task, invoke the `code-reviewer` subagent on all changed files before committing. Address any Critical or Major issues before proceeding.
- **Commit** — Run the `/commit` skill after every task to commit the changes.

## Error Handling

### Sandbox (`code.ts`)

Always wrap Figma API calls in try/catch. Never let errors bubble up silently.

**User-facing errors** → `figma.notify()` with `{ error: true }`:

```ts
try {
  await stampPages();
} catch (e) {
  figma.notify('Failed to insert page numbers.', { error: true });
}
```

**Errors requiring UI feedback** → forward via `SandboxBridge.send('error', ...)`:

```ts
sandboxBridge.send('error', { message: e instanceof Error ? e.message : 'Unknown error' });
```

**Top-level handler** — wrap the entry point so the plugin never freezes silently:

```ts
figma.on('run', async () => {
  try {
    await main();
  } catch (e) {
    figma.notify('An error occurred.', { error: true });
    figma.closePlugin();
  }
});
```

### UI (`App.tsx`)

Handle the `error` message from the sandbox and reflect it in component state:

```ts
uiBridge.on('error', ({ message }) => setError(message));
```

Disable action buttons while an operation is in progress to prevent duplicate calls:

```ts
const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
```

### Pre-condition Checks

Validate before calling Figma APIs — do not rely on catch alone:

| Condition | Check |
| --- | --- |
| No frames in section | extracted frame list is empty |
| Component deleted | `figma.getNodeById(id) === null` |
| Instance node missing | plugin metadata lookup returns `undefined` |

## Security (Figma Plugin Context)

See **절대 규칙** at the top for the full list of hard prohibitions. Below is the rationale and detail for each area.

### Sensitive Data

Plugin bundles are readable by anyone — never store plaintext secrets. User file data (frame names, text content) must never leave the client; sending it to external servers violates Figma policy and user trust.

### UI Layer (`ui.html`)

Figma's CSP blocks `eval()` and `new Function()`. External `<script src="...">` tags expose the plugin to supply chain attacks — keep all JS inlined via the build pipeline.

### Sandbox ↔ UI Communication

Always validate the message type when receiving via `postMessage` — ignore unknown types. The UI iframe is theoretically manipulable, so `code.ts` must be the final validation layer before any Figma API call.

### Dependencies

Run `pnpm audit` before adding any new package to verify there are no known vulnerabilities.

## Feature Specification

Full feature spec: [`docs/spec.md`](docs/spec.md) (written in Korean).

Key behaviors:

- Frames within a section are sorted TL (top-left to bottom-right) to determine page order
- A Figma component is selected by the user or auto-created (`PageNumber / Default`)
- Component instances are tagged with `setPluginData('isPageNumber', 'true')` for re-identification
- TL-order numbering is preserved even if some frames are missing instances (no renumbering on refresh)
- Supports Absolute positioning and Auto Layout placement modes

## Current Task Status

For current task progress and completion status, refer to [`docs/tasks.md`](docs/tasks.md).
