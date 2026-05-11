import type { Preview } from '@storybook/preact';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'figma-canvas',
      values: [
        { name: 'figma-canvas', value: '#F5F5F5' },
        { name: 'white', value: '#FFFFFF' },
      ],
    },
  },
};

export default preview;
