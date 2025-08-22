import { 
    Vector 
} from "../geometry";
import { 
    NodeConfig 
} from "../graph";
import { 
    LayoutChildrenMode 
} from "./layout.enum";
import { 
    MappedGrid 
} from "./strategies/grid.mapped";

export type AutosizeParentParam = 
{
    count   : number;
    nodeSize: Vector;
    spacing : number;
    min     : Vector;
}
export type AutosizeParentReturn = Vector;

export type NestedFrameParam = 
{
    children      : NodeConfig[];
    parentSize    : Vector;
    spacing       : number;
};
export type NestedFramesReturn = 
{
    pad     : number;
    ip      : number;
    content : Vector;
    grid    : MappedGrid;
};

export type PlaceChildrenParam = 
{
    mode          : LayoutChildrenMode;
    children      : NodeConfig[];
    parent        : NodeConfig;
    origin        : Vector;
    level         : number;
    nodeSize      : Vector;
    spacing       : number;
    parentSize    : Vector;
};
export type PlaceChildrenReturn = Record<string, Vector>;
export abstract class Layout 
{
    abstract nestedFrames   (args   : NestedFrameParam      )   : NestedFramesReturn;
    abstract placeChildren  (args   : PlaceChildrenParam    )   : PlaceChildrenReturn;
    abstract autosizeParent (args   : AutosizeParentParam   )   : AutosizeParentReturn;
}

/* =========================================================
 * NESTED GRID
 *  - Outer grid cells perfectly tessellate inner content
 *  - Each child renders inside a "cellInner" = (cell − 2*itemPad)
 * ========================================================= */


/* ---------- Tunables (pure) ---------- */

export const outerPad   = (s: number) : number => Math.max(12, s * 1.0); // padding inside PARENT (nested)
export const itemPad    = (s: number) : number => Math.max(4, s * 0.25); // inner padding inside each GRID CELL

export type PCTreeBelowParams = Pick<NestedFrameParam, 'parentSize' | 'spacing'>;
/* ---------- GRAPH anchoring ---------- */
export const pcTreeBelow = ({ parentSize, spacing }: PCTreeBelowParams) : Vector => new Vector(0, (parentSize?.y ?? 0) / 2 + spacing * 1.25)

