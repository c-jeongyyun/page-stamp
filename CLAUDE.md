# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Page Stamp is a **Figma plugin** that automates page numbering on slide designs. It detects frame order (top-left to bottom-right), then inserts Figma component instances containing page numbers into each frame.

## Commands

```bash
pnpm build       # One-time build → dist/code.js + dist/ui.html
pnpm watch       # Watch mode for active development
```

No test or lint commands are configured.

## Architecture

The plugin follows the standard Figma plugin split:

- **`src/code.ts`** — Backend (runs in Figma's plugin sandbox). Handles all Figma API calls: frame detection, component instance creation, page number injection, and messaging with the UI.
- **`src/App.tsx`** — Preact UI component (displayed in the plugin panel). Communicates with the backend via `postMessage`.
- **`src/ui.tsx`** — UI entry point; renders `<App />` into DOM.
- **`src/ui.html`** — HTML template. During build, the bundled JS is inlined into this file to produce `dist/ui.html`.

### Build Pipeline (`build.mjs`)

Uses esbuild with a custom `inlineHtmlPlugin`:
1. Bundles `src/code.ts` → `dist/code.js`
2. Bundles `src/ui.tsx` → inline JS, then injects into `src/ui.html` → `dist/ui.html`

Preact is aliased to replace React imports (`react` → `preact/compat`, `react-dom` → `preact/compat`), so standard React syntax works.

### Communication Pattern

```
App.tsx  →  postMessage({ type, payload })  →  code.ts
code.ts  →  figma.ui.postMessage(...)       →  App.tsx
```

## Feature Specification

Full spec is in [`docs/spec.md`](docs/spec.md) (Korean). Key behaviors:
- Frames are sorted TL (top-left to bottom-right) to determine page order
- A Figma component is selected or auto-created to represent page numbers
- Component instances are tagged with plugin metadata so they can be re-identified even if layers are renamed
- TL-order numbering is preserved even if some frames are missing instances (no renumbering)
- Supports absolute positioning and Auto Layout placement modes
