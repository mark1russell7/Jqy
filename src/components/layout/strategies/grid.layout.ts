import { 
    Vector, 
    Shapes 
} from "../../geometry";
import {
    Layout, 
    NestedFrameParam, 
    PlaceChildrenReturn, 
    PreferredSizeParam,
    NestedFramesReturn, 
    PreferredSizeReturn, 
    PlaceChildrenParam
} from "../layout";
import { 
    LayoutChildrenMode, 
    LayoutTypes
} from "../layout.enum";
import { 
    MappedGrid, 
    MappedGridItemData 
} from "./grid.mapped";
import { 
    GridItem 
} from "./grid";
import { 
    Config 
} from "../../config";
import { 
    LayoutTuning, 
    LayoutTuningConfig 
} from "../layout.tuning";
import { 
    IteratorsConfig, 
    IteratorsSet 
} from "../layout.iterators";
import { 
    mapIndex 
} from "./radial.layout";

/* Split an integer total into `parts` integers that sum to total.
   Distribute the remainder one px at a time to the first `remainder` parts. */
export type SplitEvenReturn = 
{
    sizes   : number[],
    offs    : number[]
}
export const splitEven =    (
                                total : number, 
                                parts : number
                            ) 
                            : SplitEvenReturn => 
{
    const base  : number   = Math.floor(total / parts);
    const rem   : number   = total - base * parts;
    const sizes : number[] = Array.from (
                                            { 
                                                length : parts 
                                            }, 
                                            (
                                                _ : number, 
                                                i : number
                                            ) => 
                                                base + (i < rem ? 1 : 0)
                                        );
    const offs  : number[] = sizes
                                .map(
                                        (
                                            _ : number, 
                                            i : number
                                        ) => 
                                            sizes
                                                .slice  (
                                                            0, 
                                                            i
                                                        )
                                                .reduce (
                                                            (
                                                                a : number, 
                                                                b : number
                                                            ) => 
                                                                a + b, 
                                                            0
                                                        )
                                    );
    return  { 
                sizes, 
                offs 
            };
};

export const rcSquare = (
                            n : number
                        ) 
                        : Vector => 
{ 
    const rows : number = Math.ceil(Math.sqrt(Math.max(1, n)));
    const cols : number = Math.ceil(n / rows);
    return new Vector   (
                            cols, 
                            rows
                        );
};


export  class   GridLayout 
        extends Layout 
{
    constructor(
        private tuning : Config<LayoutTuning> = LayoutTuningConfig,
        private iters  : Config<IteratorsSet> = IteratorsConfig
    ) 
    { 
        super(); 
    }
    nestedFrames =  (
                        { 
                            children, 
                            parentSize, 
                            spacing 
                        } : NestedFrameParam
                    ) 
                    : NestedFramesReturn => 
    {
        const gridSize : Vector = this.tuning.get("rowCol")(children.length); // Vector(cols, rows)
        const ip       : number = this.tuning.get("itemPad")(spacing);

        // Inner content (tessellated space)
        const content : Vector = 
            parentSize
                .round   ()
                .clamp   (1, Infinity);

        // Perfect integer subdivision with remainder distribution
        const X : SplitEvenReturn = splitEven(content.x, gridSize.x);
        const Y : SplitEvenReturn = splitEven(content.y, gridSize.y);

        const grid : MappedGrid = new MappedGrid(gridSize);
        for (let i : number = 0; i < children.length; i++) 
        {
            const cell : Vector = new Vector(
                i % gridSize.x,
                Math.floor(i / gridSize.x)
            );
            const position : Vector = new Vector(X.offs [cell.x], Y.offs [cell.y]);
            const size     : Vector = new Vector(X.sizes[cell.x], Y.sizes[cell.y]);
            grid.set(
                cell, 
                new GridItem<MappedGridItemData>(
                    cell, 
                    new Shapes.Rectangle(size, position), 
                    { 
                        id : children[i].id 
                    }
                )
            );
        }
        return  {
                    ip,
                    content,
                    grid, // outer grid cells
                };
    }

    placeChildren = (
                        args : PlaceChildrenParam
                    ) 
                    : PlaceChildrenReturn => 
    {
        const   { 
                    children, 
                    nodeSize, 
                    spacing, 
                    origin, 
                    parentSize, 
                    mode
                } : PlaceChildrenParam = args;
        const rowCol : Vector = this.tuning.get("rowCol")(children.length);
        const ip     : number = this.tuning.get("itemPad")(spacing);
        const anchor : Vector = this.iters
                                    .get(LayoutTypes.Grid)
                                    .anchorOffset   (
                                                        { 
                                                            mode, 
                                                            parentSize, 
                                                            spacing 
                                                        }
                                                    );
        switch(args.mode)
        {
            case LayoutChildrenMode.GRAPH:
                // GRAPH: logical cell = node + 2*itemPad; anchor below parent
                const cell    : Vector = nodeSize.add(Vector.scalar(2 * ip));
                const total   : Vector = rowCol.multiply(cell);
                const topLeft : Vector = origin
                                            .add(anchor)
                                            .subtract(total.halve());
                return Object
                        .fromEntries(
                            mapIndex(
                                children.length,
                                (i : number) => [
                                    children[i].id,
                                    topLeft
                                        .add    (
                                                    cell
                                                        .multiply   (
                                                                        new Vector  (
                                                                                        i % rowCol.x, 
                                                                                        Math.floor(i / rowCol.x)
                                                                                    )
                                                                    )
                                                )
                                        .add    (cell.halve())
                                        .round  ()
                                ]
                            )
                        );
            case LayoutChildrenMode.NESTED:
                const rect = new Shapes.Rectangle   (
                                                        parentSize, 
                                                        new Vector(0,0)
                                                    );
                const centers = this.iters
                                    .get(LayoutTypes.Grid)
                                    .centersInRect  (
                                                        children.length, 
                                                        rowCol, 
                                                        rect
                                                    );
                return Object
                        .fromEntries(
                                        children
                                        .map(
                                                (c, i) => 
                                                    [
                                                        c.id, 
                                                        centers[i]
                                                    ]
                                            )
                                    );
        }
    };
    preferredSize = (
                        { 
                            count, 
                            nodeSize, 
                            spacing, 
                            mode 
                        } : PreferredSizeParam
                    ) : PreferredSizeReturn => 
    {
        // grid preferred size = exact cells for nodeSize + itemPad, plus outerPad
        const rowCol    : Vector = this.tuning.get("rowCol")(count);
        const ip        : number = this.tuning.get("itemPad")(spacing);
        const pad       : number = this.tuning.get("outerPad")(spacing);
        const cell      : Vector = nodeSize.add(Vector.scalar(2 * ip));
        const inner     : Vector = rowCol.multiply(cell);
        return inner.add(Vector.scalar(2 * pad));
    };
    
}