import { Box, LayoutResult } from "../engine/computeLayout";
import { Theme, defaultTheme } from "./theme";

function depthOf(b: Box, all: Record<string, Box>): number {
  let d = 0, p = b.parentId;
  while (p) { d++; p = all[p]?.parentId; }
  return d;
}

export function AbsoluteDOM({ result, theme = defaultTheme }: { result: LayoutResult; theme?: Theme }) {
  const all = result.boxes;
  const boxes = Object.values(all).sort((a, b) => depthOf(a, all) - depthOf(b, all));

  const lines = result.wires.map((w) => {
    const a = result.boxes[w.source], b = result.boxes[w.target];
    if (!a || !b) return null;
    const ax = a.tl.x + a.size.x / 2, ay = a.tl.y + a.size.y / 2;
    const bx = b.tl.x + b.size.x / 2, by = b.tl.y + b.size.y / 2;
    return (
      <line
        key={`${w.source}-${w.target}`}
        x1={ax} y1={ay} x2={bx} y2={by}
        stroke={theme.wire.stroke} strokeWidth={theme.wire.width}
      />
    );
  });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {lines}
      </svg>
      {boxes.map((b) => (
        <div
          key={b.id}
          data-parent={b.parentId ?? ""}
          style={{
            position: "absolute",
            left: b.tl.x, top: b.tl.y,
            width: b.size.x, height: b.size.y,
            border: `1px solid ${theme.node.border}`,
            borderRadius: theme.node.radius,
            background: theme.node.bg,
            boxSizing: "border-box",
            fontSize: theme.node.fontSize,
            color: theme.node.text,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            userSelect: "none",
          }}
        >
          {b.id}
        </div>
      ))}
    </div>
  );
}
