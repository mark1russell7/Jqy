// layout.engine.ts
// - DI logger + limits
// - Bounds applied to depth, node count, children per node, edges
// - Stable behavior under truncation; warnings via logger (default Noop)

import { Shapes, Vector } from "../../geometry";
import { NodeConfig } from "../../graph";
import { LayoutTypes, LayoutChildrenMode } from "../layout.enum";
import { LayoutConfigs } from "../layout.registry";
import { Layout, NestedFramesReturn } from "../layout";
import { LayoutTuning, LayoutTuningConfig } from "../layout.tuning";
import { GridItem } from "../strategies/grid/grid";
import { Config } from "../../config";
import { IteratorsConfig, IteratorsSet } from "../iterator/iterator.registry";
import { IterationConfig, IterationLimits } from "../../iteration/iteration.limits";
import { ConsoleLogger, Logger, NoopLogger } from "../../logging";
import { sliceBound } from "../../iteration/iterate";

export type NodeId = string;
export type ModeMap = Record<string, LayoutChildrenMode>;
export type Wire = { source: NodeId; target: NodeId };

export type LayoutStats = {
  nodeCount: number;
  maxDepth: number;
  bounds: Shapes.Rectangle;
  overlaps?: Array<[NodeId, NodeId]>;
};

export type LayoutResult = {
  boxes: Record<NodeId, Shapes.Box>;
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
  collectOverlaps?: boolean;
  logger?: Logger;
};

export class LayoutEngine {
  private readonly tuning: Config<LayoutTuning>;
  private readonly iters: Config<IteratorsSet>;
  private readonly limits: Config<IterationLimits>;
  private readonly collectOverlaps: boolean;
  private readonly log: Logger;

  private nodeCount = 0;
  private edgeCount = 0;

  constructor(opts: EngineOptions = {}) {
    this.tuning = opts.tuning ?? LayoutTuningConfig;
    this.iters = opts.iterators ?? IteratorsConfig;
    this.limits = opts.limits ?? IterationConfig;
    this.collectOverlaps = !!opts.collectOverlaps;
    this.log = opts.logger ?? new NoopLogger();
  }

  compute({ root, modes, nodeSize, spacing }: ComputeParams): LayoutResultEx {
    this.nodeCount = 0;
    this.edgeCount = 0;

    const boxes: Record<NodeId, Shapes.Box> = {};
    const wires: Wire[] = [];

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
  }): void {
    const { node, level, modes, nodeSize, spacing, parentBox, assigned, boxes, wires } = args;

    const maxDepth = this.limits.get("maxDepth");
    const policy = this.limits.get("onLimit");
    if (level > maxDepth) {
      this.log.warn("Max depth exceeded", { node: node.id, level, maxDepth });
      return; // truncate rather than throw by default
    }

    if (this.nodeCount >= this.limits.get("maxNodes")) {
      this.log.warn("Max nodes reached, skipping remaining traversal", { maxNodes: this.limits.get("maxNodes") });
      return;
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
    this.nodeCount++;

    const childrenRaw = node.children ?? [];
    const children = sliceBound(
      childrenRaw,
      this.limits.get("maxChildrenPerNode"),
      policy,
      this.log,
      "childrenPerNode"
    );

    if (!children.length) return;

    if (mode === LayoutChildrenMode.NESTED) {
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
        if (this.edgeCount >= this.limits.get("maxEdges")) {
          this.log.warn("Max edges reached, remaining edges skipped", { maxEdges: this.limits.get("maxEdges") });
          break;
        }
        const center = centers[c.id];
        const tlChild = center.subtract(nodeSize.halve()).as("Position");
        const childBox = new Shapes.Box(c.id, tlChild, nodeSize.as("Size"), box.id, level + 1);

        wires.push({ source: id, target: c.id });
        this.edgeCount++;

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
  }): void {
    const { children, level, nodeSize, spacing, parentBox, strat, modes, boxes, wires } = args;

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
      const item: GridItem<any> = frames.grid.getItem(c.id);
      const pos: Vector = item.dimensions.getPosition();
      const sz: Vector = item.dimensions.getSize().subtract(Vector.scalar(2 * frames.ip)).clamp(1, Infinity);

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
  }): void {
    const { node, children, level, nodeSize, spacing, parentBox, strat, modes, boxes, wires } = args;

    const pad = this.tuning.get("outerPad")(spacing);
    const inner = parentBox.size.subtract(Vector.scalar(2 * pad)).clamp(1, Infinity);
    const innerTL = parentBox.position.add(Vector.scalar(pad)).as("Position");
    const nextNodeSize = nodeSize.scale(this.tuning.get("nestedNodeScale")(level));

    const centers = strat.placeChildren({
      mode: LayoutChildrenMode.NESTED,
      children,
      parent: node,
      origin: inner.halve(),
      level,
      nodeSize: nextNodeSize,
      spacing,
      parentSize: inner,
    });

    for (const c of children) {
      const p = centers[c.id] ?? inner.scale(1 / 2);
      const childBox = new Shapes.Box(
        c.id,
        innerTL.add(p.subtract(nextNodeSize.halve())).as("Position"),
        nextNodeSize.as("Size"),
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
      });
    }
  }

  // --- Helpers ---------------------------------------------------------------

  private resolveLayoutName(node: NodeConfig, fallback: LayoutTypes): LayoutTypes {
    return node.layout && LayoutConfigs.get<LayoutTypes>(node.layout) ? node.layout : fallback;
  }

  private finalizeStats(boxes: Record<NodeId, Shapes.Box>, includeOverlaps: boolean): LayoutStats {
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
      minX = minY = maxX = maxY = 0;
    }

    const bounds = new Shapes.Rectangle(new Vector(maxX - minX, maxY - minY).as("Size"), new Vector(minX, minY).as("Position"));
    const stats: LayoutStats = { nodeCount, maxDepth, bounds };

    if (includeOverlaps) {
      const overlaps: Array<[NodeId, NodeId]> = [];
      for (let i = 0; i < ids.length; i++) {
        const a = boxes[ids[i]];
        const aPos = a.getPosition(); const aSz = a.getSize();
        const aX2 = aPos.x + aSz.x; const aY2 = aPos.y + aSz.y;
        for (let j = i + 1; j < ids.length; j++) {
          const b = boxes[ids[j]];
          const bPos = b.getPosition(); const bSz = b.getSize();
          const bX2 = bPos.x + bSz.x; const bY2 = bPos.y + bSz.y;
          const disjoint = aX2 <= bPos.x || bX2 <= aPos.x || aY2 <= bPos.y || bY2 <= aPos.y;
          if (!disjoint) overlaps.push([a.id, b.id]);
        }
      }
      stats.overlaps = overlaps;
    }

    return stats;
  }
}

// Back-compat helper
export const computeLayout = (root: NodeConfig, modes: ModeMap, nodeSize: Vector, spacing: number): LayoutResultEx =>
  new LayoutEngine({ logger: new NoopLogger() }).compute({ root, modes, nodeSize, spacing });
