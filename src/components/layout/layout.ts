import { Vector } from "../geometry";
import { NodeConfig } from "../graph";

export enum LayoutTypes {
    Grid   = "grid",
    Radial = "radial"
}
export enum LayoutChildrenMode 
{
    GRAPH     = "graph",
    NESTED    = "nested"
}

export abstract class Layout 
{
    abstract nestedFrames   (args: NestedFrameParam): any;
    abstract placeChildren(args: PlaceChildrenParam): PlaceChildrenReturn;
    abstract autosizeParent(args: any): any;
}

/* =========================================================
 * NESTED GRID
 *  - Outer grid cells perfectly tessellate inner content
 *  - Each child renders inside a "cellInner" = (cell − 2*itemPad)
 * ========================================================= */
export type NestedFrameParam = 
{
    children      : NodeConfig[];
    parentSize    : Vector;
    spacing       : number;
};
export type PlaceChildrenParam = {
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

/* ---------- Tunables (pure) ---------- */

export const outerPad   = (s: number) : number => Math.max(12, s * 1.0); // padding inside PARENT (nested)
export const itemPad    = (s: number) : number => Math.max(4, s * 0.25); // inner padding inside each GRID CELL

export type PCTreeBelowParams = Pick<NestedFrameParam, 'parentSize' | 'spacing'>;
/* ---------- GRAPH anchoring ---------- */
export const pcTreeBelow = ({ parentSize, spacing }: PCTreeBelowParams) : Vector => new Vector(0, (parentSize?.y ?? 0) / 2 + spacing * 1.25)

