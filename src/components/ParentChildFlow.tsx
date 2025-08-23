import "reactflow/dist/style.css";
import ReactFlow, { Background, Controls } from "reactflow";
import { 
    JSX,
    useMemo, 
    useState 
} from "react";
import { 
    buildGraph, 
    NodeConfig
} from "./graph";
import { 
    Vector 
} from "./geometry";
import { 
    LayoutTypes 
} from "./layout/layout.enum";
import { NestedProjection } from "./nested-projection";


/** ----------------------------
 * Demo config
 * ---------------------------- */

const DEMO = {
    id          : "root",
    label       : "Root",
    position    : new Vector(400, 60),
    layout      : LayoutTypes.Grid, // try "radial" too
    children    : [
        {
            id          :   "A",
            label       :   "A",
            layout      :   LayoutTypes.Radial,
            children    :   [
                                { 
                                    id      : "A1", 
                                    label   : "A1" 
                                }, 
                                { 
                                    id      : "A2", 
                                    label   : "A2" 
                                }, 
                                { 
                                    id      : "A3", 
                                    label   : "A3" 
                                }
                            ]
        },
        {
            id          :   "B",
            label       :   "B",
            layout      :   LayoutTypes.Grid,
            children    :   [
                                { 
                                    id      : "B1", 
                                    label   : "B1" 
                                }, 
                                { 
                                    id      : "B2", 
                                    label   : "B2" 
                                }, 
                                { 
                                    id      : "B3", 
                                    label   : "B3" 
                                }, 
                                { 
                                    id      : "B4", 
                                    label   : "B4" 
                                }
                            ]
        },
        {
            id          : "C",
            label       : "C",
            layout      : LayoutTypes.Radial,
            children    :   [
                                { 
                                    id      : "C1", 
                                    label   : "C1" 
                                }, 
                                { 
                                    id      : "C2", 
                                    label   : "C2" 
                                }, 
                                { 
                                    id      : "C3", 
                                    label   : "C3" 
                                }, 
                                { 
                                    id      : "C4", 
                                    label   : "C4" 
                                }
                            ]
        }
    ]
};
Object.freeze(DEMO);


const BAR_H = 72;

const OuterStyle : React.CSSProperties = 
{
    position    : "relative", 
    width       : "100vw", 
    height      : "100vh", 
    overflow    : "hidden"
}
const ControlsStyle : React.CSSProperties =
{
    position    : "absolute",
    left        : 0,
    top         : 0,
    width       : "100%",
    height      : BAR_H,
    background  : "#f6f8fa",
    borderBottom: "1px solid #d0d7de",
    zIndex      : 1000,
    padding     : 8,
    boxSizing   : "border-box"
}

const LeftGraphStyle : React.CSSProperties =
{
    position    : "absolute",
    left        : 0,
    top         : BAR_H,
    bottom      : 0,
    width       : "50%",
    borderRight : "1px solid #e5e7eb",
    boxSizing   : "border-box"
}

const LeftGraphTitleStyle : React.CSSProperties =
{
    position    : "absolute",
    left        : 8,
    top         : 8,
    fontSize    : 11,
    color       : "#64748b",
    zIndex      : 1
}

const LeftGraphReactFlowContainerStyle : React.CSSProperties =
{
    position    : "absolute", 
    left        : 0, 
    right       : 0, 
    top         : 0, 
    bottom      : 0
}

const RightGraphStyle : React.CSSProperties =
{
    position    : "absolute",
    left        : "50%",
    right       : 0,
    top         : BAR_H,
    bottom      : 0,
    overflow    : "auto",
    boxSizing   : "border-box"
}
const RightGraphTitleStyle : React.CSSProperties =
{
    position    : "absolute",
    left        : 8,
    top         : 8,
    fontSize    : 11,
    color       : "#64748b",
    zIndex      : 1
}

const makeConfiguratorSlider = ({label, value, min, max, onChange}) : JSX.Element => (
    <div style={{ 
                    display     : "flex", 
                    alignItems  : "center", 
                    margin      : "0 12px" 
                }}
    >
        <label style=   {{ 
                            marginRight : 8, 
                            fontSize    : 12 
                        }}
        >
            {label}
        </label>
        <input 
            type        =   "range" 
            min         =   {min        } 
            max         =   {max        } 
            value       =   {value      } 
            onChange    =   {onChange   } 
        />
        <span style={{ 
                        marginLeft  : 6, 
                        fontSize    : 12 
                    }}
        >
            {value}
        </span>
    </div>
);

/** ----------------------------
 * Main demo
 * ---------------------------- */

export type ParentChildLayoutsDemoProps = 
{
    config? : NodeConfig;
}

export const ParentChildLayoutsDemo =   (
                                            { 
                                                config = DEMO 
                                            } : ParentChildLayoutsDemoProps
                                        ) 
                                        : React.JSX.Element => 
{
    const [layoutName   , setLayoutName ] = useState(LayoutTypes.Grid); 
    const [spacing      , setSpacing    ] = useState(24);
    const [nodeW        , setNodeW      ] = useState(110);
    const [nodeH        , setNodeH      ] = useState(54);

    const nodeSize  = useMemo   (
                                    () => new Vector(nodeW, nodeH), 
                                    [
                                        nodeW, 
                                        nodeH
                                    ]
                                );
    const graphData = useMemo   (      
                                    () => 
                                        buildGraph({ config, layoutName, nodeSize, spacing }), 
                                    [
                                        config, 
                                        layoutName, 
                                        nodeSize, 
                                        spacing
                                    ]
                                );
    

    return (
        <div style={OuterStyle}>
            {/* Controls */}
            <div style={ControlsStyle}>
                <label style={{ marginRight: 8, fontSize: 12 }}>Layout</label>
                <select 
                    name        =   "layout" 
                    value       =   {layoutName} 
                    onChange    =   {(e) => setLayoutName(e.target.value as LayoutTypes)} 
                    style       =   {{ marginRight: 12 }}
                >
                    <option value={LayoutTypes.Grid     }>Grid  </option>
                    <option value={LayoutTypes.Radial   }>Radial</option>
                </select>

                {makeConfiguratorSlider({
                    label   : "Spacing",
                    value   : spacing,
                    min     : 0,
                    max     : 80,
                    onChange: (e : React.ChangeEvent<HTMLInputElement>) => setSpacing(parseInt(e.target.value, 10))
                })}

                {makeConfiguratorSlider({
                    label   : "Node W",
                    value   : nodeW,
                    min     : 0,
                    max     : 220,
                    onChange: (e : React.ChangeEvent<HTMLInputElement>) => setNodeW(parseInt(e.target.value, 10))
                })}

                {makeConfiguratorSlider({
                    label   : "Node H",
                    value   : nodeH,
                    min     : 0,
                    max     : 160,
                    onChange: (e : React.ChangeEvent<HTMLInputElement>) => setNodeH(parseInt(e.target.value, 10))
                })}
            </div>

            {/* Left: Graph (edges) */}
            <div style = {LeftGraphStyle}>
                <div style = {LeftGraphTitleStyle}>
                    Graph (Edges)
                </div>
                <div style = {LeftGraphReactFlowContainerStyle}>
                    <ReactFlow 
                        nodes   =   {graphData.nodes} 
                        edges   =   {graphData.edges} 
                        fitView 
                    >
                        <Background gap={16} />
                        <Controls />
                    </ReactFlow>
                </div>
            </div>
            {/* Right: Nested projection (true nesting) */}
            <div style = {RightGraphStyle}>
                <div style = {RightGraphTitleStyle}>
                    Nested Projection
                </div>
                <NestedProjection 
                    config      =   {config     } 
                    layoutName  =   {layoutName } 
                    nodeSize    =   {nodeSize   } 
                    spacing     =   {spacing    } 
                />
            </div>
        </div>
    );
}
