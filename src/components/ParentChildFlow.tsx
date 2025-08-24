import "reactflow/dist/style.css";
import { 
    JSX,
    useEffect,
    useMemo, 
    useState 
} from "react";
import { 
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
    LayoutView 
} from "./adapters/react-view.adapter";
import { 
    computeLayout, 
    LayoutResult, 
    ModeMap 
} from "./engine/computeLayout";
import { 
    LabeledSlider, 
    Segmented 
} from "./ui/controls";
import { 
    Shell 
} from "./ui/styles";
import { 
    Configurator 
} from "./ui/Configurator";
import { 
    Target 
} from "./adapters/env";

const DEMO : NodeConfig = 
{
    id        : "root",
    label     : "Root",
    position  : new Vector(200, 60),
    children  : [
                    { 
                        id          : "A", 
                        label       : "A", 
                        children    :   [
                                            { id    : "A1" }, 
                                            { id    : "A2" }, 
                                            { id    : "A3" }
                                        ] 
                                    },
                    { 
                        id          : "B", 
                        label       : "B", 
                        children    :   [
                                            { id    : "B1" }, 
                                            { id    : "B2" }, 
                                            { id    : "B3" }, 
                                            { id    : "B4" }
                                        ] 
                    },
                    { 
                        id          : "C", 
                        label       : "C", 
                        children    :   [
                                            { id    : "C1" }, 
                                            { id    : "C2" }, 
                                            { id    : "C3" }, 
                                            { id    : "C4" }
                                        ] 
                    },
                ],
};
Object.freeze(DEMO);

const DEMO_MIXED: NodeConfig = 
{
    id          : "root",
    label       : "Root",
    position    : new Vector(200, 60),
    layout      : LayoutTypes.Grid,
    children    :   [
                        { 
                            id          : "A", 
                            label       : "A", 
                            layout      : LayoutTypes.Radial, 
                            children    :   [
                                                { id: "A1" }, 
                                                { id: "A2" }, 
                                                { id: "A3" }
                                            ] 
                        },
                        { 
                            id          : "B", 
                            label       : "B", 
                            layout      : LayoutTypes.Grid, 
                            children    :   [
                                                { id: "B1" }, 
                                                { id: "B2" }, 
                                                { id: "B3" }, 
                                                { id: "B4" }
                                            ] 
                        },
                        { 
                            id          : "C", 
                            label       : "C", 
                            layout      : LayoutTypes.Radial, 
                            children    :   [
                                                { id: "C1" }, 
                                                { id: "C2" }, 
                                                { id: "C3" }, 
                                                { id: "C4" }
                                            ] 
                        },
                    ],
};
Object.freeze(DEMO_MIXED);
/* -------------------------------------------
 * Helpers
 * ------------------------------------------- */
type LayoutOverrideMap = Record<string, LayoutTypes | undefined>;
type NodeIndex = 
{ 
    id      : string; 
    label   : string 
};

const flattenNodes =    (
                            n : NodeConfig
                        ) : NodeIndex[] => 
{
    const out : NodeIndex[] =   [
                                    { 
                                        id      : n.id, 
                                        label   : n.label ?? n.id 
                                    }
                                ];
    for (const c of n.children ?? []) 
    {
        out.push(...flattenNodes(c));
    }
    return out;
}
const findNode =    (
                        root    : NodeConfig, 
                        id      : string
                    ) : NodeConfig | undefined => 
{
    if (root.id === id) 
    {
        return root;
    }
    for (const c of root.children ?? []) 
    {
        const hit : NodeConfig | undefined = findNode(c, id);
        if (hit) 
        {
            return hit;
        }
    }
    return undefined;
}
const subtreeIds =  (
                        root    : NodeConfig, 
                        startId : string
                    ) : string[] => 
{
    const node : NodeConfig | undefined = findNode(root, startId);
    if (!node) 
    {
        return [];
    }
    return  flattenNodes(node)
                .map(n => n.id);
}
const applyLayoutOverrides =    (
                                    node        : NodeConfig, 
                                    overrides   : LayoutOverrideMap
                                ) : NodeConfig => 
{
    const overridden : NodeConfig = { 
                                        ...node, 
                                        layout  : overrides[node.id] ?? node.layout 
                                    };
    if (node.children?.length) 
    {
        overridden.children = node.children.map(c => applyLayoutOverrides(c, overrides));
    }
    return overridden;
}

const idsInScope =  (
                        root            : NodeConfig, 
                        scope           : "all" | string, 
                        applyToSubtree  : boolean
                    ) : string[] =>
{
    const all : string[] = [];

    (() => {
        const walk = (n : NodeConfig) : void =>
        { 
            all.push(n.id); 
            (n.children ?? []).forEach(walk); 
        };
        walk(root);
    })();
    
    if (scope === "all") 
    {
        return all;
    }
    if (!applyToSubtree) 
    {
        return [scope];
    }
    const res: string[] = [];
    (() => {
        const walk = (n : NodeConfig) : void => 
        { 
            res.push(n.id); 
            (n.children ?? []).forEach(walk); 
        };
        walk(findNode(root, scope)!);
    })();
    return res;
}

/* -------------------------------------------
 * Main demo
 * ------------------------------------------- */
type RightPaneKind =        Target.DOM 
                        |   Target.Canvas 
                        |   Target.ReactFlow;
export type ParentChildLayoutsDemoProps = 
{ 
    config?: NodeConfig 
};

export const ParentChildLayoutsDemo =   (
                                            { 
                                                config = DEMO_MIXED 
                                            } : ParentChildLayoutsDemoProps
                                        ) : JSX.Element => 
{
    const [adapter  , setAdapter] = useState<RightPaneKind>(Target.DOM);
    const [spacing  , setSpacing] = useState(24);
    const [nodeW    , setNodeW  ] = useState(110);
    const [nodeH    , setNodeH  ] = useState(54);
    const LIMITS =  { 
                        spacing :   { 
                                        min : 0, 
                                        max : 80 
                                    }, 
                        nodeW   :   { 
                                        min : 40, 
                                        max : 240 
                                    }, 
                        nodeH   :   { 
                                        min : 30, 
                                        max : 180 
                                    } 
                    };
    // NEW: layout scope + mode map
    const [layoutName   , setLayoutName ] = useState<LayoutTypes>(LayoutTypes.Grid);
    const [modes        , setModes      ] = useState<ModeMap>   (
                                                                    { 
                                                                        root    : LayoutChildrenMode.GRAPH, 
                                                                        A       : LayoutChildrenMode.NESTED, 
                                                                        B       : LayoutChildrenMode.GRAPH, 
                                                                        C       : LayoutChildrenMode.NESTED 
                                                                    }
                                                                );
    const [scope            , setScope          ] = useState<"all" | string>("all");
    const [applyToSubtree   , setApplyToSubtree ] = useState(true);

    // apply layout to scope by mutating a *derived* config (never the frozen constants)
    const effectiveConfig = useMemo<NodeConfig> (
                                                    () : NodeConfig => 
                                                    {
                                                        const clone =   ( 
                                                                            n   : NodeConfig
                                                                        ) : NodeConfig => 
                                                                        {
                                                                            return  { 
                                                                                        ...n, 
                                                                                        children : (n.children ?? [])
                                                                                                    .map(clone) 
                                                                                    };
                                                                        }
                                                        const copy : NodeConfig = clone(config);
                                                        const setLayout =   (
                                                                                n   : NodeConfig
                                                                            ) : void => 
                                                                            {
                                                                                if  (
                                                                                            scope === "all" 
                                                                                        ||  n.id === scope
                                                                                    ) 
                                                                                {
                                                                                    n.layout = layoutName;
                                                                                }
                                                                                if  (
                                                                                            applyToSubtree 
                                                                                        ||  scope === "all"
                                                                                    ) 
                                                                                {
                                                                                    (n.children ?? [])
                                                                                        .forEach(setLayout);
                                                                                }
                                                                            }
                                                        setLayout(copy);
                                                        return copy;
                                                    }, 
                                                    [
                                                        config, 
                                                        layoutName, 
                                                        scope, 
                                                        applyToSubtree
                                                    ]
                                                );

    const nodeSize  : Vector =  useMemo (
                                            () : Vector => 
                                                new Vector  (
                                                                Math.max(
                                                                            20, 
                                                                            nodeW
                                                                        ), 
                                                                Math.max(
                                                                            20, 
                                                                            nodeH
                                                                        )
                                                            ), 
                                            [
                                                nodeW, 
                                                nodeH
                                            ]
                                        );
    /* KEY LAYOUT COMPUTATION */
    const result    : LayoutResult  =   useMemo (
                                                    () : LayoutResult => 
                                                        computeLayout   (
                                                                            effectiveConfig, 
                                                                            modes, 
                                                                            nodeSize, 
                                                                            spacing
                                                                        ), 
                                                    [
                                                        effectiveConfig, 
                                                        modes, 
                                                        nodeSize, 
                                                        spacing
                                                    ]
                                                );
    const scopedIds :   string[]    =   useMemo (
                                                    () => 
                                                        idsInScope  (
                                                                        config, 
                                                                        scope, 
                                                                        applyToSubtree
                                                                    ), 
                                                                    [
                                                                        config, 
                                                                        scope, 
                                                                        applyToSubtree
                                                                    ]
                                                );
    const nestedGridActive  :   boolean =   useMemo (
                                                        () => 
                                                                layoutName === LayoutTypes.Grid 
                                                            &&  scopedIds
                                                                    .some   (
                                                                                id => 
                                                                                    (modes[id] ?? LayoutChildrenMode.GRAPH) === LayoutChildrenMode.NESTED
                                                                            ),
                                                        [
                                                            layoutName, 
                                                            scopedIds, 
                                                            modes
                                                        ]
                                                    );
    
    // When "Nested + Grid" is active, snap to the stable setting:
    // Spacing = MIN, NodeW = MAX, NodeH = MAX.
    useEffect   (   
                    () : void => 
                    {
                        if (nestedGridActive) 
                        {
                            setSpacing  (LIMITS.spacing.min);
                            setNodeW    (LIMITS.nodeW.max);
                            setNodeH    (LIMITS.nodeH.max);
                        }
                    }, 
                    [
                        nestedGridActive
                    ]
                );

    const LayoutViewStyle : React.CSSProperties = 
    {
        position    : "absolute",
        inset       : 0
    }

    return (
        <div style = {Shell.outer}>
            <div style = {Shell.bar}>
                <Segmented<RightPaneKind>
                    label       =   "Right Pane"
                    value       =   {adapter    }
                    onChange    =   {setAdapter }
                    options     =   {
                                        [
                                            { label: "DOM",       value: Target.DOM         },
                                            { label: "Canvas",    value: Target.Canvas      },
                                            { label: "ReactFlow", value: Target.ReactFlow   },
                                        ]
                                    }
                />
                <Configurator
                    root                =   {config             }
                    modes               =   {modes              }
                    setModes            =   {setModes           }
                    layout              =   {layoutName         }
                    setLayout           =   {setLayoutName      }
                    scope               =   {scope              }
                    setScope            =   {setScope           }
                    applyToSubtree      =   {applyToSubtree     } 
                    setApplyToSubtree   =   {setApplyToSubtree  }
                />
                
                <LabeledSlider 
                    label       =   "Spacing" 
                    value       =   {spacing            } 
                    min         =   {LIMITS.spacing.min } 
                    max         =   {LIMITS.spacing.max } 
                    onChange    =   {setSpacing         } 
                />
                <LabeledSlider 
                    label       =   "Node W" 
                    value       =   {nodeW              }   
                    min         =   {LIMITS.nodeW.min   }  
                    max         =   {LIMITS.nodeW.max   }  
                    onChange    =   {setNodeW           } 
                    disabled    =   {nestedGridActive   } 
                />
                <LabeledSlider 
                    label       =   "Node H"  
                    value       =   {nodeH              }   
                    min         =   {LIMITS.nodeH.min   }  
                    max         =   {LIMITS.nodeH.max   }  
                    onChange    =   {setNodeH           } 
                    disabled    =   {nestedGridActive   } 
                />

            </div>

            <div style = {Shell.left}>
                <div style = {Shell.title}>
                    Graph (Edges)
                </div>
                <div style = {Shell.rf}>
                    <LayoutView 
                        kind    =   {Target.ReactFlow   } 
                        result  =   {result             } 
                    />
                </div>
            </div>

            <div style = {Shell.right}>
                <div style = {Shell.title}>
                    Right Pane: {adapter}
                </div>
                <div style = {LayoutViewStyle}>
                    <LayoutView 
                        kind    =   {adapter} 
                        result  =   {result } 
                    />
                </div>
            </div>
        </div>
    );
}