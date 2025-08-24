import { JSX } from "react";

/* ---------- Segmented (general) ---------- */
export function Segmented({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string; // may be undefined for "mixed"
  options: { label: string; value: string; disabled?: boolean }[];
  onChange: (v: string) => void;
}): JSX.Element {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginRight: 12 }}>
      <span style={{ fontSize: 12 }}>{label}</span>
      <div
        role="tablist"
        aria-label={label}
        style={{
          display: "inline-flex",
          border: "1px solid #d0d7de",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <button
              key={o.value}
              role="tab"
              aria-selected={selected}
              disabled={o.disabled}
              onClick={() => onChange(o.value)}
              style={{
                padding: "6px 10px",
                fontSize: 12,
                border: "none",
                background: selected ? "#111827" : "#fff",
                color: selected ? "#fff" : "#111827",
                cursor: o.disabled ? "not-allowed" : "pointer",
                opacity: o.disabled ? 0.5 : 1,
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Select (keep for node scope) ---------- */
export function Select({
  label, value, onChange, options
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string; disabled?: boolean }[];
}): JSX.Element {
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

/* ---------- Slider ---------- */
export function LabeledSlider({
  label, value, min, max, step = 1, onChange, disabled = false
}: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; disabled?: boolean;
}): JSX.Element {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", margin: "0 12px", opacity: disabled ? 0.5 : 1 }}>
      <label style={{ marginRight: 8, fontSize: 12 }}>{label}</label>
      <input
        type="range" min={min} max={max} step={step} value={value} disabled={disabled}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
      />
      <span style={{ marginLeft: 6, fontSize: 12 }}>{value}</span>
    </div>
  );
}
