# Source Catalog (TypeScript)

Generated on 2025-08-25T01:50:00.046Z

## Directory structure (src)

```
├── assets/

├── components/
│   ├── adapters/
│   │   ├── ports/
│   │   │   ├── api/
│   │   │   │   └── api.adapter.ts
│   │   │   ├── react/
│   │   │   │   ├── canvas.react.adapter.tsx
│   │   │   │   ├── dom.react.adapter.tsx
│   │   │   │   ├── react-flow.react.adapter.ts
│   │   │   │   ├── react-three-fiber.react.adapter.tsx
│   │   │   │   └── react-view.adapter.tsx
│   │   │   ├── vanilla/
│   │   │   │   ├── canvas.vanilla.ts
│   │   │   │   ├── dom.vanilla.adapter.ts
│   │   │   │   └── threejs.vanilla.adapter.ts
│   │   │   └── ports.ts
│   │   ├── targets/
│   │   │   └── canvas.core.ts
│   │   ├── env.ts
│   │   ├── factory.ts
│   │   └── theme.ts
│   ├── iteration/
│   │   ├── iterate.ts
│   │   └── iteration.limits.ts
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
│   ├── playground/
│   │   └── controller.ts
│   ├── ui/
│   │   ├── Configurator.tsx
│   │   ├── controls.tsx
│   │   └── styles.ts
│   ├── brand.ts
│   ├── class.types.ts
│   ├── config.ts
│   ├── errors.ts
│   ├── geometry.sanity.test.ts
│   ├── geometry.ts
│   ├── graph.ts
│   ├── logging.ts
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
// factory.ts
// - Adds makeTargetAdapter returning the new TargetAdapter using PortKind
// - Keeps existing getAdapter/makeRenderer exports for backwards-compat

import React, { JSX, ReactElement } from "react";
import { AdapterConfig, Framework, Target } from "./env";
import { runLayoutAPI, RunLayoutApiInput } from "./ports/api/api.adapter";
import { Canvas2D, Canvas2DProps } from "./ports/react/canvas.react.adapter";
import { AbsoluteDOM, AbsoluteDOMProps } from "./ports/react/dom.react.adapter";
import { LayoutView, ReactAdapterProps } from "./ports/react/react-view.adapter";
import { CanvasMount, mountCanvas2D } from "./ports/vanilla/canvas.vanilla";
import { DOMMount, mountAbsoluteDOM } from "./ports/vanilla/dom.vanilla.adapter";
import { LayoutResultEx } from "../layout/engine/layout.engine";
import { PortKind, TargetAdapter as NewTargetAdapter } from "./ports/ports";

// --- legacy Renderer + factories (unchanged API) -----------------------------

export type Renderer =
  | { kind: Target.API }
  | { kind: Target.DOM }
  | { kind: Target.Canvas }
  | { kind: Framework.React; Component: React.ComponentType<any> }
  | { kind: Target.ReactFlow; Component: React.ComponentType<any> };

export const makeRenderer = (target: Target): Renderer => {
  switch (target) {
    case Target.API:
      return { kind: Target.API };
    case Target.DOM:
      return { kind: Target.DOM };
    case Target.Canvas:
      return { kind: Target.Canvas };
    case Target.ReactFlow:
      return { kind: Target.ReactFlow, Component: LayoutView };
    case Target.ThreeJS:
    default:
      return { kind: Framework.React, Component: LayoutView };
  }
};

export type GetAdapterReturnRunLayoutAPI = {
  kind: Target.API;
  run: (input: RunLayoutApiInput) => LayoutResultEx;
};

export type GetAdapterReturnReact = {
  kind: Framework.React;
  render: (props: Canvas2DProps) => ReactElement;
};

export type GetAdapterReturnVanillaCanvas = {
  kind: Target.Canvas;
  mount: (container: HTMLElement, initial: LayoutResultEx) => CanvasMount;
};

export type GetAdapterReturnVanillaDOM = {
  kind: Target.DOM;
  mount: (container: HTMLElement, initial: LayoutResultEx) => DOMMount;
};

export type GetAdapterReturnReactFlow = {
  kind: Target.ReactFlow;
  render: (props: ReactAdapterProps) => ReactElement;
};

export type GetAdapterReturn =
  | GetAdapterReturnRunLayoutAPI
  | GetAdapterReturnReact
  | GetAdapterReturnVanillaCanvas
  | GetAdapterReturnVanillaDOM
  | GetAdapterReturnReactFlow;

export const getAdapter = (cfg: AdapterConfig): GetAdapterReturn => {
  switch (cfg.target) {
    case Target.API:
      return { kind: Target.API, run: runLayoutAPI };

    case Target.Canvas:
      if (cfg.framework === Framework.React) {
        return {
          kind: Framework.React,
          render: (props: Canvas2DProps): ReactElement => React.createElement(Canvas2D, props),
        };
      } else {
        return { kind: Target.Canvas, mount: mountCanvas2D };
      }

    case Target.DOM:
      if (cfg.framework === Framework.React) {
        return {
          kind: Framework.React,
          render: (props: AbsoluteDOMProps): JSX.Element => React.createElement(AbsoluteDOM, props),
        };
      } else {
        return { kind: Target.DOM, mount: mountAbsoluteDOM };
      }

    case Target.ReactFlow:
      return {
        kind: Target.ReactFlow,
        render: (props: ReactAdapterProps): JSX.Element =>
          React.createElement(LayoutView, { ...props, kind: Target.ReactFlow }),
      };

    case Target.ThreeJS:
      throw new Error("ThreeJS adapter not implemented yet.");

    default:
      throw new Error(`Unsupported target: ${cfg.target}`);
  }
};

// --- NEW: clean TargetAdapter using PortKind --------------------------------

export function makeTargetAdapter(cfg: AdapterConfig): NewTargetAdapter {
  switch (cfg.target) {
    case Target.API:
      return {
        target: Target.API,
        port: { kind: PortKind.API, run: runLayoutAPI },
      };
    case Target.DOM:
      if (cfg.framework === Framework.React) {
        return {
          target: Target.DOM,
          port: { kind: PortKind.React, component: AbsoluteDOM },
        };
      } else {
        return {
          target: Target.DOM,
          port: {
            kind: PortKind.Vanilla,
            mount: (container, initial) => mountAbsoluteDOM(container, initial),
          },
        };
      }
    case Target.Canvas:
      if (cfg.framework === Framework.React) {
        return {
          target: Target.Canvas,
          port: { kind: PortKind.React, component: Canvas2D },
        };
      } else {
        return {
          target: Target.Canvas,
          port: {
            kind: PortKind.Vanilla,
            mount: (container, initial) => mountCanvas2D(container, initial),
          },
        };
      }
    case Target.ReactFlow:
      return {
        target: Target.ReactFlow,
        port: { kind: PortKind.React, component: LayoutView },
      };
    default:
      throw new Error(`Unsupported target: ${cfg.target}`);
  }
}

```

### src/components/adapters/ports/api/api.adapter.ts

``` ts
import { LayoutResultEx, ModeMap, LayoutEngine } from "../../../layout/engine/layout.engine";
import { Vector } from "../../../geometry";
import { NodeConfig } from "../../../graph";

export type RunLayoutApiInput = {
  root: NodeConfig;
  modes: ModeMap;
  nodeSize: Vector;
  spacing: number;
};

const engine = new LayoutEngine();

export const runLayoutAPI = ({ root, modes, nodeSize, spacing }: RunLayoutApiInput): LayoutResultEx =>
  engine.compute({ root, modes, nodeSize, spacing });

```

### src/components/adapters/ports/ports.ts

``` ts
// ports.ts
// - Cleanly separates PortKind from Target
// - No magic string literals in your codebase

import React from "react";
import { RunLayoutApiInput } from "./api/api.adapter";
import { LayoutResultEx } from "../../layout/engine/layout.engine";
import { Target } from "../env";

export enum PortKind {
  API = "api",
  React = "react",
  Vanilla = "vanilla",
}

export type ApiPort = { kind: PortKind.API; run: (input: RunLayoutApiInput) => LayoutResultEx };
export type ReactPort = { kind: PortKind.React; component: React.ComponentType<any> };
export type VanillaPort = {
  kind: PortKind.Vanilla;
  mount: (
    container: HTMLElement,
    initial: LayoutResultEx
  ) => { update(r: LayoutResultEx): void; destroy(): void };
};

export type Port = ApiPort | ReactPort | VanillaPort;

export type TargetAdapter =
  | { target: Target.API; port: ApiPort }
  | { target: Target.DOM | Target.Canvas | Target.ReactFlow; port: ReactPort | VanillaPort };

```

### src/components/adapters/ports/react/canvas.react.adapter.tsx

``` tsx
import { JSX, useEffect, useRef } from "react";
import { LayoutResult } from "../../../layout/engine/layout.engine";
import { Theme, defaultTheme } from "../../theme";
import { CanvasRenderer2D } from "../../targets/canvas.core";

export type Canvas2DProps = {
  result: LayoutResult;
  theme?: Theme;
  /** enable partial redraw when new results come in */
  partial?: boolean;
};

export const Canvas2D = ({ result, theme = defaultTheme, partial = true }: Canvas2DProps): JSX.Element => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer2D | null>(null);

  const resizeAndRedraw = (parent: HTMLElement, cvs: HTMLCanvasElement): void => {
    const dpr = Math.max(1, (window.devicePixelRatio as number) || 1);
    const rect = parent.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (cvs.width !== w || cvs.height !== h) {
      cvs.width = w; cvs.height = h;
      const ctx = cvs.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // after size change, do a full draw to avoid artifacts
      rendererRef.current?.fullDraw(result);
    }
  };

  useEffect(() => {
    const cvs = ref.current!;
    const parent = cvs.parentElement!;
    // initial DPR + renderer
    const dpr = Math.max(1, (window.devicePixelRatio as number) || 1);
    const rect = parent.getBoundingClientRect();
    cvs.width = Math.max(1, Math.round(rect.width * dpr));
    cvs.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = cvs.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    rendererRef.current = new CanvasRenderer2D(cvs, theme);
    rendererRef.current.fullDraw(result);

    const ro = new ResizeObserver(() => resizeAndRedraw(parent, cvs));
    ro.observe(parent);

    return () => {
      ro.disconnect();
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount once

  // theme/result updates
  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.setTheme(theme);
    rendererRef.current.update(result, { partial });
  }, [result, theme, partial]);

  return (
    <canvas
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      ref={ref}
    />
  );
};

```

### src/components/adapters/ports/react/dom.react.adapter.tsx

``` tsx
import { JSX } from "react/jsx-dev-runtime";
import { LayoutResult } from "../../../layout/engine/layout.engine";
import { Theme, defaultTheme } from "../../theme";

export type AbsoluteDOMProps = {
  result: LayoutResult;
  theme?: Theme;
};

export function AbsoluteDOM({ result, theme = defaultTheme }: AbsoluteDOMProps): JSX.Element {
  const all = result.boxes;
  const boxes = Object.values(all).sort((a, b) => a.depth - b.depth || a.id.localeCompare(b.id));

  const lines = result.wires.map((w) => {
    const a = result.boxes[w.source];
    const b = result.boxes[w.target];
    if (!a || !b) return null;
    const A = a.getPosition().add(a.getSize().halve());
    const B = b.getPosition().add(b.getSize().halve());
    return (
      <line
        key={`${w.source}-${w.target}`}
        x1={A.x}
        y1={A.y}
        x2={B.x}
        y2={B.y}
        stroke={theme.wire.stroke}
        strokeWidth={theme.wire.width}
      />
    );
  });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>{lines}</svg>
      {boxes.map((b) => (
        <div
          key={b.id}
          data-parent={b.parentId ?? ""}
          style={{
            position: "absolute",
            left: b.getPosition().x,
            top: b.getPosition().y,
            width: b.getSize().x,
            height: b.getSize().y,
            border: `1px solid ${theme.node.border}`,
            borderRadius: theme.node.radius,
            background: theme.node.bg,
            boxSizing: "border-box",
            fontSize: theme.node.fontSize,
            color: theme.node.text,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            userSelect: "none",
          }}
        >
          {b.id}
        </div>
      ))}
    </div>
  );
}

```

### src/components/adapters/ports/react/react-flow.react.adapter.ts

``` ts
import type { CSSProperties } from "react";
import type { Node, Edge } from "reactflow";
import { Vector } from "../../../geometry";
import { LayoutResultEx } from "../../../layout/engine/layout.engine";

const nodeStyle = (v: Vector): CSSProperties => ({
  width: v.x,
  height: v.y,
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  background: "#fff",
  fontSize: 12,
  boxSizing: "border-box" as const,
});

export type toReactFlowReturn = { nodes: Node[]; edges: Edge[] };

export function toReactFlow({ boxes, wires }: LayoutResultEx): toReactFlowReturn {
  const nodes: Node[] = Object.values(boxes).map((b) => {
    const rel: Vector = b.parentId ? b.getPosition().subtract(boxes[b.parentId].getPosition()) : b.getPosition();

    const base: Node = {
      id: b.id,
      position: rel,
      data: { label: b.id },
      style: nodeStyle(b.size),
    };

    return b.parentId ? { ...base, parentNode: b.parentId, extent: "parent" } : base;
  });

  const edges: Edge[] = wires.map((w) => ({ id: `${w.source}-${w.target}`, source: w.source, target: w.target }));
  return { nodes, edges };
}

```

### src/components/adapters/ports/react/react-three-fiber.react.adapter.tsx

``` tsx
// TODO: Implement React-Three-Fiber <Canvas> wrapper and map boxes->meshes.
export function R3FView() 
{
    throw new Error("R3F adapter not implemented yet.");
}

```

### src/components/adapters/ports/react/react-view.adapter.tsx

``` tsx
import { JSX, useMemo } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import { Target } from "../../env";
import { LayoutResultEx } from "../../../layout/engine/layout.engine";
import { defaultTheme, Theme } from "../../theme";
import { toReactFlow } from "./react-flow.react.adapter";
import { Canvas2D } from "./canvas.react.adapter";
import { AbsoluteDOM } from "./dom.react.adapter";

export type ReactAdapterProps = {
  kind: Target;
  result: LayoutResultEx;
  theme?: Theme;
};

export const LayoutView = ({ kind, result, theme = defaultTheme }: ReactAdapterProps): JSX.Element => {
  if (kind === Target.ReactFlow) {
    const { nodes, edges } = useMemo(() => toReactFlow(result), [result]);
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background gap={16} />
          <Controls />
        </ReactFlow>
      </div>
    );
  }
  if (kind === Target.Canvas) return <Canvas2D result={result} theme={theme} />;
  return <AbsoluteDOM result={result} theme={theme} />;
};

```

### src/components/adapters/ports/vanilla/canvas.vanilla.ts

``` ts
import { LayoutResultEx } from "../../../layout/engine/layout.engine";
import { Theme, defaultTheme } from "../../theme";
import { CanvasRenderer2D } from "../../targets/canvas.core";

export type CanvasMount = {
  update: (r: LayoutResultEx, opts?: { partial?: boolean }) => void;
  destroy: () => void;
};

export const mountCanvas2D = (
  container: HTMLElement,
  initial: LayoutResultEx,
  theme: Theme = defaultTheme
): CanvasMount => {
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  Object.assign(canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%" });
  container.appendChild(canvas);

  // initial sizing + DPR
  const dpr: number = Math.max(1, (window.devicePixelRatio as number) || 1);
  const rect: DOMRect = container.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const renderer = new CanvasRenderer2D(canvas, theme);
  renderer.fullDraw(initial);

  const ro: ResizeObserver = new ResizeObserver(() => {
    const rr = container.getBoundingClientRect();
    const w = Math.max(1, Math.round(rr.width * dpr));
    const h = Math.max(1, Math.round(rr.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      const c = canvas.getContext("2d")!;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderer.fullDraw(initial);
    }
  });
  ro.observe(container);

  return {
    update: (r, opts) => renderer.update(r, { partial: opts?.partial ?? true }),
    destroy: () => {
      ro.disconnect();
      container.removeChild(canvas);
    },
  };
};

```

### src/components/adapters/ports/vanilla/dom.vanilla.adapter.ts

``` ts
import { LayoutResult, LayoutResultEx } from "../../../layout/engine/layout.engine";
import { Theme, defaultTheme } from "../../theme";

export type DOMMount = {
  update: (r: LayoutResultEx) => void;
  destroy: () => void;
};

const draw =    (
                    {
                        r,
                        root,
                        svg,
                        svgNS,
                        theme
                    } : {
                        r : LayoutResult,
                        root : HTMLElement,
                        svg : SVGElement,
                        svgNS : string,
                        theme : Theme,
                    }
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
    for (const box of Object.values(r.boxes)) 
    {
        const element               = document.createElement("div");
        element.dataset.node        = box.id;
        const style                 = element.style;
        style.position              = "absolute";
        style.left                  = `${box.getPosition().x}px`;
        style.top                   = `${box.getPosition().y}px`;
        style.width                 = `${box.getSize().x}px`;
        style.height                = `${box.getSize().y}px`;
        style.border                = `1px solid ${theme.node.border}`;
        style.borderRadius          = `${theme.node.radius}px`;
        style.background            = theme.node.bg;
        style.boxSizing             = "border-box";
        style.fontSize              = `${theme.node.fontSize}px`;
        style.color                 = theme.node.text;
        style.display               = "flex";
        style.alignItems            = "center";
        style.justifyContent        = "center";
        (style as any).userSelect   = "none"; // TS dom lib sometimes misses this
        element.textContent         = box.id;
        root.appendChild(element);
    }
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

    draw(
            {
                r: initial,
                root,
                svg,
                svgNS,
                theme
            }
        );

    return  {
                update  :   (r : LayoutResult) => 
                                draw(
                                        {
                                            r,
                                            root,
                                            svg,
                                            svgNS,
                                            theme
                                        }
                                    ),
                destroy :   () => 
                                container.removeChild(root),
            };
}

```

### src/components/adapters/ports/vanilla/threejs.vanilla.adapter.ts

``` ts
// TODO: Implement Three.js scene graph binding for boxes + wires.
// Placeholder to keep the target shape consistent.
export function mountThreeJS() 
{
    throw new Error("Three.js adapter not implemented yet.");
}

```

### src/components/adapters/targets/canvas.core.ts

``` ts
// canvas.core.ts
// - full draw (kept): drawLayoutToCanvas
// - new: CanvasRenderer2D with dirty-rect partial redraw (clip wires + boxes)
// - stable z-order via (depth,id)

import { LayoutResult } from "../../layout/engine/layout.engine";
import { Shapes, Vector } from "../../geometry";
import { Theme, defaultTheme } from "../theme";

/* ----------------------- public full draw (unchanged api) ------------------ */
export const drawLayoutToCanvas = (
  ctx: CanvasRenderingContext2D,
  result: LayoutResult,
  theme: Theme = defaultTheme
): void => {
  const { width, height } = ctx.canvas;
  paintBackground(ctx, theme, 0, 0, width, height);
  drawWires(ctx, result, theme);
  drawBoxes(ctx, result, theme);
};

/* ----------------------------- CanvasRenderer2D ----------------------------- */

type Rect = { x: number; y: number; w: number; h: number };

export class CanvasRenderer2D {
  private ctx: CanvasRenderingContext2D;
  private prev: LayoutResult | null = null;
  private theme: Theme;

  constructor(private canvas: HTMLCanvasElement, theme: Theme = defaultTheme) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D context not available");
    this.ctx = ctx;
    this.theme = theme;
  }

  setTheme(theme: Theme): void {
    this.theme = theme;
  }

  /** Ensure DPR/size; call this after you size+transform the canvas in your adapter. */
  fullDraw(result: LayoutResult): void {
    drawLayoutToCanvas(this.ctx, result, this.theme);
    this.prev = result;
  }

  update(next: LayoutResult, opts: { partial?: boolean } = {}): void {
    const partial = opts.partial ?? true;
    if (!partial || !this.prev) {
      this.fullDraw(next);
      return;
    }

    const dirty = diffDirtyRect(this.prev, next, 2); // 2px pad
    if (!dirty) {
      // nothing material changed
      this.prev = next;
      return;
    }

    const area = this.canvas.width * this.canvas.height;
    const dirtyArea = dirty.w * dirty.h;
    // heuristic: large changes → cheaper to full redraw
    if (dirtyArea / Math.max(1, area) > 0.6) {
      this.fullDraw(next);
      return;
    }

    // clear + background for dirty region
    paintBackground(this.ctx, this.theme, dirty.x, dirty.y, dirty.w, dirty.h);

    // redraw wires clipped to dirty rect
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(dirty.x, dirty.y, dirty.w, dirty.h);
    this.ctx.clip();
    drawWires(this.ctx, next, this.theme);
    this.ctx.restore();

    // redraw boxes intersecting dirty rect in correct z-order
    drawBoxesInRect(this.ctx, next, this.theme, dirty);

    this.prev = next;
  }
}

/* ----------------------------- drawing helpers ----------------------------- */

function paintBackground(
  ctx: CanvasRenderingContext2D,
  theme: Theme,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.save();
  ctx.fillStyle = theme.canvas.bg;
  ctx.fillRect(x, y, Math.max(0, w), Math.max(0, h));
  ctx.restore();
}

function drawWires(ctx: CanvasRenderingContext2D, result: LayoutResult, theme: Theme): void {
  ctx.save();
  ctx.strokeStyle = theme.wire.stroke;
  ctx.lineWidth = theme.wire.width;
  for (const w of result.wires) {
    const a = result.boxes[w.source];
    const b = result.boxes[w.target];
    if (!a || !b) continue;
    const va: Vector = a.size.halve().add(a.getPosition());
    const vb: Vector = b.size.halve().add(b.getPosition());
    ctx.beginPath();
    ctx.moveTo(va.x, va.y);
    ctx.lineTo(vb.x, vb.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBoxes(ctx: CanvasRenderingContext2D, result: LayoutResult, theme: Theme): void {
  const sorted = Object.values(result.boxes).sort(
    (A, B) => A.depth - B.depth || A.id.localeCompare(B.id)
  );

  ctx.save();
  ctx.font = `${theme.node.fontSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const b of sorted) {
    drawOneBox(ctx, b, theme);
  }
  ctx.restore();
}

function drawBoxesInRect(
  ctx: CanvasRenderingContext2D,
  result: LayoutResult,
  theme: Theme,
  r: Rect
): void {
  const sorted = Object.values(result.boxes).sort(
    (A, B) => A.depth - B.depth || A.id.localeCompare(B.id)
  );

  ctx.save();
  ctx.font = `${theme.node.fontSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const b of sorted) {
    if (intersects(rectOfBox(b), r)) drawOneBox(ctx, b, theme);
  }
  ctx.restore();
}

function drawOneBox(
  ctx: CanvasRenderingContext2D,
  b: Shapes.Box,
  theme: Theme
): void {
  const r = theme.node.radius;
  const rectangle = new Shapes.Rectangle(b.getSize(), b.getPosition());
  const center: Vector = b.getPosition().add(b.getSize().halve());

  ctx.beginPath();
  roundedRect(ctx, rectangle, r);
  ctx.fillStyle = theme.node.bg;
  ctx.fill();
  ctx.strokeStyle = theme.node.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = theme.node.text;
  ctx.fillText(b.id, center.x, center.y);
}

function roundedRect(ctx: CanvasRenderingContext2D, rectangle: Shapes.Rectangle, r: number): void {
  const size: Vector = rectangle.getSize();
  const position: Vector = rectangle.getPosition();
  const rr: number = Math.min(r, size.halve().min());
  const sizeAndPosition: Vector = size.add(position);
  ctx.moveTo(position.x + rr, position.y);
  ctx.arcTo(sizeAndPosition.x, position.y, sizeAndPosition.x, sizeAndPosition.y, rr);
  ctx.arcTo(sizeAndPosition.x, sizeAndPosition.y, position.x, sizeAndPosition.y, rr);
  ctx.arcTo(position.x, sizeAndPosition.y, position.x, position.y, rr);
  ctx.arcTo(position.x, position.y, sizeAndPosition.x, position.y, rr);
  ctx.closePath();
}

/* ------------------------------- diff helpers ------------------------------ */

function rectOfBox(b: Shapes.Box): Rect {
  const p = b.getPosition();
  const s = b.getSize();
  return { x: p.x, y: p.y, w: s.x, h: s.y };
}
function union(a: Rect | null, b: Rect): Rect {
  if (!a) return { ...b };
  const x1 = Math.min(a.x, b.x);
  const y1 = Math.min(a.y, b.y);
  const x2 = Math.max(a.x + a.w, b.x + b.w);
  const y2 = Math.max(a.y + a.h, b.y + b.h);
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}
function inflate(r: Rect, pad: number): Rect {
  return { x: r.x - pad, y: r.y - pad, w: r.w + 2 * pad, h: r.h + 2 * pad };
}
function intersects(a: Rect, b: Rect): boolean {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}
function lineBounds(a: Vector, b: Vector, pad = 1): Rect {
  const x1 = Math.min(a.x, b.x), y1 = Math.min(a.y, b.y);
  const x2 = Math.max(a.x, b.x), y2 = Math.max(a.y, b.y);
  return inflate({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 }, pad);
}

function diffDirtyRect(prev: LayoutResult, next: LayoutResult, pad = 0): Rect | null {
  let dirty: Rect | null = null;
  const ids = new Set<string>([...Object.keys(prev.boxes), ...Object.keys(next.boxes)]);

  // box moves/resizes/add/removes
  for (const id of ids) {
    const A = prev.boxes[id];
    const B = next.boxes[id];
    if (!A && B) { dirty = union(dirty, inflate(rectOfBox(B), pad)); continue; }
    if (A && !B) { dirty = union(dirty, inflate(rectOfBox(A), pad)); continue; }
    if (A && B) {
      const ra = rectOfBox(A);
      const rb = rectOfBox(B);
      if (ra.x !== rb.x || ra.y !== rb.y || ra.w !== rb.w || ra.h !== rb.h) {
        dirty = union(union(dirty, inflate(ra, pad)), inflate(rb, pad));
      }
    }
  }

  // wire changes due to moved endpoints (cheap superset: any wire connected to a changed box)
  if (dirty) {
    const changed = new Set<string>();
    for (const id of ids) {
      const A = prev.boxes[id], B = next.boxes[id];
      if (!!A !== !!B) { changed.add(id); continue; }
      if (A && B) {
        const ra = rectOfBox(A), rb = rectOfBox(B);
        if (ra.x !== rb.x || ra.y !== rb.y || ra.w !== rb.w || ra.h !== rb.h) changed.add(id);
      }
    }
    for (const w of next.wires) {
      if (changed.has(w.source) || changed.has(w.target)) {
        const a = next.boxes[w.source]; const b = next.boxes[w.target];
        if (a && b) {
          const ca = a.size.halve().add(a.getPosition());
          const cb = b.size.halve().add(b.getPosition());
          dirty = union(dirty, lineBounds(ca, cb, pad + 1));
        }
      }
    }
  }

  return dirty ? inflate(dirty, pad) : null;
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

### src/components/brand.ts

``` ts
// brand.ts
// Generic, reusable branding for ANY type (Vector, ids, enums, etc.)

export const kBrand = Symbol("brand");

export type Brand<Name extends string> = { readonly [kBrand]: Name };
export type Branded<T, Name extends string> = T & Brand<Name>;

// Attach a non-enumerable runtime brand for debugging; erases at type-level into an opaque type.
export function brand<T, Name extends string>(value: T, name: Name): Branded<T, Name> {
    try { Object.defineProperty(value as object, kBrand, { value: name, enumerable: false }); } catch {}
    return value as Branded<T, Name>;
}
export function brandOf(v: unknown): string | undefined {
    try { return (v as any)?.[kBrand] as string | undefined; } catch { return undefined; }
}
export function isBranded<Name extends string>(v: unknown, name: Name): boolean {
    return brandOf(v) === name;
}

// Common opaque aliases you can adopt progressively (no breaking changes required)
export type NodeId   = Branded<string, "NodeId">;
export type EdgeId   = Branded<string, "EdgeId">;
export type LayoutId = Branded<string, "LayoutId">;

export const asNodeId   = (s: string): NodeId   => brand(s, "NodeId");
export const asEdgeId   = (s: string): EdgeId   => brand(s, "EdgeId");
export const asLayoutId = (s: string): LayoutId => brand(s, "LayoutId");

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

### src/components/errors.ts

``` ts
// errors.ts
export type ErrorCode =
    | "LIMIT_MAX_DEPTH"
    | "LIMIT_MAX_NODES"
    | "LIMIT_MAX_CHILDREN"
    | "LIMIT_MAX_EDGES"
    | "INVALID_CONFIG";

export class LayoutError extends Error {
    constructor(public code: ErrorCode, message: string, public readonly details?: Record<string, unknown>) {
        super(message);
        this.name = "LayoutError";
    }
}
export class LimitError extends LayoutError {
    constructor(code: Exclude<ErrorCode, "INVALID_CONFIG">, message: string, details?: Record<string, unknown>) {
        super(code, message, details);
        this.name = "LimitError";
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
// geometry.ts
// Vector now uses the generic brand system (brand.ts). Brands are reusable globally.

import { add, divide, multiply, subtract } from "./math";
import { brand, Branded } from "./brand";

export type VectorBrand = "Any" | "Position" | "Size" | "Offset" | "Center";

export enum Dimension { X = "x", Y = "y" }

export type Fold = (value: number) => number;
export type NestFold = (vector: Vector) => number;
export type FoldWith = (value1: number, value2: number) => number;
export type Reduce = (x: number, y: number) => number;

export class Vector {
  constructor(public readonly x: number, public readonly y: number) {}

  public as<B extends VectorBrand>(b: B): Branded<Vector, B> {
    // keep a debug runtime brand
    return brand(this, b);
  }
  public asPosition() { return this.as("Position"); }
  public asSize()     { return this.as("Size"); }
  public asOffset()   { return this.as("Offset"); }
  public asCenter()   { return this.as("Center"); }

  public reflect = (axis: Dimension) => (axis === Dimension.X ? new Vector(this.x, -this.y) : new Vector(-this.x, this.y));
  public scale = (factor: number) => this.multiply(Vector.scalar(factor));
  public sum = () => this.reduce(add);
  public crossProduct = (vector: Vector) => this.reflect(Dimension.X).dotProduct(vector.swap());
  public normalize = () => this.scale(1 / this.length());
  public length = () => Math.sqrt(this.dotProduct(this));
  public round = () => this.map(Math.round);
  public map = (f: Fold) => this.fold(f, f);
  public reduce = (f: Reduce) => f(this.x, this.y);
  static scalar = (scalar: number) => new Vector(scalar, scalar);
  public trig = () => this.fold(Math.cos, Math.sin);
  public swap = () => new Vector(this.y, this.x);
  public area = () => this.reduce(multiply);
  public aspectRatio = () => this.reduce(divide);
  public add = (vector: Vector) => this.mapWith(add, vector);
  public multiply = (vector: Vector) => this.mapWith(multiply, vector);
  public subtract = (vector: Vector) => this.mapWith(subtract, vector);
  public divide = (vector: Vector) => this.mapWith(divide, vector);
  public max = () => this.reduce(Math.max);
  public min = () => this.reduce(Math.min);
  public negate = () => this.scale(-1);
  public halve = () => this.scale(1 / 2);
  public dotProduct = (vector: Vector) => this.multiply(vector).sum();
  public rotate = (radians: number) =>
    Vector.scalar(radians).trig().nestFold(
      (v: Vector) => v.reflect(Dimension.X).multiply(this).sum(),
      (v: Vector) => v.swap().multiply(this).sum()
    );
  public clamp = (min: number = -Infinity, max: number = Infinity) =>
    this.map((x: number) => Math.min(Math.max(x, min), max));
  public nestFold = (left: NestFold, right: NestFold) => new Vector(left(this), right(this));
  public mapWith = (f: FoldWith, vector: Vector) => this.foldWith(f, f, vector);
  public foldWith = (left: FoldWith, right: FoldWith, vector: Vector) =>
    new Vector(left(this.x, vector.x), right(this.y, vector.y));
  public fold = (left: Fold, right: Fold) => new Vector(left(this.x), right(this.y));
}

export namespace Shapes {
  export class Rectangle {
    constructor(public size: Vector, public position: Vector) {
      this.size = size.as("Size");
      this.position = position.as("Position");
    }
    getPosition(): Branded<Vector, "Position"> { return this.position.as("Position"); }
    getSize(): Branded<Vector, "Size"> { return this.size.as("Size"); }
  }

  export class Box extends Rectangle {
    constructor(
      public id: string,
      position: Vector,
      size: Vector,
      public parentId?: string,
      public depth: number = 0
    ) {
      super(size, position);
    }
    setDepth(d: number): this { this.depth = d; return this; }
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

### src/components/iteration/iterate.ts

``` ts
// iteration/iterate.ts
import { Logger } from "../logging";

export type LimitAction = "throw" | "truncate" | "warn";

export function enforceBound(
    label: string,
    count: number,
    limit: number,
    action: LimitAction,
    log?: Logger
): number {
    if (count <= limit) return count;
    const ctx = { label, count, limit, action };
    switch (action) {
        case "throw":
            throw new Error(`${label}: limit ${limit} exceeded (count=${count})`);
        case "warn":
            log?.warn(`${label}: trimming to limit`, ctx);
            return limit;
        case "truncate":
        default:
            return limit;
    }
}

export function timesBounded(
    n: number,
    limit: number,
    action: LimitAction,
    each: (i: number) => void,
    log?: Logger,
    label: string = "timesBounded"
): number {
    const k = enforceBound(label, n, limit, action, log);
    for (let i = 0; i < k; i++) each(i);
    return k;
}

export function mapIndexBounded<T>(
    n: number,
    limit: number,
    action: LimitAction,
    f: (i: number) => T,
    log?: Logger,
    label: string = "mapIndexBounded"
): T[] {
    const out: T[] = [];
    timesBounded(n, limit, action, (i) => out.push(f(i)), log, label);
    return out;
}

export function sliceBound<T>(arr: readonly T[], limit: number, action: LimitAction, log?: Logger, label = "sliceBound"): T[] {
    const k = enforceBound(label, arr.length, limit, action, log);
    return arr.slice(0, k);
}

//@tentative
export function forEachBounded<T>(
    arr: readonly T[],
    limit: number,
    action: LimitAction,
    each: (item: T, i: number) => void,
    log?: Logger,
    label: string = "forEachBounded"
): number {
    const k = enforceBound(label, arr.length, limit, action, log);
    for (let i = 0; i < k; i++) each(arr[i], i);
    return k;
}
```

### src/components/iteration/iteration.limits.ts

``` ts
// iteration/limits.ts
// Hard bounds + policy everywhere (depth, nodes, children, edges, ops)
import { Config } from "../config";
import type { LimitAction } from "./iterate";

export type IterationLimits = {
  maxDepth: number;
  maxNodes: number;
  maxChildrenPerNode: number;
  maxEdges: number;
  maxOpsPerPass: number; // coarse fuse for any while/for you add later
  onLimit: LimitAction;  // "throw" | "truncate" | "warn"
};

export const defaultIterationLimits: IterationLimits = {
  maxDepth: 1000,
  maxNodes: 5000,
  maxChildrenPerNode: 1000,
  maxEdges: 10000,
  maxOpsPerPass: 100_000,
  onLimit: "warn",
};

export const IterationConfig = new Config<IterationLimits>(defaultIterationLimits);

/** Simple guardable loop if you need it somewhere ad-hoc. */
export function boundedLoop(limit: number, body: (i: number) => boolean): void {
  let i = 0;
  for (; i < limit && body(i); i++);
  if (i >= limit) throw new Error(`boundedLoop: limit ${limit} reached`);
}

```

### src/components/layout/engine/layout.engine.ts

``` ts
// layout.engine.ts
// - DI logger + limits
// - Bounds applied to depth, node count, children per node, edges
// - Stable behavior under truncation; warnings via logger (default Noop)

import { Shapes, Vector } from "../../geometry";
import { NodeConfig } from "../../graph";
import { LayoutTypes, LayoutChildrenMode } from "../layout.enum";
import { LayoutConfigs } from "../layout.registry";
import { Layout, NestedFramesReturn } from "../layout";
import { LayoutTuning, LayoutTuningConfig } from "../layout.tuning";
import { GridItem } from "../strategies/grid/grid";
import { Config } from "../../config";
import { IteratorsConfig, IteratorsSet } from "../iterator/iterator.registry";
import { IterationConfig, IterationLimits } from "../../iteration/iteration.limits";
import { ConsoleLogger, Logger, NoopLogger } from "../../logging";
import { sliceBound } from "../../iteration/iterate";

export type NodeId = string;
export type ModeMap = Record<string, LayoutChildrenMode>;
export type Wire = { source: NodeId; target: NodeId };

export type LayoutStats = {
  nodeCount: number;
  maxDepth: number;
  bounds: Shapes.Rectangle;
  overlaps?: Array<[NodeId, NodeId]>;
};

export type LayoutResult = {
  boxes: Record<NodeId, Shapes.Box>;
  wires: Wire[];
};

export type LayoutResultEx = LayoutResult & { stats: LayoutStats };

export type ComputeParams = {
  root: NodeConfig;
  modes: ModeMap;
  nodeSize: Vector; // treat as Size (caller may brand)
  spacing: number;
};

export type EngineOptions = {
  iterators?: Config<IteratorsSet>;
  tuning?: Config<LayoutTuning>;
  limits?: Config<IterationLimits>;
  collectOverlaps?: boolean;
  logger?: Logger;
};

export class LayoutEngine {
  private readonly tuning: Config<LayoutTuning>;
  private readonly iters: Config<IteratorsSet>;
  private readonly limits: Config<IterationLimits>;
  private readonly collectOverlaps: boolean;
  private readonly log: Logger;

  private nodeCount = 0;
  private edgeCount = 0;

  constructor(opts: EngineOptions = {}) {
    this.tuning = opts.tuning ?? LayoutTuningConfig;
    this.iters = opts.iterators ?? IteratorsConfig;
    this.limits = opts.limits ?? IterationConfig;
    this.collectOverlaps = !!opts.collectOverlaps;
    this.log = opts.logger ?? new NoopLogger();
  }

  compute({ root, modes, nodeSize, spacing }: ComputeParams): LayoutResultEx {
    this.nodeCount = 0;
    this.edgeCount = 0;

    const boxes: Record<NodeId, Shapes.Box> = {};
    const wires: Wire[] = [];

    this.placeNode({
      node: root,
      level: 0,
      modes,
      nodeSize,
      spacing,
      parentBox: undefined,
      assigned: undefined,
      boxes,
      wires,
    });

    const stats = this.finalizeStats(boxes, this.collectOverlaps);
    return { boxes, wires, stats };
  }

  // --- Internal traversal ----------------------------------------------------

  private placeNode(args: {
    node: NodeConfig;
    level: number;
    modes: ModeMap;
    nodeSize: Vector;
    spacing: number;
    parentBox?: Shapes.Box;
    assigned?: Shapes.Box;
    boxes: Record<NodeId, Shapes.Box>;
    wires: Wire[];
  }): void {
    const { node, level, modes, nodeSize, spacing, parentBox, assigned, boxes, wires } = args;

    const maxDepth = this.limits.get("maxDepth");
    const policy = this.limits.get("onLimit");
    if (level > maxDepth) {
      this.log.warn("Max depth exceeded", { node: node.id, level, maxDepth });
      return; // truncate rather than throw by default
    }

    if (this.nodeCount >= this.limits.get("maxNodes")) {
      this.log.warn("Max nodes reached, skipping remaining traversal", { maxNodes: this.limits.get("maxNodes") });
      return;
    }

    const id = node.id;
    const mode: LayoutChildrenMode = modes[id] ?? LayoutChildrenMode.GRAPH;
    const chosen: LayoutTypes = this.resolveLayoutName(node, node.layout ?? LayoutTypes.Grid);
    const strat: Layout = LayoutConfigs.get<LayoutTypes>(chosen);

    // Resolve this node's box (and set depth once)
    let box: Shapes.Box;
    if (assigned) {
      box = assigned;
      box.depth = level;
    } else {
      const size =
        mode === LayoutChildrenMode.GRAPH
          ? nodeSize
          : strat.preferredSize({
              count: (node.children ?? []).length,
              nodeSize,
              spacing,
              mode: LayoutChildrenMode.NESTED,
            });
      const tl = (node.position ?? Vector.scalar(0)).as("Position");
      box = new Shapes.Box(id, tl, size.as("Size"), parentBox?.id, level);
    }

    boxes[id] = box;
    this.nodeCount++;

    const childrenRaw = node.children ?? [];
    const children = sliceBound(
      childrenRaw,
      this.limits.get("maxChildrenPerNode"),
      policy,
      this.log,
      "childrenPerNode"
    );

    if (!children.length) return;

    if (mode === LayoutChildrenMode.NESTED) {
      if (chosen === LayoutTypes.Grid) {
        this.placeNestedGridChildren({
          node,
          children,
          level,
          nodeSize,
          spacing,
          parentBox: box,
          strat,
          modes,
          boxes,
          wires,
        });
      } else {
        this.placeNestedRadialChildren({
          node,
          children,
          level,
          nodeSize,
          spacing,
          parentBox: box,
          strat,
          modes,
          boxes,
          wires,
        });
      }
    } else {
      // GRAPH mode: children outside; add wires
      const centers = strat.placeChildren({
        mode: LayoutChildrenMode.GRAPH,
        children,
        parent: node,
        origin: box.position.add(box.size.scale(1 / 2)),
        level,
        nodeSize,
        spacing,
        parentSize: box.size,
      });

      for (const c of children) {
        if (this.edgeCount >= this.limits.get("maxEdges")) {
          this.log.warn("Max edges reached, remaining edges skipped", { maxEdges: this.limits.get("maxEdges") });
          break;
        }
        const center = centers[c.id];
        const tlChild = center.subtract(nodeSize.halve()).as("Position");
        const childBox = new Shapes.Box(c.id, tlChild, nodeSize.as("Size"), box.id, level + 1);

        wires.push({ source: id, target: c.id });
        this.edgeCount++;

        this.placeNode({
          node: c,
          level: level + 1,
          modes,
          nodeSize,
          spacing,
          parentBox: box,
          assigned: childBox,
          boxes,
          wires,
        });
      }
    }
  }

  private placeNestedGridChildren(args: {
    node: NodeConfig;
    children: NodeConfig[];
    level: number;
    nodeSize: Vector;
    spacing: number;
    parentBox: Shapes.Box;
    strat: Layout;
    modes: ModeMap;
    boxes: Record<NodeId, Shapes.Box>;
    wires: Wire[];
  }): void {
    const { children, level, nodeSize, spacing, parentBox, strat, modes, boxes, wires } = args;

    const pad = this.tuning.get("outerPad")(spacing);
    const inner = parentBox.size.subtract(Vector.scalar(2 * pad)).clamp(1, Infinity);
    const innerTL = parentBox.position.add(Vector.scalar(pad)).as("Position");
    const nextNodeSize = nodeSize.scale(this.tuning.get("nestedNodeScale")(level));

    const frames: NestedFramesReturn = strat.nestedFrames({
      children,
      parentSize: inner,
      spacing,
    });

    for (const c of children) {
      const item: GridItem<any> = frames.grid.getItem(c.id);
      const pos: Vector = item.dimensions.getPosition();
      const sz: Vector = item.dimensions.getSize().subtract(Vector.scalar(2 * frames.ip)).clamp(1, Infinity);

      const childBox = new Shapes.Box(
        c.id,
        innerTL.add(pos).add(Vector.scalar(frames.ip)).as("Position"),
        sz.as("Size"),
        parentBox.id,
        parentBox.depth + 1
      );

      this.placeNode({
        node: c,
        level: parentBox.depth + 1,
        modes,
        nodeSize: nextNodeSize,
        spacing,
        parentBox,
        assigned: childBox,
        boxes,
        wires,
      });
    }
  }

  private placeNestedRadialChildren(args: {
    node: NodeConfig;
    children: NodeConfig[];
    level: number;
    nodeSize: Vector;
    spacing: number;
    parentBox: Shapes.Box;
    strat: Layout;
    modes: ModeMap;
    boxes: Record<NodeId, Shapes.Box>;
    wires: Wire[];
  }): void {
    const { node, children, level, nodeSize, spacing, parentBox, strat, modes, boxes, wires } = args;

    const pad = this.tuning.get("outerPad")(spacing);
    const inner = parentBox.size.subtract(Vector.scalar(2 * pad)).clamp(1, Infinity);
    const innerTL = parentBox.position.add(Vector.scalar(pad)).as("Position");
    const nextNodeSize = nodeSize.scale(this.tuning.get("nestedNodeScale")(level));

    const centers = strat.placeChildren({
      mode: LayoutChildrenMode.NESTED,
      children,
      parent: node,
      origin: inner.halve(),
      level,
      nodeSize: nextNodeSize,
      spacing,
      parentSize: inner,
    });

    for (const c of children) {
      const p = centers[c.id] ?? inner.scale(1 / 2);
      const childBox = new Shapes.Box(
        c.id,
        innerTL.add(p.subtract(nextNodeSize.halve())).as("Position"),
        nextNodeSize.as("Size"),
        parentBox.id,
        parentBox.depth + 1
      );

      this.placeNode({
        node: c,
        level: parentBox.depth + 1,
        modes,
        nodeSize: nextNodeSize,
        spacing,
        parentBox,
        assigned: childBox,
        boxes,
        wires,
      });
    }
  }

  // --- Helpers ---------------------------------------------------------------

  private resolveLayoutName(node: NodeConfig, fallback: LayoutTypes): LayoutTypes {
    return node.layout && LayoutConfigs.get<LayoutTypes>(node.layout) ? node.layout : fallback;
  }

  private finalizeStats(boxes: Record<NodeId, Shapes.Box>, includeOverlaps: boolean): LayoutStats {
    const ids = Object.keys(boxes);
    const nodeCount = ids.length;

    let maxDepth = 0;
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const id of ids) {
      const b = boxes[id];
      maxDepth = Math.max(maxDepth, b.depth);
      const pos = b.getPosition();
      const sz = b.getSize();
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + sz.x);
      maxY = Math.max(maxY, pos.y + sz.y);
    }

    if (!isFinite(minX)) {
      minX = minY = maxX = maxY = 0;
    }

    const bounds = new Shapes.Rectangle(new Vector(maxX - minX, maxY - minY).as("Size"), new Vector(minX, minY).as("Position"));
    const stats: LayoutStats = { nodeCount, maxDepth, bounds };

    if (includeOverlaps) {
      const overlaps: Array<[NodeId, NodeId]> = [];
      for (let i = 0; i < ids.length; i++) {
        const a = boxes[ids[i]];
        const aPos = a.getPosition(); const aSz = a.getSize();
        const aX2 = aPos.x + aSz.x; const aY2 = aPos.y + aSz.y;
        for (let j = i + 1; j < ids.length; j++) {
          const b = boxes[ids[j]];
          const bPos = b.getPosition(); const bSz = b.getSize();
          const bX2 = bPos.x + bSz.x; const bY2 = bPos.y + bSz.y;
          const disjoint = aX2 <= bPos.x || bX2 <= aPos.x || aY2 <= bPos.y || bY2 <= aPos.y;
          if (!disjoint) overlaps.push([a.id, b.id]);
        }
      }
      stats.overlaps = overlaps;
    }

    return stats;
  }
}

// Back-compat helper
export const computeLayout = (root: NodeConfig, modes: ModeMap, nodeSize: Vector, spacing: number): LayoutResultEx =>
  new LayoutEngine({ logger: new NoopLogger() }).compute({ root, modes, nodeSize, spacing });

```

### src/components/layout/iterator/iterator.registry.ts

``` ts
import { Config } from "../../config";
import { Iterator } from "./iterator.types";
import { LayoutTypes } from "../layout.enum";
import { buildIterators, IteratorsSet } from "./layout.iterators";

export interface IteratorRegistry {
  [LayoutTypes.Grid]: Iterator;
  [LayoutTypes.Radial]: Iterator;
}
export const IteratorsConfig = new Config<Record<keyof IteratorRegistry, Iterator>>(buildIterators());
export type { IteratorsSet }; // re-export for convenience

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
export const mapToRect = (u: Vector, r: Shapes.Rectangle): Vector =>
  r.getPosition().add(u.multiply(r.getSize()));

/** correct grid centers: ((col+.5)/cols, (row+.5)/rows) */
export const gridUnit = (i: number, n: number, rowCol: Vector): Vector => {
  const coordinates = rowCol.clamp(1, Infinity);
  const cell = new Vector(i % coordinates.x, Math.floor(i / coordinates.x));
  return cell.add(Vector.scalar(1 / 2)).divide(coordinates);
};

export type IteratorsSet = {
  [LayoutTypes.Grid]: Iterator;
  [LayoutTypes.Radial]: Iterator;
};

export const buildIterators = (tuning: Config<LayoutTuning> = LayoutTuningConfig): IteratorsSet => {
  const opsGrid: IteratorOps = {
    unit: gridUnit,
    mapToRect,
    anchor: ({ mode, parentSize, spacing }) =>
      mode === LayoutChildrenMode.GRAPH
        ? tuning.get("anchor")({ mode, parentSize, spacing })
        : new Vector(0, 0),
  };

  const opsRadial: IteratorOps = {
    anchor: ({ mode, parentSize, spacing }: AnchorIteratorParams) =>
      mode === LayoutChildrenMode.GRAPH ? tuning.get("anchor")({ mode, parentSize, spacing }) : new Vector(0, 0),
    angle: (i: number, n: number): number => {
      const start = tuning.get("startAngle")();
      const cw = tuning.get("clockwise")();
      return tuning.get("angleOf")(i, n, start, cw);
    },
  };

  return {
    grid: new Iterator(opsGrid),
    radial: new Iterator(opsRadial),
  };
};

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
// layout.registry.ts
import { Config } from "../config";
import { Layout } from "./layout";
import { LayoutTypes } from "./layout.enum";
import { GridLayout } from "./strategies/grid/grid.layout";
import { RadialLayout } from "./strategies/radial/radial.layout";

export interface LayoutRegistry {
  [LayoutTypes.Grid]: import("./strategies/grid/grid.layout").GridLayout;
  [LayoutTypes.Radial]: import("./strategies/radial/radial.layout").RadialLayout;
}

export type LayoutKind = keyof LayoutRegistry;

export const LayoutConfigs = new Config<Record<LayoutKind, Layout>>({
  [LayoutTypes.Grid]: new GridLayout(),
  [LayoutTypes.Radial]: new RadialLayout(),
});

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
import { AnchorIteratorParams } from "./iterator/iterator.types";
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
import { Vector, Shapes } from "../../../geometry";
import {
  Layout, NestedFrameParam, PlaceChildrenReturn, PreferredSizeParam,
  NestedFramesReturn, PreferredSizeReturn, PlaceChildrenParam
} from "../../layout";
import { LayoutChildrenMode, LayoutTypes } from "../../layout.enum";
import { MappedGrid, MappedGridItemData } from "./grid.mapped";
import { GridItem } from "./grid";
import { Config } from "../../../config";
import { LayoutTuning, LayoutTuningConfig } from "../../layout.tuning";
import { IteratorsConfig, IteratorsSet } from "../../iterator/iterator.registry";
import { mapIndexBounded, sliceBound } from "../../../iteration/iterate";
import { IterationConfig } from "../../../iteration/iteration.limits";

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

export class GridLayout extends Layout {
  constructor(
    private tuning: Config<LayoutTuning> = LayoutTuningConfig,
    private iters: Config<IteratorsSet> = IteratorsConfig
  ) { super(); }

  nestedFrames = ({ children, parentSize, spacing }: NestedFrameParam): NestedFramesReturn => {
    const maxPer = IterationConfig.get("maxChildrenPerNode");
    const policy = IterationConfig.get("onLimit");
    const safeChildren = sliceBound(children, maxPer, policy);

    const gridSize: Vector = this.tuning.get("rowCol")(safeChildren.length);
    const ip: number = this.tuning.get("itemPad")(spacing);
    const content: Vector = parentSize.round().clamp(1, Infinity);

    const X = splitEven(content.x, gridSize.x);
    const Y = splitEven(content.y, gridSize.y);

    const grid: MappedGrid = MappedGrid.emptyMapped<MappedGridItemData>(gridSize, () => ({ id: "" }));

    for (let i = 0; i < safeChildren.length; i++) {
      const cell = new Vector(i % gridSize.x, Math.floor(i / gridSize.x));
      const position = new Vector(X.offs[cell.x], Y.offs[cell.y]);
      const size = new Vector(X.sizes[cell.x], Y.sizes[cell.y]);
      grid.set(cell, new GridItem<MappedGridItemData>(cell, new Shapes.Rectangle(size, position), { id: safeChildren[i].id }));
    }

    return { ip, content, grid };
  };

  placeChildren = (args: PlaceChildrenParam): PlaceChildrenReturn => {
    const { children, nodeSize, spacing, origin, parentSize, mode } = args;
    const maxPer = IterationConfig.get("maxChildrenPerNode");
    const policy = IterationConfig.get("onLimit");
    const safeChildren = sliceBound(children, maxPer, policy);

    const rowCol: Vector = this.tuning.get("rowCol")(safeChildren.length);
    const ip: number = this.tuning.get("itemPad")(spacing);
    const anchor: Vector = this.iters.get(LayoutTypes.Grid).anchorOffset({ mode, parentSize, spacing });

    switch (mode) {
      case LayoutChildrenMode.GRAPH: {
        const cell = nodeSize.add(Vector.scalar(2 * ip));
        const total = rowCol.multiply(cell);
        const topLeft = origin.add(anchor).subtract(total.halve());
        return Object.fromEntries(
          mapIndexBounded(
            safeChildren.length,
            safeChildren.length, // already bounded
            "truncate",
            (i: number) => [
              safeChildren[i].id,
              topLeft
                .add(cell.multiply(new Vector(i % rowCol.x, Math.floor(i / rowCol.x))))
                .add(cell.halve())
                .round(),
            ]
          )
        );
      }
      case LayoutChildrenMode.NESTED: {
        const rect = new Shapes.Rectangle(parentSize, new Vector(0, 0));
        const centers = this.iters.get(LayoutTypes.Grid).centersInRect(safeChildren.length, rowCol, rect);
        return Object.fromEntries(safeChildren.map((c, i) => [c.id, centers[i]]));
      }
    }
  };

  preferredSize = ({ count, nodeSize, spacing }: PreferredSizeParam): PreferredSizeReturn => {
    const rowCol: Vector = this.tuning.get("rowCol")(count);
    const ip: number = this.tuning.get("itemPad")(spacing);
    const pad: number = this.tuning.get("outerPad")(spacing);
    const cell: Vector = nodeSize.add(Vector.scalar(2 * ip));
    const inner: Vector = rowCol.multiply(cell);
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
import { Vector } from "../../../geometry";
import {
  PreferredSizeParam, PreferredSizeReturn, Layout, PlaceChildrenReturn, PlaceChildrenParam, NestedFramesReturn
} from "../../layout";
import { LayoutChildrenMode } from "../../layout.enum";
import { MappedGrid } from "../grid/grid.mapped";
import { Config } from "../../../config";
import { LayoutTuning, LayoutTuningConfig } from "../../layout.tuning";
import { IterationConfig } from "../../../iteration/iteration.limits";
import { mapIndexBounded } from "../../../iteration/iterate";

export class RadialLayout extends Layout {
  constructor(private tuning: Config<LayoutTuning> = LayoutTuningConfig) { super(); }
  nestedFrames = (): NestedFramesReturn => ({
    ip: 0,
    content: new Vector(0, 0),
    grid: MappedGrid.emptyMapped(new Vector(0, 0), () => ({ id: "" })),
  });

  placeChildren = (args: PlaceChildrenParam): PlaceChildrenReturn =>
    args.mode === LayoutChildrenMode.NESTED ? nestedRadialCenters(this.tuning, args) : graphRadialCenters(this.tuning, args);

  preferredSize = ({ count, nodeSize, spacing, mode }: PreferredSizeParam): PreferredSizeReturn =>
    mode === LayoutChildrenMode.NESTED ? this.tuning.get("nestedRadialPreferred")(count, nodeSize, spacing) : nodeSize;
}

/* ==================== helpers ==================== */
export const nestedRadialCenters = (
  tuning: Config<LayoutTuning>,
  { children, parentSize, nodeSize, spacing }: PlaceChildrenParam
): PlaceChildrenReturn => {
  const maxPer = IterationConfig.get("maxChildrenPerNode");
  const policy = IterationConfig.get("onLimit");

  const inner: Vector = parentSize.round().clamp(1, Infinity);
  const c: Vector = inner.scale(1 / 2);
  const start = tuning.get("startAngle")();
  const cw = tuning.get("clockwise")();
  const baseR = inner.min() / 2 - nodeSize.max() / 2 - tuning.get("itemPad")(spacing);
  const r = Math.max(tuning.get("minRadius")(), baseR);

  return Object.fromEntries(
    mapIndexBounded(children.length, maxPer, policy, (i) => [
      children[i].id,
      Vector.scalar(tuning.get("angleOf")(i, children.length, start, cw)).trig().scale(r).add(c),
    ])
  );
};

export const graphRadialCenters = (
  tuning: Config<LayoutTuning>,
  { children, origin, nodeSize, spacing, level, parentSize }: PlaceChildrenParam
): PlaceChildrenReturn => {
  const maxPer = IterationConfig.get("maxChildrenPerNode");
  const policy = IterationConfig.get("onLimit");

  const base = tuning.get("radialBase")(nodeSize, spacing);
  const r = Math.max(tuning.get("minRadius")(), base * (1 + level * tuning.get("radialLevelScale")()));
  const a = tuning.get("anchor")({ mode: LayoutChildrenMode.GRAPH, parentSize, spacing });
  const c = origin.add(a);

  const start = tuning.get("startAngle")();
  const cw = tuning.get("clockwise")();

  return Object.fromEntries(
    mapIndexBounded(children.length, maxPer, policy, (i) => [
      children[i].id,
      Vector.scalar(tuning.get("angleOf")(i, children.length, start, cw)).trig().scale(r).add(c).round(),
    ])
  );
};

```

### src/components/logging.ts

``` ts
// logging.ts
export enum LogLevel { Debug = 10, Info = 20, Warn = 30, Error = 40, Off = 99 }
export type LogCtx = Record<string, unknown>;

export interface Logger {
    level: LogLevel;
    child(bindings: LogCtx): Logger;
    debug(msg: string, ctx?: LogCtx): void;
    info (msg: string, ctx?: LogCtx): void;
    warn (msg: string, ctx?: LogCtx): void;
    error(msg: string, ctx?: LogCtx): void;
}

export class NoopLogger implements Logger {
    level = LogLevel.Off;
    child(): Logger { return this; }
    debug(): void {} info(): void {} warn(): void {} error(): void {}
}

export class ConsoleLogger implements Logger {
    constructor(public level: LogLevel = LogLevel.Warn, private readonly bindings: LogCtx = {}) {}
    child(bindings: LogCtx): Logger { return new ConsoleLogger(this.level, { ...this.bindings, ...bindings }); }
    private out(kind: "debug"|"info"|"warn"|"error", msg: string, ctx?: LogCtx): void {
        // eslint-disable-next-line no-console
        console[kind]({ msg, ...this.bindings, ...(ctx ?? {}) });
    }
    debug(msg: string, ctx?: LogCtx) { if (this.level <= LogLevel.Debug) this.out("debug", msg, ctx); }
    info (msg: string, ctx?: LogCtx) { if (this.level <= LogLevel.Info ) this.out("info" , msg, ctx); }
    warn (msg: string, ctx?: LogCtx) { if (this.level <= LogLevel.Warn ) this.out("warn" , msg, ctx); }
    error(msg: string, ctx?: LogCtx) { if (this.level <= LogLevel.Error) this.out("error", msg, ctx); }
}

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
import { JSX, useEffect, useMemo, useState } from "react";
import { NodeConfig } from "./graph";
import { Vector } from "./geometry";
import { LayoutChildrenMode, LayoutTypes } from "./layout/layout.enum";
import { LayoutEngine, LayoutResultEx, ModeMap } from "./layout/engine/layout.engine";
import { LabeledSlider, Segmented } from "./ui/controls";
import { Shell } from "./ui/styles";
import { Configurator } from "./ui/Configurator";
import { Target } from "./adapters/env";
import { LayoutView } from "./adapters/ports/react/react-view.adapter";

const DEMO: NodeConfig = {
  id: "root",
  label: "Root",
  position: new Vector(200, 60),
  children: [
    { id: "A", label: "A", children: [{ id: "A1" }, { id: "A2" }, { id: "A3" }] },
    { id: "B", label: "B", children: [{ id: "B1" }, { id: "B2" }, { id: "B3" }, { id: "B4" }] },
    { id: "C", label: "C", children: [{ id: "C1" }, { id: "C2" }, { id: "C3" }, { id: "C4" }] },
  ],
};
Object.freeze(DEMO);

const DEMO_MIXED: NodeConfig = {
  id: "root",
  label: "Root",
  position: new Vector(200, 60),
  layout: LayoutTypes.Grid,
  children: [
    { id: "A", label: "A", layout: LayoutTypes.Radial, children: [{ id: "A1" }, { id: "A2" }, { id: "A3" }] },
    { id: "B", label: "B", layout: LayoutTypes.Grid, children: [{ id: "B1" }, { id: "B2" }, { id: "B3" }, { id: "B4" }] },
    { id: "C", label: "C", layout: LayoutTypes.Radial, children: [{ id: "C1" }, { id: "C2" }, { id: "C3" }, { id: "C4" }] },
  ],
};
Object.freeze(DEMO_MIXED);

type LayoutOverrideMap = Record<string, LayoutTypes | undefined>;
type NodeIndex = { id: string; label: string };

const flattenNodes = (n: NodeConfig): NodeIndex[] => {
  const out: NodeIndex[] = [{ id: n.id, label: n.label ?? n.id }];
  for (const c of n.children ?? []) out.push(...flattenNodes(c));
  return out;
};
const findNode = (root: NodeConfig, id: string): NodeConfig | undefined => {
  if (root.id === id) return root;
  for (const c of root.children ?? []) {
    const hit: NodeConfig | undefined = findNode(c, id);
    if (hit) return hit;
  }
  return undefined;
};
const subtreeIds = (root: NodeConfig, startId: string): string[] => {
  const node: NodeConfig | undefined = findNode(root, startId);
  if (!node) return [];
  return flattenNodes(node).map((n) => n.id);
};
const idsInScope = (root: NodeConfig, scope: "all" | string, applyToSubtree: boolean): string[] => {
  const all: string[] = [];
  (function () {
    const walk = (n: NodeConfig): void => {
      all.push(n.id);
      (n.children ?? []).forEach(walk);
    };
    walk(root);
  })();
  if (scope === "all") return all;
  if (!applyToSubtree) return [scope];
  const res: string[] = [];
  (function () {
    const walk = (n: NodeConfig): void => {
      res.push(n.id);
      (n.children ?? []).forEach(walk);
    };
    walk(findNode(root, scope)!);
  })();
  return res;
};

export type ParentChildLayoutsDemoProps = { config?: NodeConfig };

export const ParentChildLayoutsDemo = ({ config = DEMO_MIXED }: ParentChildLayoutsDemoProps): JSX.Element => {
  const [adapter, setAdapter] = useState<Target.DOM | Target.Canvas | Target.ReactFlow>(Target.DOM);
  const [spacing, setSpacing] = useState(24);
  const [nodeW, setNodeW] = useState(110);
  const [nodeH, setNodeH] = useState(54);
  const LIMITS = {
    spacing: { min: 0, max: 80 },
    nodeW: { min: 40, max: 240 },
    nodeH: { min: 30, max: 180 },
  };

  const [layoutName, setLayoutName] = useState<LayoutTypes>(LayoutTypes.Grid);
  const [modes, setModes] = useState<ModeMap>({
    root: LayoutChildrenMode.GRAPH,
    A: LayoutChildrenMode.NESTED,
    B: LayoutChildrenMode.GRAPH,
    C: LayoutChildrenMode.NESTED,
  });
  const [scope, setScope] = useState<"all" | string>("all");
  const [applyToSubtree, setApplyToSubtree] = useState(true);

  const effectiveConfig = useMemo<NodeConfig>(() => {
    const clone = (n: NodeConfig): NodeConfig => ({ ...n, children: (n.children ?? []).map(clone) });
    const copy: NodeConfig = clone(config);
    const setLayout = (n: NodeConfig): void => {
      if (scope === "all" || n.id === scope) n.layout = layoutName;
      if (applyToSubtree || scope === "all") (n.children ?? []).forEach(setLayout);
    };
    setLayout(copy);
    return copy;
  }, [config, layoutName, scope, applyToSubtree]);

  const nodeSize: Vector = useMemo(
    () => new Vector(Math.max(20, nodeW), Math.max(20, nodeH)).asSize(),
    [nodeW, nodeH]
  );

  const engine = useMemo(() => new LayoutEngine({ collectOverlaps: false }), []);

  const result: LayoutResultEx = useMemo(
    () => engine.compute({ root: effectiveConfig, modes, nodeSize, spacing }),
    [engine, effectiveConfig, modes, nodeSize, spacing]
  );

  const scopedIds: string[] = useMemo(() => idsInScope(config, scope, applyToSubtree), [config, scope, applyToSubtree]);
  const nestedGridActive: boolean = useMemo(
    () => layoutName === LayoutTypes.Grid && scopedIds.some((id) => (modes[id] ?? LayoutChildrenMode.GRAPH) === LayoutChildrenMode.NESTED),
    [layoutName, scopedIds, modes]
  );

  useEffect(() => {
    if (nestedGridActive) {
      setSpacing(LIMITS.spacing.min);
      setNodeW(LIMITS.nodeW.max);
      setNodeH(LIMITS.nodeH.max);
    }
  }, [nestedGridActive]);

  const LayoutViewStyle: React.CSSProperties = { position: "absolute", inset: 0 };

  return (
    <div style={Shell.outer}>
      <div style={Shell.bar}>
        <Segmented<Target.DOM | Target.Canvas | Target.ReactFlow>
          label="Right Pane"
          value={adapter}
          onChange={setAdapter}
          options={[
            { label: "DOM", value: Target.DOM },
            { label: "Canvas", value: Target.Canvas },
            { label: "ReactFlow", value: Target.ReactFlow },
          ]}
        />
        <Configurator
          root={config}
          modes={modes}
          setModes={setModes}
          layout={layoutName}
          setLayout={setLayoutName}
          scope={scope}
          setScope={setScope}
          applyToSubtree={applyToSubtree}
          setApplyToSubtree={setApplyToSubtree}
        />

        <LabeledSlider label="Spacing" value={spacing} min={LIMITS.spacing.min} max={LIMITS.spacing.max} onChange={setSpacing} />
        <LabeledSlider label="Node W" value={nodeW} min={LIMITS.nodeW.min} max={LIMITS.nodeW.max} onChange={setNodeW} disabled={nestedGridActive} />
        <LabeledSlider label="Node H" value={nodeH} min={LIMITS.nodeH.min} max={LIMITS.nodeH.max} onChange={setNodeH} disabled={nestedGridActive} />
      </div>

      <div style={Shell.left}>
        <div style={Shell.title}>Graph (Edges)</div>
        <div style={Shell.rf}>
          <LayoutView kind={Target.ReactFlow} result={result} />
        </div>
      </div>

      <div style={Shell.right}>
        <div style={Shell.title}>Right Pane: {adapter}</div>
        <div style={LayoutViewStyle}>
          <LayoutView kind={adapter} result={result} />
        </div>
      </div>
    </div>
  );
};

```

### src/components/playground/controller.ts

``` ts
import { NodeConfig } from "../graph";
import { Target } from "../adapters/env";
import { LayoutTypes } from "../layout/layout.enum";
import { LayoutEngine, LayoutResultEx, ModeMap } from "../layout/engine/layout.engine";
import { Vector } from "../geometry";

export type PlaygroundState = {
  adapter: Target;
  spacing: number;
  nodeW: number;
  nodeH: number;
  layout: LayoutTypes;
  scope: "all" | string;
  applyToSubtree: boolean;
  modes: ModeMap;
};

export type PlaygroundController = {
  compute(config: NodeConfig, s: PlaygroundState): LayoutResultEx;
  deriveOverrides(config: NodeConfig, s: PlaygroundState): NodeConfig;
};

export function makePlaygroundController(engine = new LayoutEngine()): PlaygroundController {
  const deriveOverrides = (root: NodeConfig, s: PlaygroundState): NodeConfig => {
    const clone = (n: NodeConfig): NodeConfig => ({ ...n, children: (n.children ?? []).map(clone) });
    const copy = clone(root);
    const apply = (n: NodeConfig): void => {
      if (s.scope === "all" || n.id === s.scope) n.layout = s.layout;
      if (s.applyToSubtree || s.scope === "all") (n.children ?? []).forEach(apply);
    };
    apply(copy);
    return copy;
  };

  const compute = (config: NodeConfig, s: PlaygroundState): LayoutResultEx => {
    const nodeSize = new Vector(s.nodeW, s.nodeH).asSize();
    return engine.compute({
      root: config,
      modes: s.modes,
      nodeSize,
      spacing: s.spacing,
    });
  };

  return { compute, deriveOverrides };
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
import { ModeMap } from "../layout/engine/layout.engine";

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

