import { JSX } from "react";
export function Select({
  label, value, onChange, options
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string; disabled?: boolean }[];
}): JSX.Element {
  // If current value is not in options, fall back to first enabled option
  const values = new Set(options.map(o => o.value));
  const safeValue = values.has(value) ? value : (options.find(o => !o.disabled)?.value ?? "");

  return (
    <div style={{ display: "inline-flex", alignItems: "center", marginRight: 12 }}>
      <label style={{ marginRight: 8, fontSize: 12 }}>{label}</label>
      <select value={safeValue} onChange={(e) => onChange(e.target.value)}>
        {options.map(o => (
          <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}


export function LabeledSlider({
  label, value, min, max, step = 1, onChange
}: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void;
}): JSX.Element {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", margin: "0 12px" }}>
      <label style={{ marginRight: 8, fontSize: 12 }}>{label}</label>
      <input type="range" min={min} max={max} step={step} value={value}
             onChange={(e) => onChange(parseInt(e.target.value, 10))} />
      <span style={{ marginLeft: 6, fontSize: 12 }}>{value}</span>
    </div>
  );
}
