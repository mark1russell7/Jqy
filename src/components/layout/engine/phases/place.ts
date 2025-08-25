import type { Parsed } from "./parse";
import type { Plan } from "./plan";
import type { SystemContext } from "../context";
import { Vector } from "../../../core/geometry";
import { LayoutChildrenMode, LayoutTypes } from "../../layout.enum";
import type { LayoutSnapshot, Box, Wire } from "../../types";
import type { NodeConfig } from "../../../graph/types";
import { makePhase, type Phase } from "./contracts";
import { boundsOf, overlapsOf } from "../../metrics/metrics";

/**
 * Pure placement for the new pipeline.
 * - Tree path: uses registered Layout strategies (grid/radial) directly.
 * - Graph path: minimal vertical stack (until general-graph placement lands).
 */
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
    boxes[id] = {
      id,
      position: new Vector(0, y),
      size: options.nodeSize,
      depth: 0,
    };
    y += options.nodeSize.y + options.spacing;
  }
  const wires: Wire[] = parsed.graph.edges.map((e, i) => ({ id: e.id ?? String(i), source: e.source, target: e.target }));
  const bounds = boundsOf(Object.values(boxes));
  const stats = {
    nodeCount: ids.length,
    edgeCount: wires.length,
    maxDepth: 0,
    bounds,
  };
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
    // decide root size based on its own mode
    const rootMode = this.modeOf(root.id);
    const rootSize = this.sizeForNode(root, rootMode);
    const rootTopLeft = (root.position ?? new Vector(0, 0)).round();
    const rootCenter = rootTopLeft.add(rootSize.halve());

    this.placeNode({
      node: root,
      parentId: undefined,
      level: 0,
      centerAbs: rootCenter,
      parentMode: LayoutChildrenMode.GRAPH, // irrelevant for root
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
    const myLayout = this.layoutOf(node.id);

    // Size for *this* node
    const size = (forceSize ?? this.sizeForNode(node, myMode)).round();
    const topLeft = centerAbs.subtract(size.halve()).round();

    // --- logging (debug) ---
    this.ctx.log.debug?.("placeNode: start", {
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
    if (children.length === 0) return;

    const strat = this.ctx.layouts.get(myLayout);
    const mapping = strat.placeChildren({
      mode: myMode,
      children,
      parent: node,
      origin: centerAbs,
      level,
      nodeSize: this.opts.nodeSize,
      spacing: this.opts.spacing,
      parentSize: size,
    });

    const needsLocalToAbs = myMode === LayoutChildrenMode.NESTED;
    const localToAbsOffset = needsLocalToAbs ? topLeft : new Vector(0, 0);

    // ---------- compute "cell" for my children when I'm NESTED ----------
    let cellInner: Vector | undefined;
    if (myMode === LayoutChildrenMode.NESTED && myLayout === LayoutTypes.Grid) {
      const padOuter = this.ctx.tunings.get("outerPad")(this.opts.spacing);
      const inner = size.subtract(Vector.scalar(2 * padOuter)).clamp(1, Infinity);
      const rowCol = this.ctx.tunings.get("rowCol")(children.length);
      const ip = this.ctx.tunings.get("itemPad")(this.opts.spacing);
      cellInner = inner.divide(rowCol).subtract(Vector.scalar(2 * ip)).clamp(1, Infinity);
    }

    // --- nested helper for radial child square side (geometry bound) ---
    const radialChildSquareSide = (n: number, parentSize: Vector, spacing: number): number => {
      const pad = this.ctx.tunings.get("outerPad")(spacing);
      const g   = this.ctx.tunings.get("itemPad")(spacing);
      const R   = Math.max(1, Math.min(parentSize.x, parentSize.y) / 2 - pad);
      const sin = Math.sin(Math.PI / Math.max(1, n));
      const denom = 1 + sin;
      const sBound = (2 * R * sin - g * (1 + sin)) / Math.max(denom, 1e-6);
      const f = this.ctx.tunings.get("nestedChildMaxFraction")();
      const sMax = Math.min(sBound, 2 * R * f);
      return Math.floor(Math.max(8, sMax));
    };

    // if I'm nested+radial we’ll need side value later to align ring radius
    let sideForRadial: number | undefined;
    if (myMode === LayoutChildrenMode.NESTED && myLayout === LayoutTypes.Radial) {
      sideForRadial = radialChildSquareSide(children.length, size, this.opts.spacing);
    }

    const forcedSizeForChild = (childMode: LayoutChildrenMode): Vector | undefined => {
      if (myMode !== LayoutChildrenMode.NESTED) return undefined;

      if (myLayout === LayoutTypes.Grid) {
        const sideMax = Math.max(8, Math.floor(Math.min(cellInner!.x, cellInner!.y)));
        const k = (childMode === LayoutChildrenMode.NESTED)
          ? this.ctx.tunings.get("nestedContainerScale")(level + 1)
          : 1;
        return Vector.scalar(Math.floor(sideMax * k));
      }

      if (myLayout === LayoutTypes.Radial) {
        const s = sideForRadial!;
        const k = (childMode === LayoutChildrenMode.NESTED)
          ? this.ctx.tunings.get("nestedContainerScale")(level + 1)
          : 1;
        return Vector.scalar(Math.floor(s * k));
      }
      return undefined;
    };

    // --- parameters needed to re-center & re-radius nested radial
    let cLocal: Vector | undefined;
    let rWanted: number | undefined;
    let angStart = 0, cw = true;

    if (myMode === LayoutChildrenMode.NESTED && myLayout === LayoutTypes.Radial) {
      const padOuter = this.ctx.tunings.get("outerPad")(this.opts.spacing);
      const inner = size.subtract(Vector.scalar(2 * padOuter)).clamp(1, Infinity);
      const g = this.ctx.tunings.get("itemPad")(this.opts.spacing);
      const R = inner.min() / 2;
      // center of inner rect in LOCAL coordinates (note: includes pad offset)
      cLocal = Vector.scalar(padOuter).add(inner.scale(1 / 2));
      // radius consistent with forced size s
      rWanted = Math.max(0, R - ((sideForRadial ?? 0) + g) / 2);
      angStart = this.ctx.tunings.get("startAngle")();
      cw = this.ctx.tunings.get("clockwise")();
    }

    for (let i = 0; i < children.length; i++) {
      const child = children[i];

      // tree wire
      this.wires.push({
        id: `${node.id}->${child.id}#${this.wires.length}`,
        source: node.id,
        target: child.id,
      });

      let childCenterLocal: Vector;
      if (myMode === LayoutChildrenMode.NESTED && myLayout === LayoutTypes.Radial && cLocal && rWanted !== undefined) {
        // recompute angle-driven ring with correct pad offset and radius
        const angle = this.ctx.tunings.get("angleOf")(i, children.length, angStart, cw);
        childCenterLocal = Vector.scalar(angle).trig().scale(rWanted).add(cLocal);
      } else {
        // use strategy-provided mapping
        const mapped = mapping[child.id] ?? centerAbs; // absolute center if graph
        childCenterLocal = needsLocalToAbs ? mapped : mapped.subtract(localToAbsOffset);
      }

      const childCenterAbs = childCenterLocal.add(localToAbsOffset);

      const childMode = this.modeOf(child.id);
      const passSize = forcedSizeForChild(childMode); // override for BOTH GRAPH and NESTED

      // --- logging (debug) ---
      if (passSize) {
        this.ctx.log.debug?.("placeNode: child forced size", {
          parent: node.id,
          child: child.id,
          childMode,
          forced: { x: passSize.x, y: passSize.y }
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
  private layoutOf(id: string): LayoutTypes {
    return this.plan.layouts[id] ?? LayoutTypes.Grid;
  }
  private sizeForNode(node: NodeConfig, myMode: LayoutChildrenMode): Vector {
    if (myMode === LayoutChildrenMode.NESTED) {
      const strat = this.ctx.layouts.get(this.layoutOf(node.id));
      return strat.preferredSize({
        count: (node.children ?? []).length,
        nodeSize: this.opts.nodeSize,
        spacing: this.opts.spacing,
        mode: LayoutChildrenMode.NESTED,
      }).round();
    }
    // GRAPH: node renders as a “unit” box
    return this.opts.nodeSize.round();
  }
}

export const PlacePhase: Phase<{ parsed: Parsed; plan: Plan; ctx: SystemContext; options: { nodeSize: Vector; spacing: number; collectOverlaps: boolean } }, LayoutSnapshot> =
  makePhase("place", (input) => place(input.parsed, input.plan, input.ctx, input.options));
