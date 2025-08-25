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
