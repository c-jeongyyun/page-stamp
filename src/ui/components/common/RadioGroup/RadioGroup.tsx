import type { CSSProperties } from '../../types/cssProperties.type';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
}

const wrapperStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const labelStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '12px',
  color: '#000',
  cursor: 'pointer',
};

export function RadioGroup({ name, options, value, onChange }: RadioGroupProps) {
  return (
    <div style={wrapperStyle}>
      {options.map((opt) => (
        <label key={opt.value} style={labelStyle}>
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => {
              if (opt.value !== value) onChange(opt.value);
            }}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
