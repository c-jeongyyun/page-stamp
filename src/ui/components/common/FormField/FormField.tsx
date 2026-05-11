import type { ReactNode } from 'react';
import type { CSSProperties } from '../../types/cssProperties.type';

interface FormFieldProps {
  label: string;
  children: ReactNode;
}

const wrapperStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const labelStyle: CSSProperties = {
  fontSize: '11px',
  fontWeight: 500,
  color: '#000',
  letterSpacing: '0.02em',
};

export function FormField({ label, children }: FormFieldProps) {
  return (
    <div style={wrapperStyle}>
      <span style={labelStyle}>{label}</span>
      {children}
    </div>
  );
}
