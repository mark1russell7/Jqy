import type { Parsed } from "./parse";
import type { Plan } from "./plan";
import type { SystemContext } from "../context";
import { Vector } from "../../../core/geometry";
import { LayoutChildrenMode } from "../../layout.enum";
import type { LayoutSnapshot, Box, Wire } from "../../types";
import type { NodeConfig } from "../../../graph/types";
import { makePhase, type Phase } from "./contracts";
import { boundsOf, overlapsOf } from "../../metrics/metrics";

export function place(
  parsed: Parsed,
  plan: Plan,
  ctx: SystemContext,
  options: { nodeSize: Vector; spacing: number; collectOverlaps: boolean }
): LayoutSnapshot {
  if (parsed.tree) {
    const tp = new TreePlacer(plan, ctx, options);
    return tp.run(parsed.tree);
  }

  // Graph fallback (no tree): simple stacked layout
  const ids = Object.keys(parsed.graph.nodes);
  const boxes: Record<string, Box> = {};
  let y = 0;
  for (const id of ids) {
    boxes[id] = { id, position: new Vector(0, y), size: options.nodeSize, depth: 0 };
    y += options.nodeSize.y + options.spacing;
  }
  const wires: Wire[] = parsed.graph.edges.map((e, i) => ({ id: e.id ?? String(i), source: e.source, target: e.target }));
  const bounds = boundsOf(Object.values(boxes));
  const stats = { nodeCount: ids.length, edgeCount: wires.length, maxDepth: 0, bounds };
  return { boxes, wires, stats, version: Date.now() };
}

/* =========================== helpers / classes =========================== */

class TreePlacer {
  private boxes: Record<string, Box> = {};
  private wires: Wire[] = [];
  private maxDepth = 0;

  constructor(
    private plan: Plan,
    private ctx: SystemContext,
    private opts: { nodeSize: Vector; spacing: number; collectOverlaps: boolean }
  ) {}

  run(root: NodeConfig): LayoutSnapshot {
    const rootMode = this.modeOf(root.id);
    const rootSize = this.sizeForNode(root, rootMode);
    const rootTopLeft = (root.position ?? new Vector(0, 0)).round();
    const rootCenter = rootTopLeft.add(rootSize.halve());

    this.placeNode({
      node: root,
      parentId: undefined,
      level: 0,
      centerAbs: rootCenter,
      parentMode: LayoutChildrenMode.GRAPH,
    });

    const boxes = this.boxes;
    const bounds = boundsOf(Object.values(boxes));
    const overlaps = this.opts.collectOverlaps ? overlapsOf(Object.values(boxes)) : undefined;

    return {
      boxes,
      wires: this.wires,
      stats: {
        nodeCount: Object.keys(boxes).length,
        edgeCount: this.wires.length,
        maxDepth: this.maxDepth,
        bounds,
        overlaps,
      },
      version: Date.now(),
      meta: { source: "pipeline" },
    };
  }

  private placeNode(args: {
    node: NodeConfig;
    parentId?: string;
    level: number;
    centerAbs: Vector;
    parentMode: LayoutChildrenMode;
    forceSize?: Vector;
  }): void {
    const { node, parentId, level, centerAbs, forceSize } = args;
    const myMode = this.modeOf(node.id);
    const myLayout = this.plan.layouts[node.id];

    const size = (forceSize ?? this.sizeForNode(node, myMode)).round();
    const topLeft = centerAbs.subtract(size.halve()).round();

    this.ctx.log.debug?.("placeNode", {
      id: node.id, mode: myMode, layout: myLayout, level,
      size: { x: size.x, y: size.y }, centerAbs: { x: centerAbs.x, y: centerAbs.y }
    });

    this.boxes[node.id] = {
      id: node.id,
      position: topLeft,
      size,
      parentId: args.parentMode === LayoutChildrenMode.NESTED ? parentId : undefined,
      depth: level,
    };
    if (level > this.maxDepth) this.maxDepth = level;

    const children = node.children ?? [];
    if (!children.length) return;

    const strat = this.ctx.layouts.get(myLayout);
    const childModes: Record<string, LayoutChildrenMode> = Object.fromEntries(children.map(c => [c.id, this.modeOf(c.id)]));

    // ask the strategy for centers (and optional size overrides)
    const ex = typeof (strat as any).placeChildrenEx === "function"
      ? (strat as any).placeChildrenEx({
          mode: myMode,
          children,
          parent: node,
          origin: centerAbs,
          level,
          nodeSize: this.opts.nodeSize,
          spacing: this.opts.spacing,
          parentSize: size,
          childModes,
        }) as { centers: Record<string, Vector>, sizes?: Record<string, Vector> }
      : { centers: strat.placeChildren({
          mode: myMode,
          children,
          parent: node,
          origin: centerAbs,
          level,
          nodeSize: this.opts.nodeSize,
          spacing: this.opts.spacing,
          parentSize: size,
        }) };

    const localToAbsOffset = myMode === LayoutChildrenMode.NESTED ? topLeft : new Vector(0, 0);

    for (const child of children) {
      // tree wire
      this.wires.push({
        id: `${node.id}->${child.id}#${this.wires.length}`,
        source: node.id,
        target: child.id,
      });

      const localOrAbs = ex.centers[child.id] ?? centerAbs;
      const childCenterAbs = localOrAbs.add(localToAbsOffset);

      const passSize = ex.sizes?.[child.id];

      if (passSize) {
        this.ctx.log.debug?.("child forced size", {
          parent: node.id, child: child.id, forced: { x: passSize.x, y: passSize.y }
        });
      }

      this.placeNode({
        node: child,
        parentId: node.id,
        level: level + 1,
        centerAbs: childCenterAbs,
        parentMode: myMode,
        forceSize: passSize,
      });
    }
  }

  private modeOf(id: string): LayoutChildrenMode {
    return this.plan.modes[id] ?? LayoutChildrenMode.GRAPH;
  }
  private sizeForNode(node: NodeConfig, myMode: LayoutChildrenMode): Vector {
    if (myMode === LayoutChildrenMode.NESTED) {
      const strat = this.ctx.layouts.get(this.plan.layouts[node.id]);
      return strat.preferredSize({
        count: (node.children ?? []).length,
        nodeSize: this.opts.nodeSize,
        spacing: this.opts.spacing,
        mode: LayoutChildrenMode.NESTED,
      }).round();
    }
    return this.opts.nodeSize.round();
  }
}

export const PlacePhase: Phase<{ parsed: Parsed; plan: Plan; ctx: SystemContext; options: { nodeSize: Vector; spacing: number; collectOverlaps: boolean } }, LayoutSnapshot> =
  makePhase("place", (input) => place(input.parsed, input.plan, input.ctx, input.options));
