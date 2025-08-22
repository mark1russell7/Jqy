
/**
 * Generalized abstractions
 * -------------------------------------------------------
 * - NodeConfig: declarative tree of nodes (id, label, children, optional layout override)
 * - LayoutStrategy: computes child positions given a parent position
 * - Renderer: two modes
 *     (A) Graph mode: render each node as a ReactFlow node with edges
 *     (B) Nested mode: project each child inside its parent DOM box
 */

import { LAYOUTS, resolveLayoutName } from "./layout.strategy";
import { Point } from "./point";

/** @typedef {{ x:number, y:number }} Point */
/** @typedef {{ w:number, h:number }} Size */
/**
 * @typedef NodeConfig
 * @prop {string} id
 * @prop {string=} label
 * @prop {Point=} position  // used by Graph renderer as absolute canvas pos
 * @prop {NodeConfig[]=} children
 * @prop {"tree"|"radial"=} layout  // optional per-node layout override
 */


export type NodeConfig = {
    id: string;
    label?: string;
    position?: Point;
    children?: NodeConfig[];
    layout?: "tree" | "radial";
};

export type Node = {
    id: string, 
    data: {
        label: string
    }, 
    position: Point, 
    style: React.CSSProperties
};

export type Edge = {
    id: string;
    source: string;
    target: string;
};


/**
 * Recursively apply a chosen layout strategy to produce ReactFlow nodes/edges.
 */
export function buildGraph({ config, layoutName, nodeSize, spacing }) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

    function walk(node, level) {
    const id = node.id;
    const label = node.label ?? id;
    const posTL = node.position ?? { x: 0, y: 0 }; // ReactFlow expects top-left
    const parentCenter = { x: posTL.x + nodeSize.w / 2, y: posTL.y + nodeSize.h / 2 };

    // push parent node
    nodes.push({
      id,
      data: { label },
      position: posTL,
      style: {
        width: nodeSize.w,
        height: nodeSize.h,
        border: "1px solid #cbd5e1",
        borderRadius: 10,
        background: "#ffffff",
        fontSize: 12,
        boxSizing: "border-box",
      },
    });

    const children = node.children ?? [];
    if (!children.length) return;

    const chosen = resolveLayoutName(node, layoutName);
    const { placeChildren } = LAYOUTS[chosen];

    // GRAPH MODE: place using parent center; then convert to child top-left
    const childCenters = placeChildren({
      mode: "graph",
      children,
      parent: node,
      origin: parentCenter,
      level,
      nodeSize,
      spacing,
      parentSize: { w: nodeSize.w, h: nodeSize.h },
    });

    for (const child of children) {
      const cc = childCenters[child.id] ?? parentCenter;
      const childTL = { x: cc.x - nodeSize.w / 2, y: cc.y - nodeSize.h / 2 };
      child.position = childTL;
      edges.push({ id: `${id}-${child.id}`, source: id, target: child.id });
      walk(child, level + 1);
    }
  }

  walk(config, 0);
  return { nodes, edges };
}