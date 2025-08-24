import { 
  Shapes,
    Vector 
} from "../geometry";
import { 
    NodeConfig 
} from "../graph";
import { 
    LayoutTypes, 
    LayoutChildrenMode 
} from "../layout/layout.enum";
import { 
    LayoutConfigs, 
    resolveLayoutName 
} from "../layout/layout.values";
import { 
    Layout, 
    NestedFramesReturn,
    PlaceChildrenReturn
} from "../layout/layout";
import { 
    LayoutTuningConfig 
} from "../layout/layout.tuning";
import { 
    MappedGridItemData 
} from "../layout/strategies/grid.mapped";
import { 
    GridItem 
} from "../layout/strategies/grid";

export type ModeMap = Record<string, LayoutChildrenMode>;

export type Wire = 
{ 
    source  : string; 
    target  : string 
};

export type LayoutResult = 
{ 
    boxes   : Record<string, Shapes.Box>; 
    wires   : Wire[] 
};
export const computeLayout =    (
                                    root        : NodeConfig,
                                    modes       : ModeMap,
                                    nodeSize    : Vector,
                                    spacing     : number
                                ) : LayoutResult =>
{
    const boxes: Record<string, Shapes.Box> = {};
    const wires: Wire[] = [];

    const place =   (
                        node            : NodeConfig,
                        level           : number,
                        assigned?       : Shapes.Box,
                        currentNodeSize : Vector = nodeSize
                    ) : void  => 
                    {
                        const id        : string                = node.id;
                        const mode      : LayoutChildrenMode    = modes[id] ?? LayoutChildrenMode.GRAPH;
                        const chosen    : LayoutTypes           = resolveLayoutName (
                                                                                        node, 
                                                                                        node.layout ?? LayoutTypes.Grid
                                                                                    );
                        const strat     : Layout                = LayoutConfigs.get<LayoutTypes>(chosen);

                        // Resolve this node's box
                        let   box       : Shapes.Box;
                        if (assigned) 
                        {
                            box = assigned;
                        } 
                        else 
                        {
                            const size =
                                mode === LayoutChildrenMode.GRAPH
                                    ? currentNodeSize
                                    : strat.preferredSize({
                                        count       : (node.children ?? []).length,
                                        nodeSize    : currentNodeSize,
                                        spacing,
                                        mode        : LayoutChildrenMode.NESTED,
                                    });
                            const tl = node.position ?? Vector.scalar(0);
                            box = new Shapes.Box( 
                                                    id, 
                                                    tl, 
                                                    size 
                                                );
                        }

                        boxes[id] = box;

                        const children = node.children ?? [];
                        if (!children.length) 
                        {
                            return;
                        }

                        if (mode === LayoutChildrenMode.NESTED) 
                        {
                            // children placed INSIDE this node’s box
                            const pad           : number = LayoutTuningConfig.get("outerPad")(spacing);
                            const inner         : Vector = box.size.subtract(Vector.scalar(2 * pad)).clamp(1, Infinity);
                            const innerTL       : Vector = box.position.add(Vector.scalar(pad));
                            const nextNodeSize  : Vector = currentNodeSize.scale(
                                LayoutTuningConfig.get("nestedNodeScale")(level)
                            );

                            if (chosen === LayoutTypes.Grid) 
                            {
                                // Grid nested: cells hard-size children (independent of sliders)
                                const frames : NestedFramesReturn = strat.nestedFrames  (  
                                                                                            { 
                                                                                                children, 
                                                                                                parentSize  : inner, 
                                                                                                spacing 
                                                                                            }
                                                                                        );
                                for (const c of children) 
                                {
                                    const item  : GridItem<MappedGridItemData | undefined> | undefined = frames.grid.getItem(c.id)!;
                                    const pos   : Vector = item.dimensions.getPosition();
                                    const sz    : Vector = item.dimensions
                                                                .getSize    ()
                                                                .subtract   (Vector.scalar(2 * frames.ip))
                                                                .clamp      (1, Infinity);
                                    const childBox = new Shapes.Box (
                                                                        c.id,
                                                                        innerTL
                                                                            .add(pos)
                                                                            .add(Vector.scalar(frames.ip)),
                                                                        sz
                                                                    );
                                    place   (
                                                c, 
                                                level + 1, 
                                                childBox, 
                                                nextNodeSize
                                            ); // pass scaled base
                                }
                            } 
                            else 
                            {
                                // Radial (or any center-based) nested
                                // 1) get centers (uses nextNodeSize only)
                                const centers : Record<string, Vector> = strat.placeChildren(
                                                                                                {
                                                                                                    mode        : LayoutChildrenMode.NESTED,
                                                                                                    children, 
                                                                                                    parent      : node,
                                                                                                    origin      : inner.halve(),
                                                                                                    level, 
                                                                                                    nodeSize    : nextNodeSize, 
                                                                                                    spacing, 
                                                                                                    parentSize  : inner,
                                                                                                }
                                                                                            );

                                // 2) compute each child's *base* desired size (before global fit)
                                const baseSizes : Record<string, Vector> = {};
                                for (const c of children) 
                                {
                                    const childMode     : LayoutChildrenMode    = modes[c.id] ?? LayoutChildrenMode.GRAPH;
                                    const childChosen   : LayoutTypes           = resolveLayoutName (   
                                                                                                        c, 
                                                                                                        c.layout ?? LayoutTypes.Grid
                                                                                                    );
                                    const childStrat    : Layout                = LayoutConfigs.get<LayoutTypes>(childChosen);
                                    const sz : Vector = (childMode === LayoutChildrenMode.NESTED)
                                                            ? childStrat.preferredSize  (
                                                                                            {
                                                                                                count       : (c.children ?? []).length,
                                                                                                nodeSize    : nextNodeSize,
                                                                                                spacing,
                                                                                                mode        : LayoutChildrenMode.NESTED,
                                                                                            }
                                                                                        )
                                                                        .scale          (
                                                                                            LayoutTuningConfig
                                                                                                .get("nestedContainerScale")
                                                                                                (level)
                                                                                        )
                                                            : nextNodeSize;
                                    baseSizes[c.id] = sz;
                                }
                    
                                // 3) derive a *single* scale k that guarantees fit:
                                //    - radial containment (half-diagonal inside ring)
                                //    - tangential non-overlap (chord >= width)
                                //    - global max-fraction of parent inner
                                const n             : number = Math.max(1, children.length);
                                const innerRadius   : number = inner.halve().min();
                                const ip            : number = LayoutTuningConfig.get("itemPad")(spacing);
                                // radius used by nestedRadialCenters (to keep consistent)
                                const r             : number = Math.max(
                                    LayoutTuningConfig.get("minRadius")(),
                                    innerRadius - nextNodeSize.max() / 2 - ip
                                );
                                const theta         : number = (Math.PI * 2) / n;
                                const chord         : number = 2 * r * Math.sin(theta / 2);

                                let maxWidth        : number = 0;
                                let maxHalfDiag     : number = 0;
                                let maxSideForFrac  : number = 0;
                                for (const c of children) 
                                {
                                    const sz : Vector   = baseSizes[c.id];
                                    maxWidth            = Math.max(maxWidth, sz.x);
                                    maxHalfDiag         = Math.max(maxHalfDiag, sz.length() / 2);
                                    maxSideForFrac      = Math.max(maxSideForFrac, sz.max());
                                }
                                const fracMax       : number = LayoutTuningConfig.get("nestedChildMaxFraction")();
                                const kRadial       : number = maxHalfDiag > 0 ? (r - ip) / maxHalfDiag : 1;
                                const kTangential   : number = (n >= 2 && maxWidth > 0) ? (chord - ip) / maxWidth : 1;
                                const kFraction     : number = maxSideForFrac > 0 ? ((innerRadius * 2) * fracMax) / maxSideForFrac : 1;
                                let   k             : number = Math.min (
                                                                            1, 
                                                                            kRadial, 
                                                                            kTangential, 
                                                                            kFraction
                                                                        );
                                if (!isFinite(k) || k <= 0) 
                                {
                                    k = Math.min(
                                                    1, 
                                                    kFraction, 
                                                    0.1
                                                );
                                }
                    
                                // 4) place scaled children
                                for (const c of children) {
                                    const p         : Vector = centers[c.id] ?? inner.scale(1 / 2);
                                    const finalSize : Vector = baseSizes[c.id]
                                                                .scale(k)
                                                                .clamp(1, Infinity);
                                    const tlChild   : Vector = innerTL
                                                                .add(
                                                                        p.subtract(finalSize.halve())
                                                                    );
                                    const childBox  : Shapes.Box = new Shapes.Box   (
                                                                                        c.id, 
                                                                                        tlChild, 
                                                                                        finalSize
                                                                                    );
                                    place   (
                                                c, 
                                                level + 1, 
                                                childBox, 
                                                nextNodeSize
                                            );
                                }
                            }
                        } else {
                            // GRAPH mode: children outside; constant base node size from current level
                            const centers : PlaceChildrenReturn = strat.placeChildren({
                                mode: LayoutChildrenMode.GRAPH,
                                children,
                                parent: node,
                                origin: box.position.add(box.size.scale(1 / 2)),
                                level,
                                nodeSize: currentNodeSize,
                                spacing,
                                parentSize: box.size,
                            });

                            for (const c of children) 
                            {
                                const cc        : Vector = centers[c.id];
                                const tlChild   : Vector = cc.subtract(currentNodeSize.halve());
                                const childBox  : Shapes.Box = new Shapes.Box   (
                                                                                    c.id, 
                                                                                    tlChild, 
                                                                                    currentNodeSize
                                                                                );
                                wires.push  (
                                                { 
                                                    source  : id, 
                                                    target  : c.id 
                                                }
                                            );
                                place   (
                                            c, 
                                            level + 1, 
                                            childBox, 
                                            currentNodeSize);
                            }
                        }
                    }

    place   (
                root, 
                0, 
                undefined, 
                nodeSize
            );
    return  { 
                boxes, 
                wires 
            };
}