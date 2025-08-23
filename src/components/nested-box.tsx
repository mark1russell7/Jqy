import { JSX } from "react";
import { Vector } from "./geometry";
import { NodeConfig } from "./graph";
import { LayoutChildrenMode, LayoutTypes } from "./layout/layout.enum";
import { LayoutConfigs, resolveLayoutName } from "./layout/layout.values";
import { Layout, PlaceChildrenParam } from "./layout/layout";
import { GridChild } from "./grid-child";
import { RadialChild } from "./radial-child";

export type NestedBoxProps = 
{
    node        : NodeConfig;
    layoutName  : LayoutTypes;
    nodeSize    : Vector;
    spacing     : number;
    level?      : number;
};

const NestedBox =   (
                        { 
                            node, 
                            layoutName, 
                            nodeSize, 
                            spacing, 
                            level = 0 
                        } : NestedBoxProps
                    ) 
                    : JSX.Element =>
{
    const children : NodeConfig[] = node.children ?? [];
    const chosen   : LayoutTypes  = resolveLayoutName(node, layoutName);
    const strategy : Layout       = LayoutConfigs.get<LayoutTypes>(chosen);

    // Size parent (if not specified)
    const size    : Vector = strategy
                                .preferredSize  ({ 
                                                    count   : children.length,
                                                    nodeSize, 
                                                    spacing,
                                                    mode    : LayoutChildrenMode.NESTED
                                                });

    // Parent container
    const pad     : number = Math.max(12, spacing * 1.0); // keep in sync with outerPad
    const inner   : Vector = size.subtract(Vector.scalar(2 * pad)).clamp(1, Infinity)
    
    // For nested GRID we want tight cells; for RADIAL we use centers
    const origin     : Vector = inner.scale(1/2); // local origin of INNER container
    const nestedArgs : PlaceChildrenParam = 
    { 
        mode       : LayoutChildrenMode.NESTED, 
        parent     : node, 
        parentSize : inner,
        children, 
        origin, 
        level, 
        nodeSize, 
        spacing
    };

    const gridFrames = chosen === LayoutTypes.Grid 
                            ? strategy.nestedFrames(nestedArgs) 
                            : null;
    const centers    = strategy.placeChildren(nestedArgs); // used by radial; grid still OK

    const OuterStyle : React.CSSProperties = 
    {
        position        : "relative",
        width           : size.x,
        height          : size.y,
        border          : "1px solid #d0d7de",
        borderRadius    : 10,
        background      : "#fff",
        boxSizing       : "border-box"
    };
    const LabelStyle : React.CSSProperties = 
    {
        position    : "absolute",
        left        : 6,
        top         : 4,
        fontSize    : 11,
        color       : "#475569",
        userSelect  : "none"
    };

    const InnerContentStyle : React.CSSProperties = 
    {
        position    : "absolute",
        left        : pad,
        top         : pad,
        width       : inner.x,
        height      : inner.y
    };



    return (
        <div style={OuterStyle}>
            {/* label */}
            <div style={LabelStyle}>
                {node.label ?? node.id}
            </div>

            {/* INNER CONTENT area (parent − padding) */}
            <div style={InnerContentStyle}>
                {
                    children
                        .map((c) => 
                                    {
                                        if (chosen === LayoutTypes.Grid && gridFrames) 
                                        {
                                            return <GridChild 
                                                        key         = {c.id}
                                                        nodeConfig  = {c} 
                                                        layoutName  = {layoutName} 
                                                        nodeSize    = {nodeSize} 
                                                        spacing     = {spacing} 
                                                        level       = {level} 
                                                        gridFrames  = {gridFrames} 
                                                    />;
                                        } 
                                        else 
                                        {
                                            // RADIAL (or any center-based nested): place by center, size stays nodeSize
                                            return <RadialChild 
                                                        nodeConfig  = {c} 
                                                        layoutName  = {layoutName} 
                                                        nodeSize    = {nodeSize} 
                                                        spacing     = {spacing} 
                                                        level       = {level} 
                                                        centers     = {centers} 
                                                        origin      = {origin} 
                                                    />;
                                        }
                                    }
                            )
                }
            </div>
        </div>
    );
}

export { NestedBox };