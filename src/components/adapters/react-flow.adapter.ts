import type { CSSProperties } from "react";
import type { Node, Edge } from "reactflow";
import { LayoutResult } from "../engine/computeLayout";

const nodeStyle = (w: number, h: number): CSSProperties => ({
  width: w,
  height: h,
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  background: "#fff",
  fontSize: 12,
  boxSizing: "border-box" as const,
});
export function toReactFlow({ boxes, wires }: LayoutResult): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = Object.values(boxes).map((b) => {
    const rel = b.parentId ? {
      x: b.tl.x - boxes[b.parentId].tl.x,
      y: b.tl.y - boxes[b.parentId].tl.y,
    } : { x: b.tl.x, y: b.tl.y };

    const base: Node = {
      id: b.id,
      position: rel,
      data: { label: b.id },
      style: nodeStyle(b.size.x, b.size.y),
    };

    return b.parentId
      ? { ...base, parentNode: b.parentId, extent: "parent" as const }
      : base;
  });

  const edges: Edge[] = wires.map((w) => ({ id: `${w.source}-${w.target}`, source: w.source, target: w.target }));
  return { nodes, edges };
}
