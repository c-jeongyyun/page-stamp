import type { Meta, StoryObj } from '@storybook/preact';
import { useState } from 'react';
import { NumberInput } from './NumberInput';

type NumberInputProps = Parameters<typeof NumberInput>[0];

const meta: Meta<NumberInputProps> = {
  component: NumberInput,
  args: {
    value: 1,
    min: 1,
    onChange: () => {},
  },
};

export default meta;
type Story = StoryObj<NumberInputProps>;

export const Default: Story = {};

export const WithPlaceholder: Story = {
  args: {
    value: 0,
    placeholder: 'Start number',
  },
};

export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <NumberInput {...args} value={value} onChange={setValue} />;
  },
};
