import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children text', () => {
    render(
      <Button variant="primary" onClick={vi.fn()}>
        Click me
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(
      <Button variant="primary" onClick={onClick}>
        Go
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <Button variant="primary" onClick={vi.fn()} disabled>
        Submit
      </Button>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button variant="primary" onClick={onClick} disabled>
        Submit
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders secondary variant', () => {
    render(
      <Button variant="secondary" onClick={vi.fn()}>
        Cancel
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('renders ghost variant', () => {
    render(
      <Button variant="ghost" onClick={vi.fn()}>
        Remove
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });
});
