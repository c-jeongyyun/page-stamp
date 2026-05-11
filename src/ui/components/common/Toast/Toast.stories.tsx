import type { Meta, StoryObj } from '@storybook/preact';
import { Toast } from './Toast';

const meta: Meta<typeof Toast> = {
  component: Toast,
  // Toast is fixed-positioned; use a wrapper to keep it visible in the canvas
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', height: '80px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    // Disable auto-dismiss during Storybook by providing a no-op onDismiss
  },
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Error: Story = {
  args: {
    type: 'error',
    message: 'Failed to insert page numbers.',
    onDismiss: () => {},
  },
};

export const Success: Story = {
  args: {
    type: 'success',
    message: 'Page numbers applied successfully.',
    onDismiss: () => {},
  },
};
