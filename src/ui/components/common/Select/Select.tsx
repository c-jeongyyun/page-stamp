import type { CSSProperties } from '../../types/cssProperties.type';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const selectStyle: CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: '12px',
  color: '#000',
  backgroundColor: '#fff',
  border: '1px solid #E5E5E5',
  borderRadius: '8px',
  appearance: 'none',
  cursor: 'pointer',
  outline: 'none',
};

const disabledStyle: CSSProperties = {
  ...selectStyle,
  opacity: 0.4,
  cursor: 'not-allowed',
};

export function Select({ options, value, onChange, disabled }: SelectProps) {
  return (
    <select
      style={disabled ? disabledStyle : selectStyle}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
