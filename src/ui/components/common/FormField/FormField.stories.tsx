import type { Meta, StoryObj } from '@storybook/preact';
import { FormField } from './FormField';
import { Select } from './Select';
import { NumberInput } from './NumberInput';
import { RadioGroup } from './RadioGroup';

const meta: Meta<typeof FormField> = {
  component: FormField,
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const WithSelect: Story = {
  args: {
    label: 'Section',
    children: (
      <Select
        options={[
          { value: 'a', label: 'Chapter 1' },
          { value: 'b', label: 'Chapter 2' },
        ]}
        value="a"
        onChange={() => {}}
      />
    ),
  },
};

export const WithNumberInput: Story = {
  args: {
    label: 'Start number',
    children: <NumberInput value={1} min={1} onChange={() => {}} />,
  },
};

export const WithRadioGroup: Story = {
  args: {
    label: 'Positioning mode',
    children: (
      <RadioGroup
        name="mode"
        options={[
          { value: 'ABSOLUTE', label: 'Absolute' },
          { value: 'AUTO_LAYOUT', label: 'Auto Layout' },
        ]}
        value="ABSOLUTE"
        onChange={() => {}}
      />
    ),
  },
};
