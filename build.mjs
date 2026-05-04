import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const isWatch = process.argv.includes('--watch');

const preactAlias = {
  'react': 'preact/compat',
  'react-dom/test-utils': 'preact/test-utils',
  'react-dom': 'preact/compat',
  'react/jsx-runtime': 'preact/jsx-runtime',
};

mkdirSync('dist', { recursive: true });

/** @type {esbuild.Plugin} */
const inlineHtmlPlugin = {
  name: 'inline-html',
  setup(build) {
    build.onEnd((result) => {
      if (result.errors.length > 0) return;
      const js = result.outputFiles[0].text;
      const template = readFileSync('src/ui.html', 'utf-8');
      const html = template.replace('</body>', `<script>${js}</script>\n</body>`);
      writeFileSync('dist/ui.html', html);
      console.log('[ui] dist/ui.html built');
    });
  },
};

/** @type {esbuild.BuildOptions} */
const codeOptions = {
  entryPoints: ['src/code.ts'],
  bundle: true,
  outfile: 'dist/code.js',
  platform: 'browser',
  target: 'es2020',
  logLevel: 'info',
};

/** @type {esbuild.BuildOptions} */
const uiOptions = {
  entryPoints: ['src/ui.tsx'],
  bundle: true,
  write: false,
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  jsxImportSource: 'preact',
  alias: preactAlias,
  logLevel: 'info',
  plugins: [inlineHtmlPlugin],
};

if (isWatch) {
  const [codeCtx, uiCtx] = await Promise.all([
    esbuild.context(codeOptions),
    esbuild.context(uiOptions),
  ]);
  await Promise.all([codeCtx.watch(), uiCtx.watch()]);
  console.log('Watching for changes...');
} else {
  await Promise.all([
    esbuild.build(codeOptions),
    esbuild.build(uiOptions),
  ]);
}
