# Source Catalog (TypeScript)

Generated on 2025-08-24T03:21:37.768Z

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
│   ├── engine/
│   │   └── computeLayout.ts
│   ├── layout/
│   │   ├── strategies/
│   │   │   ├── grid.layout.ts
│   │   │   ├── grid.mapped.ts
│   │   │   ├── grid.ts
│   │   │   └── radial.layout.ts
│   │   ├── iterators.types.ts
│   │   ├── layout.config.ts
│   │   ├── layout.enum.ts
│   │   ├── layout.iterators.ts
│   │   ├── layout.ts
│   │   ├── layout.tuning.ts
│   │   └── layout.values.ts
│   ├── ui/
│   │   ├── Configurator.tsx
│   │   ├── controls.tsx
│   │   └── styles.ts
│   ├── config.ts
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
import { computeLayout, LayoutResult, ModeMap } from "../engine/computeLayout";
import { Vector } from "../geometry";
import { NodeConfig } from "../graph";

export function runLayoutAPI(
  root: NodeConfig,
  modes: ModeMap,
  nodeSize: Vector,
  spacing: number
): LayoutResult {
  return computeLayout(root, modes, nodeSize, spacing);
}

```

### src/components/adapters/canvas.adapter.tsx

``` tsx
import { useEffect, useRef } from "react";
import { LayoutResult } from "../engine/computeLayout";
import { Theme, defaultTheme } from "./theme";
import { drawLayoutToCanvas } from "./canvas.core";

export function Canvas2D({ result, theme = defaultTheme }: { result: LayoutResult; theme?: Theme }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cvs = ref.current!;
    const parent = cvs.parentElement!;
    const ro = new ResizeObserver(() => draw());
    ro.observe(parent);

    function draw() {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const rect = parent.getBoundingClientRect();
      cvs.width = Math.max(1, Math.round(rect.width * dpr));
      cvs.height = Math.max(1, Math.round(rect.height * dpr));
      const ctx = cvs.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawLayoutToCanvas(ctx, result, theme);
    }

    draw();
    return () => ro.disconnect();
  }, [result, theme]);

  return <canvas style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} ref={ref} />;
}


```

### src/components/adapters/canvas.core.ts

``` ts
import { LayoutResult } from "../engine/computeLayout";
import { Theme, defaultTheme } from "./theme";

export function drawLayoutToCanvas(
  ctx: CanvasRenderingContext2D,
  result: LayoutResult,
  theme: Theme = defaultTheme
) {
  const { width, height } = ctx.canvas;
  // background
  ctx.save();
  ctx.fillStyle = theme.canvas.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // wires
  ctx.save();
  ctx.strokeStyle = theme.wire.stroke;
  ctx.lineWidth = theme.wire.width;
  for (const w of result.wires) {
    const a = result.boxes[w.source];
    const b = result.boxes[w.target];
    if (!a || !b) continue;
    const ax = a.tl.x + a.size.x / 2, ay = a.tl.y + a.size.y / 2;
    const bx = b.tl.x + b.size.x / 2, by = b.tl.y + b.size.y / 2;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  }
  ctx.restore();

  // nodes
  ctx.save();
  ctx.font = `${theme.node.fontSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const b of Object.values(result.boxes)) {
    // box
    const r = theme.node.radius;
    const x = b.tl.x, y = b.tl.y, w = b.size.x, h = b.size.y;

    ctx.beginPath();
    roundedRect(ctx, x, y, w, h, r);
    ctx.fillStyle = theme.node.bg;
    ctx.fill();
    ctx.strokeStyle = theme.node.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    // label
    ctx.fillStyle = theme.node.text;
    ctx.fillText(b.id, x + w / 2, y + h / 2);
  }
  ctx.restore();
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

```

### src/components/adapters/canvas.vanilla.ts

``` ts
import { LayoutResult } from "../engine/computeLayout";
import { drawLayoutToCanvas } from "./canvas.core";
import { Theme, defaultTheme } from "./theme";

export type CanvasMount = {
  update: (r: LayoutResult) => void;
  destroy: () => void;
};

export function mountCanvas2D(
  container: HTMLElement,
  initial: LayoutResult,
  theme: Theme = defaultTheme
): CanvasMount {
  const canvas = document.createElement("canvas");
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  container.appendChild(canvas);

  const draw = (r: LayoutResult) => {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawLayoutToCanvas(ctx, r, theme);
  };

  draw(initial);

  const ro = new ResizeObserver(() => draw(initial));
  ro.observe(container);

  return {
    update: draw,
    destroy: () => {
      ro.disconnect();
      container.removeChild(canvas);
    }
  };
}

```

### src/components/adapters/env.ts

``` ts
export enum RuntimeEnv { Browser = "browser", Headless = "headless" }
export enum Framework { React = "react", Vanilla = "vanilla", Node = "node" }
export enum Target { API = "api", Canvas = "canvas", DOM = "dom", ReactFlow = "reactflow", ThreeJS = "threejs" }

// Placeholder types for threejs/r3f, implement later.
export type ThreeJsAdapter = unknown;

export type AdapterConfig = {
  runtime: RuntimeEnv;
  framework: Framework;
  target: Target;
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
import React from "react";
import { AdapterConfig, Framework, Target } from "./env";
import { runLayoutAPI } from "./api.adapter";
import { Canvas2D } from "./canvas.adapter";
import { AbsoluteDOM } from "./react-dom.adapter";
import { LayoutView } from "./react-view.adapter";
import { mountCanvas2D } from "./canvas.vanilla";
import { mountAbsoluteDOM } from "./vanilla-dom.adapter";
// factory.ts
export type Renderer =
  | { kind: "api" }
  | { kind: "dom" }
  | { kind: "canvas" }
  | { kind: "react", Component: React.ComponentType<any> }
  | { kind: "reactflow", Component: React.ComponentType<any> };

export function makeRenderer(target: Target): Renderer {
  switch (target) {
    case Target.API:    return { kind: "api" };
    case Target.DOM:    return { kind: "dom" };
    case Target.Canvas: return { kind: "canvas" };
    case Target.ReactFlow:
    case Target.ThreeJS:
    default:            return { kind: "react", Component: LayoutView }; // imported from a .tsx file
  }
}

/**
 * getAdapter(cfg)
 * - For React: returns { kind: 'react', render: (props) => ReactElement }
 * - For Vanilla: returns { kind: 'vanilla', mount(container, initial) => { update, destroy } }
 * - For API: returns { kind: 'api', run(root, modes, nodeSize, spacing) => LayoutResult }
 */
export function getAdapter(cfg: AdapterConfig) {
  switch (cfg.target) {
    case Target.API:
      return { kind: "api" as const, run: runLayoutAPI };

    case Target.Canvas:
      if (cfg.framework === Framework.React) {
        return { kind: "react" as const, render: (props: any) => React.createElement(Canvas2D, props) };
      } else {
        return { kind: "vanilla" as const, mount: mountCanvas2D };
      }

    case Target.DOM:
      if (cfg.framework === Framework.React) {
        return { kind: "react" as const, render: (props: any) => React.createElement(AbsoluteDOM, props) };
      } else {
        return { kind: "vanilla" as const, mount: mountAbsoluteDOM };
      }

    case Target.ReactFlow:
      // React only – reuse <LayoutView kind="reactflow" />
      return {
        kind: "react" as const,
        render: (props: any) => React.createElement(LayoutView as any, { ...props, kind: "reactflow" }),
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
export function R3FView() {
  throw new Error("R3F adapter not implemented yet.");
}

```

### src/components/adapters/react-dom.adapter.tsx

``` tsx
import { Box, LayoutResult } from "../engine/computeLayout";
import { Theme, defaultTheme } from "./theme";

function depthOf(b: Box, all: Record<string, Box>): number {
  let d = 0, p = b.parentId;
  while (p) { d++; p = all[p]?.parentId; }
  return d;
}

export function AbsoluteDOM({ result, theme = defaultTheme }: { result: LayoutResult; theme?: Theme }) {
  const all = result.boxes;
  const boxes = Object.values(all).sort((a, b) => depthOf(a, all) - depthOf(b, all));

  const lines = result.wires.map((w) => {
    const a = result.boxes[w.source], b = result.boxes[w.target];
    if (!a || !b) return null;
    const ax = a.tl.x + a.size.x / 2, ay = a.tl.y + a.size.y / 2;
    const bx = b.tl.x + b.size.x / 2, by = b.tl.y + b.size.y / 2;
    return (
      <line
        key={`${w.source}-${w.target}`}
        x1={ax} y1={ay} x2={bx} y2={by}
        stroke={theme.wire.stroke} strokeWidth={theme.wire.width}
      />
    );
  });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {lines}
      </svg>
      {boxes.map((b) => (
        <div
          key={b.id}
          data-parent={b.parentId ?? ""}
          style={{
            position: "absolute",
            left: b.tl.x, top: b.tl.y,
            width: b.size.x, height: b.size.y,
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

### src/components/adapters/react-flow.adapter.ts

``` ts
import type { CSSProperties } from "react";
import type { Node, Edge } from "reactflow";
import { LayoutResult } from "../engine/computeLayout";

const nodeStyle = (w: number, h: number): CSSProperties => ({
  width: w,
  height: h,
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  background: "#fff",
  fontSize: 12,
  boxSizing: "border-box" as const,
});
export function toReactFlow({ boxes, wires }: LayoutResult): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = Object.values(boxes).map((b) => {
    const rel = b.parentId ? {
      x: b.tl.x - boxes[b.parentId].tl.x,
      y: b.tl.y - boxes[b.parentId].tl.y,
    } : { x: b.tl.x, y: b.tl.y };

    const base: Node = {
      id: b.id,
      position: rel,
      data: { label: b.id },
      style: nodeStyle(b.size.x, b.size.y),
    };

    return b.parentId
      ? { ...base, parentNode: b.parentId, extent: "parent" as const }
      : base;
  });

  const edges: Edge[] = wires.map((w) => ({ id: `${w.source}-${w.target}`, source: w.source, target: w.target }));
  return { nodes, edges };
}

```

### src/components/adapters/react-view.adapter.tsx

``` tsx
import React, { useMemo } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import { LayoutResult } from "../engine/computeLayout";
import { toReactFlow } from "./react-flow.adapter";
import { AbsoluteDOM } from "./react-dom.adapter";
import { Canvas2D } from "./canvas.adapter";
import { Theme, defaultTheme } from "./theme";

export type ReactAdapterKind = "reactflow" | "dom" | "canvas";

export function LayoutView({
  kind, result, theme = defaultTheme,
}: {
  kind: ReactAdapterKind;
  result: LayoutResult;
  theme?: Theme;
}) {
  if (kind === "reactflow") {
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
  if (kind === "canvas") {
    return <Canvas2D result={result} theme={theme} />;
  }
  return <AbsoluteDOM result={result} theme={theme} />;
}

```

### src/components/adapters/theme.ts

``` ts
export type Theme = {
  node: {
    bg: string;
    border: string;
    radius: number;
    fontSize: number;
    text: string;
  };
  wire: {
    stroke: string;
    width: number;
  };
  canvas: {
    bg: string;
  };
};

export const defaultTheme: Theme = {
  node: {
    bg: "#ffffff",
    border: "#cbd5e1",
    radius: 10,
    fontSize: 12,
    text: "#0f172a",
  },
  wire: {
    stroke: "#94a3b8",
    width: 1,
  },
  canvas: {
    bg: "#ffffff",
  },
};

```

### src/components/adapters/three.adapter.ts

``` ts
// TODO: Implement Three.js scene graph binding for boxes + wires.
// Placeholder to keep the target shape consistent.
export function mountThreeJS() {
  throw new Error("Three.js adapter not implemented yet.");
}

```

### src/components/adapters/vanilla-dom.adapter.ts

``` ts
import { LayoutResult } from "../engine/computeLayout";
import { Theme, defaultTheme } from "./theme";

export type DOMMount = { update: (r: LayoutResult) => void; destroy: () => void };

export function mountAbsoluteDOM(
    container: HTMLElement,
    initial: LayoutResult,
    theme: Theme = defaultTheme
): DOMMount {
    const root = document.createElement("div");
    root.style.position = "relative";
    root.style.width = "100%";
    root.style.height = "100%";
    container.appendChild(root);

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    Object.assign(svg.style, { position: "absolute", inset: "0", pointerEvents: "none" });
    root.appendChild(svg);

    const draw = (r: LayoutResult) => {
        // clear
        root.querySelectorAll("[data-node]").forEach(n => n.remove());
        while (svg.firstChild) svg.removeChild(svg.firstChild);

        // wires
        for (const w of r.wires) {
            const a = r.boxes[w.source], b = r.boxes[w.target];
            if (!a || !b) continue;
            const ax = a.tl.x + a.size.x / 2, ay = a.tl.y + a.size.y / 2;
            const bx = b.tl.x + b.size.x / 2, by = b.tl.y + b.size.y / 2;
            const line = document.createElementNS(svgNS, "line");
            line.setAttribute("x1", String(ax));
            line.setAttribute("y1", String(ay));
            line.setAttribute("x2", String(bx));
            line.setAttribute("y2", String(by));
            line.setAttribute("stroke", theme.wire.stroke);
            line.setAttribute("stroke-width", String(theme.wire.width));
            svg.appendChild(line);
        }

        // nodes
        for (const b of Object.values(r.boxes)) {
            const el = document.createElement("div");
            el.dataset.node = b.id;
            const s = el.style;
            s.position = "absolute";
            s.left = `${b.tl.x}px`;
            s.top = `${b.tl.y}px`;
            s.width = `${b.size.x}px`;
            s.height = `${b.size.y}px`;
            s.border = `1px solid ${theme.node.border}`;
            s.borderRadius = `${theme.node.radius}px`;
            s.background = theme.node.bg;
            s.boxSizing = "border-box";
            s.fontSize = `${theme.node.fontSize}px`;
            s.color = theme.node.text;
            s.display = "flex";
            s.alignItems = "center";
            s.justifyContent = "center";
            (s as any).userSelect = "none"; // TS dom lib sometimes misses this
            el.textContent = b.id;
            root.appendChild(el);
        }
    };

    draw(initial);

    return {
        update: draw,
        destroy: () => container.removeChild(root),
    };
}

```

### src/components/config.ts

``` ts
export class Config<T extends Record<string, any>> 
{
    public set<K extends keyof T>(key: K, value: T[K]) 
    {
        this.settings[key] = value;
    }

    public get<K extends keyof T>(key: K): T[K] 
    {
        return this.settings[key];
    }

    public reset<K extends keyof T>(key: K) 
    {
        this.settings[key] = this.defaults[key];
    }

    public resetAll() 
    {
        this.settings = { ...this.defaults };
    }

    constructor(private settings: T, private defaults : T = settings) 
    {
        
    }
}
```

### src/components/engine/computeLayout.ts

``` ts
import { Vector } from "../geometry";
import { NodeConfig } from "../graph";
import { LayoutTypes, LayoutChildrenMode } from "../layout/layout.enum";
import { LayoutConfigs, resolveLayoutName } from "../layout/layout.values";
import { Layout } from "../layout/layout";
import { LayoutTuningConfig } from "../layout/layout.tuning";

export type Mode = "graph" | "nested";
export type ModeMap = Record<string, Mode>;

export type Box = {
  id: string;
  parentId?: string;
  tl: Vector;        // absolute top-left in canvas coords
  size: Vector;
};

export type Wire = { source: string; target: string };

export type LayoutResult = { boxes: Record<string, Box>; wires: Wire[] };

export function computeLayout(
  root: NodeConfig,
  modes: ModeMap,
  nodeSize: Vector,
  spacing: number
): LayoutResult {
  const boxes: Record<string, Box> = {};
  const wires: Wire[] = [];

  function place(node: NodeConfig, level: number, assigned?: Box): void {
    const id = node.id;
    const mode: Mode = modes[id] ?? "graph";
    const chosen = resolveLayoutName(node, node.layout ?? LayoutTypes.Grid);
    const strat: Layout = LayoutConfigs.get<LayoutTypes>(chosen);

    // If we were given a concrete frame for this node, use it as-is.
    let box: Box;
    if (assigned) {
      box = assigned;
    } else {
      const size =
        mode === "graph"
          ? nodeSize
          : strat.preferredSize({
              count: (node.children ?? []).length,
              nodeSize,
              spacing,
              mode: LayoutChildrenMode.NESTED,
            });
      const tl = node.position ?? Vector.scalar(0);
      box = { id, tl, size };
    }

    boxes[id] = box;

    const children = node.children ?? [];
    if (!children.length) return;

    if (mode === "nested") {
      // Nested children are placed INSIDE this node’s box
      const pad = LayoutTuningConfig.get("outerPad")(spacing);
      const inner = box.size.subtract(Vector.scalar(2 * pad)).clamp(1, Infinity);
      const innerTL = box.tl.add(Vector.scalar(pad));

      if (chosen === LayoutTypes.Grid) {
        const frames = strat.nestedFrames({ children, parentSize: inner, spacing });
        for (const c of children) {
          const item = frames.grid.getItem(c.id)!;
          const pos = item.dimensions.getPosition();
          const sz = item.dimensions.getSize().subtract(Vector.scalar(2 * frames.ip)).clamp(1, Infinity);
          const childBox: Box = {
            id: c.id,
            parentId: id,
            tl: innerTL.add(pos).add(Vector.scalar(frames.ip)),
            size: sz,
          };
          place(c, level + 1, childBox);
        }
      } else {
        // RADIAL nested → we place children by centers; if a child is itself "nested",
        // give it a preferred container size; otherwise use nodeSize.
        for (const c of children) {
          const centers = strat.placeChildren({
            mode: LayoutChildrenMode.NESTED,
            children,
            parent: node,
            origin: inner.scale(1 / 2),
            level,
            nodeSize,
            spacing,
            parentSize: inner,
          });
          const p = centers[c.id] ?? inner.scale(1 / 2);

          const childMode: Mode = modes[c.id] ?? "graph";
          const childChosen = resolveLayoutName(c, c.layout ?? LayoutTypes.Grid);
          const childStrat = LayoutConfigs.get<LayoutTypes>(childChosen);

          const desiredSize =
            childMode === "nested"
              ? childStrat.preferredSize({
                  count: (c.children ?? []).length,
                  nodeSize,
                  spacing,
                  mode: LayoutChildrenMode.NESTED,
                })
              : nodeSize;

          const tlChild = innerTL.add(p.subtract(desiredSize.halve()));
          const childBox: Box = { id: c.id, parentId: id, tl: tlChild, size: desiredSize };
          place(c, level + 1, childBox);
        }
      }
    } else {
      // GRAPH mode: children live outside, connected by edges, no parentId
      const centers = strat.placeChildren({
        mode: LayoutChildrenMode.GRAPH,
        children,
        parent: node,
        origin: box.tl.add(box.size.scale(1 / 2)),
        level,
        nodeSize,
        spacing,
        parentSize: box.size,
      });

      for (const c of children) {
        const cc = centers[c.id];
        const tlChild = cc.subtract(nodeSize.halve());
        const childBox: Box = { id: c.id, tl: tlChild, size: nodeSize };
        wires.push({ source: id, target: c.id });
        place(c, level + 1, childBox);
      }
    }
  }

  place(root, 0);
  return { boxes, wires };
}
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
}
console.log(new Vector(3,4).length());                 // 5
console.log(new Vector(1,0).rotate(Math.PI/2));        // ~ (0,1)
console.log(new Vector(2,3).crossProduct(new Vector(5,7))); // 2*7 - 3*5 = -1
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

### src/components/layout/iterators.types.ts

``` ts
import { Vector } from "../geometry";
import { LayoutChildrenMode } from "./layout.enum";
import { Shapes } from "../geometry";

/** Unit point in [0,1]² (center-based for grid centers). */
export type UnitPoint = Vector;

/** Compute unit point for i-th child among n, given a (cols,rows) heuristic. */
export type UnitIterator = (i: number, n: number, rowCol: Vector) => UnitPoint;

/** Map a unit point into a concrete rectangle (top-left + size). */
export type RectMapper = (u: UnitPoint, rect: Shapes.Rectangle) => Vector;

/** Anchor offset for GRAPH placements (tree-below, etc.). */
export type AnchorIterator = (ctx: { mode: LayoutChildrenMode; parentSize: Vector; spacing: number }) => Vector;

/** Angle iterator for radial layouts (delegates tuning for start/cw/step). */
export type AngleIterator = (i: number, n: number) => number;

/** Iterator object = composition of unit/angle + mapping + anchoring. */
export interface IteratorOps {
    unit?: UnitIterator;           // e.g., grid center
    mapToRect?: RectMapper;        // maps unit → rect coords
    anchor: AnchorIterator;        // anchor for graph mode
    angle?: AngleIterator;         // for radial
}

/** Concrete iterator with helpers to derive positions. */
export class Iterator {
    constructor(private ops: IteratorOps) {}

    /** Centers inside rect using unit iterator (grid). */
    centersInRect(n: number, rowCol: Vector, rect: Shapes.Rectangle): Vector[] {
        if (!this.ops.unit || !this.ops.mapToRect) return [];
        const res: Vector[] = [];
        for (let i = 0; i < n; i++) {
            const u = this.ops.unit(i, n, rowCol);
            res.push(this.ops.mapToRect(u, rect));
        }
        return res;
    }

    /** Anchored centers for graph mode; caller applies top-left later. */
    anchorOffset(ctx: { mode: LayoutChildrenMode; parentSize: Vector; spacing: number }): Vector {
        return this.ops.anchor(ctx);
    }

    /** Angles for radial iteration. */
    angles(n: number): number[] {
        if (!this.ops.angle) return [];
        const res: number[] = [];
        for (let i = 0; i < n; i++) res.push(this.ops.angle(i, n));
        return res;
    }
}

```

### src/components/layout/layout.config.ts

``` ts
import { 
    Config 
} from "../config";
import { 
    Vector 
} from "../geometry";
import { 
    LayoutTypes 
} from "./layout.enum";

export type LayoutConfigOptions = 
{
    mode        : LayoutTypes;
    spacing     : number;
    nodeSize    : Vector;
}

export const layoutConfig = new Config<LayoutConfigOptions>({
    mode     : LayoutTypes.Grid,
    spacing  : 10,
    nodeSize : new Vector(100, 100)
});

export const nestedGridConfig = new Config<{
    outerPadding : Vector;
}>({
    outerPadding : new Vector(20, 20),
});
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

### src/components/layout/layout.iterators.ts

``` ts
import { Shapes, Vector } from "../geometry";
import { Iterator, IteratorOps } from "./iterators.types";
import { LayoutChildrenMode } from "./layout.enum";
import { Config } from "../config";
import { LayoutTuning, LayoutTuningConfig } from "./layout.tuning";

/** map unit [0,1]² → top-left rect (position + u * size). */
export const mapToRect = (u: Vector, r: Shapes.Rectangle): Vector =>
     r.getPosition().add(u.multiply(r.getSize()));

/** correct grid centers: ((col+.5)/cols, (row+.5)/rows) */
export const gridUnit = (i: number, n: number, rowCol: Vector): Vector => {
    const cols = Math.max(1, rowCol.x);
    const rows = Math.max(1, rowCol.y);
    const col = i % cols;
    const row = Math.floor(i / cols);
    return new Vector((col + 0.5) / cols, (row + 0.5) / rows);
};

/** iterator registry */
export type IteratorsSet = {
    grid: Iterator;
    radial: Iterator;
};

export const buildIterators = (tuning: Config<LayoutTuning> = LayoutTuningConfig): IteratorsSet => {
    const opsGrid: IteratorOps = {
        unit: gridUnit,
        mapToRect,
        anchor: ({ mode, parentSize, spacing }) =>
            mode === LayoutChildrenMode.GRAPH ? tuning.get("anchor")({ mode, parentSize, spacing }) : new Vector(0, 0),
    };

    const opsRadial: IteratorOps = {
        anchor: ({ mode, parentSize, spacing }) =>
            mode === LayoutChildrenMode.GRAPH ? tuning.get("anchor")({ mode, parentSize, spacing }) : new Vector(0, 0),
        angle: (i, n) => {
            const start = tuning.get("startAngle")();
            const cw    = tuning.get("clockwise")();
            return tuning.get("angleOf")(i, n, start, cw);
        },
    };

    return {
        grid:   new Iterator(opsGrid),
        radial: new Iterator(opsRadial),
    };
};

/** default singleton */
export const IteratorsConfig = new Config<IteratorsSet>(buildIterators());

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
} from "./strategies/grid.mapped";
export type PreferredSizeParam = {
  /* number of direct children */
  count   : number;
  /* node box size used when graph-mode node is rendered (base unit) */
  nodeSize: Vector;
  /* visual spacing knob */
  spacing : number;
  /* where the node is being asked to measure for */
  mode    : LayoutChildrenMode; // GRAPH | NESTED
};

/** formerly autosizeParent */
export type PreferredSizeReturn = Vector;
export type AutosizeParentParam = 
{
    count   : number;
    nodeSize: Vector;
    spacing : number;
    min     : Vector;
}
export type AutosizeParentReturn = Vector;

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
    abstract preferredSize  (args: PreferredSizeParam ) : PreferredSizeReturn;
}

/* =========================================================
 * NESTED GRID
 *  - Outer grid cells perfectly tessellate inner content
 *  - Each child renders inside a "cellInner" = (cell − 2*itemPad)
 * ========================================================= */


/* ---------- Tunables (pure) ---------- */

export const outerPad   = (s: number) : number => Math.max(12, s * 1.0); // padding inside PARENT (nested)
export const itemPad    = (s: number) : number => Math.max(4, s * 0.25); // inner padding inside each GRID CELL

export type PCTreeBelowParams = Pick<NestedFrameParam, 'parentSize' | 'spacing'>;
/* ---------- GRAPH anchoring ---------- */
export const pcTreeBelow = ({ parentSize, spacing }: PCTreeBelowParams) : Vector => new Vector(0, (parentSize?.y ?? 0) / 2 + spacing * 1.25)


```

### src/components/layout/layout.tuning.ts

``` ts
import { Config } from "../config";
import { Vector } from "../geometry";
import { LayoutChildrenMode } from "./layout.enum";

export type LayoutTuning = {
  /* paddings */
  outerPad: (spacing: number) => number;     // nested parent content padding
  itemPad : (spacing: number) => number;     // inner cell padding (grid-only)

  /* grid row/col heuristic — return Vector(cols, rows) */
  rowCol: (n: number) => Vector;

  /* anchor for GRAPH placements (tree-below) */
  anchor: (ctx: { mode: LayoutChildrenMode; parentSize: Vector; spacing: number }) => Vector;

  /* RADIAL knobs */
  startAngle: () => number;                  // radians (0 = 3 o’clock)
  clockwise : () => boolean;                 // direction
  angleOf   : (i: number, n: number, start: number, cw: boolean) => number;

  /* GRAPH radial radius: r = base(nodeSize, spacing) * (1 + level * levelScale) */
  radialBase     : (nodeSize: Vector, spacing: number) => number;
  radialLevelScale: () => number;
  minRadius      : () => number;

  /* NESTED radial preferred size if no size is provided (root-only or free): */
  nestedRadialPreferred: (count: number, nodeSize: Vector, spacing: number) => Vector;
  nestedNodeScale: (level: number) => number;  // NEW
};

export const defaultTuning: LayoutTuning = {
  outerPad: (s) => Math.max(12, s * 1.0),
  itemPad : (s) => Math.max(4,  s * 0.25),

  rowCol: (n) => {
    const rows = Math.ceil(Math.sqrt(Math.max(1, n)));
    const cols = Math.ceil(n / rows);
    return new Vector(cols, rows);
  },

  anchor: ({ mode, parentSize, spacing }) =>
    mode === LayoutChildrenMode.GRAPH
      ? new Vector(0, (parentSize?.y ?? 0) / 2 + spacing * 1.25)
      : new Vector(0, 0),

  startAngle: () => 0,
  clockwise : () => true,
  angleOf: (i, n, start, cw) => {
    const tau = Math.PI * 2;
    return start + (cw ? 1 : -1) * (i / Math.max(1, n)) * tau;
  },

  radialBase: (nodeSize, spacing) => nodeSize.max() + spacing * 3, // was “*3”
  radialLevelScale: () => 0.6,                                      // was “0.6”
  minRadius: () => 8,

  nestedNodeScale: (level) => Math.pow(0.85, level + 1), // NEW: ~15% smaller per depth
  // sensible default: grows gently with child count
  nestedRadialPreferred: (count, nodeSize, spacing) => {
    const ring = Math.max(1, count);
    const r = Math.max(nodeSize.max() + spacing * 2, nodeSize.max() * (1 + 0.15 * ring));
    const d = 2 * r + 2 * Math.max(12, spacing * 1.0);
    return Vector.scalar(d);
  },
};

export const LayoutTuningConfig = new Config<LayoutTuning>(defaultTuning);

```

### src/components/layout/layout.values.ts

``` ts
import { 
    Config 
} from "../config";
import { 
    GridLayout 
} from "./strategies/grid.layout";
import { 
    Layout 
} from "./layout";
import { 
    LayoutTypes 
} from "./layout.enum";
import { 
    RadialLayout 
} from "./strategies/radial.layout";
import { 
    NodeConfig 
} from "../graph";

/* =========================================================
 * Public API (functional, no mutations)
 * ========================================================= */

export type ClassOf<T> = { new(...args: any[]): T };
export const LayoutConfigs = new Config<Record<LayoutTypes, Layout>>(
    {
        grid   : new GridLayout(),
        radial : new RadialLayout(),
    }
);
export const resolveLayoutName = (node : NodeConfig, fallback : LayoutTypes) : LayoutTypes => node.layout && LayoutConfigs.get<LayoutTypes>(node.layout) ? node.layout : fallback;
```

### src/components/layout/strategies/grid.layout.ts

``` ts
import { Vector, Shapes } from "../../geometry";
import {
  Layout, NestedFrameParam, PlaceChildrenReturn, PreferredSizeParam,
  NestedFramesReturn, PreferredSizeReturn, PlaceChildrenParam
} from "../layout";
import { LayoutChildrenMode } from "../layout.enum";
import { MappedGrid, MappedGridItemData } from "./grid.mapped";
import { GridItem } from "./grid";
import { Config } from "../../config";
import { LayoutTuning, LayoutTuningConfig } from "../layout.tuning";
import { gridUnit, IteratorsConfig, IteratorsSet, mapToRect } from "../layout.iterators";
import { mapIndex } from "./radial.layout";

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
    return { sizes, offs };
};

export const rcSquare = (
                            n : number
                        ) 
                        : Vector => 
{ 
    const rows = Math.ceil(Math.sqrt(Math.max(1, n)));
    const cols = Math.ceil(n / rows);
    return new Vector(cols, rows);
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
        const gridSize  = this.tuning.get("rowCol")(children.length); // Vector(cols, rows)
        const ip        = this.tuning.get("itemPad")(spacing);

        // Inner content (tessellated space)
        const content : Vector = 
            parentSize
                .round   ()
                .clamp   (1, Infinity);

        // Perfect integer subdivision with remainder distribution
        const X : SplitEvenReturn = splitEven(content.x, gridSize.x);
        const Y : SplitEvenReturn = splitEven(content.y, gridSize.y);

        const grid : MappedGrid = new MappedGrid(gridSize);
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
        return {
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
        const { children, nodeSize, spacing, origin, parentSize, mode } = args;
        const rowCol    = this.tuning.get("rowCol")(children.length);
        const ip        = this.tuning.get("itemPad")(spacing);
        const anchor    = this.iters.get("grid").anchorOffset({ mode, parentSize, spacing });
        switch(args.mode)
        {
            case LayoutChildrenMode.GRAPH:
                // GRAPH: logical cell = node + 2*itemPad; anchor below parent
                const cell    = nodeSize.add(Vector.scalar(2 * ip));
                const total   = rowCol.multiply(cell);
                const topLeft = origin.add(anchor).subtract(total.halve());
                return Object
                        .fromEntries(
                            mapIndex(
                                children.length,
                                (i : number) => [
                                    children[i].id,
                                    topLeft
                                        .add(cell.multiply(new Vector(i % rowCol.x, Math.floor(i / rowCol.x))))
                                        .add(cell.halve())
                                        .round()
                                ]
                            )
                        );
            case LayoutChildrenMode.NESTED:
                const rect = new Shapes.Rectangle(parentSize, new Vector(0,0));
                const centers = this.iters.get("grid").centersInRect(children.length, rowCol, rect);
                return Object.fromEntries(children.map((c, i) => [c.id, centers[i]]));
        }
    };
    preferredSize = ({ count, nodeSize, spacing, mode }: PreferredSizeParam): PreferredSizeReturn => {
        // grid preferred size = exact cells for nodeSize + itemPad, plus outerPad
        const rowCol    = this.tuning.get("rowCol")(count);
        const ip        = this.tuning.get("itemPad")(spacing);
        const pad       = this.tuning.get("outerPad")(spacing);
        const cell      = nodeSize.add(Vector.scalar(2 * ip));
        const inner     = rowCol.multiply(cell);
        return inner.add(Vector.scalar(2 * pad));
    };
    
}
```

### src/components/layout/strategies/grid.mapped.ts

``` ts
import { 
    Vector 
} from "../../geometry";
import { 
    Grid, 
    GridItem 
} from "./grid";

export type MappedGridItemID = string;
export type MappedGridItemData = 
{
    id : MappedGridItemID;
};
export  class   MappedGrid<T extends MappedGridItemData = MappedGridItemData> 
        extends Grid<T>
{
    protected map : Map<MappedGridItemID, Vector> = new Map();
    override set = (cell : Vector, item : GridItem<T>) : void => 
    {
        this.grid[cell.y][cell.x] = item;
        this.map.set(item.data.id, cell);
    }
    getCell = (id : MappedGridItemID) : Vector | undefined => this.map.get(id);
    getItem = (id : MappedGridItemID) : GridItem<T | undefined> | undefined => 
        {
        const cell = this.getCell(id);
        if (!cell) return undefined;
        return this.grid[cell.y][cell.x];
    }
}

 
```

### src/components/layout/strategies/grid.ts

``` ts
import { 
    Vector, 
    Shapes 
} from "../../geometry";
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
    public grid : GridItem<T | undefined>[][];
    constructor(public size : Vector) 
    {
        this.grid = Array
                        .from(
                            { 
                                length : size.y 
                            }, 
                            () => Array
                                    .from(
                                        { 
                                            length : size.x 
                                        }, 
                                        () => new GridItem<undefined>(
                                                                new Vector(0, 0), 
                                                                new Shapes.Rectangle(
                                                                                        new Vector(0, 0), 
                                                                                        new Vector(0, 0)
                                                                                    ),
                                                                undefined
                                                             )
                                    )
                        );
    }
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

### src/components/layout/strategies/radial.layout.ts

``` ts
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
    LayoutTypes 
} from "./layout/layout.enum";
import { LayoutView, ReactAdapterKind } from "./adapters/react-view.adapter";
import { computeLayout, ModeMap } from "./engine/computeLayout";
import { LabeledSlider, Select } from "./ui/controls";
import { Shell } from "./ui/styles";
import { Configurator } from "./ui/Configurator";

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
    { id: "B", label: "B", layout: LayoutTypes.Grid,   children: [{ id: "B1" }, { id: "B2" }, { id: "B3" }, { id: "B4" }] },
    { id: "C", label: "C", layout: LayoutTypes.Radial, children: [{ id: "C1" }, { id: "C2" }, { id: "C3" }, { id: "C4" }] },
  ],
};
Object.freeze(DEMO_MIXED);
/* -------------------------------------------
 * Helpers
 * ------------------------------------------- */
type LayoutOverrideMap = Record<string, LayoutTypes | undefined>;
type NodeIndex = { id: string; label: string };

const MIXED = "__mixed__";

function flattenNodes(n: NodeConfig): NodeIndex[] {
  const out: NodeIndex[] = [{ id: n.id, label: n.label ?? n.id }];
  for (const c of n.children ?? []) out.push(...flattenNodes(c));
  return out;
}
function findNode(root: NodeConfig, id: string): NodeConfig | undefined {
  if (root.id === id) return root;
  for (const c of root.children ?? []) {
    const hit = findNode(c, id);
    if (hit) return hit;
  }
  return undefined;
}
function subtreeIds(root: NodeConfig, startId: string): string[] {
  const node = findNode(root, startId);
  if (!node) return [];
  return flattenNodes(node).map(n => n.id);
}
function applyLayoutOverrides(node: NodeConfig, overrides: LayoutOverrideMap): NodeConfig {
  const overridden: NodeConfig = { ...node, layout: overrides[node.id] ?? node.layout };
  if (node.children?.length) overridden.children = node.children.map(c => applyLayoutOverrides(c, overrides));
  return overridden;
}
function allSame<T>(arr: T[]): { same: boolean; value: T | undefined } {
  if (!arr.length) return { same: true, value: undefined };
  const v = arr[0];
  return { same: arr.every(x => x === v), value: v };
}

/* -------------------------------------------
 * Main demo
 * ------------------------------------------- */
export type ParentChildLayoutsDemoProps = { config?: NodeConfig };

export function ParentChildLayoutsDemo({ config = DEMO_MIXED }: ParentChildLayoutsDemoProps) {
  const [adapter, setAdapter] = useState<ReactAdapterKind>("dom");
  const [spacing, setSpacing] = useState(24);
  const [nodeW, setNodeW] = useState(110);
  const [nodeH, setNodeH] = useState(54);

  // NEW: layout scope + mode map
  const [layoutName, setLayoutName] = useState<LayoutTypes>(LayoutTypes.Grid);
  const [modes, setModes] = useState<ModeMap>({ root: "graph", A: "nested", B: "graph", C: "nested" });
  const [scope, setScope] = useState<"all" | string>("all");
  const [applyToSubtree, setApplyToSubtree] = useState(true);

  // apply layout to scope by mutating a *derived* config (never the frozen constants)
  const effectiveConfig = useMemo<NodeConfig>(() => {
    function clone(n: NodeConfig): NodeConfig {
      return { ...n, children: (n.children ?? []).map(clone) };
    }
    const copy = clone(config);
    function setLayout(n: NodeConfig) {
      if (scope === "all" || n.id === scope) n.layout = layoutName;
      if (applyToSubtree || scope === "all") (n.children ?? []).forEach(setLayout);
    }
    setLayout(copy);
    return copy;
  }, [config, layoutName, scope, applyToSubtree]);

  const nodeSize = useMemo(() => new Vector(Math.max(20, nodeW), Math.max(20, nodeH)), [nodeW, nodeH]);
  const result   = useMemo(() => computeLayout(effectiveConfig, modes, nodeSize, spacing), [effectiveConfig, modes, nodeSize, spacing]);

  return (
    <div style={Shell.outer}>
      <div style={Shell.bar}>
        <Select label="Right Pane" value={adapter} onChange={(v) => setAdapter(v as ReactAdapterKind)}
                options={[{ label: "DOM", value: "dom" }, { label: "Canvas", value: "canvas" }, { label: "React Flow", value: "reactflow" }]} />
        <Configurator
          root={config}
          modes={modes} setModes={setModes}
          layout={layoutName} setLayout={setLayoutName}
          scope={scope} setScope={setScope}
          applyToSubtree={applyToSubtree} setApplyToSubtree={setApplyToSubtree}
        />
        <LabeledSlider label="Spacing" value={spacing} min={0} max={80} onChange={setSpacing} />
        <LabeledSlider label="Node W"  value={nodeW}   min={40} max={240} onChange={setNodeW} />
        <LabeledSlider label="Node H"  value={nodeH}   min={30} max={180} onChange={setNodeH} />
      </div>

      <div style={Shell.left}>
        <div style={Shell.title}>Graph (Edges)</div>
        <div style={Shell.rf}>
          <LayoutView kind="reactflow" result={result} />
        </div>
      </div>

      <div style={Shell.right}>
        <div style={Shell.title}>Right Pane: {adapter}</div>
        <div style={{ position: "absolute", inset: 0 }}>
          <LayoutView kind={adapter} result={result} />
        </div>
      </div>
    </div>
  );
}
```

### src/components/ui/Configurator.tsx

``` tsx
// src/components/ui/Configurator.tsx
import { JSX, useMemo } from "react";
import { Select } from "./controls";
import { NodeConfig } from "../graph";
import { LayoutTypes } from "../layout/layout.enum";
import { Mode, ModeMap } from "../engine/computeLayout";

type Scope = "all" | string; // "all" or a node id

function collectIds(root: NodeConfig): string[] {
  const ids: string[] = [];
  (function walk(n: NodeConfig) {
    ids.push(n.id);
    (n.children ?? []).forEach(walk);
  })(root);
  return ids;
}

export function Configurator({
  root, modes, setModes, layout, setLayout, scope, setScope, applyToSubtree, setApplyToSubtree,
}: {
  root: NodeConfig;
  modes: ModeMap;
  setModes: (f: (prev: ModeMap) => ModeMap) => void;
  layout: LayoutTypes;
  setLayout: (l: LayoutTypes) => void;
  scope: Scope;
  setScope: (s: Scope) => void;
  applyToSubtree: boolean;
  setApplyToSubtree: (v: boolean) => void;
}): JSX.Element {
  const ids = useMemo(() => collectIds(root), [root]);

  const modeOptions = [
    { label: "Graph",  value: "graph"  },
    { label: "Nested", value: "nested" },
  ];
  const layoutOptions = [
    { label: "Grid",   value: LayoutTypes.Grid   },
    { label: "Radial", value: LayoutTypes.Radial },
  ];

  function idsInScope(): string[] {
    if (scope === "all") return ids;
    if (!applyToSubtree) return [scope];
    const res: string[] = [];
    (function walk(n: NodeConfig) {
      res.push(n.id);
      (n.children ?? []).forEach(walk);
    })((function find(n: NodeConfig, id: string): NodeConfig {
      if (n.id === id) return n;
      for (const c of n.children ?? []) {
        const r = find(c, id);
        if (r) return r;
      }
      return n; // should not get here
    })(root, scope as string));
    return res;
  }

  return (
    <div style={{ display: "inline-flex", gap: 12, alignItems: "center" }}>
      <Select
        label="Edit"
        value={scope}
        onChange={(v) => setScope(v as Scope)}
        options={[{ label: "All nodes", value: "all" }, ...ids.map(id => ({ label: id, value: id }))]}
      />
      <label style={{ fontSize: 12 }}>
        <input type="checkbox" checked={applyToSubtree} onChange={(e) => setApplyToSubtree(e.target.checked)} /> Apply to subtree
      </label>
      <Select
        label="Layout"
        value={layout}
        onChange={(v) => setLayout(v as LayoutTypes)}
        options={layoutOptions}
      />
      <Select
        label="Mode"
        value={"graph"} // display-only; we set by click below
        onChange={() => {}}
        options={modeOptions}
      />
      <div style={{ display: "inline-flex", gap: 8 }}>
        {modeOptions.map(m => (
          <button
            key={m.value}
            onClick={() => {
              const targetIds = idsInScope();
              setModes(prev => {
                const next = { ...prev };
                for (const id of targetIds) next[id] = m.value as Mode;
                return next;
              });
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

```

### src/components/ui/controls.tsx

``` tsx
import { JSX } from "react";
export function Select({
  label, value, onChange, options
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string; disabled?: boolean }[];
}): JSX.Element {
  // If current value is not in options, fall back to first enabled option
  const values = new Set(options.map(o => o.value));
  const safeValue = values.has(value) ? value : (options.find(o => !o.disabled)?.value ?? "");

  return (
    <div style={{ display: "inline-flex", alignItems: "center", marginRight: 12 }}>
      <label style={{ marginRight: 8, fontSize: 12 }}>{label}</label>
      <select value={safeValue} onChange={(e) => onChange(e.target.value)}>
        {options.map(o => (
          <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}


export function LabeledSlider({
  label, value, min, max, step = 1, onChange
}: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void;
}): JSX.Element {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", margin: "0 12px" }}>
      <label style={{ marginRight: 8, fontSize: 12 }}>{label}</label>
      <input type="range" min={min} max={max} step={step} value={value}
             onChange={(e) => onChange(parseInt(e.target.value, 10))} />
      <span style={{ marginLeft: 6, fontSize: 12 }}>{value}</span>
    </div>
  );
}

```

### src/components/ui/styles.ts

``` ts
export const Shell = {
  outer: { position: "relative" as const, width: "100vw", height: "100vh", overflow: "hidden" },
  barH: 72,
  bar: {
    position: "absolute" as const, left: 0, top: 0, width: "100%", height: 72,
    background: "#f6f8fa", borderBottom: "1px solid #d0d7de", zIndex: 1000, padding: 8, boxSizing: "border-box" as const
  },
  left: {
    position: "absolute" as const, left: 0, top: 72, bottom: 0, width: "50%", borderRight: "1px solid #e5e7eb",
    boxSizing: "border-box" as const
  },
  right: {
    position: "absolute" as const, left: "50%", right: 0, top: 72, bottom: 0, overflow: "auto", boxSizing: "border-box" as const
  },
  title: { position: "absolute" as const, left: 8, top: 8, fontSize: 11, color: "#64748b", zIndex: 1 },
  rf: { position: "absolute" as const, left: 0, right: 0, top: 0, bottom: 0 },
};

```

