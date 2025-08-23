// layout/layout.iterators.ts
import { Shapes, Vector } from "../geometry";
import { LayoutChildrenMode } from "./layout.enum";

export type SiblingPlacer = (i: number, n: number, rowCol: Vector) => Vector;
export type RectMapper = (u: Vector, r: Shapes.Rectangle) => Vector;
export type Anchor = (ctx: { mode: LayoutChildrenMode; parentSize: Vector; spacing: number }) => Vector;

export const mapToRect: RectMapper = (u : Vector, r : Shapes.Rectangle) : Vector =>
    r.getPosition().add(u.multiply(r.getSize()));
//   new Vector(r.cx + u.nx * r.w, r.cy + u.ny * r.h);

/** Grid on a unit box with caller-provided row/col heuristic */
export const gridUnit: SiblingPlacer = (i : number, n : number, rowCol : Vector) : Vector => {

    const coordinates = rowCol.fold(
        (x : number) : number => i % x,
        (y : number) : number => Math.floor(i / y)
    );
  // cells fill [-0.5,0.5]^2 exactly
    return coordinates
                .add(Vector.scalar(1/2))
                .divide(coordinates)
                .add(Vector.scalar(-1/2));
};

/** Radial around 0 with radius 0.5 */
export const radialUnit : SiblingPlacer =   (
                                                i : number, 
                                                n : number
                                            ) 
                                            :   Vector => 
                                                Vector
                                                    .scalar((i / Math.max(1, n)) * Math.PI * 2)
                                                    .trig()
                                                    .scale(0.5);
