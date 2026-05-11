import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';

const OPTIONS = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
];

describe('Select', () => {
  it('renders all options', () => {
    render(<Select options={OPTIONS} value="a" onChange={vi.fn()} />);
    expect(screen.getByRole('option', { name: 'Option A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option B' })).toBeInTheDocument();
  });

  it('reflects the current value', () => {
    render(<Select options={OPTIONS} value="b" onChange={vi.fn()} />);
    const select = screen.getByRole('combobox');
    expect((select as HTMLSelectElement).value).toBe('b');
  });

  it('calls onChange with selected value', async () => {
    const onChange = vi.fn();
    render(<Select options={OPTIONS} value="a" onChange={onChange} />);
    await userEvent.selectOptions(screen.getByRole('combobox'), 'b');
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Select options={OPTIONS} value="a" onChange={vi.fn()} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('renders empty options list without crashing', () => {
    render(<Select options={[]} value="" onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
