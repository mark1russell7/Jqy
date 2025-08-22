import { Vector, Shapes } from "../../geometry";
import { Layout, NestedFrameParam, LayoutChildrenMode, PlaceChildrenReturn } from "../layout";
import { outerPad, itemPad, pcTreeBelow } from "../layout";
import { PlaceChildrenParam } from "../layout";
import { ceilSqrt } from "../../math";
import { Grid, GridItem } from "./grid";


export type NestedFrameGridItemData = {
    id : string
}
export type NestedFramesReturn = 
{
    pad     : number;
    ip      : number;
    content : Vector;
    grid    : Grid<NestedFrameGridItemData>;
}

export  class   GridLayout 
        extends Layout 
{
    nestedFrames({ children, parentSize, spacing }: NestedFrameParam) : NestedFramesReturn {
        
        const n = children.length;
        const grid = new Grid<NestedFrameGridItemData>(rcSquare(n));
        const pad = outerPad(spacing);
        const ip = itemPad(spacing);

        // Inner content (tessellated space)
        const content = new Vector(
            Math.max(1, Math.round(parentSize.x - 2 * pad)),
            Math.max(1, Math.round(parentSize.y - 2 * pad))
        );

        // Perfect integer subdivision with remainder distribution
        const X = splitEven(content.x, grid.size.x);
        const Y = splitEven(content.y, grid.size.y);

        for (let i = 0; i < n; i++) {
            const cell = new Vector(
                i % grid.size.x,
                Math.floor(i / grid.size.x)
            );
            const position = new Vector(X.offs[cell.x], Y.offs[cell.y]);
            const size = new Vector(X.sizes[cell.x], Y.sizes[cell.y]);
            grid.set(cell, new GridItem<NestedFrameGridItemData>(cell, new Shapes.Rectangle(position, size), { id: children[i].id }));
        }
        return {
            pad,
            ip,
            content,
            grid, // outer grid cells
        };
    }

    placeChildren(args: PlaceChildrenParam) : PlaceChildrenReturn 
    {
        switch(args.mode)
        {
            case LayoutChildrenMode.GRAPH:
                return graphGridCenters(args);
            case LayoutChildrenMode.NESTED:
                const { grid } = this.nestedFrames(args);
                const gridMap = {};
                for(const row of grid.grid)
                {
                    for(const cell of row)
                    {
                        
                        if(cell.data)
                        {
                            gridMap[cell.data.id] = cell.dimensions.getPosition().add(cell.dimensions.getSize().scale(0.5));
                        }
                    }
                }
                return gridMap;
        }
    };
    autosizeParent({ count, nodeSize, spacing }) 
    {
        return  rcSquare(count)
                    .multiply   (
                                    nodeSize
                                        .add(
                                                Vector
                                                    .scalar (
                                                                2 * itemPad(spacing)
                                                            )
                                            )
                                )
                    .add        (
                                    Vector
                                        .scalar (
                                                    2 * outerPad(spacing)
                                                )
                                );
    }
}
/* =========================================================
 * GRAPH (non-nested)
 *  - Grid uses tree-below anchor; "gaps" are created by itemPad
 *    because each logical cell = node + 2*itemPad.
 * ========================================================= */

export function graphGridCenters({ children, origin, nodeSize, spacing, level, parentSize } : PlaceChildrenParam) : PlaceChildrenReturn{
  
  const gridSize = rcSquare(children.length);

  const cellSize = nodeSize.add(Vector.scalar(2 * itemPad(spacing)));
  const total = gridSize.multiply(cellSize);

  const a = pcTreeBelow({ parentSize, spacing });
  const position = origin.add(a).subtract(total.scale(0.5));

  const pos = {};
  for (let i = 0; i < children.length; i++) {
    pos[children[i].id] = position.add(new Vector(i % gridSize.x, Math.floor(i / gridSize.x)).multiply(cellSize)).add(cellSize.scale(0.5)).round()
  }
  return pos;
}
/* Split an integer total into `parts` integers that sum to total.
   Distribute the remainder one px at a time to the first `remainder` parts. */

export const splitEven = (total, parts) => {
  const base = Math.floor(total / parts);
  const rem = total - base * parts;
  const sizes = Array.from({ length: parts }, (_, i) => base + (i < rem ? 1 : 0));
  const offs = sizes.map((_, i) => sizes.slice(0, i).reduce((a, b) => a + b, 0));
  return { sizes, offs };
};
export const rcSquare = n => { const r = ceilSqrt(n); const c = Math.ceil(n / r); return new Vector(c, r); };

