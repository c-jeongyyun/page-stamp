import type { Meta, StoryObj } from '@storybook/preact';
import { useState } from 'react';
import { RadioGroup } from './RadioGroup';

const POSITION_OPTIONS = [
  { value: 'ABSOLUTE', label: 'Absolute' },
  { value: 'AUTO_LAYOUT', label: 'Auto Layout' },
];

type RadioGroupProps = Parameters<typeof RadioGroup>[0];

const meta: Meta<RadioGroupProps> = {
  component: RadioGroup,
  args: {
    name: 'positioning',
    options: POSITION_OPTIONS,
    value: 'ABSOLUTE',
    onChange: () => {},
  },
};

export default meta;
type Story = StoryObj<RadioGroupProps>;

export const Default: Story = {};

export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <RadioGroup {...args} value={value} onChange={setValue} />;
  },
};
