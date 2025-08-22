import "reactflow/dist/style.css";
import ReactFlow, { Background, Controls } from "reactflow";
import { 
    JSX,
    useMemo, 
    useState 
} from "react";
import { 
    resolveLayoutName 
} from "./layout/layout.values";
import { 
    LayoutConfigs 
} from "./layout/layout.values";
import { 
    cloneDeep 
} from "./object.utils";
import { 
    buildGraph, 
    NodeConfig
} from "./graph";
import { 
    Vector 
} from "./geometry";
import { 
    LayoutChildrenMode,
    LayoutTypes 
} from "./layout/layout.enum";
import { 
    Layout, 
    NestedFramesReturn, 
    PlaceChildrenParam,
    PlaceChildrenReturn
} from "./layout/layout";

/** ----------------------------
 * Nested projection renderer
 * ---------------------------- */

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
    const minSize : Vector = nodeSize.scale(2);
    const size    : Vector = strategy
                                .autosizeParent({ 
                                                    count   : children.length,
                                                    min     : minSize, 
                                                    nodeSize, 
                                                    spacing
                                                });

    // Parent container
    const pad     : number = Math.max(12, spacing * 1.0); // keep in sync with outerPad
    const inner   : Vector = size.subtract(Vector.scalar(2 * pad)).clamp(-Infinity, 1)
    
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


export type GridChildProps = 
{
    nodeConfig  : NodeConfig;
    layoutName  : LayoutTypes;
    nodeSize    : Vector;
    spacing     : number;
    level       : number;
    gridFrames  : NestedFramesReturn;
}

const GridChild =   (
                        {
                            nodeConfig,
                            layoutName,
                            nodeSize,
                            spacing,
                            level,
                            gridFrames
                        } : GridChildProps
                    ) 
                    : React.JSX.Element => 
{
    // Tight cell rect
    const frame = gridFrames.grid.getItem(nodeConfig.id);
    if(!frame)
    {
        return <>Error {nodeConfig.id}</>;
    }
    const position  = frame.dimensions.getPosition();
    const size      = frame.dimensions.getSize();
    const childNode =   { 
                            ...nodeConfig, 
                            size 
                        };
    const ChildStyle : React.CSSProperties = 
    {
        position    : "absolute",
        left        : position.x,
        top         : position.y,
        width       : size.x,
        height      : size.y
    };
    return (
        <div 
                key     =   {nodeConfig.id  } 
                style   =   {ChildStyle     }
        >
            <NestedBox 
                node        =   {childNode  } 
                layoutName  =   {layoutName } 
                nodeSize    =   {nodeSize   } 
                spacing     =   {spacing    } 
                level       =   {level + 1  } 
            />
        </div>
    );
}

export type RadialChildProps = 
{
    nodeConfig  : NodeConfig;
    layoutName  : LayoutTypes;
    nodeSize    : Vector;
    spacing     : number;
    level       : number;
    centers     : PlaceChildrenReturn;
    origin      : Vector;
}
const RadialChild = (
                        {
                            nodeConfig,
                            layoutName,
                            nodeSize,
                            spacing,
                            level,
                            centers,
                            origin
                        } : RadialChildProps
                    ) 
                    : React.JSX.Element => 
{
     // RADIAL (or any center-based nested): place by center, size stays nodeSize
    const p = centers[nodeConfig.id] ?? { 
                                            x : origin.x, 
                                            y : origin.y 
                                        };
    const position  = p.subtract(nodeSize.halve());
    const childNode =   { 
                            ...nodeConfig, 
                            size : nodeSize 
                        };
    const childStyle : React.CSSProperties = {
        position    : "absolute",
        left        : position.x,
        top         : position.y,
        width       : nodeSize.x,
        height      : nodeSize.y
    };
    return (
        <div
                key     =   {nodeConfig.id  } 
                style   =   {childStyle     }
        >
            <NestedBox 
                node        =   {childNode  } 
                layoutName  =   {layoutName } 
                nodeSize    =   {nodeSize   } 
                spacing     =   {spacing    } 
                level       =   {level + 1  } 
            />
        </div>
    );    
}




function NestedProjection({ config, layoutName, nodeSize, spacing }) {
    return (
        <div style={{ position: "absolute", left: 12, top: 12 }}>
            <NestedBox node={config} layoutName={layoutName} nodeSize={nodeSize} spacing={spacing} />
        </div>
    );
}

/** ----------------------------
 * Demo config
 * ---------------------------- */

const DEMO = {
    id: "root",
    label: "Root",
    position: new Vector(400, 60),
    layout: LayoutTypes.Grid, // try "radial" too
    children: [
        {
            id: "A",
            label: "A",
            layout: LayoutTypes.Radial,
            children: [{ id: "A1", label: "A1" }, { id: "A2", label: "A2" }, { id: "A3", label: "A3" }],
        },
        {
            id: "B",
            label: "B",
            layout: LayoutTypes.Grid,
            children: [{ id: "B1", label: "B1" }, { id: "B2", label: "B2" }, { id: "B3", label: "B3" }, { id: "B4", label: "B4" }],
        },
        {
            id: "C",
            label: "C",
            layout: LayoutTypes.Radial,
            children: [{ id: "C1", label: "C1" }, { id: "C2", label: "C2" }, { id: "C3", label: "C3" }, { id: "C4", label: "C4" }],
        },
    ],
};

/** ----------------------------
 * Main demo
 * ---------------------------- */

export default function ParentChildLayoutsDemo({ config = DEMO }) {
    const [layoutName, setLayoutName] = useState(LayoutTypes.Grid); 
    const [spacing, setSpacing] = useState(24);
    const [nodeW, setNodeW] = useState(110);
    const [nodeH, setNodeH] = useState(54);

    const nodeSize = useMemo(() => new Vector(nodeW, nodeH), [nodeW, nodeH]);

    const graphData = useMemo(() => {
        const c = cloneDeep(config);
        return buildGraph({ config: c, layoutName, nodeSize, spacing });
    }, [config, layoutName, nodeSize, spacing]);

    const BAR_H = 72;

    return (
        <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
            {/* Controls */}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: BAR_H,
                    background: "#f6f8fa",
                    borderBottom: "1px solid #d0d7de",
                    zIndex: 1000,
                    padding: 8,
                    boxSizing: "border-box",
                }}
            >
                <label style={{ marginRight: 8, fontSize: 12 }}>Layout</label>

                <select name="layout" value={layoutName} onChange={(e) => setLayoutName(e.target.value as LayoutTypes)} style={{ marginRight: 12 }}>
                    <option value={LayoutTypes.Grid}>Grid</option>
                    <option value={LayoutTypes.Radial}>Radial</option>
                </select>

                <label style={{ marginLeft: 8, marginRight: 6, fontSize: 12 }}>Spacing</label>
                <input type="range" min={8} max={80} value={spacing} onChange={(e) => setSpacing(parseInt(e.target.value, 10))} />
                <span style={{ marginLeft: 6, fontSize: 12 }}>{spacing}</span>

                <label style={{ marginLeft: 12, marginRight: 6, fontSize: 12 }}>Node W</label>
                <input type="range" min={80} max={220} value={nodeW} onChange={(e) => setNodeW(parseInt(e.target.value, 10))} />
                <span style={{ marginLeft: 6, fontSize: 12 }}>{nodeW}px</span>

                <label style={{ marginLeft: 12, marginRight: 6, fontSize: 12 }}>Node H</label>
                <input type="range" min={40} max={160} value={nodeH} onChange={(e) => setNodeH(parseInt(e.target.value, 10))} />
                <span style={{ marginLeft: 6, fontSize: 12 }}>{nodeH}px</span>
            </div>

            {/* Left: Graph (edges) */}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    top: BAR_H,
                    bottom: 0,
                    width: "50%",
                    borderRight: "1px solid #e5e7eb",
                    boxSizing: "border-box",
                }}
            >
                <div style={{ position: "absolute", left: 8, top: 8, fontSize: 11, color: "#64748b", zIndex: 2 }}>
                    Graph (Edges)
                </div>
                <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}>
                    <ReactFlow nodes={graphData.nodes} edges={graphData.edges} fitView>
                        <Background gap={16} />
                        <Controls />
                    </ReactFlow>
                </div>
            </div>

            {/* Right: Nested projection (true nesting) */}
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    right: 0,
                    top: BAR_H,
                    bottom: 0,
                    overflow: "auto",
                    boxSizing: "border-box",
                }}
            >
                <div style={{ position: "absolute", left: 8, top: 8, fontSize: 11, color: "#64748b", zIndex: 1 }}>
                    Nested Projection
                </div>
                <NestedProjection config={config} layoutName={layoutName} nodeSize={nodeSize} spacing={spacing} />
            </div>
        </div>
    );
}
