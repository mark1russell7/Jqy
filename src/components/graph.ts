
/**
 * Generalized abstractions
 * -------------------------------------------------------
 * - NodeConfig: declarative tree of nodes (id, label, children, optional layout override)
 * - LayoutStrategy: computes child positions given a parent position
 * - Renderer: two modes
 *     (A) Graph mode: render each node as a ReactFlow node with edges
 *     (B) Nested mode: project each child inside its parent DOM box
 */

import { Vector } from "./geometry";
import { resolveLayoutName } from "./layout/layout.values";
import { LayoutConfigs } from "./layout/layout.values";
import { LayoutChildrenMode } from "./layout/layout";


export type NodeConfig = {
    id: string;
    label?: string;
    position?: Vector;
    children?: NodeConfig[];
    layout?: "tree" | "radial";
};

export type Node = {
    id: string, 
    data: {
        label: string
    }, 
    position: Vector, 
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
export type BuildGraphParam = {
    config: NodeConfig;
    layoutName: string;
    nodeSize: Vector;
    spacing: number;
}

export function buildGraph({ config, layoutName, nodeSize, spacing }: BuildGraphParam) {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    function walk(node: NodeConfig, level: number) {
        const id = node.id;
        const label = node.label ?? id;
        const posTL = node.position ?? Vector.scalar(0);
        const parentCenter = posTL.add(nodeSize.scale(1/2));
        // push parent node
        nodes.push({
            id,
            data: { label },
            position: posTL,
            style: {
                width: nodeSize.x,
                height: nodeSize.y,
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                background: "#ffffff",
                fontSize: 12,
                boxSizing: "border-box",
              },
        });

        const children = node.children ?? [];
        if (!children.length) 
        {
            return;
        }

        const chosen = resolveLayoutName(node, layoutName);
        const { placeChildren } = LayoutConfigs[chosen];

        // GRAPH MODE: place using parent center; then convert to child top-left
        const childCenters = placeChildren({
            mode: LayoutChildrenMode.GRAPH,
            children,
            parent: node,
            origin: parentCenter,
            level,
            nodeSize,
            spacing,
            parentSize: nodeSize,
        });

        for (const child of children) {
            const cc = childCenters[child.id] ?? parentCenter;
            const childTL = cc.subtract(nodeSize.scale(1/2));
            child.position = childTL;
            edges.push({ id: `${id}-${child.id}`, source: id, target: child.id });
            walk(child, level + 1);
        }
    }

    walk(config, 0);
    return { nodes, edges };
}