// layout.engine.ts
// - New LayoutEngine class with options
// - Depth (z) computed once during traversal and stored on each Box
// - Stats: nodeCount, maxDepth, bounds, overlaps
// - Member compute({ ... }) with object params
// - Back-compat helper computeLayout(...) exported at bottom

import { Shapes, Vector } from "../../geometry";
import { NodeConfig } from "../../graph";
import { LayoutTypes, LayoutChildrenMode } from "../layout.enum";
import { LayoutConfigs } from "../layout.registry";
import { Layout, NestedFramesReturn, PlaceChildrenReturn } from "../layout";
import { LayoutTuning, LayoutTuningConfig } from "../layout.tuning";
import { MappedGridItemData } from "../strategies/grid/grid.mapped";
import { GridItem } from "../strategies/grid/grid";
import { Config } from "../../config";
import { IteratorsConfig, IteratorsSet } from "../iterator/layout.iterators";
import { IterationConfig, IterationLimits } from "../../iteration/iteration.limits";
import { VectorBrand } from "../../geometry";

export type NodeId = string;
export type ModeMap = Record<string, LayoutChildrenMode>;

export type Wire = { source: NodeId; target: NodeId };

export type LayoutStats = {
  nodeCount: number;
  maxDepth: number;
  bounds: Shapes.Rectangle; // extents of all boxes
  overlaps?: Array<[NodeId, NodeId]>;
};

export type LayoutResult = {
  boxes: Record<NodeId, Shapes.Box>; // now includes .depth
  wires: Wire[];
};

export type LayoutResultEx = LayoutResult & { stats: LayoutStats };

export type ComputeParams = {
  root: NodeConfig;
  modes: ModeMap;
  nodeSize: Vector; // treat as Size (caller may brand)
  spacing: number;
};

export type EngineOptions = {
  iterators?: Config<IteratorsSet>;
  tuning?: Config<LayoutTuning>;
  limits?: Config<IterationLimits>;
  /** if true, compute overlaps (O(n^2)) */
  collectOverlaps?: boolean;
};

export class LayoutEngine {
  private readonly tuning: Config<LayoutTuning>;
  private readonly iters: Config<IteratorsSet>;
  private readonly limits: Config<IterationLimits>;
  private readonly collectOverlaps: boolean;

  constructor(opts: EngineOptions = {}) {
    this.tuning = opts.tuning ?? LayoutTuningConfig;
    this.iters = opts.iterators ?? IteratorsConfig;
    this.limits = opts.limits ?? IterationConfig;
    this.collectOverlaps = !!opts.collectOverlaps;
  }

  compute({ root, modes, nodeSize, spacing }: ComputeParams): LayoutResultEx {
    const boxes: Record<NodeId, Shapes.Box> = {};
    const wires: Wire[] = [];

    // guard recursion via limits
    const maxDepthAllowed = this.limits.get("maxDepth");

    this.placeNode({
      node: root,
      level: 0,
      modes,
      nodeSize,
      spacing,
      parentBox: undefined,
      assigned: undefined,
      boxes,
      wires,
      maxDepthAllowed,
    });

    const stats = this.finalizeStats(boxes, this.collectOverlaps);
    return { boxes, wires, stats };
  }

  // --- Internal traversal ----------------------------------------------------

  private placeNode(args: {
    node: NodeConfig;
    level: number;
    modes: ModeMap;
    nodeSize: Vector;
    spacing: number;
    parentBox?: Shapes.Box;
    assigned?: Shapes.Box;
    boxes: Record<NodeId, Shapes.Box>;
    wires: Wire[];
    maxDepthAllowed: number;
  }): void {
    const {
      node,
      level,
      modes,
      nodeSize,
      spacing,
      parentBox,
      assigned,
      boxes,
      wires,
      maxDepthAllowed,
    } = args;

    if (level > maxDepthAllowed) {
      throw new Error(`LayoutEngine: maxDepth (${maxDepthAllowed}) exceeded.`);
    }

    const id = node.id;
    const mode: LayoutChildrenMode = modes[id] ?? LayoutChildrenMode.GRAPH;
    const chosen: LayoutTypes = this.resolveLayoutName(node, node.layout ?? LayoutTypes.Grid);
    const strat: Layout = LayoutConfigs.get<LayoutTypes>(chosen);

    // Resolve this node's box (and set depth once)
    let box: Shapes.Box;
    if (assigned) {
      box = assigned;
      box.depth = level;
    } else {
      // Measure size if nested container, else graph node uses nodeSize
      const size =
        mode === LayoutChildrenMode.GRAPH
          ? nodeSize
          : strat.preferredSize({
              count: (node.children ?? []).length,
              nodeSize,
              spacing,
              mode: LayoutChildrenMode.NESTED,
            });
      const tl = (node.position ?? Vector.scalar(0)).as("Position");
      box = new Shapes.Box(id, tl, size.as("Size"), parentBox?.id, level);
    }

    boxes[id] = box;

    const children = node.children ?? [];
    if (!children.length) return;

    if (mode === LayoutChildrenMode.NESTED) {
      // place children inside this box
      if (chosen === LayoutTypes.Grid) {
        this.placeNestedGridChildren({
          node,
          children,
          level,
          nodeSize,
          spacing,
          parentBox: box,
          strat,
          modes,
          boxes,
          wires,
          maxDepthAllowed,
        });
      } else {
        this.placeNestedRadialChildren({
          node,
          children,
          level,
          nodeSize,
          spacing,
          parentBox: box,
          strat,
          modes,
          boxes,
          wires,
          maxDepthAllowed,
        });
      }
    } else {
      // GRAPH mode: children outside; add wires
      const centers = strat.placeChildren({
        mode: LayoutChildrenMode.GRAPH,
        children,
        parent: node,
        origin: box.position.add(box.size.scale(1 / 2)),
        level,
        nodeSize,
        spacing,
        parentSize: box.size,
      });

      for (const c of children) {
        const center = centers[c.id];
        const tlChild = center.subtract(nodeSize.halve()).as("Position");
        const childBox = new Shapes.Box(c.id, tlChild, nodeSize.as("Size"), box.id, level + 1);

        // wire from parent → child
        wires.push({ source: id, target: c.id });

        this.placeNode({
          node: c,
          level: level + 1,
          modes,
          nodeSize,
          spacing,
          parentBox: box,
          assigned: childBox,
          boxes,
          wires,
          maxDepthAllowed,
        });
      }
    }
  }

  private placeNestedGridChildren(args: {
    node: NodeConfig;
    children: NodeConfig[];
    level: number;
    nodeSize: Vector;
    spacing: number;
    parentBox: Shapes.Box;
    strat: Layout;
    modes: ModeMap;
    boxes: Record<NodeId, Shapes.Box>;
    wires: Wire[];
    maxDepthAllowed: number;
  }): void {
    const {
      children,
      level,
      nodeSize,
      spacing,
      parentBox,
      strat,
      modes,
      boxes,
      wires,
      maxDepthAllowed,
    } = args;

    const pad = this.tuning.get("outerPad")(spacing);
    const inner = parentBox.size.subtract(Vector.scalar(2 * pad)).clamp(1, Infinity);
    const innerTL = parentBox.position.add(Vector.scalar(pad)).as("Position");

    const nextNodeSize = nodeSize.scale(this.tuning.get("nestedNodeScale")(level));

    const frames: NestedFramesReturn = strat.nestedFrames({
      children,
      parentSize: inner,
      spacing,
    });

    for (const c of children) {
      const item: GridItem<MappedGridItemData | undefined> = frames.grid.getItem(c.id);
      const pos: Vector = item.dimensions.getPosition();
      const sz: Vector = item.dimensions
        .getSize()
        .subtract(Vector.scalar(2 * frames.ip))
        .clamp(1, Infinity);

      const childBox = new Shapes.Box(
        c.id,
        innerTL.add(pos).add(Vector.scalar(frames.ip)).as("Position"),
        sz.as("Size"),
        parentBox.id,
        parentBox.depth + 1
      );

      this.placeNode({
        node: c,
        level: parentBox.depth + 1,
        modes,
        nodeSize: nextNodeSize,
        spacing,
        parentBox,
        assigned: childBox,
        boxes,
        wires,
        maxDepthAllowed,
      });
    }
  }

  private placeNestedRadialChildren(args: {
    node: NodeConfig;
    children: NodeConfig[];
    level: number;
    nodeSize: Vector;
    spacing: number;
    parentBox: Shapes.Box;
    strat: Layout;
    modes: ModeMap;
    boxes: Record<NodeId, Shapes.Box>;
    wires: Wire[];
    maxDepthAllowed: number;
  }): void {
    const {
      node,
      children,
      level,
      nodeSize,
      spacing,
      parentBox,
      strat,
      modes,
      boxes,
      wires,
      maxDepthAllowed,
    } = args;

    const pad = this.tuning.get("outerPad")(spacing);
    const inner = parentBox.size.subtract(Vector.scalar(2 * pad)).clamp(1, Infinity);
    const innerTL = parentBox.position.add(Vector.scalar(pad)).as("Position");
    const nextNodeSize = nodeSize.scale(this.tuning.get("nestedNodeScale")(level));

    // centers (relative to inner rect)
    const centers: Record<string, Vector> = strat.placeChildren({
      mode: LayoutChildrenMode.NESTED,
      children,
      parent: node,
      origin: inner.halve(),
      level,
      nodeSize: nextNodeSize,
      spacing,
      parentSize: inner,
    });

    // compute base desired size for each child (before fit)
    const baseSizes: Record<string, Vector> = {};
    for (const c of children) {
      const childMode = modes[c.id] ?? LayoutChildrenMode.GRAPH;
      const childChosen = this.resolveLayoutName(c, c.layout ?? LayoutTypes.Grid);
      const childStrat: Layout = LayoutConfigs.get<LayoutTypes>(childChosen);

      const sz: Vector =
        childMode === LayoutChildrenMode.NESTED
          ? childStrat
              .preferredSize({
                count: (c.children ?? []).length,
                nodeSize: nextNodeSize,
                spacing,
                mode: LayoutChildrenMode.NESTED,
              })
              .scale(this.tuning.get("nestedContainerScale")(level))
          : nextNodeSize;

      baseSizes[c.id] = sz;
    }

    // derive scale k to guarantee fit
    const n = Math.max(1, children.length);
    const innerRadius = inner.halve().min();
    const ip = this.tuning.get("itemPad")(spacing);
    const r = Math.max(
      this.tuning.get("minRadius")(),
      innerRadius - nextNodeSize.max() / 2 - ip
    );
    const theta = (Math.PI * 2) / n;
    const chord = 2 * r * Math.sin(theta / 2);

    let maxWidth = 0;
    let maxHalfDiag = 0;
    let maxSideForFrac = 0;
    for (const c of children) {
      const sz = baseSizes[c.id];
      maxWidth = Math.max(maxWidth, sz.x);
      maxHalfDiag = Math.max(maxHalfDiag, sz.length() / 2);
      maxSideForFrac = Math.max(maxSideForFrac, sz.max());
    }
    const fracMax = this.tuning.get("nestedChildMaxFraction")();
    const kRadial = maxHalfDiag > 0 ? (r - ip) / maxHalfDiag : 1;
    const kTangential = n >= 2 && maxWidth > 0 ? (chord - ip) / maxWidth : 1;
    const kFraction = maxSideForFrac > 0 ? (innerRadius * 2 * fracMax) / maxSideForFrac : 1;
    let k = Math.min(1, kRadial, kTangential, kFraction);
    if (!isFinite(k) || k <= 0) k = Math.min(1, kFraction, 0.1);

    for (const c of children) {
      const p = centers[c.id] ?? inner.scale(1 / 2);
      const finalSize = baseSizes[c.id].scale(k).clamp(1, Infinity);
      const tlChild = innerTL.add(p.subtract(finalSize.halve())).as("Position");
      const childBox = new Shapes.Box(c.id, tlChild, finalSize.as("Size"), parentBox.id, parentBox.depth + 1);

      this.placeNode({
        node: c,
        level: parentBox.depth + 1,
        modes,
        nodeSize: nextNodeSize,
        spacing,
        parentBox,
        assigned: childBox,
        boxes,
        wires,
        maxDepthAllowed,
      });
    }
  }

  // --- Helpers ---------------------------------------------------------------

  private resolveLayoutName(node: NodeConfig, fallback: LayoutTypes): LayoutTypes {
    return node.layout && LayoutConfigs.get<LayoutTypes>(node.layout) ? node.layout : fallback;
  }

  private finalizeStats(
    boxes: Record<NodeId, Shapes.Box>,
    includeOverlaps: boolean
  ): LayoutStats {
    const ids = Object.keys(boxes);
    const nodeCount = ids.length;

    let maxDepth = 0;
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const id of ids) {
      const b = boxes[id];
      maxDepth = Math.max(maxDepth, b.depth);
      const pos = b.getPosition();
      const sz = b.getSize();
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + sz.x);
      maxY = Math.max(maxY, pos.y + sz.y);
    }

    if (!isFinite(minX)) {
      minX = 0;
      minY = 0;
      maxX = 0;
      maxY = 0;
    }

    const bounds = new Shapes.Rectangle(
      new Vector(maxX - minX, maxY - minY).as("Size"),
      new Vector(minX, minY).as("Position")
    );

    const stats: LayoutStats = { nodeCount, maxDepth, bounds };

    if (includeOverlaps) {
      const overlaps: Array<[NodeId, NodeId]> = [];
      for (let i = 0; i < ids.length; i++) {
        const a = boxes[ids[i]];
        const aPos = a.getPosition();
        const aSz = a.getSize();
        const aX2 = aPos.x + aSz.x;
        const aY2 = aPos.y + aSz.y;
        for (let j = i + 1; j < ids.length; j++) {
          const b = boxes[ids[j]];
          const bPos = b.getPosition();
          const bSz = b.getSize();
          const bX2 = bPos.x + bSz.x;
          const bY2 = bPos.y + bSz.y;
          const disjoint =
            aX2 <= bPos.x || bX2 <= aPos.x || aY2 <= bPos.y || bY2 <= aPos.y;
          if (!disjoint) overlaps.push([a.id, b.id]);
        }
      }
      stats.overlaps = overlaps;
    }

    return stats;
  }
}

// Back-compat helper if you still want a function call in some places.
export const computeLayout = (
  root: NodeConfig,
  modes: ModeMap,
  nodeSize: Vector,
  spacing: number
): LayoutResultEx => new LayoutEngine().compute({ root, modes, nodeSize, spacing });
