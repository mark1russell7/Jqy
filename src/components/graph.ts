
/**
 * Generalized abstractions
 * -------------------------------------------------------
 * - NodeConfig: declarative tree of nodes (id, label, children, optional layout override)
 * - LayoutStrategy: computes child positions given a parent position
 * - Renderer: two modes
 *     (A) Graph mode: render each node as a ReactFlow node with edges
 *     (B) Nested mode: project each child inside its parent DOM box
 */

import { 
    Vector 
} from "./geometry";
import { 
    resolveLayoutName 
} from "./layout/layout.values";
import { 
    LayoutConfigs 
} from "./layout/layout.values";
import { 
    LayoutChildrenMode, 
    LayoutTypes 
} from "./layout/layout.enum";
import { 
    Layout, 
    PlaceChildrenReturn 
} from "./layout/layout";


export type NodeConfig = 
{
    id          : string;
    label?      : string;
    position?   : Vector;
    children?   : NodeConfig[];
    layout?     : LayoutTypes;
};

export type Node = 
{
    id       : string, 
    data     :  {
                    label : string
                }, 
    position : Vector, 
    style    : React.CSSProperties
};

export type Edge = 
{
    id     : string;
    source : string;
    target : string;
};


/**
 * Recursively apply a chosen layout strategy to produce ReactFlow nodes/edges.
 */
export type BuildGraphParam = 
{
    config     : NodeConfig;
    layoutName : LayoutTypes;
    nodeSize   : Vector;
    spacing    : number;
}
export type BuildGraphReturn = 
{
    nodes: Node[];
    edges: Edge[];
}

export const buildGraph  =  (   
                                { 
                                    config, 
                                    layoutName, 
                                    nodeSize, 
                                    spacing 
                                } : BuildGraphParam
                            ) 
                            : BuildGraphReturn =>
{
    const nodes : Node[] = [];
    const edges : Edge[] = [];

    function walk   (
                        node  : NodeConfig, 
                        level : number
                    ) 
    {
        const id            : string = node.id;
        const label         : string = node.label ?? id;
        const posTL         : Vector = node.position ?? Vector.scalar(0);
        const parentCenter  : Vector = posTL.add(nodeSize.scale(1/2));
        // push parent node
        nodes.push({
            id,
            data        :   { 
                                label 
                            },
            position    :   posTL,
            style       :   {
                                width           : nodeSize.x,
                                height          : nodeSize.y,
                                border          : "1px solid #cbd5e1",
                                borderRadius    : 10,
                                background      : "#ffffff",
                                fontSize        : 12,
                                boxSizing       : "border-box",
                            }
        });
        const children : NodeConfig[] = node.children ?? [];
        if (!children.length) 
        {
            return;
        }

        const chosen : LayoutTypes = resolveLayoutName(node, layoutName);
        const { placeChildren } : Layout = LayoutConfigs.get<LayoutTypes>(chosen);

        // GRAPH MODE: place using parent center; then convert to child top-left
        const childCenters : PlaceChildrenReturn = placeChildren({
            mode        : LayoutChildrenMode.GRAPH,
            children,
            parent      : node,
            origin      : parentCenter,
            level,
            nodeSize,
            spacing,
            parentSize  : nodeSize,
        });

        for (const child of children) 
        {
            const cc        : Vector = childCenters[child.id] ?? parentCenter;
            const childTL   : Vector = cc.subtract(nodeSize.scale(1/2));
            child.position = childTL;
            edges.push({ 
                id      : `${id}-${child.id}`, 
                source  : id, 
                target  : child.id 
            });
            walk(child, level + 1);
        }
    }
    walk(config, 0);
    return { nodes, edges };
}