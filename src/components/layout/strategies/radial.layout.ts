import { Vector } from "../../geometry";
import { Layout, LayoutChildrenMode, PlaceChildrenReturn } from "../layout";
import { outerPad, itemPad, pcTreeBelow } from "../layout";
import { PlaceChildrenParam } from "../layout";

export  class   RadialLayout 
        extends Layout 
{
    nestedFrames    = (                         ) => null
    placeChildren   = (args: PlaceChildrenParam ) => 
                                                    args.mode === LayoutChildrenMode.NESTED
                                                        ? nestedRadialCenters(args)
                                                        : graphRadialCenters (args);
    autosizeParent  = ({ nodeSize, spacing }    ) => Vector.scalar(nodeSize.max() * 6 + 2 * outerPad(spacing));
}
/* =========================================================
 * NESTED RADIAL
 *  - Place on a circle and uniform-scale to fit inner content
 * ========================================================= */

export function nestedRadialCenters({ children, parentSize, nodeSize, spacing }: PlaceChildrenParam) : PlaceChildrenReturn {
    const pad = outerPad(spacing);
    const inner = parentSize.subtract(Vector.scalar(2 * pad)).round().clamp(-Infinity, 1);
    const c = inner.scale(1/2);
    // raw radius before fit
    const baseR = inner.min() / 2 - nodeSize.max() / 2 - itemPad(spacing);
    const r = Math.max(8, baseR);
    return Object.fromEntries(
                                        radialAngles(children.length)
                                            .map((t, i) =>  [
                                                                children[i].id, 
                                                                Vector
                                                                    .scalar(t)
                                                                    .trig()
                                                                    .scale(r)
                                                                    .add(c)
                                                            ])
                                    );;
}
/* ---------- UNIT placers (sibling-only) ---------- */
export const radialAngles = (count : number) : number[] => mapIndex(count, (i : number) => (i / Math.max(1, count)) * Math.PI * 2);

export function graphRadialCenters({ children, origin, nodeSize, spacing, level, parentSize }: PlaceChildrenParam) : PlaceChildrenReturn {
    const r = (nodeSize.max() + spacing * 3) * (1 + level * 0.6);
    const c = origin.add(pcTreeBelow({ parentSize, spacing }));
    return  Object
                .fromEntries(
                    radialAngles(children.length)
                        .map((t, i) =>  [
                                            children[i].id, 
                                            Vector
                                                .scalar(t)
                                                .trig()
                                                .scale(r)
                                                .add(c)
                                                .round()
                                        ]
                        )
                );
}
export const mapIndex = (n : number, f: (i: number) => any) => Array.from({ length: n }, (_, i) => f(i));

