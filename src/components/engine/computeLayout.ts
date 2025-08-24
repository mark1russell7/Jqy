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

  function place(node: NodeConfig, level: number, assigned?: Box): void {
    const id = node.id;
    const mode: Mode = modes[id] ?? "graph";
    const chosen = resolveLayoutName(node, node.layout ?? LayoutTypes.Grid);
    const strat: Layout = LayoutConfigs.get<LayoutTypes>(chosen);

    // If we were given a concrete frame for this node, use it as-is.
    let box: Box;
    if (assigned) {
      box = assigned;
    } else {
      const size =
        mode === "graph"
          ? nodeSize
          : strat.preferredSize({
              count: (node.children ?? []).length,
              nodeSize,
              spacing,
              mode: LayoutChildrenMode.NESTED,
            });
      const tl = node.position ?? Vector.scalar(0);
      box = { id, tl, size };
    }

    boxes[id] = box;

    const children = node.children ?? [];
    if (!children.length) return;

    if (mode === "nested") {
      // Nested children are placed INSIDE this node’s box
      const pad = LayoutTuningConfig.get("outerPad")(spacing);
      const inner = box.size.subtract(Vector.scalar(2 * pad)).clamp(1, Infinity);
      const innerTL = box.tl.add(Vector.scalar(pad));

      if (chosen === LayoutTypes.Grid) {
        const frames = strat.nestedFrames({ children, parentSize: inner, spacing });
        for (const c of children) {
          const item = frames.grid.getItem(c.id)!;
          const pos = item.dimensions.getPosition();
          const sz = item.dimensions.getSize().subtract(Vector.scalar(2 * frames.ip)).clamp(1, Infinity);
          const childBox: Box = {
            id: c.id,
            parentId: id,
            tl: innerTL.add(pos).add(Vector.scalar(frames.ip)),
            size: sz,
          };
          place(c, level + 1, childBox);
        }
      } else {
        // RADIAL nested → we place children by centers; if a child is itself "nested",
        // give it a preferred container size; otherwise use nodeSize.
        for (const c of children) {
          const centers = strat.placeChildren({
            mode: LayoutChildrenMode.NESTED,
            children,
            parent: node,
            origin: inner.scale(1 / 2),
            level,
            nodeSize,
            spacing,
            parentSize: inner,
          });
          const p = centers[c.id] ?? inner.scale(1 / 2);

          const childMode: Mode = modes[c.id] ?? "graph";
          const childChosen = resolveLayoutName(c, c.layout ?? LayoutTypes.Grid);
          const childStrat = LayoutConfigs.get<LayoutTypes>(childChosen);

          const desiredSize =
            childMode === "nested"
              ? childStrat.preferredSize({
                  count: (c.children ?? []).length,
                  nodeSize,
                  spacing,
                  mode: LayoutChildrenMode.NESTED,
                })
              : nodeSize;

          const tlChild = innerTL.add(p.subtract(desiredSize.halve()));
          const childBox: Box = { id: c.id, parentId: id, tl: tlChild, size: desiredSize };
          place(c, level + 1, childBox);
        }
      }
    } else {
      // GRAPH mode: children live outside, connected by edges, no parentId
      const centers = strat.placeChildren({
        mode: LayoutChildrenMode.GRAPH,
        children,
        parent: node,
        origin: box.tl.add(box.size.scale(1 / 2)),
        level,
        nodeSize,
        spacing,
        parentSize: box.size,
      });

      for (const c of children) {
        const cc = centers[c.id];
        const tlChild = cc.subtract(nodeSize.halve());
        const childBox: Box = { id: c.id, tl: tlChild, size: nodeSize };
        wires.push({ source: id, target: c.id });
        place(c, level + 1, childBox);
      }
    }
  }

  place(root, 0);
  return { boxes, wires };
}