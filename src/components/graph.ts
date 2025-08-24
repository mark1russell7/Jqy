
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
    LayoutTypes 
} from "./layout/layout.enum";


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
