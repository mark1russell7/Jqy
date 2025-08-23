// dom/adapter.tsx
import { LayoutResult } from "../engine/computeLayout";

export function AbsoluteDOM({ result }: { result: LayoutResult }) {
  const boxes = Object.values(result.boxes);

  // optional edge rendering using SVG atop the boxes
  const lines = result.wires.map((w) => {
    const a = result.boxes[w.source], b = result.boxes[w.target];
    if (!a || !b) return null;
    const ax = a.tl.x + a.size.x / 2, ay = a.tl.y + a.size.y / 2;
    const bx = b.tl.x + b.size.x / 2, by = b.tl.y + b.size.y / 2;
    return <line key={`${w.source}-${w.target}`} x1={ax} y1={ay} x2={bx} y2={by} stroke="#94a3b8" strokeWidth={1} />;
  });

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* edges below nodes */}
      <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {lines}
      </svg>

      {/* nodes */}
      {boxes.map((b) => (
        <div
          key={b.id}
          style={{
            position: "absolute",
            left: b.tl.x,
            top: b.tl.y,
            width: b.size.x,
            height: b.size.y,
            border: "1px solid #cbd5e1",
            borderRadius: 10,
            background: "#fff",
            boxSizing: "border-box",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            userSelect: "none",
          }}
          data-parent={b.parentId ?? ""}
        >
          {b.id}
        </div>
      ))}
    </div>
  );
}
