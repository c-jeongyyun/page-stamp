import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { NumberInput } from './NumberInput';

describe('NumberInput', () => {
  it('renders with the given value', () => {
    render(<NumberInput value={5} onChange={vi.fn()} />);
    expect(screen.getByRole('spinbutton')).toHaveValue(5);
  });

  it('calls onChange with parsed number when input changes', () => {
    const onChange = vi.fn();
    render(<NumberInput value={1} onChange={onChange} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '42' } });
    expect(onChange).toHaveBeenCalledWith(42);
  });

  it('applies min attribute when provided', () => {
    render(<NumberInput value={1} onChange={vi.fn()} min={1} />);
    expect(screen.getByRole('spinbutton')).toHaveAttribute('min', '1');
  });

  it('renders placeholder text when provided', () => {
    render(<NumberInput value={0} onChange={vi.fn()} placeholder="Enter a number" />);
    expect(screen.getByPlaceholderText('Enter a number')).toBeInTheDocument();
  });
});
