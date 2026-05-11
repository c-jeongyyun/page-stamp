import { useState } from 'react';
import type { ReactNode } from 'react';
import type { CSSProperties } from '../../types/cssProperties.type';

interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}

const BASE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 16px',
  fontSize: '12px',
  fontWeight: 500,
  borderRadius: '50px',
  border: 'none',
  cursor: 'pointer',
  transition: 'opacity 0.1s, background-color 0.1s',
  whiteSpace: 'nowrap',
};

const VARIANTS: Record<ButtonProps['variant'], CSSProperties> = {
  primary: { ...BASE, backgroundColor: '#000', color: '#fff' },
  secondary: { ...BASE, backgroundColor: '#fff', color: '#000', border: '1px solid #E5E5E5' },
  ghost: { ...BASE, backgroundColor: 'transparent', color: '#000' },
};

const HOVER: Record<ButtonProps['variant'], CSSProperties> = {
  primary: { backgroundColor: '#222' },
  secondary: { backgroundColor: '#F5F5F5' },
  ghost: { backgroundColor: 'rgba(0, 0, 0, 0.06)' },
};

const ACTIVE: Record<ButtonProps['variant'], CSSProperties> = {
  primary: { backgroundColor: '#333' },
  secondary: { backgroundColor: '#EBEBEB' },
  ghost: { backgroundColor: 'rgba(0, 0, 0, 0.12)' },
};

const DISABLED: CSSProperties = { opacity: 0.4, cursor: 'not-allowed' };

export function Button({ variant, onClick, disabled, children }: ButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const interactionStyle = pressed ? ACTIVE[variant] : hovered ? HOVER[variant] : {};
  const style = disabled
    ? { ...VARIANTS[variant], ...DISABLED }
    : { ...VARIANTS[variant], ...interactionStyle };

  return (
    <button
      style={style}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
    >
      {children}
    </button>
  );
}
