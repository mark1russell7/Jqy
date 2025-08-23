import { LayoutResult } from "../engine/computeLayout";

export function toReactFlow({ boxes, wires }: LayoutResult) {
    const nodes = Object.values(boxes).map((b) => ({
        id: b.id,
        position: { x: b.tl.x, y: b.tl.y },
        data: { label: b.id },
        style: { width: b.size.x, height: b.size.y, border: "1px solid #cbd5e1", borderRadius: 10, background: "#fff", fontSize: 12, boxSizing: "border-box" },
        parentNode: b.parentId,
        extent: b.parentId ? "parent" as const : undefined,
    }));
    const edges = wires.map((w) => ({ id: `${w.source}-${w.target}`, source: w.source, target: w.target }));
    return { nodes, edges };
}
