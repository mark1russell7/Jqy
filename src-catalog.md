# Source Catalog (TypeScript)

Generated on 2025-08-25T00:37:35.512Z

## Directory structure (src)

```
├── assets/

├── components/
│   ├── adapters/
│   │   ├── api.adapter.ts
│   │   ├── canvas.adapter.tsx
│   │   ├── canvas.core.ts
│   │   ├── canvas.vanilla.ts
│   │   ├── env.ts
│   │   ├── factory.ts
│   │   ├── r3f.adapter.tsx
│   │   ├── react-dom.adapter.tsx
│   │   ├── react-flow.adapter.ts
│   │   ├── react-view.adapter.tsx
│   │   ├── theme.ts
│   │   ├── three.adapter.ts
│   │   └── vanilla-dom.adapter.ts
│   ├── layout/
│   │   ├── engine/
│   │   │   └── layout.engine.ts
│   │   ├── iterator/
│   │   │   ├── iterator.registry.ts
│   │   │   ├── iterator.types.ts
│   │   │   └── layout.iterators.ts
│   │   ├── strategies/
│   │   │   ├── grid/
│   │   │   │   ├── grid.layout.ts
│   │   │   │   ├── grid.mapped.ts
│   │   │   │   └── grid.ts
│   │   │   └── radial/
│   │   │       └── radial.layout.ts
│   │   ├── layout.enum.ts
│   │   ├── layout.registry.ts
│   │   ├── layout.ts
│   │   └── layout.tuning.ts
│   ├── ui/
│   │   ├── Configurator.tsx
│   │   ├── controls.tsx
│   │   └── styles.ts
│   ├── class.types.ts
│   ├── config.ts
│   ├── geometry.sanity.test.ts
│   ├── geometry.ts
│   ├── graph.ts
│   ├── math.ts
│   └── ParentChildFlow.tsx
└── App.tsx
```

## Files

### src/App.tsx

``` tsx
import { 
  ParentChildLayoutsDemo 
} from './components/ParentChildFlow';

function App() 
{
  return <ParentChildLayoutsDemo  />;
}

export default App;

```

### src/components/adapters/api.adapter.ts

``` ts
import { 
    computeLayout, 
    LayoutResult, 
    ModeMap 
} from "../engine/computeLayout";
import { 
    Vector 
} from "../geometry";
import { 
    NodeConfig 
} from "../graph";

export type RunLayoutApiInput = 
{
    root      : NodeConfig,
    modes     : ModeMap,
    nodeSize  : Vector,
    spacing   : number
}

export const runLayoutAPI = (
                                {
                                    root,
                                    modes,
                                    nodeSize,
                                    spacing
                                } : RunLayoutApiInput
                            ) : LayoutResult => 
                                computeLayout   (
                                                    root, 
                                                    modes, 
                                                    nodeSize, 
                                                    spacing
                                                );


```

### src/components/adapters/canvas.adapter.tsx

``` tsx
import { 
    JSX,
    useEffect, 
    useRef 
} from "react";
import { 
    LayoutResult 
} from "../engine/layout.engine";
import { 
    Theme, 
    defaultTheme 
} from "./theme";
import { 
    drawLayoutToCanvas 
} from "./canvas.core";

export type Canvas2DProps =
{
  result  : LayoutResult;
  theme?  : Theme;
}
export const Canvas2D = ( 
                            { 
                                result, 
                                theme = defaultTheme 
                            } : Canvas2DProps
                        ) : JSX.Element => 
                        {
                            const ref : React.RefObject<HTMLCanvasElement | null> = useRef<HTMLCanvasElement | null>(null);
                            const draw =    (
                                                parent : HTMLElement,
                                                cvs    : HTMLCanvasElement
                                            ) : void => 
                                            {
                                                const dpr  : number                   = Math.max(
                                                                                                    1, 
                                                                                                        window.devicePixelRatio 
                                                                                                    ||  1
                                                                                                );
                                                const rect : DOMRect                  = parent.getBoundingClientRect();
                                                cvs.width                             = Math.max(
                                                                                                    1, 
                                                                                                    Math.round  (
                                                                                                                        rect.width  
                                                                                                                    *   dpr
                                                                                                                )
                                                                                                );
                                                cvs.height                            = Math.max(
                                                                                                    1, 
                                                                                                    Math.round  (
                                                                                                                        rect.height 
                                                                                                                    *   dpr
                                                                                                                )
                                                                                                );
                                                const ctx  : CanvasRenderingContext2D = cvs.getContext("2d")!;
                                                ctx.setTransform(
                                                                    dpr, 
                                                                    0, 
                                                                    0, 
                                                                    dpr, 
                                                                    0, 
                                                                    0
                                                                );
                                                drawLayoutToCanvas  (
                                                                        ctx, 
                                                                        result, 
                                                                        theme
                                                                    );
                                            }
                            useEffect   (
                                            () : (() => void) => 
                                            {
                                                const cvs       : HTMLCanvasElement = ref.current!;
                                                const parent    : HTMLElement       = cvs.parentElement!;
                                                const ro        : ResizeObserver    = new ResizeObserver(
                                                                                                            () : void => 
                                                                                                                draw(parent, cvs)
                                                                                                        );
                                                ro.observe(parent);
                                                draw(
                                                        parent, 
                                                        cvs
                                                    );
                                                return  () : void => 
                                                            ro.disconnect();
                                            }, 
                                            [
                                                result, 
                                                theme
                                            ]
                                        );

                            return  <canvas style   =   {
                                                            { 
                                                                position    : "absolute", 
                                                                inset       : 0, 
                                                                width       : "100%", 
                                                                height      : "100%", 
                                                                display     : "block" 
                                                            }
                                                        } 
                                            ref     =   {
                                                            ref
                                                        } 
                                    />;
                        }


```

### src/components/adapters/canvas.core.ts

``` ts
import { 
    LayoutResult 
} from "../engine/layout.engine";
import { 
    Shapes, 
    Vector 
} from "../geometry";
import { 
    Theme, 
    defaultTheme 
} from "./theme";

export const MAX_DEPTH      = 1_000;
export const finite_loop    =   (
                                    f : () => boolean
                                ) : void => 
                                {
                                    let i : number = 1;
                                    for (
                                            let keepGoing : boolean = true; 
                                            i <= MAX_DEPTH && keepGoing; 
                                            i++, keepGoing = f()
                                        );
                                    if(i === MAX_DEPTH)
                                    {
                                        throw new Error("Maximum depth exceeded");
                                    }
                                        
                                }

export const depthOf =  (
                            box     : Shapes.Box, 
                            boxes   : LayoutResult["boxes"]
                        ) : number => 
                        {
                            let     d           : number     = 0
                            const   boxesBox    : Shapes.Box = boxes[box.id];
                            if(boxesBox.parentId === undefined)
                            {
                                return d;
                            }
                            let p : string = boxesBox.parentId;
                            finite_loop(
                                            () => 
                                            {
                                                d++;
                                                const boxesBox      : Shapes.Box = boxes[p];
                                                const parentBoxID   :  string | undefined = boxesBox.parentId;
                                                if(parentBoxID === undefined)
                                                {
                                                    return false;
                                                }
                                                p = parentBoxID;
                                                return true;
                                            }
                                        );
                            return d;
                        }

export const drawLayoutToCanvas =   (
                                        ctx     : CanvasRenderingContext2D,
                                        result  : LayoutResult,
                                        theme   : Theme = defaultTheme
                                    ) : void => 
                                    {
                                        const   { 
                                                    width, 
                                                    height 
                                                } 
                                                : 
                                                { 
                                                    width   : number, 
                                                    height  : number 
                                                } = ctx.canvas;

                                        // background
                                        ctx.save();
                                        ctx.fillStyle   = theme.canvas.bg;
                                        ctx.fillRect(
                                                        0, 
                                                        0, 
                                                        width, 
                                                        height
                                                    );
                                        ctx.restore();

                                        // wires first (under boxes)
                                        ctx.save();
                                        ctx.strokeStyle = theme.wire.stroke;
                                        ctx.lineWidth   = theme.wire.width;
                                        for (const w of result.wires) 
                                        {
                                            const a : Shapes.Box = result.boxes[w.source];
                                            const b : Shapes.Box = result.boxes[w.target];
                                            if (!a || !b) 
                                            {
                                                continue;
                                            }
                                            const va : Vector = a
                                                                    .size
                                                                    .halve()
                                                                    .add(a.getPosition());
                                            const vb : Vector = b
                                                                    .size
                                                                    .halve()
                                                                    .add(b.getPosition());
                                            ctx.beginPath   ();
                                            ctx.moveTo      (
                                                                va.x, 
                                                                va.y
                                                            );
                                            ctx.lineTo      (
                                                                vb.x, 
                                                                vb.y
                                                            );
                                            ctx.stroke      ();
                                        }
                                        ctx.restore();

                                        // draw boxes sorted by depth (parents under children)
                                        const sorted = Object
                                                        .values (result.boxes)
                                                        .sort   (
                                                                    (
                                                                        A : Shapes.Box, 
                                                                        B : Shapes.Box
                                                                    ) : number =>
                                                                        depthOf(A, result.boxes) 
                                                                    -   depthOf(B, result.boxes)
                                                                );

                                        ctx.save();
                                        ctx.font            = `${theme.node.fontSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
                                        ctx.textAlign       = "center";
                                        ctx.textBaseline    = "middle";
                                        for (const b of sorted) 
                                        {
                                            const r         : number            = theme.node.radius;
                                            const rectangle : Shapes.Rectangle  = new Shapes.Rectangle  (
                                                                                                            b.getSize(), 
                                                                                                            b.getPosition()
                                                                                                        );
                                            const center    : Vector            = b.getPosition().add(b.getSize().halve());

                                            ctx.beginPath();
                                            roundedRect (
                                                            ctx, 
                                                            rectangle, 
                                                            r
                                                        );
                                            ctx.fillStyle   = theme.node.bg;
                                            ctx.fill();
                                            ctx.strokeStyle = theme.node.border;
                                            ctx.lineWidth = 1;
                                            ctx.stroke();

                                            ctx.fillStyle = theme.node.text;
                                            ctx.fillText(
                                                            b.id, 
                                                            center.x, 
                                                            center.y
                                                        );
                                        }
                                        ctx.restore();
                                    }

const roundedRect = (
                                        ctx         : CanvasRenderingContext2D,
                                        rectangle   : Shapes.Rectangle, 
                                        r           : number
                    ) : void => 
                    {
                        const size              : Vector    = rectangle.getSize();
                        const position          : Vector    = rectangle.getPosition();
                        const rr                : number    = Math.min  (
                                                                            r, 
                                                                            size
                                                                                .halve()
                                                                                .min()
                                                                        );
                        const sizeAndPosition   : Vector    = size.add(position);
                        ctx.moveTo  (
                                        position.x + rr, 
                                        position.y
                                    );
                        ctx.arcTo   (
                                        sizeAndPosition.x, 
                                        position.y, 
                                        sizeAndPosition.x, 
                                        sizeAndPosition.y, 
                                        rr
                                    );
                        ctx.arcTo   (
                                        sizeAndPosition.x, 
                                        sizeAndPosition.y, 
                                        position.x, 
                                        sizeAndPosition.y, 
                                        rr
                                    );
                        ctx.arcTo   (
                                        position.x, 
                                        sizeAndPosition.y, 
                                        position.x, 
                                        position.y, 
                                        rr
                                    );
                        ctx.arcTo   (
                                        position.x, 
                                        position.y, 
                                        sizeAndPosition.x, 
                                        position.y, 
                                        rr
                                    );
                        ctx.closePath();
                    }

```

### src/components/adapters/canvas.vanilla.ts

``` ts
import { 
    LayoutResult 
} from "../engine/computeLayout";
import { 
    drawLayoutToCanvas 
} from "./canvas.core";
import { 
    Theme, 
    defaultTheme 
} from "./theme";

export type CanvasMount = 
{
    update  : (r: LayoutResult  ) => void;
    destroy : (                 ) => void;
};

export const mountCanvas2D =    (
                                    container   : HTMLElement,
                                    initial     : LayoutResult,
                                    theme       : Theme         = defaultTheme
                                ) : CanvasMount => 
                                {
                                    const canvas : HTMLCanvasElement    = document.createElement("canvas");
                                    canvas.style.position               = "absolute";
                                    canvas.style.inset                  = "0";
                                    canvas.style.width                  = "100%";
                                    canvas.style.height                 = "100%";
                                    container.appendChild(canvas);

                                    const draw =    (r: LayoutResult) : void => 
                                                    {
                                                        const dpr   : number                    = Math.max  (
                                                                                                                1, 
                                                                                                                    window.devicePixelRatio 
                                                                                                                ||  1
                                                                                                            );
                                                        const rect  : DOMRect                   = canvas.getBoundingClientRect();
                                                        canvas.width                            = Math.max  (
                                                                                                                1, 
                                                                                                                Math.round  (
                                                                                                                                    rect.width  
                                                                                                                                *   dpr
                                                                                                                            )
                                                                                                            );
                                                        canvas.height                           = Math.max  (
                                                                                                                1, 
                                                                                                                Math.round  (
                                                                                                                                    rect.height 
                                                                                                                                *   dpr
                                                                                                                            )
                                                                                                            );
                                                        const ctx   : CanvasRenderingContext2D  = canvas.getContext("2d")!;
                                                        ctx.setTransform(
                                                                            dpr, 
                                                                            0,
                                                                            0, 
                                                                            dpr, 
                                                                            0, 
                                                                            0
                                                                        );
                                                        drawLayoutToCanvas  (
                                                                                ctx, 
                                                                                r, 
                                                                                theme
                                                                            );
                                                    };

                                    draw(initial);

                                    const ro : ResizeObserver = new ResizeObserver(() => draw(initial));
                                    ro.observe(container);

                                    return  {
                                                update  :   draw,
                                                destroy :   () : void => 
                                                            {
                                                                ro.disconnect();
                                                                container.removeChild(canvas);
                                                            }
                                            };
                                }

```

### src/components/adapters/env.ts

``` ts
export enum RuntimeEnv  
{ 
    Browser     = "browser", 
    Headless    = "headless" 
}
export enum Framework   
{ 
    React   = "react", 
    Vanilla = "vanilla", 
    Node    = "node" 
}
export enum Target      
{ 
    API         = "api", 
    Canvas      = "canvas", 
    DOM         = "dom", 
    ReactFlow   = "reactflow", 
    ThreeJS     = "threejs" 
}

// Placeholder types for threejs/r3f, implement later.
export type ThreeJsAdapter = unknown;

export type AdapterConfig = 
{
    runtime     : RuntimeEnv;
    framework   : Framework;
    target      : Target;
};

/**
 * Factory notes:
 * - API → just expose your computeLayout function (works everywhere).
 * - Canvas → React wrapper or vanilla mount depending on framework.
 * - DOM → React wrapper or vanilla mount depending on framework.
 * - ReactFlow → React only.
 * - ThreeJS → placeholders for now.
 */

```

### src/components/adapters/factory.ts

``` ts
import React, { JSX, ReactElement } from "react";
import { 
    AdapterConfig, 
    Framework, 
    Target 
} from "./env";
import { 
    runLayoutAPI, 
    RunLayoutApiInput
} from "./api.adapter";
import { 
    Canvas2D, 
    Canvas2DProps
} from "./canvas.adapter";
import { 
    AbsoluteDOM, 
    AbsoluteDOMProps
} from "./react-dom.adapter";
import { 
    LayoutView, 
    ReactAdapterProps
} from "./react-view.adapter";
import { 
    CanvasMount,
    mountCanvas2D 
} from "./canvas.vanilla";
import { 
    DOMMount,
    mountAbsoluteDOM 
} from "./vanilla-dom.adapter";
import { 
    LayoutResult 
} from "../layout/engine/layout.engine";
// factory.ts

export type Renderer =
    | { kind : Target.API                                              }
    | { kind : Target.DOM                                              }
    | { kind : Target.Canvas                                           }
    | { kind : Framework.React   , Component : React.ComponentType<any>}
    | { kind : Target.ReactFlow  , Component : React.ComponentType<any>};

export const makeRenderer = (
                                target : Target
                            ) : Renderer => 
                            {
                                switch (target) 
                                {
                                    case Target.API:    return  { 
                                                                    kind       : Target.API 
                                                                };
                                    case Target.DOM:    return  { 
                                                                    kind        : Target.DOM 
                                                                };
                                    case Target.Canvas      : return  { 
                                                                    kind        : Target.Canvas 
                                                                };
                                    case Target.ReactFlow   : return   { 
                                                                        kind        : Target.ReactFlow, 
                                                                        Component   : LayoutView 
                                                                    };
                                    case Target.ThreeJS:
                                    default:            return  { 
                                                                    kind        : Framework.React, 
                                                                    Component   : LayoutView 
                                                                };
                                }
                            }


/**
 * getAdapter(cfg)
 * - For React: returns { kind: 'react', render: (props) => ReactElement }
 * - For Vanilla: returns { kind: 'vanilla', mount(container, initial) => { update, destroy } }
 * - For API: returns { kind: 'api', run(root, modes, nodeSize, spacing) => LayoutResult }
 */
export type GetAdapterReturnRunLayoutAPI = 
{
    kind            :   Target.API,
    run             :   (
                            input   : RunLayoutApiInput
                        ) => LayoutResult
}

export type GetAdapterReturnReact = 
{
    kind   :    Framework.React,
    render :    (
                    props   : Canvas2DProps
                ) => ReactElement
}

export type GetAdapterReturnVanillaCanvas = 
{
    kind   :    Target.Canvas,
    mount  :    (
                    container   : HTMLElement,
                    initial     : LayoutResult
                ) => CanvasMount
}

export type GetAdapterReturnVanillaDOM = 
{
    kind   :    Target.DOM,
    mount  :    (
                    container   : HTMLElement,
                    initial     : LayoutResult
                ) => DOMMount
}

export type GetAdapterReturnReactFlow = 
{
    kind   :    Target.ReactFlow,
    render :    (
                    props   : ReactAdapterProps
                ) => ReactElement
}

export type GetAdapterReturn =      GetAdapterReturnRunLayoutAPI 
                                |   GetAdapterReturnReact
                                |   GetAdapterReturnVanillaCanvas
                                |   GetAdapterReturnVanillaDOM
                                |   GetAdapterReturnReactFlow
export const getAdapter =   (
                                cfg : AdapterConfig
                            ) : GetAdapterReturn => 
                            {
                                switch (cfg.target) 
                                {
                                    case Target.API:
                                        return  { 
                                                    kind    : Target.API, 
                                                    run     : runLayoutAPI 
                                                };

                                    case Target.Canvas:
                                        if (cfg.framework === Framework.React) 
                                        {
                                            return  { 
                                                        kind    :   Framework.React, 
                                                        render  :   (props : Canvas2DProps) : ReactElement => 
                                                                        React.createElement (
                                                                                                Canvas2D, 
                                                                                                props
                                                                                            ) 
                                                    };
                                        } 
                                        else 
                                        {
                                            return  { 
                                                        kind    : Target.Canvas, 
                                                        mount   : mountCanvas2D 
                                                    };
                                        }

                                case Target.DOM:
                                    if (cfg.framework === Framework.React) 
                                    {
                                        return  { 
                                                    kind    : Framework.React, 
                                                    render  :   (
                                                                    props   : AbsoluteDOMProps
                                                                ) : JSX.Element => 
                                                                    React.createElement (
                                                                                            AbsoluteDOM, 
                                                                                            props
                                                                                        ) 
                                                };
                                    } 
                                    else 
                                    {
                                        return  { 
                                                    kind    : Target.DOM, 
                                                    mount   : mountAbsoluteDOM 
                                                };
                                    }

                                case Target.ReactFlow:
                                    // React only – reuse <LayoutView kind="reactflow" />
                                    return  {
                                                kind    : Target.ReactFlow,
                                                render  :   (
                                                                props   : ReactAdapterProps
                                                            ) : JSX.Element => 
                                                                React.createElement (
                                                                                        LayoutView, 
                                                                                        {
                                                                                            ...props,
                                                                                            kind    : Target.ReactFlow,
                                                                                        }
                                                                                    ),
                                        };

                                case Target.ThreeJS:
                                    throw new Error("ThreeJS adapter not implemented yet.");

                                default:
                                    throw new Error(`Unsupported target: ${cfg.target}`);
                                }
                            }

```

### src/components/adapters/r3f.adapter.tsx

``` tsx
// TODO: Implement React-Three-Fiber <Canvas> wrapper and map boxes->meshes.
export function R3FView() 
{
    throw new Error("R3F adapter not implemented yet.");
}

```

### src/components/adapters/react-dom.adapter.tsx

``` tsx
import { 
    JSX 
} from "react/jsx-dev-runtime";
import { 
    LayoutResult 
} from "../engine/layout.engine";
import { 
    Theme, 
    defaultTheme 
} from "./theme";
import { 
    depthOf 
} from "./canvas.core";


export type AbsoluteDOMProps = 
{
    result: LayoutResult;
    theme?: Theme;
}
export function AbsoluteDOM (
                                { 
                                    result, 
                                    theme   = defaultTheme 
                                } : AbsoluteDOMProps
                            ) : JSX.Element 
                            {
                                const all   = result.boxes;
                                const boxes = Object
                                                .values (all)
                                                .sort   (
                                                            (a, b) => 
                                                                    depthOf(a, all) 
                                                                -   depthOf(b, all)
                                                        );

                                const lines = result
                                                .wires
                                                .map(
                                                        (w) => 
                                                        {
                                                            const a = result.boxes[w.source];
                                                            const b = result.boxes[w.target];
                                                            if (!a || !b) 
                                                            {
                                                                return null;
                                                            }
                                                            const A = a.getPosition().add(a.getSize().halve());
                                                            const B = b.getPosition().add(b.getSize().halve());
                                                            return (
                                                                <line
                                                                    key         =   {`${w.source}-${w.target}`}
                                                                    x1          =   {A.x} 
                                                                    y1          =   {A.y} 
                                                                    x2          =   {B.x} 
                                                                    y2          =   {B.y}
                                                                    stroke      =   {theme.wire.stroke} 
                                                                    strokeWidth =   {theme.wire.width}
                                                                />
                                                            );
                                                        });

                                return (
                                    <div style  =   {
                                                        { 
                                                            position    : "absolute", 
                                                            inset       : 0 
                                                        }
                                                    }
                                    >
                                        <svg style  =   {
                                                            { 
                                                                position        : "absolute", 
                                                                inset           : 0, 
                                                                pointerEvents   : "none" 
                                                            }
                                                        }
                                        >
                                            {lines}
                                        </svg>
                                        {
                                            boxes.map(
                                                        (b) => 
                                                        (
                                                            <div
                                                                key             =   {b.id}
                                                                data-parent     =   {b.parentId ?? ""}
                                                                style           =   {{
                                                                                        position        : "absolute",
                                                                                        left            : b.getPosition().x, 
                                                                                        top             : b.getPosition().y,
                                                                                        width           : b.getSize().x, 
                                                                                        height          : b.getSize().y,
                                                                                        border          : `1px solid ${theme.node.border}`,
                                                                                        borderRadius    : theme.node.radius,
                                                                                        background      : theme.node.bg,
                                                                                        boxSizing       : "border-box",
                                                                                        fontSize        : theme.node.fontSize,
                                                                                        color           : theme.node.text,
                                                                                        display         : "flex",
                                                                                        alignItems      : "center",
                                                                                        justifyContent  : "center",
                                                                                        userSelect      : "none",
                                                                                    }}
                                                            >
                                                                {b.id}
                                                            </div>
                                                        )
                                                    )
                                        }
                                    </div>
                                );
                            }

```

### src/components/adapters/react-flow.adapter.ts

``` ts
import type { 
    CSSProperties 
} from "react";
import type { 
    Node, 
    Edge 
} from "reactflow";
import { 
    LayoutResult 
} from "../engine/layout.engine";
import { 
    Vector 
} from "../geometry";

const nodeStyle =   (
                        v : Vector
                    ) : CSSProperties => 
                    ({
                        width           : v.x,
                        height          : v.y,
                        border          : "1px solid #cbd5e1",
                        borderRadius    : 10,
                        background      : "#fff",
                        fontSize        : 12,
                        boxSizing       : "border-box" as const,
                    });
export type toReactFlowReturn = 
{
    nodes   : Node[]; 
    edges   : Edge[];
};
export function toReactFlow (
                                { 
                                    boxes, 
                                    wires 
                                }: LayoutResult
                            ) : toReactFlowReturn 
                            {
                                const nodes : Node[] = Object
                                                            .values (boxes)
                                                            .map    (
                                                                        (b) => 
                                                                        {
                                                                            const rel   : Vector    =   b.parentId
                                                                                                            ?   b.getPosition().subtract(boxes[b.parentId].getPosition())
                                                                                                            :   b.getPosition();

                                                                            const base  : Node  = 
                                                                            {
                                                                                id          :   b.id,
                                                                                position    :   rel,
                                                                                data        :   { 
                                                                                                    label   : b.id 
                                                                                                },
                                                                                style       :   nodeStyle   (
                                                                                                                b.size
                                                                                                            ),
                                                                            };

                                                                            return  b.parentId
                                                                                        ?   { 
                                                                                                ...base, 
                                                                                                parentNode  : b.parentId, 
                                                                                                extent      : "parent"
                                                                                            }
                                                                                        :   base;
                                                                        }
                                                                    );

                                const edges :   Edge[]  =   wires
                                                                .map(
                                                                        (w) => 
                                                                        ({ 
                                                                            id      : `${w.source}-${w.target}`, 
                                                                            source  : w.source, 
                                                                            target  : w.target 
                                                                        })
                                                                    );
                                return  { 
                                            nodes, 
                                            edges 
                                        };
                            }

```

### src/components/adapters/react-view.adapter.tsx

``` tsx
import { JSX, useMemo } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import { LayoutResult } from "../engine/layout.engine";
import { toReactFlow } from "./react-flow.adapter";
import { AbsoluteDOM } from "./react-dom.adapter";
import { Canvas2D } from "./canvas.adapter";
import { Theme, defaultTheme } from "./theme";
import { Target } from "./env";


export type ReactAdapterProps = 
{
    kind    : Target;
    result  : LayoutResult;
    theme?  : Theme;
};

export const LayoutView =   (
                                {
                                    kind, 
                                    result, 
                                    theme = defaultTheme,
                                } : ReactAdapterProps
                            ) : JSX.Element => 
                            {
                                if (kind === Target.ReactFlow) 
                                {
                                    const   { 
                                                nodes, 
                                                edges 
                                            } = useMemo (
                                                            () => 
                                                                toReactFlow(result), 
                                                            [
                                                                result
                                                            ]
                                                        );
                                    return (
                                        <div 
                                            style   =   {
                                                            { 
                                                                position    : "absolute", 
                                                                inset       : 0 
                                                            }
                                                        }
                                        >
                                            <ReactFlow 
                                                nodes   =   {nodes} 
                                                edges   =   {edges} 
                                                fitView
                                            >
                                                <Background gap =   {16} />
                                                <Controls />
                                            </ReactFlow>
                                        </div>
                                    );
                                }
                                if (kind === Target.Canvas) 
                                {
                                    return  <Canvas2D 
                                                result  =   {result} 
                                                theme   =   {theme} 
                                            />;
                                }
                                return  <AbsoluteDOM 
                                            result  =   {result} 
                                            theme   =   {theme} 
                                        />;
                            }

```

### src/components/adapters/theme.ts

``` ts
export type Theme = 
{
    node    :   {
                    bg          : string;
                    border      : string;
                    radius      : number;
                    fontSize    : number;
                    text        : string;
                };
    wire    :   {
                    stroke  : string;
                    width   : number;
                };
    canvas  :   {
                    bg  : string;
                };
};

export const defaultTheme : Theme = {
                                        node    :   {
                                                        bg          : "#ffffff",
                                                        border      : "#cbd5e1",
                                                        radius      : 10,
                                                        fontSize    : 12,
                                                        text        : "#0f172a",
                                                    },
                                        wire    :   {
                                                        stroke  : "#94a3b8",
                                                        width   :   1,
                                                    },
                                        canvas  :   {
                                                        bg  : "#ffffff",
                                                    },
                                    };

```

### src/components/adapters/three.adapter.ts

``` ts
// TODO: Implement Three.js scene graph binding for boxes + wires.
// Placeholder to keep the target shape consistent.
export function mountThreeJS() 
{
    throw new Error("Three.js adapter not implemented yet.");
}

```

### src/components/adapters/vanilla-dom.adapter.ts

``` ts
import { 
    LayoutResult 
} from "../engine/computeLayout";
import { 
    Theme, 
    defaultTheme 
} from "./theme";

export type DOMMount = 
{ 
    update  :   (
                    r : LayoutResult
                ) => void; 
    destroy :   () => void 
};

export const mountAbsoluteDOM = (
                                    container   : HTMLElement,
                                    initial     : LayoutResult,
                                    theme       : Theme = defaultTheme
                                ) : DOMMount => 
                                {
                                    const root          : HTMLDivElement = document.createElement("div");
                                    root.style.position = "relative";
                                    root.style.width    = "100%";
                                    root.style.height   = "100%";
                                    container.appendChild(root);

                                    const svgNS : string        = "http://www.w3.org/2000/svg";
                                    const svg   : SVGElement    = document.createElementNS(svgNS, "svg") as SVGElement;
                                    Object.assign   (
                                                        svg.style, 
                                                        { 
                                                            position        : "absolute", 
                                                            inset           : "0", 
                                                            pointerEvents   : "none" 
                                                        }
                                                    );
                                    root.appendChild(svg);

                                    const draw =    (
                                                        r : LayoutResult
                                                    ) : void => 
                                                    {
                                                        // clear
                                                        root
                                                            .querySelectorAll("[data-node]")
                                                            .forEach(n => n.remove());
                                                        
                                                        while (svg.firstChild) 
                                                        {
                                                            svg.removeChild(svg.firstChild);
                                                        }

                                                        // wires
                                                        for (const w of r.wires) 
                                                        {
                                                            const a = r.boxes[w.source];
                                                            const b = r.boxes[w.target];
                                                            if (!a || !b) 
                                                            {
                                                                continue;
                                                            }
                                                            const A = a.getPosition().add(a.getSize().halve());
                                                            const B = b.getPosition().add(b.getSize().halve());
                                                            const line = document.createElementNS(svgNS, "line");
                                                            line.setAttribute("x1", String(A.x));
                                                            line.setAttribute("y1", String(A.y));
                                                            line.setAttribute("x2", String(B.x));
                                                            line.setAttribute("y2", String(B.y));
                                                            line.setAttribute("stroke", theme.wire.stroke);
                                                            line.setAttribute("stroke-width", String(theme.wire.width));
                                                            svg.appendChild(line);
                                                        }

                                                        // nodes
                                                        for (const b of Object.values(r.boxes)) 
                                                        {
                                                            const el                = document.createElement("div");
                                                            el.dataset.node         = b.id;
                                                            const s                 = el.style;
                                                            s.position              = "absolute";
                                                            s.left                  = `${b.getPosition().x}px`;
                                                            s.top                   = `${b.getPosition().y}px`;
                                                            s.width                 = `${b.getSize().x}px`;
                                                            s.height                = `${b.getSize().y}px`;
                                                            s.border                = `1px solid ${theme.node.border}`;
                                                            s.borderRadius          = `${theme.node.radius}px`;
                                                            s.background            = theme.node.bg;
                                                            s.boxSizing             = "border-box";
                                                            s.fontSize              = `${theme.node.fontSize}px`;
                                                            s.color                 = theme.node.text;
                                                            s.display               = "flex";
                                                            s.alignItems            = "center";
                                                            s.justifyContent        = "center";
                                                            (s as any).userSelect   = "none"; // TS dom lib sometimes misses this
                                                            el.textContent          = b.id;
                                                            root.appendChild(el);
                                                        }
                                                    };

                                    draw(initial);

                                    return  {
                                                update  :   draw,
                                                destroy :   () => 
                                                                container.removeChild(root),
                                            };
                                }

```

### src/components/class.types.ts

``` ts

export type ClassOf<T> = { new(...args: any[]): T };

```

### src/components/config.ts

``` ts
export class Config<T extends Record<string, any>> 
{
    public set<K extends keyof T>   (
                                        key     : K, 
                                        value   : T[K]
                                    ) : void 
    {
        this.settings[key] = value;
    }

    public get<K extends keyof T>   (
                                        key : K
                                    ) : T[K] 
    {
        return this.settings[key];
    }

    public reset<K extends keyof T> (
                                        key : K
                                    ) : void
    {
        this.settings[key] = this.defaults[key];
    }

    public resetAll() : void
    {
        this.settings = { ...this.defaults };
    }

    constructor (
                    private settings : T, 
                    private readonly defaults : T = { ...settings } // @Note: Shallow Copy
                ) 
    {
        Object.freeze(this.defaults);
        
    }
}
```

### src/components/geometry.sanity.test.ts

``` ts
import { Vector } from "./geometry";


console.log(new Vector(3, 4).length()); // 5
console.log(new Vector(1, 0).rotate(Math.PI / 2)); // ~ (0,1)
console.log(new Vector(2, 3).crossProduct(new Vector(5, 7))); // 2*7 - 3*5 = -1

```

### src/components/geometry.ts

``` ts
import { 
    add, 
    divide, 
    multiply, 
    subtract 
} from "./math";

export enum Dimension 
{
    X = "x",
    Y = "y"
}
export type Fold        =   (value  : number) => number;
export type NestFold    =   (vector : Vector) => number;
export type FoldWith    =   (
                                value1 : number, 
                                value2 : number
                            ) => number;
export type Reduce      =   (
                                x : number, 
                                y : number
                            ) => number;
export class Vector 
{
    constructor (
                    public readonly x : number, 
                    public readonly y : number
                ) 
    {

    }
    public  reflect         =   (axis       : Dimension )   =>  axis === Dimension.X 
                                                                    ? new Vector( this.x, -this.y) 
                                                                    : new Vector(-this.x,  this.y);
    public  scale           =   (factor     : number    )   =>  this.multiply   (Vector.scalar(factor));
    public  sum             =   (                       )   =>  this.reduce     (add);
    public  crossProduct    =   (vector     : Vector    )   =>  this.reflect    (Dimension.X)
                                                                    .dotProduct (vector.swap());
    public  normalize       =   (                       )   =>  this.scale      (1 / this.length());
    public  length          =   (                       )   =>  Math.sqrt       (this.dotProduct(this)); // Math.hypot(this.x, this.y); is more numerically stable
    public  round           =   (                       )   =>  this.map        (Math.round);
    public  map             =   (f          : Fold      )   =>  this.fold       (f,f);
    public  reduce          =   (f          : Reduce    )   =>  f               (this.x, this.y);
    static  scalar          =   (scalar     : number    )   =>  new Vector      (scalar, scalar);
    public  trig            =   (                       )   =>  this.fold       (Math.cos, Math.sin);
    public  swap            =   (                       )   =>  new Vector      (this.y, this.x);
    public  area            =   (                       )   =>  this.reduce     (multiply);
    public  aspectRatio     =   (                       )   =>  this.reduce     (divide);
    public  add             =   (vector     :   Vector  )   =>  this.mapWith    (add        , vector);
    public  multiply        =   (vector     :   Vector  )   =>  this.mapWith    (multiply   , vector);
    public  subtract        =   (vector     :   Vector  )   =>  this.mapWith    (subtract   , vector);
    public  divide          =   (vector     :   Vector  )   =>  this.mapWith    (divide     , vector);
    public  max             =   (                       )   =>  this.reduce     (Math.max);
    public  min             =   (                       )   =>  this.reduce     (Math.min);
    public  negate          =   (                       )   =>  this.scale      (-1);
    public  halve           =   (                       )   =>  this.scale      (1 / 2);
    public  dotProduct      =   (vector     :   Vector  )   =>  this.multiply   (vector)
                                                                    .sum        ();
    public  rotate          =   (radians    :   number  )   =>  Vector
                                                                    .scalar     (radians)
                                                                    .trig       ()
                                                                    .nestFold   (
                                                                                    (v : Vector) => v
                                                                                                        .reflect(Dimension.X)
                                                                                                        .multiply(this)
                                                                                                        .sum(),
                                                                                    (v : Vector) => v
                                                                                                        .swap()
                                                                                                        .multiply(this)
                                                                                                        .sum()
                                                                                );
    public  clamp           =   (
                                    min     : number = -Infinity, 
                                    max     : number =  Infinity
                                ) => this.map   (
                                                    (x : number) => 
                                                                    Math.min(
                                                                                Math.max(
                                                                                            x, 
                                                                                            min
                                                                                        ), 
                                                                                max
                                                                            )
                                                );
    public  nestFold        =   (   
                                    left    : NestFold, 
                                    right   : NestFold
                                ) => new Vector (
                                                    left(this), 
                                                    right(this)
                                                );
    public  mapWith         =   (
                                    f       : FoldWith, 
                                    vector  : Vector
                                ) => this.foldWith  (
                                                        f, 
                                                        f, 
                                                        vector
                                                    );
    public  foldWith        =   (   
                                    left    : FoldWith, 
                                    right   : FoldWith, 
                                    vector  : Vector
                                ) => new Vector (
                                                    left (this.x, vector.x), 
                                                    right(this.y, vector.y)
                                                );
    public  fold            =   (
                                    left    : Fold, 
                                    right   : Fold
                                ) => new Vector (
                                                    left(this.x), 
                                                    right(this.y)
                                                );
}

export namespace Shapes 
{
    export class Rectangle
    {
        constructor(
            public size     : Vector,
            public position : Vector
        ) 
        {

        }
        getPosition() : Vector 
        {
            return this.position;
        }
        getSize() : Vector 
        {
            return this.size;
        }
    }

    export class Box extends Rectangle 
    {
        constructor(
            public  id        : string,
                    position  : Vector,
                    size      : Vector,
            public  parentId? : string,
        ) {
            super(size, position);
        }
    }
}

```

### src/components/graph.ts

``` ts

/**
 * Generalized abstractions
 * -------------------------------------------------------
 * - NodeConfig: declarative tree of nodes (id, label, children, optional layout override)
 * - LayoutStrategy: computes child positions given a parent position
 * - Renderer: two modes
 *     (A) Graph mode: render each node as a ReactFlow node with edges
 *     (B) Nested mode: project each child inside its parent DOM box
 */

import { 
    Vector 
} from "./geometry";
import { 
    LayoutTypes 
} from "./layout/layout.enum";


export type NodeConfig = 
{
    id          : string;
    label?      : string;
    position?   : Vector;
    children?   : NodeConfig[];
    layout?     : LayoutTypes;
};

export type Node = 
{
    id       : string, 
    data     :  {
                    label : string
                }, 
    position : Vector, 
    style    : React.CSSProperties
};

export type Edge = 
{
    id     : string;
    source : string;
    target : string;
};

```

### src/components/layout/engine/layout.engine.ts

``` ts
import { 
  Shapes,
    Vector 
} from "../../geometry";
import { 
    NodeConfig 
} from "../../graph";
import { 
    LayoutTypes, 
    LayoutChildrenMode 
} from "../layout.enum";
import { LayoutConfigs } from "../layout.registry";
import { 
    Layout, 
    NestedFramesReturn,
    PlaceChildrenReturn
} from "../layout";
import { 
    LayoutTuningConfig 
} from "../layout.tuning";
import { 
    MappedGridItemData 
} from "../strategies/grid/grid.mapped";
import { 
    GridItem 
} from "../strategies/grid/grid";


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
                        currentNodeSize : Vector = nodeSize,
                        parent          : Shapes.Box | undefined = undefined
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
                                                    size,
                                                    parent?.id
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
                                    const item  : GridItem<MappedGridItemData | undefined> = frames.grid.getItem(c.id);
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
                                                                        sz,
                                                                        box.id
                                                                    );
                                    place   (
                                                c, 
                                                level + 1, 
                                                childBox, 
                                                nextNodeSize,
                                                box
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
                                                                                        finalSize,
                                                                                        box.id
                                                                                    );
                                    place   (
                                                c, 
                                                level + 1, 
                                                childBox, 
                                                nextNodeSize,
                                                box
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
                                                                                    currentNodeSize,
                                                                                    box.id
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
                                            currentNodeSize,
                                            box
                                        );
                            }
                        }
                    }

    place   (
                root, 
                0, 
                undefined, 
                nodeSize,
                undefined
            );
    return  { 
                boxes, 
                wires 
            };
};
export const resolveLayoutName = (
    node: NodeConfig,
    fallback: LayoutTypes
): LayoutTypes => node.layout && LayoutConfigs.get<LayoutTypes>(node.layout)
        ? node.layout
        : fallback;

```

### src/components/layout/iterator/iterator.registry.ts

``` ts
import { Config } from "../../config";
import { Iterator } from "./iterator.types";
import { LayoutTypes } from "../layout.enum";
import { buildIterators } from "./layout.iterators";

export interface IteratorRegistry {
  [LayoutTypes.Grid  ]: Iterator;
  [LayoutTypes.Radial]: Iterator;
  // later: [LayoutTypes.Spiral]: Iterator;
}
export const IteratorsConfig = new Config<Record<keyof IteratorRegistry, Iterator>>(buildIterators());

```

### src/components/layout/iterator/iterator.types.ts

``` ts
import { 
    Vector 
} from "../../geometry";
import { 
    LayoutChildrenMode 
} from "../layout.enum";
import { 
    Shapes 
} from "../../geometry";

/** Unit point in [0,1]² (center-based for grid centers). */
export type UnitPoint = Vector;

/** Compute unit point for i-th child among n, given a (cols,rows) heuristic. */
export type UnitIterator =  (
                                i       : number, 
                                n       : number, 
                                rowCol  : Vector
                            ) => UnitPoint;

/** Map a unit point into a concrete rectangle (top-left + size). */
export type RectMapper =    (
                                u       : UnitPoint, 
                                rect    : Shapes.Rectangle
                            ) => Vector;

export type AnchorIteratorParams =
{
    mode        : LayoutChildrenMode;
    parentSize  : Vector;
    spacing     : number;
}
/** Anchor offset for GRAPH placements (tree-below, etc.). */
export type AnchorIterator =    (  
                                    ctx : AnchorIteratorParams
                                ) => Vector;

/** Angle iterator for radial layouts (delegates tuning for start/cw/step). */
export type AngleIterator = (
                                i   : number, 
                                n   : number
                            ) => number;

/** Iterator object = composition of unit/angle + mapping + anchoring. */
export interface IteratorOps 
{
    unit?       : UnitIterator;           // e.g., grid center
    mapToRect?  : RectMapper;        // maps unit → rect coords
    anchor      : AnchorIterator;        // anchor for graph mode
    angle?      : AngleIterator;         // for radial
}

/** Concrete iterator with helpers to derive positions. */
export class Iterator 
{
    constructor (
                    private ops : IteratorOps
                ) 
    {
        
    }

    /** Centers inside rect using unit iterator (grid). */
    centersInRect   (
                        n       : number, 
                        rowCol  : Vector, 
                        rect    : Shapes.Rectangle
                    ) : Vector[] 
    {
        if  (
                    !this.ops.unit 
                ||  !this.ops.mapToRect
            ) 
        {
            return [];
        }
        const res : Vector[] = [];
        for (
                let i : number = 0; 
                i < n; 
                i++
            )
        {
            const u : UnitPoint = this  .ops
                                        .unit   (
                                                    i, 
                                                    n, 
                                                    rowCol
                                                );
            res.push(
                        this.ops.mapToRect  (
                                                u, 
                                                rect
                                            )
                    );
        }
        return res;
    }

    /** Anchored centers for graph mode; caller applies top-left later. */
    anchorOffset(
                    ctx :   { 
                                mode        : LayoutChildrenMode; 
                                parentSize  : Vector; 
                                spacing     : number 
                            }
                ) : Vector 
    {
        return this.ops.anchor(ctx);
    }

    /** Angles for radial iteration. */
    angles  (
                n : number
            ) : number[] 
    {
        if (!this.ops.angle) 
        {
            return [];
        }
        const res : number[] = [];
        for (
                let i : number = 0; 
                i < n; 
                i++
            ) 
            {
                res.push(this.ops.angle(i, n));
            }
        return res;
    }
}

```

### src/components/layout/iterator/layout.iterators.ts

``` ts
import { Shapes, Vector } from "../../geometry";
import { AnchorIteratorParams, Iterator, IteratorOps } from "./iterator.types";
import { LayoutChildrenMode, LayoutTypes } from "../layout.enum";
import { Config } from "../../config";
import { LayoutTuning, LayoutTuningConfig } from "../layout.tuning";

/** map unit [0,1]² → top-left rect (position + u * size). */
export const mapToRect =    (
                                u   : Vector, 
                                r   : Shapes.Rectangle
                            ) : Vector =>
    r
        .getPosition()
        .add(u.multiply(r.getSize()));

/** correct grid centers: ((col+.5)/cols, (row+.5)/rows) */
export const gridUnit = (
                            i       : number, 
                            n       : number, 
                            rowCol  : Vector
                        ) : Vector => 
{
    const coordinates = rowCol.clamp(1, Infinity)
    const cell = new Vector(
        i % coordinates.x,
        Math.floor(i / coordinates.x)
    );
    return cell.add(Vector.scalar(1/2)).divide(coordinates);
};

/** iterator registry */
export type IteratorsSet = 
{
   [LayoutTypes.Grid]    : Iterator;  
   [LayoutTypes.Radial]  : Iterator;
};

export const buildIterators =   (
                                    tuning  : Config<LayoutTuning> = LayoutTuningConfig
                                ) : IteratorsSet => 
{
    const opsGrid: IteratorOps = 
    {
        unit        : gridUnit,
        mapToRect,
        anchor      :   (
                            { 
                                mode, 
                                parentSize, 
                                spacing 
                            }
                        ) =>
            mode === LayoutChildrenMode.GRAPH 
                ? tuning.get("anchor")  (
                                            { 
                                                mode, 
                                                parentSize, 
                                                spacing 
                                            }
                                        ) 
                : new Vector(0, 0),
    };

    const opsRadial : IteratorOps = 
    {
        anchor  :   (
                        { 
                            mode, 
                            parentSize, 
                            spacing 
                        } : AnchorIteratorParams
                    ) : Vector =>
            mode === LayoutChildrenMode.GRAPH ? tuning.get("anchor")(
                                                                        { 
                                                                            mode, 
                                                                            parentSize, 
                                                                            spacing 
                                                                        }
                                                                    ) : new Vector(0, 0),
        angle   :   (
                        i : number, 
                        n : number
                    ) : number => 
        {
            const start : number = tuning.get("startAngle")();
            const cw    : boolean = tuning.get("clockwise")();
            return tuning.get("angleOf")(
                                            i, 
                                            n, 
                                            start, 
                                            cw
                                        );
        },
    };

    return  {
                grid    : new Iterator(opsGrid),
                radial  : new Iterator(opsRadial),
            };
};

/** default singleton */
export const IteratorsConfig = new Config<IteratorsSet>(buildIterators());

```

### src/components/layout/layout.enum.ts

``` ts

export enum LayoutTypes 
{
    Grid    = "grid",
    Radial  = "radial"
}
export enum LayoutChildrenMode 
{
    GRAPH   = "graph",
    NESTED  = "nested"
}

```

### src/components/layout/layout.registry.ts

``` ts
import { 
    Config 
} from "../config";
import { 
    Layout 
} from "./layout";
import { 
    LayoutTypes 
} from "./layout.enum";

export interface LayoutRegistry
{
    [LayoutTypes.Grid   ] : import("./strategies/grid/grid.layout").GridLayout;
    [LayoutTypes.Radial ] : import("./strategies/radial/radial.layout").RadialLayout;
}

export type LayoutKind      = keyof LayoutRegistry;
export const LayoutConfigs  = new Config<Record<LayoutKind, Layout>>(
    {
        [LayoutTypes.Grid   ]   : new (await import("./strategies/grid/grid.layout"  )).GridLayout(),
        [LayoutTypes.Radial ]   : new (await import("./strategies/radial/radial.layout")).RadialLayout(),
    }
);

```

### src/components/layout/layout.ts

``` ts
import { 
    Vector 
} from "../geometry";
import { 
    NodeConfig 
} from "../graph";
import { 
    LayoutChildrenMode 
} from "./layout.enum";
import { 
    MappedGrid 
} from "./strategies/grid/grid.mapped";
export type PreferredSizeParam = 
{
  /* number of direct children */
  count     : number;
  /* node box size used when graph-mode node is rendered (base unit) */
  nodeSize  : Vector;
  /* visual spacing knob */
  spacing   : number;
  /* where the node is being asked to measure for */
  mode      : LayoutChildrenMode; // GRAPH | NESTED
};

/** formerly autosizeParent */
export type PreferredSizeReturn = Vector;

export type NestedFrameParam = 
{
    children      : NodeConfig[];
    parentSize    : Vector;
    spacing       : number;
};
export type NestedFramesReturn = 
{
    ip      : number;
    content : Vector;
    grid    : MappedGrid;
};

export type PlaceChildrenParam = 
{
    mode          : LayoutChildrenMode;
    children      : NodeConfig[];
    parent        : NodeConfig;
    origin        : Vector;
    level         : number;
    nodeSize      : Vector;
    spacing       : number;
    parentSize    : Vector;
};
export type PlaceChildrenReturn = Record<string, Vector>;
export abstract class Layout 
{
    abstract nestedFrames   (args   : NestedFrameParam      )   : NestedFramesReturn;
    abstract placeChildren  (args   : PlaceChildrenParam    )   : PlaceChildrenReturn;
    
    /** Return the layout’s preferred box size ONLY if the node has no externally-allocated size. */
    abstract preferredSize  (args   : PreferredSizeParam    )   : PreferredSizeReturn;
}

```

### src/components/layout/layout.tuning.ts

``` ts
import { 
    Config 
} from "../config";
import { 
    Vector 
} from "../geometry";
import { 
    AnchorIteratorParams 
} from "./iterator.types";
import { 
    LayoutChildrenMode 
} from "./layout.enum";

export type LayoutTuning = 
{
    /* paddings */
    outerPad                :   (spacing: number) => number;     // nested parent content padding
    itemPad                 :   (spacing: number) => number;     // inner cell padding (grid-only)

    /* grid row/col heuristic — return Vector(cols, rows) */
    rowCol                  :   (n: number) => Vector;

    /* anchor for GRAPH placements (tree-below) */
    anchor                  :   (
                                    ctx :   { 
                                                mode        : LayoutChildrenMode; 
                                                parentSize  : Vector; 
                                                spacing     : number 
                                            }
                                ) => Vector;

    /* RADIAL knobs */
    startAngle              :   () => number;                  // radians (0 = 3 o’clock)
    clockwise               :   () => boolean;                 // direction
    angleOf                 :   (
                                    i       : number, 
                                    n       : number, 
                                    start   : number, 
                                    cw      : boolean
                                ) => number;

    /* GRAPH radial radius: r = base(nodeSize, spacing) * (1 + level * levelScale) */
    radialBase              :   (
                                    nodeSize    : Vector, 
                                    spacing     : number
                                ) => number;
    radialLevelScale        :   () => number;
    minRadius               :   () => number;

    /* NESTED radial preferred size if no size is provided (root-only or free): */
    nestedRadialPreferred   :   (
                                    count       : number, 
                                    nodeSize    : Vector, 
                                    spacing     : number) => Vector;
    nestedNodeScale         :   (level: number) => number;  // NEW
    nestedContainerScale    :   (level: number) => number;   // NEW
    nestedChildMaxFraction  :   () => number;        // NEW: cap child box vs parent inner (radial nested)
};

export const defaultTuning : LayoutTuning = 
{
    outerPad: (s :  number) : number => Math.max(0, Math.round(s * 1.0)),
    itemPad : (s :  number) : number => Math.max(0, Math.round(s * 0.25)),

    rowCol: (n :  number) : Vector => {
        const rows : number = Math.ceil(Math.sqrt(Math.max(1, n)));
        const cols : number = Math.ceil(n / rows);
        return new Vector(cols, rows);
    },

    anchor: ({ mode, parentSize, spacing } : AnchorIteratorParams) : Vector =>
        mode === LayoutChildrenMode.GRAPH
            ? new Vector(0, (parentSize?.y ?? 0) / 2 + spacing * 1.25)
            : new Vector(0, 0),

    startAngle  : () : number => 0,
    clockwise   : () : boolean => true,
    angleOf     : 
                (  
                    i       : number, 
                    n       : number, 
                    start   : number, 
                    cw      : boolean
                ) : number => 
        start + (cw ? 1 : -1) * (i / Math.max(1, n)) * Math.PI * 2,

    radialBase              :   (
                                    nodeSize    : Vector, 
                                    spacing     : number
                                ) : number => nodeSize.max() + spacing * 3, // was “*3”
    radialLevelScale        :   () => 0.6,                                      // was “0.6”
    minRadius               :   () => 8,

    nestedNodeScale         :   (level : number) : number => Math.pow(0.85, level + 1), // NEW: ~15% smaller per depth
    nestedContainerScale    :   (level : number) : number => Math.pow(0.85, level + 1),
    // sensible default: grows gently with child count
    nestedRadialPreferred   :   (
                                    count       : number, 
                                    nodeSize    : Vector, 
                                    spacing     : number
                                ) : Vector => 
    {
        const ring  : number = Math.max(1, count);
        const r     : number = Math.max (   
                                            nodeSize.max() + spacing * 2, 
                                            nodeSize.max() * (1 + 0.15 * ring)
                                        );
        const d     : number = 2 * r + 2 * Math.max(12, spacing * 1.0);
        return Vector.scalar(d);
    },
    nestedChildMaxFraction: () => 0.45,                    // child’s longest side <= 45% of parent
};

export const LayoutTuningConfig = new Config<LayoutTuning>(defaultTuning);

```

### src/components/layout/strategies/grid/grid.layout.ts

``` ts
import { 
    Vector, 
    Shapes 
} from "../../../geometry";
import {
    Layout, 
    NestedFrameParam, 
    PlaceChildrenReturn, 
    PreferredSizeParam,
    NestedFramesReturn, 
    PreferredSizeReturn, 
    PlaceChildrenParam
} from "../../layout";
import { 
    LayoutChildrenMode, 
    LayoutTypes
} from "../../layout.enum";
import { 
    MappedGrid, 
    MappedGridItemData 
} from "./grid.mapped";
import { 
    GridItem 
} from "./grid";
import { 
    Config 
} from "../../../config";
import { 
    LayoutTuning, 
    LayoutTuningConfig 
} from "../../layout.tuning";
import { 
    IteratorsConfig, 
    IteratorsSet 
} from "../../iterator/layout.iterators";
import { 
    mapIndex 
} from "../radial/radial.layout";

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


export  class   GridLayout 
        extends Layout 
{
    constructor(
        private tuning : Config<LayoutTuning> = LayoutTuningConfig,
        private iters  : Config<IteratorsSet> = IteratorsConfig
    ) 
    { 
        super(); 
    }
    nestedFrames =  (
                        { 
                            children, 
                            parentSize, 
                            spacing 
                        } : NestedFrameParam
                    ) 
                    : NestedFramesReturn => 
    {
        const gridSize : Vector = this.tuning.get("rowCol" )(children.length); // Vector(cols, rows)
        const ip       : number = this.tuning.get("itemPad")(spacing);

        // Inner content (tessellated space)
        const content : Vector = 
            parentSize
                .round   ()
                .clamp   (1, Infinity);

        // Perfect integer subdivision with remainder distribution
        const X : SplitEvenReturn = splitEven(content.x, gridSize.x);
        const Y : SplitEvenReturn = splitEven(content.y, gridSize.y);

        const grid : MappedGrid = MappedGrid.emptyMapped<MappedGridItemData>(
            gridSize,
            () => ({ id: '' })
        );
        for (let i : number = 0; i < children.length; i++) 
        {
            const cell : Vector = new Vector(
                i % gridSize.x,
                Math.floor(i / gridSize.x)
            );
            const position : Vector = new Vector(X.offs [cell.x], Y.offs [cell.y]);
            const size     : Vector = new Vector(X.sizes[cell.x], Y.sizes[cell.y]);
            grid.set(
                cell, 
                new GridItem<MappedGridItemData>(
                    cell, 
                    new Shapes.Rectangle(size, position), 
                    { 
                        id : children[i].id 
                    }
                )
            );
        }
        return  {
                    ip,
                    content,
                    grid, // outer grid cells
                };
    }

    placeChildren = (
                        args : PlaceChildrenParam
                    ) 
                    : PlaceChildrenReturn => 
    {
        const   { 
                    children, 
                    nodeSize, 
                    spacing, 
                    origin, 
                    parentSize, 
                    mode
                } : PlaceChildrenParam = args;
        const rowCol : Vector = this.tuning.get("rowCol")(children.length);
        const ip     : number = this.tuning.get("itemPad")(spacing);
        const anchor : Vector = this.iters
                                    .get(LayoutTypes.Grid)
                                    .anchorOffset   (
                                                        { 
                                                            mode, 
                                                            parentSize, 
                                                            spacing 
                                                        }
                                                    );
        switch(args.mode)
        {
            case LayoutChildrenMode.GRAPH:
                // GRAPH: logical cell = node + 2*itemPad; anchor below parent
                const cell    : Vector = nodeSize.add(Vector.scalar(2 * ip));
                const total   : Vector = rowCol.multiply(cell);
                const topLeft : Vector = origin
                                            .add(anchor)
                                            .subtract(total.halve());
                return Object
                        .fromEntries(
                            mapIndex(
                                children.length,
                                (i : number) => [
                                    children[i].id,
                                    topLeft
                                        .add    (
                                                    cell
                                                        .multiply   (
                                                                        new Vector  (
                                                                                        i % rowCol.x, 
                                                                                        Math.floor(i / rowCol.x)
                                                                                    )
                                                                    )
                                                )
                                        .add    (cell.halve())
                                        .round  ()
                                ]
                            )
                        );
            case LayoutChildrenMode.NESTED:
                const rect = new Shapes.Rectangle   (
                                                        parentSize, 
                                                        new Vector(0,0)
                                                    );
                const centers = this.iters
                                    .get(LayoutTypes.Grid)
                                    .centersInRect  (
                                                        children.length, 
                                                        rowCol, 
                                                        rect
                                                    );
                return Object
                        .fromEntries(
                                        children
                                        .map(
                                                (c, i) => 
                                                    [
                                                        c.id, 
                                                        centers[i]
                                                    ]
                                            )
                                    );
        }
    };
    preferredSize = (
                        { 
                            count, 
                            nodeSize, 
                            spacing, 
                            mode 
                        } : PreferredSizeParam
                    ) : PreferredSizeReturn => 
    {
        // grid preferred size = exact cells for nodeSize + itemPad, plus outerPad
        const rowCol    : Vector = this.tuning.get("rowCol")(count);
        const ip        : number = this.tuning.get("itemPad")(spacing);
        const pad       : number = this.tuning.get("outerPad")(spacing);
        const cell      : Vector = nodeSize.add(Vector.scalar(2 * ip));
        const inner     : Vector = rowCol.multiply(cell);
        return inner.add(Vector.scalar(2 * pad));
    };
    
}
```

### src/components/layout/strategies/grid/grid.mapped.ts

``` ts
import { 
    Shapes,
    Vector 
} from "../../../geometry";
import { 
    Grid, 
    GridItem 
} from "./grid";

export type MappedGridItemID = string;
export type MappedGridItemData = 
{
    id : MappedGridItemID;
};
export type MappedGridItemDataType = MappedGridItemData;
export  class   MappedGrid<T extends MappedGridItemDataType = MappedGridItemDataType> 
        extends Grid<T>
{
    static emptyMapped<T extends MappedGridItemDataType>(
        size : Vector,
        factory : () => T
    ) : MappedGrid<T> {
        return new MappedGrid<T>(
            size,
            Array
                .from(
                    { 
                        length : size.y 
                    }, 
                    () => Array
                            .from(
                                { 
                                    length : size.x 
                                }, 
                                () => new GridItem<T>(
                                                        new Vector(0, 0), 
                                                        new Shapes.Rectangle(
                                                                                new Vector(0, 0), 
                                                                                new Vector(0, 0)
                                                                            ),
                                                            factory()
                                                        )
                            )
                )
        )
    }
    protected map : Map<MappedGridItemID, Vector> = new Map();
    override set =  (   
                        cell : Vector, 
                        item : GridItem<T>
                    ) : void => 
    {
        this.grid[cell.y][cell.x] = item;
        this.map.set(item.data.id, cell);
    }
    getCell =   (
                    id : MappedGridItemID
                ) : Vector | undefined => 
                    this.map.get(id);
    getItem =   (
                    id : MappedGridItemID
                ) : GridItem<T | undefined> => 
    {
        const cell : Vector | undefined = this.getCell(id);
        if (!cell) 
        {
            throw new Error(`Cell not found for item ID: ${id}`);
        }
        return this.grid[cell.y][cell.x];
    }
}

 
```

### src/components/layout/strategies/grid/grid.ts

``` ts
import { 
    Vector, 
    Shapes 
} from "../../../geometry";
export class GridItem<T> 
{
    constructor(
        public cell       : Vector,
        public dimensions : Shapes.Rectangle,
        public data       : T
    ) 
    { 

    }
}


export class Grid<T> 
{
    static empty<T>(
        size : Vector,
        factory : (
            x : number,
            y : number
        ) => T
    ) : Grid<T>{
        return new Grid<T>(
            size,
            Array
                .from(
                    { 
                        length : size.y 
                    }, 
                    (
                        y : number
                    ) => Array
                            .from(
                                { 
                                    length : size.x 
                                }, 
                                (
                                    x : number
                                ) => new GridItem<T>(
                                                        new Vector(0, 0), 
                                                        new Shapes.Rectangle(
                                                                                new Vector(0, 0), 
                                                                                new Vector(0, 0)
                                                                            ),
                                                        factory(x, y)
                                                    )
                            )
                )
        )
    }
    constructor(
        public size : Vector,
        public grid : GridItem<T>[][]
    ) 
    {}
    set =   (
                cell : Vector, 
                item : GridItem<T>
            ) 
            : void =>
                void (this.grid[cell.y][cell.x] = item);
    get =   (
                cell : Vector
            ) 
            : GridItem<T | undefined> => 
                this.grid[cell.y][cell.x];
}

```

### src/components/layout/strategies/radial/radial.layout.ts

``` ts
import { 
    Vector 
} from "../../../geometry";
import {
    PreferredSizeParam, 
    PreferredSizeReturn,
    Layout, 
    PlaceChildrenReturn, 
    PlaceChildrenParam, 
    NestedFramesReturn
} from "../../layout";
import { 
    LayoutChildrenMode 
} from "../../layout.enum";
import { 
    MappedGrid 
} from "../grid/grid.mapped";
import { 
    Config 
} from "../../../config";
import { 
    LayoutTuning, 
    LayoutTuningConfig 
} from "../../layout.tuning";

export  class   RadialLayout 
        extends Layout 
{
    constructor(private tuning: Config<LayoutTuning> = LayoutTuningConfig) 
    {
        super();
    }
    nestedFrames    =   () 
                        : NestedFramesReturn => (
                                                    {
                                                        ip      : 0,
                                                        content : new Vector(0, 0),
                                                        grid    : MappedGrid
                                                                    .emptyMapped(
                                                                                    new Vector(0, 0), 
                                                                                    () => ({ id: '' })
                                                                                )
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
    const base  : number    = tuning.get("radialBase")(nodeSize, spacing);
    const r     : number    = Math.max  (
                                            tuning.get("minRadius")(), 
                                            base *  (1 + level * tuning.get("radialLevelScale")())
                                        );

    const a     : Vector    = tuning.get("anchor")  (
                                                        { 
                                                            mode    : LayoutChildrenMode.GRAPH, 
                                                            parentSize, 
                                                            spacing 
                                                        }
                                                    );
    const c     : Vector    = origin.add(a);

    const start : number    = tuning.get("startAngle")();
    const cw    : boolean   = tuning.get("clockwise")();
    return  Object
                .fromEntries(
                    mapIndex(children.length,
                                ( 
                                    i : number
                                ) =>  
                                        [
                                            children[i].id, 
                                            Vector
                                                .scalar (tuning.get("angleOf")  (
                                                                                    i, 
                                                                                    children.length, 
                                                                                    start, 
                                                                                    cw
                                                                                )
                                                        )
                                                .trig   ( )
                                                .scale  (r)
                                                .add    (c)
                                                .round  ( )
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


```

### src/components/math.ts

``` ts
/* ---------- Functional helpers ---------- */
export const ceilSqrt   = (n : number            ) : number => Math.ceil(Math.sqrt(Math.max(1, n)));
export const add        = (a : number, b : number) : number => a + b;
export const subtract   = (a : number, b : number) : number => a - b;
export const multiply   = (a : number, b : number) : number => a * b;
export const divide     = (a : number, b : number) : number => a / b;
```

### src/components/ParentChildFlow.tsx

``` tsx
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
} from "./layout/engine/layout.engine";
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
```

### src/components/ui/Configurator.tsx

``` tsx
import { 
  JSX, 
  useMemo 
} from "react";
import { 
  Segmented, 
  Select, 
  SelectOption
} from "./controls";
import { 
  NodeConfig 
} from "../graph";
import { 
  LayoutChildrenMode, 
  LayoutTypes 
} from "../layout/layout.enum";
import { 
  ModeMap 
} from "../engine/layout.engine";

type Scope = "all" | string;


export type CollectReturn = 
{
  ids   : string[];
  byId  : Record<string, NodeConfig>;
}
const collect = (
                    root : NodeConfig
                ) : CollectReturn => 
{
    const ids   : string[] = [];
    const byId  : Record<string, NodeConfig> = {};
    const walk  =   (
                        n : NodeConfig
                    ) : void => 
                        {
                            ids.push(n.id); 
                            byId[n.id] = n;
                            (n.children ?? [])
                                .forEach(walk);
                        }
    walk(root);
    return  { 
                ids, 
                byId 
            };
}
const subtreeIds =  (
                        byId    : Record<string, NodeConfig>, 
                        start   : string
                    ) : string[] => 
{
    const res : string[] = [];
    const walk =    (
                        n : NodeConfig
                    ) : void => 
                        {
                            res.push(n.id);
                            (n.children ?? [])
                                .forEach(walk);
                        }
    walk(byId[start]);
    return res;
}
export type ConfiguratorProps = 
{
    root                : NodeConfig;
    modes               : ModeMap;
    setModes            : (f: (prev: ModeMap) => ModeMap) => void;
    layout              : LayoutTypes;
    setLayout           : (l: LayoutTypes) => void;
    scope               : Scope;
    setScope            : (s: Scope) => void;
    applyToSubtree      : boolean;
    setApplyToSubtree   : (v: boolean) => void;
}
                        
export const Configurator = (
                                {
                                    root, 
                                    modes, 
                                    setModes, 
                                    layout, 
                                    setLayout, 
                                    scope, 
                                    setScope,
                                    applyToSubtree, 
                                    setApplyToSubtree
                                } : ConfiguratorProps
                            ) : JSX.Element => 
{
    const { ids, byId } : CollectReturn = useMemo(() => collect(root), [root]);

    const targetIds = useMemo   (
                                    () => 
                                    {
                                        if (scope === "all") 
                                        {
                                            return ids;
                                        }
                                        return applyToSubtree 
                                                ? subtreeIds(byId, scope) 
                                                : [scope];
                                    }, 
                                    [
                                        ids, 
                                        byId, 
                                        scope, 
                                        applyToSubtree
                                    ]
                                );

    const modeOptions   :   { label : string  ; value : LayoutChildrenMode        }[] = 
                        [
                            { label : "Graph" , value : LayoutChildrenMode.GRAPH  },
                            { label : "Nested", value : LayoutChildrenMode.NESTED },
                        ];
    const layoutOptions :   { label : string  ; value : LayoutTypes               }[] = 
                        [
                            { label : "Grid"  , value : LayoutTypes.Grid          },
                            { label : "Radial", value : LayoutTypes.Radial        },    
                        ];

    const currentModes  : LayoutChildrenMode[]              = targetIds
                                                                .map(
                                                                        (
                                                                            id : string
                                                                        ) : LayoutChildrenMode => 
                                                                            modes[id] ?? LayoutChildrenMode.GRAPH
                                                                    );
    const allSame       : boolean                           = currentModes
                                                                .every  (
                                                                            (
                                                                                m : LayoutChildrenMode
                                                                            ) : boolean => 
                                                                                m === currentModes[0]
                                                                        );
    const activeMode    : LayoutChildrenMode | undefined    = allSame 
                                                                ? currentModes[0] 
                                                                : undefined;

    const OuterStyle : React.CSSProperties = 
    {
        display     : "inline-flex",
        gap         : 12,
        alignItems  : "center"
    };

    const CheckBoxStyle : React.CSSProperties =
    {
        fontSize: 12
    }

    const SelectOptions : SelectOption<string>[] =
    [
        {
            label: "All nodes",
            value: "all"
        },
        ...ids.map  (
                        (id : string) : SelectOption<string> => 
                            (
                                { 
                                    label   : id, 
                                    value   : id 
                                }
                            )
                    )
    ];
    const onSelectChange    =   (
                                    v : string
                                ) : void => 
                                    setScope(v as Scope);

    const onCheckBoxChange  =   (
                                    e : React.ChangeEvent<HTMLInputElement>
                                ) : void => 
                                    setApplyToSubtree(e.target.checked);

    const onLayoutChange    =   (
                                    v : string
                                ) : void => 
                                    setLayout(v as LayoutTypes);
    const onModeChange      =   (
                                    v : string | undefined
                                ) : void => 
                                    setModes(
                                                (
                                                    prev : Record<string, LayoutChildrenMode>
                                                ) : Record<string, LayoutChildrenMode> => 
                                                {
                                                    const next : Record<string, LayoutChildrenMode> =   { 
                                                                                                            ...prev 
                                                                                                        };
                                                    for (const id of targetIds) 
                                                    {
                                                        next[id] = v as LayoutChildrenMode;
                                                    }
                                                    return next;
                                                }
                                            );
    return (
        <div style = {OuterStyle}>
            <Select
                label       =   "Edit"
                value       =   {scope          }
                onChange    =   {onSelectChange }
                options     =   {SelectOptions  }
            />
            <label style = {CheckBoxStyle}>
                <input 
                    type        =   "checkbox" 
                    checked     =   {applyToSubtree     } 
                    onChange    =   {onCheckBoxChange   } 
                /> Apply to subtree
            </label>


            {/* Segmented control for mode */}
            <Segmented
                label       =   "Layout"
                value       =   {layout         }
                options     =   {layoutOptions  }
                onChange    =   {onLayoutChange }
            />
    
            <Segmented<string | undefined>
                label       =   "Mode"
                value       =   {allSame 
                                    ? activeMode
                                    : undefined }
                options     =   {modeOptions    }
                onChange    =   {onModeChange   }
            />
        </div>
    );
}

```

### src/components/ui/controls.tsx

``` tsx
import { 
  JSX 
} from "react";

export type SelectOption<T> =
{
    label     : string;
    value     : T;
    disabled? : boolean;
}
/* ---------- Segmented (general) ---------- */
export type SelectionProps<T> = 
{
    label     : string;
    options   : SelectOption<T>[];
    onChange  : (v : T) => void;
    value     : T;
}
export function Segmented<T>(
                                {
                                    label,
                                    options,
                                    onChange,
                                    value
                                } : SelectionProps<T>
                            ) : JSX.Element 
{
    const labelToValue = new Map<string, T>(options.map((o : SelectOption<T>) : [string, T] => [o.label, o.value]));
    const valueToLabel = new Map<T, string>(options.map((o : SelectOption<T>) : [T, string] => [o.value, o.label]));

    const OuterStyle : React.CSSProperties = 
    {
        display     : "inline-flex",
        alignItems  : "center",
        gap         : 8,
        marginRight : 12
    };
    const OuterLabelStyle : React.CSSProperties =
    {
        fontSize : 12
    }
    const TabListStyle : React.CSSProperties =
    {
        display       : "inline-flex",
        border        : "1px solid #d0d7de",
        borderRadius  : 8,
        overflow      : "hidden"
    };

    const OptionStyle = (o : SelectOption<T>, selected : boolean) : React.CSSProperties =>
    {
        return {
            padding      : "6px 10px",
            fontSize     : 12,
            border       : "none",
            background   : selected ? "#111827" : "#fff",
            color        : selected ? "#fff" : "#111827",
            cursor       : o.disabled ? "not-allowed" : "pointer",
            opacity      : o.disabled ? 0.5 : 1,
        };
    };

    return (
        <div style = {OuterStyle}>
            <span style = {OuterLabelStyle}>
                {label}
            </span>
            <div
                role        =   "tablist"
                aria-label  =   {label          }
                style       =   {TabListStyle   }
            >
                {
                    options.map (
                                    (o : SelectOption<T>) : JSX.Element => 
                                    {
                                        const selected : boolean = value === o.value;
                                        return (
                                            <button
                                                key             =   {o.label + Math.random().toString(16)   }
                                                role            =   "tab"
                                                aria-selected   =   {selected                               }
                                                disabled        =   {o.disabled                             }
                                                onClick         =   {() => onChange(o.value)                }
                                                style           =   {OptionStyle(o, selected)               }
                                            >
                                                {o.label}
                                            </button>
                                        );
                                    }
                    )
                }
            </div>
        </div>
    );
}

/* ---------- Select (keep for node scope) ---------- */
export function Select<T>   (
                                {
                                    label, 
                                    onChange, 
                                    options, 
                                    value
                                } : SelectionProps<T>
                            ) : JSX.Element 
{
    const labelToValue : Map<string, T> = new Map<string, T>(options.map((o : SelectOption<T>) : [string, T] => [o.label, o.value]));
    const valueToLabel : Map<T, string> = new Map<T, string>(options.map((o : SelectOption<T>) : [T, string] => [o.value, o.label]));
    
    const OuterStyle : React.CSSProperties =
    {
        display       : "inline-flex",
        alignItems    : "center",
        marginRight   : 12
    };

    const OuterLabelStyle : React.CSSProperties =
    {
        marginRight   : 8,
        fontSize      : 12
    };

    const SelectOnChange =  (
                                e : React.ChangeEvent<HTMLSelectElement>
                            ) : void =>
    {
        onChange(labelToValue.get(e.target.value)!);
    };

    return (
        <div style = {OuterStyle}>
            <label style = {OuterLabelStyle}>
                {label}
            </label>
            <select 
                value       =   {valueToLabel.get(value)!   } 
                onChange    =   {SelectOnChange             }
            >
                {
                    options
                        .map(   
                                (
                                    o : SelectOption<T>
                                ) : JSX.Element => 
                                    (
                                        <option 
                                            key         =   {o.label + Math.random().toString(16)} 
                                            value       =   {o.label} 
                                            disabled    =   {o.disabled}
                                        >
                                            {o.label}
                                        </option>
                                    )
                        )
                }
            </select>
        </div>
    );
}

/* ---------- Slider ---------- */

export type LabeledSliderProps = 
    Omit<SelectionProps<number>, 'options'> 
&   {
        min         : number;
        max         : number;
        step?       : number;
        disabled?   : boolean;
    };

export const LabeledSlider =    (
                                    {
                                        label, 
                                        value, 
                                        min, 
                                        max, 
                                        step = 1, 
                                        onChange, 
                                        disabled = false
                                    } : LabeledSliderProps
                                ) : JSX.Element => 
{
    const OuterStyle : React.CSSProperties =
    {
        display       : "inline-flex",
        alignItems    : "center",
        margin        : "0 12px",
        opacity       : disabled ? 0.5 : 1
    };
    const OuterLabelStyle : React.CSSProperties =
    {
        marginRight   : 8,
        fontSize      : 12
    };
    const InnerStyle : React.CSSProperties =
    {
        marginLeft    : 8,
        fontSize      : 12
    };

    const OnChange =    (
                            e : React.ChangeEvent<HTMLInputElement>
                        ) : void => 
    {
        onChange(parseInt(e.target.value, 10));
    };
    return  (
                <div style = {OuterStyle}>
                    <label style = {OuterLabelStyle}>
                        {label}
                    </label>
                    <input
                        type        =   "range" 
                        min         =   {min        } 
                        max         =   {max        } 
                        step        =   {step       } 
                        value       =   {value      } 
                        disabled    =   {disabled   }
                        onChange    =   {OnChange   }
                    />
                    <span style = {InnerStyle}>
                        {value}
                    </span>
                </div>
            );
}

```

### src/components/ui/styles.ts

``` ts
export type ShellStyles = 
{
    outer   : React.CSSProperties;
    bar     : React.CSSProperties;
    left    : React.CSSProperties;
    right   : React.CSSProperties;
    title   : React.CSSProperties;
    rf      : React.CSSProperties;
};

export const Shell : ShellStyles = 
{
    outer   :   { 
                    position    : "relative", 
                    width       : "100vw", 
                    height      : "100vh", 
                    overflow    : "hidden" 
                },
    bar     :   {
                    position        : "absolute", 
                    left            : 0, 
                    top             : 0, 
                    width           : "100%", 
                    height          : 72,
                    background      : "#f6f8fa", 
                    borderBottom    : "1px solid #d0d7de", 
                    zIndex          : 1000, 
                    padding         : 8, 
                    boxSizing       : "border-box"
    },
    left    :   {
                    position    : "absolute", 
                    left        : 0, 
                    top         : 72, 
                    bottom      : 0, 
                    width       : "50%", 
                    borderRight : "1px solid #e5e7eb",
                    boxSizing   : "border-box"
                },
    right   :   {
                    position    : "absolute", 
                    left        : "50%", 
                    right       : 0, 
                    top         : 72, 
                    bottom      : 0, 
                    overflow    : "auto", 
                    boxSizing   : "border-box"
                },
    title   :   { 
                    position    : "absolute", 
                    left        : 8, 
                    top         : 8, 
                    fontSize    : 11, 
                    color       : "#64748b", 
                    zIndex      : 1 
                },
    rf      :   { 
                    position    : "absolute", 
                    left        : 0, 
                    right       : 0, 
                    top         : 0, 
                    bottom      : 0 
                },
};

```

