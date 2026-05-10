import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'sandbox',
          globals: true,
          environment: 'node',
          include: ['src/sandbox/__tests__/**/*.test.ts'],
          setupFiles: ['src/sandbox/__tests__/setup.ts'],
        },
      },
      {
        oxc: {
          jsx: { importSource: 'preact' },
        },
        resolve: {
          alias: {
            react: 'preact/compat',
            'react-dom': 'preact/compat',
          },
        },
        test: {
          name: 'ui',
          globals: true,
          environment: 'jsdom',
          include: ['src/ui/__tests__/**/*.test.{ts,tsx}'],
          setupFiles: ['src/ui/__tests__/setup.ts'],
        },
      },
    ],
  },
});
