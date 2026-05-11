import type { Meta, StoryObj } from '@storybook/preact';
import { useState } from 'react';
import { Select } from './Select';

const SECTION_OPTIONS = [
  { value: 'section-1', label: 'Chapter 1 — Introduction' },
  { value: 'section-2', label: 'Chapter 2 — Architecture' },
  { value: 'section-3', label: 'Chapter 3 — Implementation' },
];

type SelectProps = Parameters<typeof Select>[0];

const meta: Meta<SelectProps> = {
  component: Select,
  args: {
    options: SECTION_OPTIONS,
    value: 'section-1',
    onChange: () => {},
  },
};

export default meta;
type Story = StoryObj<SelectProps>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <Select {...args} value={value} onChange={setValue} />;
  },
};
