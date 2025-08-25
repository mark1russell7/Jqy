import type { CSSProperties } from "react";
import type { Node, Edge } from "reactflow";
import { LayoutResultEx } from "../layout/engine/layout.engine";
import { Vector } from "../geometry";

const nodeStyle = (v: Vector): CSSProperties => ({
  width: v.x,
  height: v.y,
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  background: "#fff",
  fontSize: 12,
  boxSizing: "border-box" as const,
});

export type toReactFlowReturn = { nodes: Node[]; edges: Edge[] };

export function toReactFlow({ boxes, wires }: LayoutResultEx): toReactFlowReturn {
  const nodes: Node[] = Object.values(boxes).map((b) => {
    const rel: Vector = b.parentId ? b.getPosition().subtract(boxes[b.parentId].getPosition()) : b.getPosition();

    const base: Node = {
      id: b.id,
      position: rel,
      data: { label: b.id },
      style: nodeStyle(b.size),
    };

    return b.parentId ? { ...base, parentNode: b.parentId, extent: "parent" } : base;
  });

  const edges: Edge[] = wires.map((w) => ({ id: `${w.source}-${w.target}`, source: w.source, target: w.target }));
  return { nodes, edges };
}
