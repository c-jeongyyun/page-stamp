import { useEffect, useRef } from 'react';
import type { CSSProperties } from '../../types/cssProperties.type';

interface ToastProps {
  message: string;
  type: 'error' | 'success';
  onDismiss?: () => void;
}

const DISMISS_DELAY_MS = 3000;

const BASE_STYLE: CSSProperties = {
  position: 'fixed',
  bottom: '16px',
  left: '16px',
  right: '16px',
  padding: '10px 14px',
  borderRadius: '8px',
  fontSize: '12px',
  fontWeight: 500,
  zIndex: 100,
};

const TYPE_STYLES: Record<ToastProps['type'], CSSProperties> = {
  error: { ...BASE_STYLE, backgroundColor: '#000', color: '#fff' },
  success: { ...BASE_STYLE, backgroundColor: '#fff', color: '#000', border: '1px solid #E5E5E5' },
};

export function Toast({ message, type, onDismiss }: ToastProps) {
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  useEffect(() => {
    const id = setTimeout(() => onDismissRef.current?.(), DISMISS_DELAY_MS);
    return () => clearTimeout(id);
  }, []);

  return <div style={TYPE_STYLES[type]}>{message}</div>;
}
