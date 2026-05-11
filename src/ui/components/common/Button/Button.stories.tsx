import type { Meta, StoryObj } from '@storybook/preact';
import { Button } from './Button';

type ButtonProps = Parameters<typeof Button>[0];

const meta: Meta<ButtonProps> = {
  component: Button,
  args: {
    onClick: () => {},
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost'],
    },
  },
};

export default meta;
type Story = StoryObj<ButtonProps>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Apply',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Cancel',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Remove all',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Apply',
  },
};

export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
    </div>
  ),
  args: {
    onClick: () => {},
  },
};
