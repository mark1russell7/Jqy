import { 
    Vector 
} from "../../geometry";
import { 
    AutosizeParentParam,
    AutosizeParentReturn,
    Layout, 
    PlaceChildrenReturn 
} from "../layout";
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
    NestedFramesReturn
} from "../layout";
import { MappedGrid } from "./grid.mapped";

export  class   RadialLayout 
        extends Layout 
{
    nestedFrames    =   () 
                        : NestedFramesReturn => (
                                                    {
                                                        pad     : 0,
                                                        ip      : 0,
                                                        content : new Vector(0, 0),
                                                        grid    : new MappedGrid(new Vector(0, 0))
                                                    }
                                                );
    placeChildren   =   (
                            args : PlaceChildrenParam
                        ) 
                        : PlaceChildrenReturn => 
                                                args.mode === LayoutChildrenMode.NESTED
                                                    ? nestedRadialCenters(args)
                                                    : graphRadialCenters (args);
    autosizeParent  =   (
                            { 
                                nodeSize, 
                                spacing 
                            } : AutosizeParentParam
                        ) 
                        : AutosizeParentReturn => 
                                                    Vector
                                                        .scalar(nodeSize.max() * 6 + 2 * outerPad(spacing));
}
/* =========================================================
 * NESTED RADIAL
 *  - Place on a circle and uniform-scale to fit inner content
 * ========================================================= */

export const nestedRadialCenters =  (
                                        { 
                                            children, 
                                            parentSize, 
                                            nodeSize, 
                                            spacing 
                                        } : PlaceChildrenParam
                                    ) : PlaceChildrenReturn => 
{
    const inner : Vector = parentSize
                            .subtract(Vector.scalar(2 * outerPad(spacing)))
                            .round   ()
                            .clamp   (-Infinity, 1);
    const c     : Vector = inner.scale(1/2);
    // raw radius before fit
    const baseR : number = inner.min() / 2 - nodeSize.max() / 2 - itemPad(spacing);
    const r     : number = Math.max(8, baseR);
    return Object
            .fromEntries(
                            radialAngles(children.length)
                                .map(
                                        (
                                            t : number, 
                                            i : number
                                        ) 
                                        : [string, Vector] =>  
                                                                [
                                                                    children[i].id, 
                                                                    Vector
                                                                        .scalar(t)
                                                                        .trig  ( )
                                                                        .scale (r)
                                                                        .add   (c)
                                                                ]
                                    )
                        );
}
/* ---------- UNIT placers (sibling-only) ---------- */
export const radialAngles = (
                                count : number
                            ) 
                            : number[] => 
                                            mapIndex(
                                                        count, 
                                                        (i : number) => 
                                                            (i / Math.max(1, count)) * Math.PI * 2
                                                    );

export const graphRadialCenters =   (
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
    const r : number = (nodeSize.max() + spacing * 3) * (1 + level * 0.6);
    const c : Vector = origin.add(pcTreeBelow({ parentSize, spacing }));
    return  Object
                .fromEntries(
                    radialAngles(children.length)
                        .map(
                                (
                                    t : number, 
                                    i : number
                                ) =>  
                                        [
                                            children[i].id, 
                                            Vector
                                                .scalar(t)
                                                .trig  ( )
                                                .scale (r)
                                                .add   (c)
                                                .round ( )
                                        ]
                        )
                );
}
export const mapIndex = <T> (
                                n : number, 
                                f : (i: number) => T
                            ) 
                            : T[] => 
                                Array
                                    .from(
                                            { 
                                                length : n 
                                            }, 
                                            (
                                                _ : undefined, 
                                                i : number
                                            ) => 
                                                f(i)
                                         );

