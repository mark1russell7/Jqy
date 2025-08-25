import { JSX } from "react/jsx-dev-runtime";
import { LayoutResult } from "../layout/engine/layout.engine";
import { Theme, defaultTheme } from "./theme";

export type AbsoluteDOMProps = {
  result: LayoutResult;
  theme?: Theme;
};

export function AbsoluteDOM({ result, theme = defaultTheme }: AbsoluteDOMProps): JSX.Element {
  const all = result.boxes;
  const boxes = Object.values(all).sort((a, b) => a.depth - b.depth || a.id.localeCompare(b.id));

  const lines = result.wires.map((w) => {
    const a = result.boxes[w.source];
    const b = result.boxes[w.target];
    if (!a || !b) return null;
    const A = a.getPosition().add(a.getSize().halve());
    const B = b.getPosition().add(b.getSize().halve());
    return (
      <line
        key={`${w.source}-${w.target}`}
        x1={A.x}
        y1={A.y}
        x2={B.x}
        y2={B.y}
        stroke={theme.wire.stroke}
        strokeWidth={theme.wire.width}
      />
    );
  });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>{lines}</svg>
      {boxes.map((b) => (
        <div
          key={b.id}
          data-parent={b.parentId ?? ""}
          style={{
            position: "absolute",
            left: b.getPosition().x,
            top: b.getPosition().y,
            width: b.getSize().x,
            height: b.getSize().y,
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
