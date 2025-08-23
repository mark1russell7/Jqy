import { Vector } from "../../geometry";
import {
  PreferredSizeParam, PreferredSizeReturn,
  Layout, PlaceChildrenReturn, PlaceChildrenParam, NestedFramesReturn
} from "../layout";
import { LayoutChildrenMode } from "../layout.enum";
import { MappedGrid } from "./grid.mapped";
import { Config } from "../../config";
import { LayoutTuning, LayoutTuningConfig } from "../layout.tuning";

export  class   RadialLayout 
        extends Layout 
{
    constructor(private tuning: Config<LayoutTuning> = LayoutTuningConfig) {
        super();
    }
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
                                                    ? nestedRadialCenters(this.tuning, args)
                                                    : graphRadialCenters (this.tuning, args);
    preferredSize = (
                        { 
                            count, 
                            nodeSize, 
                            spacing, 
                            mode 
                        } : PreferredSizeParam
                    ) 
                    : PreferredSizeReturn => 
                                                mode === LayoutChildrenMode.NESTED 
                                                    /*  caller has no external size; 
                                                        provide a pleasant default via tuning */
                                                            ? this  .tuning
                                                                    .get("nestedRadialPreferred")   (
                                                                                                        count, 
                                                                                                        nodeSize, 
                                                                                                        spacing
                                                                                                    )
                                                            /*  graph node’s own box uses nodeSize (engine decides); 
                                                                return nodeSize to be explicit */
                                                            : nodeSize;
                                            
}
/* =========================================================
 * NESTED RADIAL
 *  - Place on a circle and uniform-scale to fit inner content
 * ========================================================= */

export const nestedRadialCenters =  (
                                        tuning: Config<LayoutTuning>, 
                                        { 
                                            children, 
                                            parentSize, 
                                            nodeSize, 
                                            spacing 
                                        } : PlaceChildrenParam
                                    ) : PlaceChildrenReturn => 
{
    const inner : Vector    = parentSize
                                .subtract(Vector.scalar(2 * tuning.get("outerPad")(spacing)))
                                .round   ()
                                .clamp   (1, Infinity);
    const c     : Vector    = inner.scale(1/2);
    const start : number    = tuning.get("startAngle")();
    const cw    : boolean   = tuning.get("clockwise")();
    const baseR : number    = inner.min() / 2 - nodeSize.max() / 2 - tuning.get("itemPad")(spacing);
    const r     : number    = Math.max(tuning.get("minRadius")(), baseR);
    return Object
            .fromEntries(
                            mapIndex(children.length,
                                        (
                                            i : number
                                        ) 
                                        : [string, Vector] =>  
                                                                [
                                                                    children[i].id, 
                                                                    Vector
                                                                        .scalar(tuning.get("angleOf")(i, children.length, start, cw))
                                                                        .trig  ( )
                                                                        .scale (r)
                                                                        .add   (c)
                                                                ]
                                    )
                        );
}

export const graphRadialCenters =   (
                                        tuning: Config<LayoutTuning>,
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
    const base  = tuning.get("radialBase")(nodeSize, spacing);
    const r     = Math.max(tuning.get("minRadius")(), base * (1 + level * tuning.get("radialLevelScale")()));

    const a     = tuning.get("anchor")({ mode: LayoutChildrenMode.GRAPH, parentSize, spacing });
    const c     = origin.add(a);

    const start = tuning.get("startAngle")();
    const cw    = tuning.get("clockwise")();
    return  Object
                .fromEntries(
                    mapIndex(children.length,
                                ( 
                                    i : number
                                ) =>  
                                        [
                                            children[i].id, 
                                            Vector
                                                .scalar(tuning.get("angleOf")(i, children.length, start, cw))
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

