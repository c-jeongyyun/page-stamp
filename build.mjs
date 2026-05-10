import { mkdirSync, readFileSync, writeFileSync, watch } from 'fs';
import { build } from 'rolldown';

const isWatch = process.argv.includes('--watch');

const preactAlias = {
  react: 'preact/compat',
  'react-dom/test-utils': 'preact/test-utils',
  'react-dom': 'preact/compat',
  'react/jsx-runtime': 'preact/jsx-runtime',
};

mkdirSync('dist', { recursive: true });

/** @type {import('rolldown').BuildOptions} */
const codeOptions = {
  input: 'src/sandbox/code.ts',
  platform: 'browser',
  transform: {
    target: 'es2020',
  },
  output: {
    file: 'dist/code.js',
    format: 'iife',
  },
};

/** @type {import('rolldown').BuildOptions} */
const uiOptions = {
  input: 'src/ui/ui.tsx',
  write: false,
  platform: 'browser',
  resolve: {
    alias: preactAlias,
  },
  transform: {
    target: 'es2020',
  },
  output: {
    format: 'iife',
  },
};

async function buildUi() {
  const result = await build(uiOptions);
  const chunk = result.output.find((output) => output.type === 'chunk');
  if (!chunk) throw new Error('UI bundle chunk was not generated');

  const template = readFileSync('src/ui/ui.html', 'utf-8');
  const html = template.replace('</body>', `<script>${chunk.code}</script>\n</body>`);
  writeFileSync('dist/ui.html', html);
  console.log('[ui] dist/ui.html built');
}

async function buildAll() {
  await Promise.all([build(codeOptions), buildUi()]);
}

if (isWatch) {
  let pending = false;

  const rebuild = async () => {
    if (pending) return;
    pending = true;
    try {
      await buildAll();
    } catch (error) {
      console.error(error);
    } finally {
      pending = false;
    }
  };

  await rebuild();
  watch('src', { recursive: true }, rebuild);
  console.log('Watching for changes...');
} else {
  await buildAll();
}
