import { Vector } from "../core/geometry";
import { NodeConfig } from "../graph/types";
import { 
    LayoutChildrenMode 
} from "./layout.enum";
import { 
    MappedGrid 
} from "./strategies/grid/grid.mapped";
export type PreferredSizeParam = 
{
  /* number of direct children */
  count     : number;
  /* node box size used when graph-mode node is rendered (base unit) */
  nodeSize  : Vector;
  /* visual spacing knob */
  spacing   : number;
  /* where the node is being asked to measure for */
  mode      : LayoutChildrenMode; // GRAPH | NESTED
};

/** formerly autosizeParent */
export type PreferredSizeReturn = Vector;

export type NestedFrameParam = 
{
    children      : NodeConfig[];
    parentSize    : Vector;
    spacing       : number;
};
export type NestedFramesReturn = 
{
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
    
    /** Return the layout’s preferred box size ONLY if the node has no externally-allocated size. */
    abstract preferredSize  (args   : PreferredSizeParam    )   : PreferredSizeReturn;
}
