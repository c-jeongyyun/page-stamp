import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { FormField } from './FormField';

describe('FormField', () => {
  it('renders the label text', () => {
    render(
      <FormField label="Section">
        <input />
      </FormField>,
    );
    expect(screen.getByText('Section')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <FormField label="Label">
        <input data-testid="child-input" />
      </FormField>,
    );
    expect(screen.getByTestId('child-input')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <FormField label="Label">
        <span data-testid="child-a" />
        <span data-testid="child-b" />
      </FormField>,
    );
    expect(screen.getByTestId('child-a')).toBeInTheDocument();
    expect(screen.getByTestId('child-b')).toBeInTheDocument();
  });
});
