import type { StorybookConfig } from '@storybook/preact-vite';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  stories: ['../src/ui/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/preact-vite',
    options: {},
  },
  viteFinal(viteConfig) {
    return mergeConfig(viteConfig, {
      resolve: {
        alias: {
          react: 'preact/compat',
          'react-dom/test-utils': 'preact/test-utils',
          'react-dom': 'preact/compat',
          'react/jsx-runtime': 'preact/jsx-runtime',
        },
      },
    });
  },
};

export default config;
