import { 
    Vector, 
    Shapes 
} from "../../geometry";
import { 
    Layout, 
    NestedFrameParam, 
    PlaceChildrenReturn, 
    AutosizeParentParam,
    NestedFramesReturn,
    AutosizeParentReturn
} from "../layout";
import { MappedGrid, MappedGridItemData } from "./grid.mapped";
import { 
    LayoutChildrenMode 
} from "../layout.enum";
import { 
    outerPad, 
    itemPad, 
    pcTreeBelow 
} from "../layout";
import { 
    PlaceChildrenParam 
} from "../layout";
import { 
    ceilSqrt 
} from "../../math";
import { 
    GridItem 
} from "./grid";
import { 
    NodeConfig 
} from "../../graph";

export  class   GridLayout 
        extends Layout 
{
    nestedFrames =  (
                        { 
                            children, 
                            parentSize, 
                            spacing 
                        } : NestedFrameParam
                    ) 
                    : NestedFramesReturn => 
    {
        const gridSize : Vector = rcSquare(children.length);
        const grid : MappedGrid = new MappedGrid(rcSquare(children.length));
        const pad  : number = outerPad(spacing);
        const ip   : number = itemPad (spacing);

        // Inner content (tessellated space)
        const content : Vector = 
            parentSize
                .subtract(Vector
                            .scalar(2 * pad))
                .round   ()
                .clamp   (-Infinity, 1);

        // Perfect integer subdivision with remainder distribution
        const X : SplitEvenReturn = splitEven(content.x, gridSize.x);
        const Y : SplitEvenReturn = splitEven(content.y, gridSize.y);

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
                    new Shapes.Rectangle(position, size), 
                    { 
                        id : children[i].id 
                    }
                )
            );
        }
        return {
            pad,
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
        switch(args.mode)
        {
            case LayoutChildrenMode.GRAPH:
                return graphGridCenters(args);
            case LayoutChildrenMode.NESTED:
                const { grid } : NestedFramesReturn = this.nestedFrames(args);
                const gridMap  : PlaceChildrenReturn= {};
                for(const row of grid.grid)
                {
                    for(const cell of row)
                    {
                        if(cell.data)
                        {
                            gridMap[cell.data.id] = cell
                                                        .dimensions
                                                        .getPosition()
                                                        .add(
                                                                cell
                                                                    .dimensions
                                                                    .getSize()
                                                                    .scale(0.5)
                                                            );
                        }
                    }
                }
                return gridMap;
        }
    };
    autosizeParent =    (
                            { 
                                count, 
                                nodeSize, 
                                spacing 
                            } : AutosizeParentParam
                        ) 
                    : AutosizeParentReturn =>
                                                rcSquare(count)
                                                    .multiply   (
                                                                    nodeSize
                                                                        .add(
                                                                                Vector
                                                                                    .scalar (2 * itemPad(spacing))
                                                                            )
                                                                )
                                                    .add        (
                                                                    Vector
                                                                        .scalar (2 * outerPad(spacing))
                                                                );
}
/* =========================================================
 * GRAPH (non-nested)
 *  - Grid uses tree-below anchor; "gaps" are created by itemPad
 *    because each logical cell = node + 2*itemPad.
 * ========================================================= */

export const graphGridCenters = (
                                    { 
                                        children, 
                                        origin, 
                                        nodeSize, 
                                        spacing, 
                                        level, 
                                        parentSize 
                                    } : PlaceChildrenParam
                                ) 
                                : PlaceChildrenReturn => 
{
    const gridSize  : Vector = rcSquare(children.length);
    const cellSize  : Vector = nodeSize
                                .add(
                                        Vector
                                            .scalar(2 * itemPad(spacing))
                                    );
    const position  : Vector = origin
                                .add     (
                                            pcTreeBelow (   
                                                            { 
                                                                parentSize, 
                                                                spacing 
                                                            }
                                                        )
                                         )
                                .subtract(
                                            gridSize
                                                .multiply(cellSize)
                                                .halve()
                                         );
    return Object
            .fromEntries(children
                            .map(   (
                                        c : NodeConfig, 
                                        i : number
                                    ) =>    ([
                                                c.id,
                                                position
                                                    .add(
                                                            new Vector  (
                                                                            i % gridSize.x, 
                                                                            Math.floor(i / gridSize.x)
                                                                        )
                                                            .multiply   (cellSize)
                                                        )
                                                    .add  (cellSize.halve())
                                                    .round()
                                            ])
                            )
                        );
}
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
    return { sizes, offs };
};

export const rcSquare = (
                            n : number
                        ) 
                        : Vector => 
{ 
    const r : number = ceilSqrt(n); 
    const c : number = Math.ceil(n / r); 
    return new Vector(c, r); 
};

