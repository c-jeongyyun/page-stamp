import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { Toast } from './Toast';

describe('Toast', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the message text', () => {
    render(<Toast message="Something went wrong" type="error" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders success message', () => {
    render(<Toast message="Done!" type="success" />);
    expect(screen.getByText('Done!')).toBeInTheDocument();
  });

  it('calls onDismiss automatically after timeout', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<Toast message="Done!" type="success" onDismiss={onDismiss} />);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(3000);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not throw when onDismiss is not provided and timeout fires', () => {
    vi.useFakeTimers();
    render(<Toast message="Done!" type="success" />);
    expect(() => vi.advanceTimersByTime(3000)).not.toThrow();
  });
});
