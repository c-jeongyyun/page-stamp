import type { CSSProperties } from '../../types/cssProperties.type';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  placeholder?: string;
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: '12px',
  color: '#000',
  backgroundColor: '#fff',
  border: '1px solid #E5E5E5',
  borderRadius: '8px',
  outline: 'none',
  boxSizing: 'border-box',
};

export function NumberInput({ value, onChange, min, placeholder }: NumberInputProps) {
  return (
    <input
      type="number"
      style={inputStyle}
      value={value}
      min={min}
      placeholder={placeholder}
      step="1"
      onChange={(e) => {
        const parsed = parseInt((e.target as HTMLInputElement).value, 10);
        if (!isNaN(parsed)) onChange(parsed);
      }}
    />
  );
}
