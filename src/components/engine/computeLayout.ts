import { Vector } from "../geometry";
import { NodeConfig } from "../graph";
import { LayoutTypes, LayoutChildrenMode } from "../layout/layout.enum";
import { LayoutConfigs, resolveLayoutName } from "../layout/layout.values";
import { Layout } from "../layout/layout";
import { LayoutTuningConfig } from "../layout/layout.tuning";

export type Mode = "graph" | "nested";
export type ModeMap = Record<string, Mode>;

export type Box = {
  id: string;
  parentId?: string;
  tl: Vector;        // absolute top-left in canvas coords
  size: Vector;
};

export type Wire = { source: string; target: string };

export type LayoutResult = { boxes: Record<string, Box>; wires: Wire[] };

export function computeLayout(
  root: NodeConfig,
  modes: ModeMap,
  nodeSize: Vector,
  spacing: number
): LayoutResult {
  const boxes: Record<string, Box> = {};
  const wires: Wire[] = [];

  function place(node: NodeConfig, level: number, parent?: Box): void {
    const id = node.id;
    const mode: Mode = modes[id] ?? "graph";
    const chosen = resolveLayoutName(node, node.layout ?? LayoutTypes.Grid);
    const strat: Layout = LayoutConfigs.get<LayoutTypes>(chosen);

    // figure out this node's box
    let size: Vector;
    let tl  : Vector;

    if (parent) {
      // nested node inherits its slot (already absolute)
      size = parent.size; tl = parent.tl;
    } else {
      // top-level node: if position provided, use it; else (0,0)
      tl   = node.position ?? Vector.scalar(0);
      size = mode === "graph"
        ? nodeSize
        : strat.preferredSize({ count: (node.children ?? []).length, nodeSize, spacing, mode: LayoutChildrenMode.NESTED });
    }

    boxes[id] = { id, tl, size, parentId: parent?.id };

    const children = node.children ?? [];
    if (!children.length) return;

    if (mode === "nested") {
      const pad = LayoutTuningConfig.get("outerPad")(spacing);
      const inner = size.subtract(Vector.scalar(2 * pad)).clamp(1, Infinity);
      const innerTL = tl.add(Vector.scalar(pad));

      if (chosen === LayoutTypes.Grid) {
        const frames = strat.nestedFrames({ children, parentSize: inner, spacing });
        for (const c of children) {
          const item = frames.grid.getItem(c.id)!;
          const pos = item.dimensions.getPosition();
          const sz  = item.dimensions.getSize().subtract(Vector.scalar(2 * frames.ip)).clamp(1, Infinity);
          const childBox: Box = { id: c.id, parentId: id, tl: innerTL.add(pos).add(Vector.scalar(frames.ip)), size: sz };
          // recurse: child receives its slot as its box
          place(c, level + 1, childBox);
        }
      } else {
        // radial nested: centers + nodeSize
        const centers = strat.placeChildren({
          mode: LayoutChildrenMode.NESTED,
          children, parent: node,
          origin: inner.scale(1/2),
          level, nodeSize, spacing,
          parentSize: inner,
        });
        for (const c of children) {
          const p = centers[c.id] ?? inner.scale(1/2);
          const tlChild = innerTL.add(p.subtract(nodeSize.halve()));
          const childBox: Box = { id: c.id, parentId: id, tl: tlChild, size: nodeSize };
          place(c, level + 1, childBox);
        }
      }
    } else {
      // GRAPH: compute child centers below this node; children get standard nodeSize
      const centers = strat.placeChildren({
        mode: LayoutChildrenMode.GRAPH,
        children, parent: node,
        origin: tl.add(size.scale(1/2)),
        level, nodeSize, spacing,
        parentSize: size,
      });

      for (const c of children) {
        const cc = centers[c.id];
        const tlChild = cc.subtract(nodeSize.halve());
        boxes[c.id] = { id: c.id, tl: tlChild, size: nodeSize };
        wires.push({ source: id, target: c.id });
        place(c, level + 1);
      }
    }
  }

  place(root, 0);
  return { boxes, wires };
}
