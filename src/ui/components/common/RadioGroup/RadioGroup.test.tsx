import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { RadioGroup } from './RadioGroup';

const OPTIONS = [
  { value: 'x', label: 'Choice X' },
  { value: 'y', label: 'Choice Y' },
];

describe('RadioGroup', () => {
  it('renders all radio options', () => {
    render(<RadioGroup name="test" options={OPTIONS} value="x" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Choice X')).toBeInTheDocument();
    expect(screen.getByLabelText('Choice Y')).toBeInTheDocument();
  });

  it('checks the radio matching the current value', () => {
    render(<RadioGroup name="test" options={OPTIONS} value="y" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Choice X')).not.toBeChecked();
    expect(screen.getByLabelText('Choice Y')).toBeChecked();
  });

  it('calls onChange with the selected value when clicked', async () => {
    const onChange = vi.fn();
    render(<RadioGroup name="test" options={OPTIONS} value="x" onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Choice Y'));
    expect(onChange).toHaveBeenCalledWith('y');
  });

  it('does not call onChange when clicking the already-selected option', async () => {
    const onChange = vi.fn();
    render(<RadioGroup name="test" options={OPTIONS} value="x" onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Choice X'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
