import { Vector, Shapes } from "../../../geometry";
import {
  Layout, NestedFrameParam, PlaceChildrenReturn, PreferredSizeParam,
  NestedFramesReturn, PreferredSizeReturn, PlaceChildrenParam
} from "../../layout";
import { LayoutChildrenMode, LayoutTypes } from "../../layout.enum";
import { MappedGrid, MappedGridItemData } from "./grid.mapped";
import { GridItem } from "./grid";
import { Config } from "../../../config";
import { LayoutTuning, LayoutTuningConfig } from "../../layout.tuning";
import { IteratorsConfig, IteratorsSet } from "../../iterator/iterator.registry";
import { mapIndexBounded, sliceBound } from "../../../iteration/iterate";
import { IterationConfig } from "../../../iteration/iteration.limits";

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

export class GridLayout extends Layout {
  constructor(
    private tuning: Config<LayoutTuning> = LayoutTuningConfig,
    private iters: Config<IteratorsSet> = IteratorsConfig
  ) { super(); }

  nestedFrames = ({ children, parentSize, spacing }: NestedFrameParam): NestedFramesReturn => {
    const maxPer = IterationConfig.get("maxChildrenPerNode");
    const policy = IterationConfig.get("onLimit");
    const safeChildren = sliceBound(children, maxPer, policy);

    const gridSize: Vector = this.tuning.get("rowCol")(safeChildren.length);
    const ip: number = this.tuning.get("itemPad")(spacing);
    const content: Vector = parentSize.round().clamp(1, Infinity);

    const X = splitEven(content.x, gridSize.x);
    const Y = splitEven(content.y, gridSize.y);

    const grid: MappedGrid = MappedGrid.emptyMapped<MappedGridItemData>(gridSize, () => ({ id: "" }));

    for (let i = 0; i < safeChildren.length; i++) {
      const cell = new Vector(i % gridSize.x, Math.floor(i / gridSize.x));
      const position = new Vector(X.offs[cell.x], Y.offs[cell.y]);
      const size = new Vector(X.sizes[cell.x], Y.sizes[cell.y]);
      grid.set(cell, new GridItem<MappedGridItemData>(cell, new Shapes.Rectangle(size, position), { id: safeChildren[i].id }));
    }

    return { ip, content, grid };
  };

  placeChildren = (args: PlaceChildrenParam): PlaceChildrenReturn => {
    const { children, nodeSize, spacing, origin, parentSize, mode } = args;
    const maxPer = IterationConfig.get("maxChildrenPerNode");
    const policy = IterationConfig.get("onLimit");
    const safeChildren = sliceBound(children, maxPer, policy);

    const rowCol: Vector = this.tuning.get("rowCol")(safeChildren.length);
    const ip: number = this.tuning.get("itemPad")(spacing);
    const anchor: Vector = this.iters.get(LayoutTypes.Grid).anchorOffset({ mode, parentSize, spacing });

    switch (mode) {
      case LayoutChildrenMode.GRAPH: {
        const cell = nodeSize.add(Vector.scalar(2 * ip));
        const total = rowCol.multiply(cell);
        const topLeft = origin.add(anchor).subtract(total.halve());
        return Object.fromEntries(
          mapIndexBounded(
            safeChildren.length,
            safeChildren.length, // already bounded
            "truncate",
            (i: number) => [
              safeChildren[i].id,
              topLeft
                .add(cell.multiply(new Vector(i % rowCol.x, Math.floor(i / rowCol.x))))
                .add(cell.halve())
                .round(),
            ]
          )
        );
      }
      case LayoutChildrenMode.NESTED: {
        const rect = new Shapes.Rectangle(parentSize, new Vector(0, 0));
        const centers = this.iters.get(LayoutTypes.Grid).centersInRect(safeChildren.length, rowCol, rect);
        return Object.fromEntries(safeChildren.map((c, i) => [c.id, centers[i]]));
      }
    }
  };

  preferredSize = ({ count, nodeSize, spacing }: PreferredSizeParam): PreferredSizeReturn => {
    const rowCol: Vector = this.tuning.get("rowCol")(count);
    const ip: number = this.tuning.get("itemPad")(spacing);
    const pad: number = this.tuning.get("outerPad")(spacing);
    const cell: Vector = nodeSize.add(Vector.scalar(2 * ip));
    const inner: Vector = rowCol.multiply(cell);
    return inner.add(Vector.scalar(2 * pad));
  };
}