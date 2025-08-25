# Source Catalog (TypeScript)

Generated on 2025-08-25T06:37:22.059Z

## Directory structure (src)

```
├── assets/

├── components/
│   ├── adapters/
│   │   ├── targets/
│   │   │   └── canvas.core.ts
│   │   ├── env.ts
│   │   └── theme.ts
│   ├── core/
│   │   ├── config/

│   │   ├── geometry/
│   │   │   ├── geometry.sanity.test.ts
│   │   │   └── index.ts
│   │   ├── ids-branding/
│   │   │   └── brand.ts
│   │   ├── logging/
│   │   │   └── logger.ts
│   │   ├── math/
│   │   │   └── index.ts
│   │   ├── result-error/

│   │   └── utils/

│   ├── graph/
│   │   ├── builders/
│   │   │   └── tree.ts
│   │   ├── model.ts
│   │   ├── types.ts
│   │   └── validate.ts
│   ├── iteration/
│   │   ├── iterate.ts
│   │   └── iteration.limits.ts
│   ├── layout/
│   │   ├── api/
│   │   │   ├── contracts.ts
│   │   │   └── index.ts
│   │   ├── constraints/

│   │   ├── engine/
│   │   │   ├── phases/
│   │   │   │   ├── contracts.ts
│   │   │   │   ├── parse.ts
│   │   │   │   ├── place.ts
│   │   │   │   ├── plan.ts
│   │   │   │   ├── post.ts
│   │   │   │   ├── route.ts
│   │   │   │   └── validate.ts
│   │   │   ├── context.ts
│   │   │   └── engine.ts
│   │   ├── iterator/
│   │   │   ├── iterator.registry.ts
│   │   │   ├── iterator.types.ts
│   │   │   └── layout.iterators.ts
│   │   ├── limits/
│   │   │   └── index.ts
│   │   ├── metrics/
│   │   │   └── metrics.ts
│   │   ├── registries/
│   │   │   ├── layout.registry.ts
│   │   │   └── router.registry.ts
│   │   ├── routers/
│   │   │   ├── line.router.ts
│   │   │   └── ortho.router.ts
│   │   ├── strategies/
│   │   │   ├── grid/
│   │   │   │   ├── grid.layout.ts
│   │   │   │   ├── grid.mapped.ts
│   │   │   │   └── grid.ts
│   │   │   └── radial/
│   │   │       └── radial.layout.ts
│   │   ├── tunings/

│   │   ├── layout.enum.ts
│   │   ├── layout.ts
│   │   ├── layout.tuning.ts
│   │   └── types.ts
│   ├── render/
│   │   ├── ports/
│   │   │   ├── canvas.port.ts
│   │   │   ├── dom.port.ts
│   │   │   └── types.ts
│   │   ├── theme/

│   │   └── views/
│   │       └── LayoutView.tsx
│   ├── tooling/
│   │   ├── diagnostics/
│   │   │   └── audit.ts
│   │   ├── exporters/
│   │   │   ├── reactflow.ts
│   │   │   └── svg.ts
│   │   ├── importers/

│   │   ├── testkit/

│   │   └── workers/

│   ├── ui/
│   │   ├── controls/

│   │   ├── playground/
│   │   │   └── Testbed.tsx
│   │   ├── styles/

│   │   ├── Configurator.tsx
│   │   ├── controls.tsx
│   │   └── styles.ts
│   ├── config.ts
│   ├── errors.ts
│   └── ParentChildFlow.tsx
└── App.tsx
```

## Files

### src/App.tsx

``` tsx
import { useState } from "react";
import { ParentChildLayoutsDemo } from "./components/ParentChildFlow";
import { TestbedMatrix } from "./components/ui/playground/Testbed";

export default function App() {
  const [tab, setTab] = useState<"playground" | "testbed">("playground");

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 12, top: 100, zIndex: 1000 }}>
        <button onClick={() => setTab("playground")} style={{ marginRight: 8 }}>Playground</button>
        <button onClick={() => setTab("testbed")}>Testbed</button>
      </div>
      {tab === "playground" ? <ParentChildLayoutsDemo /> : <TestbedMatrix />}
    </div>
  );
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

### src/components/adapters/targets/canvas.core.ts

``` ts
// canvas.core.ts
// - full draw (kept): drawLayoutToCanvas
// - CanvasRenderer2D with dirty-rect partial redraw
// - supports polylines on wires
// - no legacy imports

import { Shapes, Vector } from "../../core/geometry";
import { Theme, defaultTheme } from "../theme";

/* ----- local layout shape expected by the canvas drawer ----- */
type LegacyBox = {
  id: string;
  getPosition(): Vector;
  getSize(): Vector;
  parentId?: string;
  depth: number;
};
type LegacyWire = { id?: string; source: string; target: string; polyline?: Vector[] };
export type CanvasLayout = { boxes: Record<string, LegacyBox>; wires: LegacyWire[] };

/* ----------------------- public full draw ------------------ */
export const drawLayoutToCanvas = (
  ctx: CanvasRenderingContext2D,
  result: CanvasLayout,
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
  private prev: CanvasLayout | null = null;
  private theme: Theme;

  constructor(private canvas: HTMLCanvasElement, theme: Theme = defaultTheme) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D context not available");
    this.ctx = ctx;
    this.theme = theme;
  }

  setTheme(theme: Theme): void { this.theme = theme; }

  fullDraw(result: CanvasLayout): void {
    drawLayoutToCanvas(this.ctx, result, this.theme);
    this.prev = result;
  }

  update(next: CanvasLayout, opts: { partial?: boolean } = {}): void {
    const partial = opts.partial ?? true;
    if (!partial || !this.prev) { this.fullDraw(next); return; }

    const dirty = diffDirtyRect(this.prev, next, 2); // 2px pad
    if (!dirty) { this.prev = next; return; }

    const area = this.canvas.width * this.canvas.height;
    const dirtyArea = dirty.w * dirty.h;
    if (dirtyArea / Math.max(1, area) > 0.6) { this.fullDraw(next); return; }

    paintBackground(this.ctx, this.theme, dirty.x, dirty.y, dirty.w, dirty.h);

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(dirty.x, dirty.y, dirty.w, dirty.h);
    this.ctx.clip();
    drawWires(this.ctx, next, this.theme);
    this.ctx.restore();

    drawBoxesInRect(this.ctx, next, this.theme, dirty);
    this.prev = next;
  }
}

/* ----------------------------- drawing helpers ----------------------------- */

function paintBackground(ctx: CanvasRenderingContext2D, theme: Theme, x: number, y: number, w: number, h: number): void {
  ctx.save();
  ctx.fillStyle = theme.canvas.bg;
  ctx.fillRect(x, y, Math.max(0, w), Math.max(0, h));
  ctx.restore();
}

function drawWires(ctx: CanvasRenderingContext2D, result: CanvasLayout, theme: Theme): void {
  ctx.save();
  ctx.strokeStyle = theme.wire.stroke;
  ctx.lineWidth = theme.wire.width;

  for (const w of result.wires) {
    if (w.polyline && w.polyline.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(w.polyline[0].x, w.polyline[0].y);
      for (let i = 1; i < w.polyline.length; i++) ctx.lineTo(w.polyline[i].x, w.polyline[i].y);
      ctx.stroke();
      continue;
    }
    const a = result.boxes[w.source];
    const b = result.boxes[w.target];
    if (!a || !b) continue;
    const va: Vector = a.getSize().halve().add(a.getPosition());
    const vb: Vector = b.getSize().halve().add(b.getPosition());
    ctx.beginPath();
    ctx.moveTo(va.x, va.y);
    ctx.lineTo(vb.x, vb.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBoxes(ctx: CanvasRenderingContext2D, result: CanvasLayout, theme: Theme): void {
  const sorted = Object.values(result.boxes).sort((A, B) => A.depth - B.depth || A.id.localeCompare(B.id));
  ctx.save();
  ctx.font = `${theme.node.fontSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const b of sorted) drawOneBox(ctx, b, theme);
  ctx.restore();
}

function drawBoxesInRect(ctx: CanvasRenderingContext2D, result: CanvasLayout, theme: Theme, r: Rect): void {
  const sorted = Object.values(result.boxes).sort((A, B) => A.depth - B.depth || A.id.localeCompare(B.id));
  ctx.save();
  ctx.font = `${theme.node.fontSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const b of sorted) if (intersects(rectOfBox(b), r)) drawOneBox(ctx, b, theme);
  ctx.restore();
}

function drawOneBox(ctx: CanvasRenderingContext2D, b: LegacyBox, theme: Theme): void {
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

function rectOfBox(b: LegacyBox): Rect {
  const p = b.getPosition();
  const s = b.getSize();
  return { x: p.x, y: p.y, w: s.x, h: s.y };
}
function union(a: Rect | null, b: Rect): Rect {
  if (!a) return { ...b };
  const x1 = Math.min(a.x, b.x), y1 = Math.min(a.y, b.y);
  const x2 = Math.max(a.x + a.w, b.x + b.w), y2 = Math.max(a.y + a.h, b.y + b.h);
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}
function inflate(r: Rect, pad: number): Rect { return { x: r.x - pad, y: r.y - pad, w: r.w + 2 * pad, h: r.h + 2 * pad }; }
function intersects(a: Rect, b: Rect): boolean {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}
function lineBounds(a: Vector, b: Vector, pad = 1): Rect {
  const x1 = Math.min(a.x, b.x), y1 = Math.min(a.y, b.y);
  const x2 = Math.max(a.x, b.x), y2 = Math.max(a.y, b.y);
  return inflate({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 }, pad);
}

function diffDirtyRect(prev: CanvasLayout, next: CanvasLayout, pad = 0): Rect | null {
  let dirty: Rect | null = null;
  const ids = new Set<string>([...Object.keys(prev.boxes), ...Object.keys(next.boxes)]);

  for (const id of ids) {
    const A = prev.boxes[id]; const B = next.boxes[id];
    if (!A && B) { dirty = union(dirty, inflate(rectOfBox(B), pad)); continue; }
    if (A && !B) { dirty = union(dirty, inflate(rectOfBox(A), pad)); continue; }
    if (A && B) {
      const ra = rectOfBox(A), rb = rectOfBox(B);
      if (ra.x !== rb.x || ra.y !== rb.y || ra.w !== rb.w || ra.h !== rb.h) {
        dirty = union(union(dirty, inflate(ra, pad)), inflate(rb, pad));
      }
    }
  }

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
      if (w.polyline && w.polyline.length >= 2) {
        // conservative: union all segments
        for (let i = 1; i < w.polyline.length; i++) dirty = union(dirty, lineBounds(w.polyline[i - 1], w.polyline[i], pad + 1));
      } else if (changed.has(w.source) || changed.has(w.target)) {
        const a = next.boxes[w.source]; const b = next.boxes[w.target];
        if (a && b) {
          const ca = a.getSize().halve().add(a.getPosition());
          const cb = b.getSize().halve().add(b.getPosition());
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

### src/components/core/geometry/geometry.sanity.test.ts

``` ts
import { Vector } from "./index";


console.log(new Vector(3, 4).length()); // 5
console.log(new Vector(1, 0).rotate(Math.PI / 2)); // ~ (0,1)
console.log(new Vector(2, 3).crossProduct(new Vector(5, 7))); // 2*7 - 3*5 = -1

```

### src/components/core/geometry/index.ts

``` ts
import { add, multiply, divide, subtract } from "../math";
import { Branded, brand } from "../ids-branding/brand";


export type VectorBrand = "Any" | "Position" | "Size" | "Offset" | "Center";

export enum Dimension { X = "x", Y = "y" }

export type Fold = (value: number) => number;
export type NestFold = (vector: Vector) => number;
export type FoldWith = (value1: number, value2: number) => number;
export type Reduce = (x: number, y: number) => number;

export class Vector {
  constructor(public readonly x: number, public readonly y: number) { }

  public as<B extends VectorBrand>(b: B): Branded<Vector, B> {
    // keep a debug runtime brand
    return brand(this, b);
  }
  public asPosition() { return this.as("Position"); }
  public asSize() { return this.as("Size"); }
  public asOffset() { return this.as("Offset"); }
  public asCenter() { return this.as("Center"); }

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
  public rotate = (radians: number) => Vector.scalar(radians).trig().nestFold(
    (v: Vector) => v.reflect(Dimension.X).multiply(this).sum(),
    (v: Vector) => v.swap().multiply(this).sum()
  );
  public clamp = (min: number = -Infinity, max: number = Infinity) => this.map((x: number) => Math.min(Math.max(x, min), max));
  public nestFold = (left: NestFold, right: NestFold) => new Vector(left(this), right(this));
  public mapWith = (f: FoldWith, vector: Vector) => this.foldWith(f, f, vector);
  public foldWith = (left: FoldWith, right: FoldWith, vector: Vector) => new Vector(left(this.x, vector.x), right(this.y, vector.y));
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

### src/components/core/ids-branding/brand.ts

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

### src/components/core/logging/logger.ts

``` ts

// logging.ts
export enum LogLevel { Debug = 10, Info = 20, Warn = 30, Error = 40, Off = 99 }
export type LogCtx = Record<string, unknown>;

export interface Logger {
    level: LogLevel;
    child(bindings: LogCtx): Logger;
    debug(msg: string, ctx?: LogCtx): void;
    info(msg: string, ctx?: LogCtx): void;
    warn(msg: string, ctx?: LogCtx): void;
    error(msg: string, ctx?: LogCtx): void;
}

export class NoopLogger implements Logger {
    level = LogLevel.Off;
    child(): Logger { return this; }
    debug(): void { } info(): void { } warn(): void { } error(): void { }
}

export class ConsoleLogger implements Logger {
    constructor(public level: LogLevel = LogLevel.Warn, private readonly bindings: LogCtx = {}) { }
    child(bindings: LogCtx): Logger { return new ConsoleLogger(this.level, { ...this.bindings, ...bindings }); }
    private out(kind: "debug" | "info" | "warn" | "error", msg: string, ctx?: LogCtx): void {
        // eslint-disable-next-line no-console
        console[kind]({ msg, ...this.bindings, ...(ctx ?? {}) });
    }
    debug(msg: string, ctx?: LogCtx) { if (this.level <= LogLevel.Debug) this.out("debug", msg, ctx); }
    info(msg: string, ctx?: LogCtx) { if (this.level <= LogLevel.Info) this.out("info", msg, ctx); }
    warn(msg: string, ctx?: LogCtx) { if (this.level <= LogLevel.Warn) this.out("warn", msg, ctx); }
    error(msg: string, ctx?: LogCtx) { if (this.level <= LogLevel.Error) this.out("error", msg, ctx); }
}

```

### src/components/core/math/index.ts

``` ts

/* ---------- Functional helpers ---------- */
export const ceilSqrt = (n: number): number => Math.ceil(Math.sqrt(Math.max(1, n)));
export const add = (a: number, b: number): number => a + b;
export const subtract = (a: number, b: number): number => a - b;
export const multiply = (a: number, b: number): number => a * b;
export const divide = (a: number, b: number): number => a / b;

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

### src/components/graph/builders/tree.ts

``` ts

import type { Graph } from "../model";
import type { NodeAttrs, Edge } from "../../layout/api/contracts";
import { NodeConfig } from "../types";

/** Build a normalized Graph from your existing NodeConfig tree. */
export function fromTree(root: NodeConfig): Graph {
  const nodes: Record<string, NodeAttrs> = {};
  const edges: Edge[] = [];
  const parents: Record<string, string | undefined> = {};

  const walk = (n: NodeConfig, parent?: NodeConfig) => {
    nodes[n.id] = {
      label: n.label ?? n.id,
      position: n.position,
      layout: n.layout,
      mode: n.mode, // NEW
    };
    if (parent) {
      parents[n.id] = parent.id;
      edges.push({ source: parent.id, target: n.id });
    } else {
      parents[n.id] = undefined;
    }
    (n.children ?? []).forEach((c) => walk(c, n));
  };
  walk(root, undefined);

  return { nodes, edges, parents, rootId: root.id };
}

```

### src/components/graph/model.ts

``` ts
import type { NodeAttrs, Edge } from "../layout/api/contracts";

export type Graph = {
  nodes: Record<string, NodeAttrs>;
  edges: Edge[];
  /** parent map derived from tree or heuristics (optional for general graphs) */
  parents?: Record<string, string | undefined>;
  rootId?: string;
};

```

### src/components/graph/types.ts

``` ts
import { Vector } from "../core/geometry";
import { LayoutTypes, LayoutChildrenMode } from "../layout/layout.enum";


export type NodeConfig = {
    id: string;
    label?: string;
    position?: Vector;
    children?: NodeConfig[];
    layout?: LayoutTypes;
    mode?: LayoutChildrenMode; // NEW
};

```

### src/components/graph/validate.ts

``` ts
import type { Graph } from "./model";

export type ValidationIssue = {
  code: "DUPLICATE_NODE" | "MISSING_NODE" | "SELF_LOOP";
  message: string;
  nodeId?: string;
  edge?: { source: string; target: string };
};

export function validateGraph(g: Graph): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  for (const id of Object.keys(g.nodes)) {
    if (ids.has(id)) issues.push({ code: "DUPLICATE_NODE", message: `Duplicate node id ${id}`, nodeId: id });
    ids.add(id);
  }
  for (const e of g.edges) {
    if (e.source === e.target) issues.push({ code: "SELF_LOOP", message: `Self-loop ${e.source}`, edge: e });
    if (!g.nodes[e.source]) issues.push({ code: "MISSING_NODE", message: `Missing source ${e.source}`, edge: e });
    if (!g.nodes[e.target]) issues.push({ code: "MISSING_NODE", message: `Missing target ${e.target}`, edge: e });
  }
  return issues;
}

```

### src/components/iteration/iterate.ts

``` ts
// iteration/iterate.ts
import { Logger } from "../core/logging/logger";

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

/** Simple guardable loop if you need it somewhere ad-hoc. */
export function boundedLoop(limit: number, body: (i: number) => boolean): void {
  let i = 0;
  for (; i < limit && body(i); i++);
  if (i >= limit) throw new Error(`boundedLoop: limit ${limit} reached`);
}

```

### src/components/layout/api/contracts.ts

``` ts
import { Vector } from "../../core/geometry";
import { NodeConfig } from "../../graph/types";
import { IterationLimits } from "../limits";
import { LayoutChildrenMode, LayoutTypes } from "../layout.enum";
import { LayoutTuning } from "../layout.tuning";

/** Minimal attrs we may get for a node (graph-agnostic). */
export type NodeAttrs = {
  label?: string;
  position?: Vector;
  size?: Vector;           // optional: if provided, preferred box
  layout?: LayoutTypes;    // preferred layout strategy for this node
  mode?: LayoutChildrenMode; // GRAPH | NESTED
  data?: unknown;
};

export type Edge = { id?: string; source: string; target: string; data?: unknown };


/** Unified input contract for the pipeline. */
export type GraphInput =
  | { kind: "tree"; root: NodeConfig }
  | { kind: "graph"; nodes: Record<string, NodeAttrs>; edges: Edge[] };

/** Engine options (all optional & shallow-merged with defaults). */
export type ComputeOptions = {
  nodeSize?: Vector;
  spacing?: number;
  collectOverlaps?: boolean;
  limitsOverride?: Partial<IterationLimits>;
  tuningOverride?: Partial<LayoutTuning>;
  routerName?: "line" | "ortho";          // NEW
};

```

### src/components/layout/api/index.ts

``` ts
import type { GraphInput, ComputeOptions } from "./contracts";
import { PipelineEngine } from "../engine/engine";
import type { SystemContext } from "../engine/context";
import { createDefaultSystem } from "../engine/context";
import type { LayoutSnapshot } from "../types";
import { toReactFlow } from "../../tooling/exporters/reactflow";
import { snapshotToSVG } from "../../tooling/exporters/svg";

export interface LayoutAPI {
  compute(input: GraphInput, options?: ComputeOptions): LayoutSnapshot;
  toReactFlow(snapshot: LayoutSnapshot): ReturnType<typeof toReactFlow>;
  toSVG(snapshot: LayoutSnapshot): string;
}

export function createLayoutAPI(ctx: SystemContext = createDefaultSystem()): LayoutAPI {
  const engine = new PipelineEngine(ctx);
  return {
    compute: (input, options) => {
      const res = engine.run(input, options);
      if (!res.ok) throw new Error(JSON.stringify(res.issues));
      return res.snapshot;
    },
    toReactFlow,
    toSVG: snapshotToSVG,
  };
}

export type { GraphInput, ComputeOptions } from "./contracts";
export type { LayoutSnapshot } from "../types";

```

### src/components/layout/engine/context.ts

``` ts
import { Config } from "../../config";
import { LayoutTuning, LayoutTuningConfig } from "../../layout/layout.tuning";
import { IterationConfig, IterationLimits } from "../limits";
import { Logger, NoopLogger } from "../../core/logging/logger";
import { InMemoryLayoutRegistry } from "../registries/layout.registry";
import { InMemoryRouterRegistry } from "../registries/router.registry";
import { GridLayout } from "../strategies/grid/grid.layout";
import { RadialLayout } from "../strategies/radial/radial.layout";
import { LineRouter } from "../routers/line.router";
import type { LayoutRegistry } from "../registries/layout.registry";
import type { RouterRegistry } from "../registries/router.registry";
import { LayoutTypes } from "../layout.enum";
import { OrthoRouter } from "../routers/ortho.router";

export type SystemContext = {
  log: Logger;
  tunings: Config<LayoutTuning>;
  limits: Config<IterationLimits>;
  layouts: LayoutRegistry;
  routers: RouterRegistry;
};

export function createDefaultSystem(overrides?: Partial<SystemContext>): SystemContext {
  const layouts = new InMemoryLayoutRegistry();
  layouts.register(LayoutTypes.Grid, new GridLayout());
  layouts.register(LayoutTypes.Radial, new RadialLayout());

  const routers = new InMemoryRouterRegistry();
  routers.register("line", new LineRouter());
  routers.register("ortho", new OrthoRouter());
  return {
    log: overrides?.log ?? new NoopLogger(),
    tunings: overrides?.tunings ?? LayoutTuningConfig,
    limits: overrides?.limits ?? IterationConfig,
    layouts: overrides?.layouts ?? layouts,
    routers: overrides?.routers ?? routers,
  };
}

```

### src/components/layout/engine/engine.ts

``` ts
import type { GraphInput, ComputeOptions } from "../api/contracts";
import { parse } from "./phases/parse";
import { validate } from "./phases/validate";
import { plan } from "./phases/plan";
import { place } from "./phases/place";
import { route } from "./phases/route";
import { post } from "./phases/post";
import type { SystemContext } from "./context";
import { createDefaultSystem } from "./context";
import type { LayoutSnapshot } from "../types";
import { Vector } from "../../core/geometry";
import { IterationConfig } from "../limits";
import { LayoutTuningConfig } from "../../layout/layout.tuning";
import { auditSnapshot } from "../../tooling/diagnostics/audit";

export type ComputeResult = { ok: true; snapshot: LayoutSnapshot; issues: ReturnType<typeof validate>["issues"] }
                         | { ok: false; issues: ReturnType<typeof validate>["issues"] };

export class PipelineEngine {
  constructor(private ctx: SystemContext = createDefaultSystem()) {}

  run(input: GraphInput, opts: ComputeOptions = {}): ComputeResult {
    const parsed = parse(input);
    const { issues } = validate(parsed);
    // Prepare effective knobs
    const nodeSize = opts.nodeSize ?? new Vector(110, 54);
    const spacing = opts.spacing ?? 24;

    const prevLimits: Record<string, unknown> = {};
    const prevTuning: Record<string, unknown> = {};
    try {
      if (opts.limitsOverride) {
        for (const [k, v] of Object.entries(opts.limitsOverride)) {
          prevLimits[k] = IterationConfig.get(k as any);
          IterationConfig.set(k as any, v as any);
        }
      }
      if (opts.tuningOverride) {
        for (const [k, v] of Object.entries(opts.tuningOverride)) {
          prevTuning[k] = LayoutTuningConfig.get(k as any);
          LayoutTuningConfig.set(k as any, v as any);
        }
      }

    const pln = plan(parsed);
    const placed = place(parsed, pln, this.ctx, {
      nodeSize,
      spacing,
      collectOverlaps: !!opts.collectOverlaps,
    });
    const routed = route(placed, this.ctx, undefined, opts.routerName ?? "line");
    const snap = post(routed);
    
    const audit = auditSnapshot(snap, pln, this.ctx.tunings);
    if (audit.length) this.ctx.log.warn("layout audit issues", { count: audit.length, audit });
    const snapshot = { ...snap, meta: { ...(snap.meta ?? {}), plan: pln, audit } };
    return { ok: true, snapshot, issues };
    
  } finally {
     for (const [k, v] of Object.entries(prevLimits)) IterationConfig.set(k as any, v as any);
     for (const [k, v] of Object.entries(prevTuning)) LayoutTuningConfig.set(k as any, v as any);
   }
  }
}

```

### src/components/layout/engine/phases/contracts.ts

``` ts
export interface Phase<I, O> {
  readonly name: string;
  run(input: I): O;
}
export const makePhase = <I, O>(name: string, run: (i: I) => O): Phase<I, O> => ({ name, run });

```

### src/components/layout/engine/phases/parse.ts

``` ts
import type { GraphInput } from "../../api/contracts";
import type { Graph } from "../../../graph/model";
import { fromTree } from "../../../graph/builders/tree";
import type { NodeConfig } from "../../../graph/types";
import { makePhase, type Phase } from "./contracts";

export type Parsed = {
  graph: Graph;
  /** If a faithful tree is available, we keep it for high-fidelity placement. */
  tree?: NodeConfig;
};

export function parse(input: GraphInput): Parsed {
  if (input.kind === "tree") {
    const graph = fromTree(input.root);
    return { graph, tree: input.root };
  }
  // Graph path: keep as-is; naive parents map if single inbound edge.
  const parents: Record<string, string | undefined> = {};
  const inbound = new Map<string, string[]>();
  for (const id of Object.keys(input.nodes)) inbound.set(id, []);
  for (const e of input.edges) {
    const arr = inbound.get(e.target);
    if (arr) arr.push(e.source);
  }
  for (const [k, v] of inbound.entries()) parents[k] = v.length > 0 ? v[0] : undefined;

  return { graph: { nodes: input.nodes, edges: input.edges, parents } };
}

export const ParsePhase: Phase<GraphInput, Parsed> = makePhase("parse", parse);
```

### src/components/layout/engine/phases/place.ts

``` ts
import type { Parsed } from "./parse";
import type { Plan } from "./plan";
import type { SystemContext } from "../context";
import { Vector } from "../../../core/geometry";
import { LayoutChildrenMode, LayoutTypes } from "../../layout.enum";
import type { LayoutSnapshot, Box, Wire } from "../../types";
import type { NodeConfig } from "../../../graph/types";
import { makePhase, type Phase } from "./contracts";
import { boundsOf, overlapsOf } from "../../metrics/metrics";

/**
 * Pure placement for the new pipeline.
 * - Tree path: uses registered Layout strategies (grid/radial) directly.
 * - Graph path: minimal vertical stack (until general-graph placement lands).
 */
export function place(
  parsed: Parsed,
  plan: Plan,
  ctx: SystemContext,
  options: { nodeSize: Vector; spacing: number; collectOverlaps: boolean }
): LayoutSnapshot {
  if (parsed.tree) {
    const tp = new TreePlacer(plan, ctx, options);
    return tp.run(parsed.tree);
  }

  // Graph fallback (no tree): simple stacked layout
  const ids = Object.keys(parsed.graph.nodes);
  const boxes: Record<string, Box> = {};
  let y = 0;
  for (const id of ids) {
    boxes[id] = {
      id,
      position: new Vector(0, y),
      size: options.nodeSize,
      depth: 0,
    };
    y += options.nodeSize.y + options.spacing;
  }
  const wires: Wire[] = parsed.graph.edges.map((e, i) => ({ id: e.id ?? String(i), source: e.source, target: e.target }));
  const bounds = boundsOf(Object.values(boxes));
  const stats = {
    nodeCount: ids.length,
    edgeCount: wires.length,
    maxDepth: 0,
    bounds,
  };
  return { boxes, wires, stats, version: Date.now() };
}

/* =========================== helpers / classes =========================== */

class TreePlacer {
  private boxes: Record<string, Box> = {};
  private wires: Wire[] = [];
  private maxDepth = 0;

  constructor(
    private plan: Plan,
    private ctx: SystemContext,
    private opts: { nodeSize: Vector; spacing: number; collectOverlaps: boolean }
  ) {}

  run(root: NodeConfig): LayoutSnapshot {
    // decide root size based on its own mode
    const rootMode = this.modeOf(root.id);
    const rootSize = this.sizeForNode(root, rootMode);
    const rootTopLeft = (root.position ?? new Vector(0, 0)).round();
    const rootCenter = rootTopLeft.add(rootSize.halve());

    this.placeNode({
      node: root,
      parentId: undefined,
      level: 0,
      centerAbs: rootCenter,
      parentMode: LayoutChildrenMode.GRAPH, // irrelevant for root
    });

    const boxes = this.boxes;
    const bounds = boundsOf(Object.values(boxes));
    const overlaps = this.opts.collectOverlaps ? overlapsOf(Object.values(boxes)) : undefined;

    return {
      boxes,
      wires: this.wires,
      stats: {
        nodeCount: Object.keys(boxes).length,
        edgeCount: this.wires.length,
        maxDepth: this.maxDepth,
        bounds,
        overlaps,
      },
      version: Date.now(),
      meta: { source: "pipeline" },
    };
  }

 private placeNode(args: {
  node: NodeConfig;
  parentId?: string;
  level: number;
  centerAbs: Vector;
  parentMode: LayoutChildrenMode;
  forceSize?: Vector;
}): void {
  const { node, parentId, level, centerAbs, forceSize } = args;
  const myMode = this.modeOf(node.id);
  const myLayout = this.layoutOf(node.id);

  // Size for *this* node
  const size = (forceSize ?? this.sizeForNode(node, myMode)).round();
  const topLeft = centerAbs.subtract(size.halve()).round();

  // --- logging (new) ---
  this.ctx.log.debug("placeNode: start", {
    id: node.id, mode: myMode, layout: myLayout, level,
    size: { x: size.x, y: size.y }, centerAbs: { x: centerAbs.x, y: centerAbs.y }
  });

  this.boxes[node.id] = {
    id: node.id,
    position: topLeft,
    size,
    parentId: args.parentMode === LayoutChildrenMode.NESTED ? parentId : undefined,
    depth: level,
  };
  if (level > this.maxDepth) this.maxDepth = level;

  const children = node.children ?? [];
  if (children.length === 0) return;

  const strat = this.ctx.layouts.get(myLayout);
  const mapping = strat.placeChildren({
    mode: myMode,
    children,
    parent: node,
    origin: centerAbs,
    level,
    nodeSize: this.opts.nodeSize,
    spacing: this.opts.spacing,
    parentSize: size,
  });

  const needsLocalToAbs = myMode === LayoutChildrenMode.NESTED;
  const localToAbsOffset = needsLocalToAbs ? topLeft : new Vector(0, 0);

  // ---------- NEW: compute "cell" for my children when I'm NESTED ----------
  let cellInner: Vector | undefined;
  if (myMode === LayoutChildrenMode.NESTED) {
    const padOuter = this.ctx.tunings.get("outerPad")(this.opts.spacing);
    const inner = size.subtract(Vector.scalar(2 * padOuter)).clamp(1, Infinity);
    const rowCol = this.ctx.tunings.get("rowCol")(children.length);
    const ip = this.ctx.tunings.get("itemPad")(this.opts.spacing);
    cellInner = inner.divide(rowCol).subtract(Vector.scalar(2 * ip)).clamp(1, Infinity);
  }

  // Helper to pick forced size for a child (GRAPH or NESTED)
  const forcedSizeForChild = (childMode: LayoutChildrenMode): Vector | undefined => {
    if (!cellInner) return undefined;                 // only when I'm a NESTED container
    const sideMax = Math.max(8, Math.floor(Math.min(cellInner.x, cellInner.y)));

    if (myLayout === LayoutTypes.Grid || myLayout === LayoutTypes.Radial) {
      if (childMode === LayoutChildrenMode.GRAPH) {
        // Perfect square for leaf/graph nodes
        return Vector.scalar(sideMax);
      } else {
        // Slightly smaller square for nested containers, so they don't "glue"
        const k = this.ctx.tunings.get("nestedContainerScale")(level + 1); // ~0.85^(d+1)
        const side = Math.max(8, Math.floor(sideMax * k));
        return Vector.scalar(side);
      }
    }
    return undefined;
  };

  for (const child of children) {
    // tree wire
    this.wires.push({
      id: `${node.id}->${child.id}#${this.wires.length}`,
      source: node.id,
      target: child.id,
    });

    const childCenter = (mapping[child.id] ?? centerAbs).add(localToAbsOffset);
    const childMode = this.modeOf(child.id);

    const passSize = forcedSizeForChild(childMode);

    // --- logging (new) ---
    if (passSize) {
      this.ctx.log.debug("placeNode: child forced size", {
        parent: node.id,
        child: child.id,
        childMode,
        forced: { x: passSize.x, y: passSize.y }
      });
    }

    this.placeNode({
      node: child,
      parentId: node.id,
      level: level + 1,
      centerAbs: childCenter,
      parentMode: myMode,
      forceSize: passSize,   // <-- actual override for both GRAPH and NESTED children
    });
  }
}

  private modeOf(id: string): LayoutChildrenMode {
    return this.plan.modes[id] ?? LayoutChildrenMode.GRAPH;
  }
  private layoutOf(id: string): LayoutTypes {
    return this.plan.layouts[id] ?? LayoutTypes.Grid;
  }
  private sizeForNode(node: NodeConfig, myMode: LayoutChildrenMode): Vector {
    if (myMode === LayoutChildrenMode.NESTED) {
      const strat = this.ctx.layouts.get(this.layoutOf(node.id));
      return strat.preferredSize({
        count: (node.children ?? []).length,
        nodeSize: this.opts.nodeSize,
        spacing: this.opts.spacing,
        mode: LayoutChildrenMode.NESTED,
      }).round();
    }
    // GRAPH: node renders as a “unit” box
    return this.opts.nodeSize.round();
  }
}

export const PlacePhase: Phase<{ parsed: Parsed; plan: Plan; ctx: SystemContext; options: { nodeSize: Vector; spacing: number; collectOverlaps: boolean } }, LayoutSnapshot> =
  makePhase("place", (input) => place(input.parsed, input.plan, input.ctx, input.options));
```

### src/components/layout/engine/phases/plan.ts

``` ts
import type { Parsed } from "./parse";
import { LayoutChildrenMode, LayoutTypes } from "../../../layout/layout.enum";
import { makePhase, type Phase } from "./contracts";
export type Plan = {
  rootId?: string;
  /** chosen layout per node (defaults to Grid) */
  layouts: Record<string, LayoutTypes>;
  /** chosen mode per node (defaults to GRAPH) */
  modes: Record<string, LayoutChildrenMode>;
};

export function plan(p: Parsed): Plan {
  const layouts: Record<string, LayoutTypes> = {};
  const modes: Record<string, LayoutChildrenMode> = {};

  for (const [id, attrs] of Object.entries(p.graph.nodes)) {
    layouts[id] = attrs.layout ?? LayoutTypes.Grid;
    modes[id] = attrs.mode ?? LayoutChildrenMode.GRAPH;
  }
  return { rootId: p.graph.rootId, layouts, modes };
}

export const PlanPhase: Phase<Parsed, Plan> = makePhase("plan", plan);

```

### src/components/layout/engine/phases/post.ts

``` ts
import type { LayoutSnapshot } from "../../types";
import { makePhase, type Phase } from "./contracts";

/** Post-processing hook; we keep it as a pass-through while the legacy engine already computed stats. */
export function post(s: LayoutSnapshot): LayoutSnapshot {
  return { ...s, version: s.version ?? Date.now() };
}
export const PostPhase: Phase<LayoutSnapshot, LayoutSnapshot> = makePhase("post", post);

```

### src/components/layout/engine/phases/route.ts

``` ts
import type { LayoutSnapshot } from "../../types";
import type { SystemContext } from "../context";
import type { Edge } from "../../api/contracts";
import { makePhase, type Phase } from "./contracts";

export function route(snapshot: LayoutSnapshot, ctx: SystemContext, _edges?: Edge[], routerName = "line"): LayoutSnapshot {
  const router = ctx.routers.get(routerName);
  const wires = snapshot.wires.map((w, i) => {
    const routed = router.route({ id: w.id ?? String(i), source: w.source, target: w.target }, snapshot);
    return routed?.polyline ? { ...w, polyline: routed.polyline } : w;
  });
  return { ...snapshot, wires };
}
// export const RoutePhase: Phase<LayoutSnapshot, LayoutSnapshot> = makePhase("route", (s) => route(s, {} as any));
// (phase wrapper intentionally not exported; engine calls route(snapshot, ctx) directly)
```

### src/components/layout/engine/phases/validate.ts

``` ts
import type { Parsed } from "./parse";
import { validateGraph } from "../../../graph/validate";
import { makePhase, type Phase } from "./contracts";
export type Validation = { issues: ReturnType<typeof validateGraph> };

export function validate(p: Parsed): Validation {
  return { issues: validateGraph(p.graph) };
}

export const ValidatePhase: Phase<Parsed, Validation> = makePhase("validate", validate);

```

### src/components/layout/iterator/iterator.registry.ts

``` ts
// src/components/layout/iterator/iterator.registry.ts
import { LayoutTypes } from "../layout.enum";
import { Iterator } from "./iterator.types";
import { buildIterators } from "./layout.iterators";
import { LayoutTuning, LayoutTuningConfig } from "../layout.tuning";
import { Config } from "../../config";

export type LayoutIteratorKind = LayoutTypes;

export interface IteratorRegistry {
  has(kind: LayoutIteratorKind): boolean;
  get(kind: LayoutIteratorKind): Iterator;
  register(kind: LayoutIteratorKind, iterator: Iterator): void;
  list(): LayoutIteratorKind[];
}

export class InMemoryIteratorRegistry implements IteratorRegistry {
  private map = new Map<LayoutIteratorKind, Iterator>();
  has(kind: LayoutIteratorKind) { return this.map.has(kind); }
  get(kind: LayoutIteratorKind) {
    const v = this.map.get(kind);
    if (!v) throw new Error(`Iterator not registered: ${kind}`);
    return v;
  }
  register(kind: LayoutIteratorKind, it: Iterator) { this.map.set(kind, it); }
  list() { return Array.from(this.map.keys()); }
}

/** Build a default registry from the current tuning config. */
export function createDefaultIteratorRegistry(tuning: Config<LayoutTuning> = LayoutTuningConfig): IteratorRegistry {
  const reg = new InMemoryIteratorRegistry();
  const set = buildIterators(tuning);
  reg.register(LayoutTypes.Grid, set.grid);
  reg.register(LayoutTypes.Radial, set.radial);
  return reg;
}

```

### src/components/layout/iterator/iterator.types.ts

``` ts
import { Vector } from "../../core/geometry";
import { 
    LayoutChildrenMode 
} from "../layout.enum";
import { Shapes } from "../../core/geometry";

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
import { Shapes, Vector } from "../../core/geometry";
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

### src/components/layout/layout.ts

``` ts
import { Vector } from "../core/geometry";
import { NodeConfig } from "../graph/types";
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
import { Vector } from "../core/geometry";
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

### src/components/layout/limits/index.ts

``` ts
// layout/limits/index.ts
import { Config } from "../../config";
import type { LimitAction } from "../../iteration/iterate";

export type LayoutLimits = {
  maxDepth: number;
  maxNodes: number;
  maxChildrenPerNode: number;
  maxEdges: number;
  maxOpsPerPass: number;
  onLimit: LimitAction; // "throw" | "truncate" | "warn"
};

export const defaultLayoutLimits: LayoutLimits = {
  maxDepth: 1000,
  maxNodes: 5000,
  maxChildrenPerNode: 1000,
  maxEdges: 10000,
  maxOpsPerPass: 100_000,
  onLimit: "warn",
};

export const LayoutLimitsConfig = new Config<LayoutLimits>(defaultLayoutLimits);

// (Optional) temporary re-exports to minimize churn while you rename imports.
export type IterationLimits = LayoutLimits;
export const IterationConfig = LayoutLimitsConfig;
```

### src/components/layout/metrics/metrics.ts

``` ts
import { Vector } from "../../core/geometry";
import type { Box, Wire, LayoutStats, LayoutSnapshot } from "../types";

export type Bounds = { position: Vector; size: Vector };

export function boundsOf(boxes: Iterable<Box>): Bounds {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let any = false;
  for (const b of boxes) {
    any = true;
    minX = Math.min(minX, b.position.x);
    minY = Math.min(minY, b.position.y);
    maxX = Math.max(maxX, b.position.x + b.size.x);
    maxY = Math.max(maxY, b.position.y + b.size.y);
  }
  if (!any) return { position: new Vector(0, 0), size: new Vector(0, 0) };
  return { position: new Vector(minX, minY), size: new Vector(maxX - minX, maxY - minY) };
}

export function overlapsOf(boxes: readonly Box[]): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (let i = 0; i < boxes.length; i++) {
    const A = boxes[i];
    const ax2 = A.position.x + A.size.x, ay2 = A.position.y + A.size.y;
    for (let j = i + 1; j < boxes.length; j++) {
      const B = boxes[j];
      const bx2 = B.position.x + B.size.x, by2 = B.position.y + B.size.y;
      const separated = ax2 <= B.position.x || bx2 <= A.position.x || ay2 <= B.position.y || by2 <= A.position.y;
      if (!separated) out.push([A.id, B.id]);
    }
  }
  return out;
}

export function maxDepthOf(boxes: Iterable<Box>): number {
  let md = 0;
  for (const b of boxes) if (b.depth > md) md = b.depth;
  return md;
}

export function edgeLengthStats(wires: readonly Wire[], boxes: Readonly<Record<string, Box>>): { total: number; mean: number; min: number; max: number } {
  let total = 0, min = Infinity, max = -Infinity, count = 0;
  for (const w of wires) {
    let length = 0;
    if (w.polyline && w.polyline.length >= 2) {
      for (let i = 1; i < w.polyline.length; i++) {
        const a = w.polyline[i - 1], b = w.polyline[i];
        const dx = b.x - a.x, dy = b.y - a.y;
        length += Math.hypot(dx, dy);
      }
    } else {
      const a = boxes[w.source], b = boxes[w.target];
      if (!a || !b) continue;
      const ac = a.position.add(a.size.halve()), bc = b.position.add(b.size.halve());
      length = Math.hypot(bc.x - ac.x, bc.y - ac.y);
    }
    total += length; min = Math.min(min, length); max = Math.max(max, length); count++;
  }
  return { total, mean: count ? total / count : 0, min: isFinite(min) ? min : 0, max: isFinite(max) ? max : 0 };
}

/** Compute the built-in LayoutStats (bounds/overlaps/maxDepth/counts). */
export function statsOfSnapshot(s: Pick<LayoutSnapshot, "boxes" | "wires">, opts: { collectOverlaps?: boolean } = {}): LayoutStats {
  const arr = Object.values(s.boxes);
  const bounds = boundsOf(arr);
  const overlaps = opts.collectOverlaps ? overlapsOf(arr) : undefined;
  const maxDepth = maxDepthOf(arr);
  return {
    nodeCount: arr.length,
    edgeCount: s.wires.length,
    maxDepth,
    bounds,
    overlaps,
  };
}

```

### src/components/layout/registries/layout.registry.ts

``` ts
import type { Layout } from "../layout";
import { LayoutTypes } from "../layout.enum";

export type LayoutKind = LayoutTypes;

export interface LayoutRegistry {
  has(kind: LayoutKind): boolean;
  get(kind: LayoutKind): Layout;
  register(kind: LayoutKind, strategy: Layout): void;
  list(): LayoutKind[];
}

export class InMemoryLayoutRegistry implements LayoutRegistry {
  private map = new Map<LayoutKind, Layout>();
  has(kind: LayoutKind) { return this.map.has(kind); }
  get(kind: LayoutKind) {
    const v = this.map.get(kind);
    if (!v) throw new Error(`Layout strategy not registered: ${kind}`);
    return v;
  }
  register(kind: LayoutKind, strategy: Layout) { this.map.set(kind, strategy); }
  list() { return Array.from(this.map.keys()); }
}

```

### src/components/layout/registries/router.registry.ts

``` ts
import type { Edge } from "../api/contracts";
import type { Vector } from "../../core/geometry";
import type { LayoutSnapshot } from "../types";

export interface RoutedEdge { id: string; source: string; target: string; polyline?: Vector[]; }

export interface EdgeRouter {
  /** Return polyline/segments for an edge, or undefined for straight center line by consumer. */
  route(e: Edge, snapshot: LayoutSnapshot): Partial<RoutedEdge> | undefined;
}

export interface RouterRegistry {
  get(name: string): EdgeRouter;
  register(name: string, router: EdgeRouter): void;
}

export class InMemoryRouterRegistry implements RouterRegistry {
  private map = new Map<string, EdgeRouter>();
  get(name: string) {
    const r = this.map.get(name);
    if (!r) throw new Error(`Router not registered: ${name}`);
    return r;
  }
  register(name: string, router: EdgeRouter) { this.map.set(name, router); }
}

```

### src/components/layout/routers/line.router.ts

``` ts
import { Vector } from "../../core/geometry";
import type { Edge } from "../api/contracts";
import type { LayoutSnapshot } from "../types";
import type { EdgeRouter, RoutedEdge } from "../registries/router.registry";

/** Simple center-to-center straight router. */
export class LineRouter implements EdgeRouter {
  route(e: Edge, snapshot: LayoutSnapshot): Partial<RoutedEdge> | undefined {
    const a = snapshot.boxes[e.source]; const b = snapshot.boxes[e.target];
    if (!a || !b) return undefined;
    const ac = a.position.add(a.size.halve());
    const bc = b.position.add(b.size.halve());
    return { polyline: [ac, bc].map((v) => new Vector(v.x, v.y)) };
  }
}

```

### src/components/layout/routers/ortho.router.ts

``` ts
import { Vector } from "../../core/geometry";
import type { Edge } from "../api/contracts";
import type { LayoutSnapshot } from "../types";
import type { EdgeRouter, RoutedEdge } from "../registries/router.registry";

/** Simple Manhattan "L" router: choose the shorter elbow. */
export class OrthoRouter implements EdgeRouter {
  route(e: Edge, snapshot: LayoutSnapshot): Partial<RoutedEdge> | undefined {
    const a = snapshot.boxes[e.source];
    const b = snapshot.boxes[e.target];
    if (!a || !b) return undefined;

    const ac = a.position.add(a.size.halve());
    const bc = b.position.add(b.size.halve());

    const turnHFirst = [ac, new Vector(bc.x, ac.y), bc];
    const turnVFirst = [ac, new Vector(ac.x, bc.y), bc];

    const len = (pts: Vector[]) => {
      let t = 0;
      for (let i = 1; i < pts.length; i++) t += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      return t;
    };

    const path = len(turnHFirst) <= len(turnVFirst) ? turnHFirst : turnVFirst;
    return { polyline: path };
  }
}

```

### src/components/layout/strategies/grid/grid.layout.ts

``` ts
import { Vector, Shapes } from "../../../core/geometry";
import {
  Layout, NestedFrameParam, PlaceChildrenReturn, PreferredSizeParam,
  NestedFramesReturn, PreferredSizeReturn, PlaceChildrenParam
} from "../../layout";
import { LayoutChildrenMode, LayoutTypes } from "../../layout.enum";
import { MappedGrid, MappedGridItemData } from "./grid.mapped";
import { GridItem } from "./grid";
import { Config } from "../../../config";
import { LayoutTuning, LayoutTuningConfig } from "../../layout.tuning";
import { mapIndexBounded, sliceBound } from "../../../iteration/iterate";
import { IterationConfig } from "../../limits";
import { createDefaultIteratorRegistry, IteratorRegistry } from "../../iterator/iterator.registry";
import { gridUnit, mapToRect } from "../../iterator/layout.iterators";

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
    private iters: IteratorRegistry = createDefaultIteratorRegistry(LayoutTuningConfig)

  ) { super(); }

  nestedFrames = ({ children, parentSize, spacing }: NestedFrameParam): NestedFramesReturn => {
    const maxPer = IterationConfig.get("maxChildrenPerNode");
    const policy = IterationConfig.get("onLimit");
    const safeChildren = sliceBound(children, maxPer, policy);

    const gridSize: Vector = this.tuning.get("rowCol")(safeChildren.length);
    const ip: number = this.tuning.get("itemPad")(spacing);
    const pad: number = this.tuning.get("outerPad")(spacing);
    const content: Vector = parentSize.round().clamp(1, Infinity).subtract(Vector.scalar(2 * pad));
    const contentTopLeft = Vector.scalar(pad);

    const X = splitEven(content.x, gridSize.x);
    const Y = splitEven(content.y, gridSize.y);

    const grid: MappedGrid = MappedGrid.emptyMapped<MappedGridItemData>(gridSize, () => ({ id: "" }));

    for (let i = 0; i < safeChildren.length; i++) {
      const cell = new Vector(i % gridSize.x, Math.floor(i / gridSize.x));
      const position = contentTopLeft.add(new Vector(X.offs[cell.x], Y.offs[cell.y]));
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
        const pad = this.tuning.get("outerPad")(spacing);
        const rect = new Shapes.Rectangle(
          parentSize.subtract(Vector.scalar(2 * pad)),
          new Vector(pad, pad)
        );
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
} from "../../../core/geometry";
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
} from "../../../core/geometry";
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
import { Vector } from "../../../core/geometry";
import {
  PreferredSizeParam, PreferredSizeReturn, Layout, PlaceChildrenReturn, PlaceChildrenParam, NestedFramesReturn
} from "../../layout";
import { LayoutChildrenMode } from "../../layout.enum";
import { MappedGrid } from "../grid/grid.mapped";
import { Config } from "../../../config";
import { LayoutTuning, LayoutTuningConfig } from "../../layout.tuning";
import { IterationConfig } from "../../limits";
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

  // use content box (outer pad)
  const padOuter = tuning.get("outerPad")(spacing);
  const inner: Vector = parentSize
    .round()
    .subtract(Vector.scalar(2 * padOuter))
    .clamp(1, Infinity);

  const c: Vector = inner.scale(1 / 2);
  const start = tuning.get("startAngle")();
  const cw = tuning.get("clockwise")();
  const ip = tuning.get("itemPad")(spacing);

  const baseR = inner.min() / 2 - Math.max(0, nodeSize.max() / 2 + ip);
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

### src/components/layout/types.ts

``` ts
import { Vector } from "../core/geometry";

export type Box = {
  id: string;
  position: Vector;  // top-left
  size: Vector;
  parentId?: string;
  depth: number;
};

export type Wire = { id: string; source: string; target: string; polyline?: Vector[] };

export type LayoutStats = {
  nodeCount: number;
  edgeCount: number;
  maxDepth: number;
  bounds: { position: Vector; size: Vector };
  overlaps?: Array<[string, string]>;
};

export type LayoutSnapshot = Readonly<{
  boxes: Readonly<Record<string, Box>>;
  wires: ReadonlyArray<Wire>;
  stats: LayoutStats;
  version: number;
  meta?: Record<string, unknown>;
}>;

```

### src/components/ParentChildFlow.tsx

``` tsx
import "reactflow/dist/style.css";
import { JSX, useEffect, useMemo, useState } from "react";
import { NodeConfig } from "./graph/types";
import { Vector } from "./core/geometry";
import { LayoutChildrenMode, LayoutTypes } from "./layout/layout.enum";
import { LabeledSlider, Segmented } from "./ui/controls";
import { Shell } from "./ui/styles";
import { Configurator } from "./ui/Configurator";
import { Target } from "./adapters/env";
import { LayoutView } from "./render/views/LayoutView";
import { createLayoutAPI } from "./layout/api";
import type { GraphInput } from "./layout/api";
import { ConsoleLogger, LogLevel } from "./core/logging/logger";
import { createDefaultSystem } from "./layout/engine/context";

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

export type ParentChildLayoutsDemoProps = { config?: NodeConfig };

export const ParentChildLayoutsDemo = ({ config = DEMO_MIXED }: ParentChildLayoutsDemoProps): JSX.Element => {
  const [adapter, setAdapter] = useState<Target.DOM | Target.Canvas | Target.ReactFlow>(Target.DOM);
  const [spacing, setSpacing] = useState(24);
  const [nodeW, setNodeW] = useState(110);
  const [nodeH, setNodeH] = useState(54);
  const LIMITS = { spacing: { min: 0, max: 80 }, nodeW: { min: 40, max: 240 }, nodeH: { min: 30, max: 180 } };

  const [layoutName, setLayoutName] = useState<LayoutTypes>(LayoutTypes.Grid);
  const [modes, setModes] = useState<Record<string, LayoutChildrenMode>>({
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

    // apply layout selection to scope (existing behavior)
    const setLayout = (n: NodeConfig): void => {
      if (scope === "all" || n.id === scope) n.layout = layoutName;
      if (applyToSubtree || scope === "all") (n.children ?? []).forEach(setLayout);
    };
    setLayout(copy);

    // NEW: apply modes map everywhere it’s provided
    const applyMode = (n: NodeConfig): void => {
      const m = modes[n.id];
      if (m !== undefined) n.mode = m;
      (n.children ?? []).forEach(applyMode);
    };
    applyMode(copy);

    return copy;
  }, [config, layoutName, scope, applyToSubtree, modes]);

  const nodeSize: Vector = useMemo(() => new Vector(Math.max(20, nodeW), Math.max(20, nodeH)), [nodeW, nodeH]);

  const [logLevel, setLogLevel] = useState<LogLevel>(LogLevel.Warn);

  const api = useMemo(() => {
    const ctx = createDefaultSystem({ log: new ConsoleLogger(logLevel) });
    return createLayoutAPI(ctx);
  }, [logLevel]);

  const input: GraphInput = useMemo(() => ({ kind: "tree", root: effectiveConfig }), [effectiveConfig]);

  const [routerName, setRouterName] = useState<"line" | "ortho">("line");
  const snapshot = useMemo(
    () =>
      api.compute(input, {
        nodeSize,
        spacing,
        collectOverlaps: false,
        routerName,
      }),
    [api, input, nodeSize, spacing, routerName]
  );

  const nestedGridActive = useMemo(
    () => layoutName === LayoutTypes.Grid && Object.keys(modes).some((id) => (modes[id] ?? LayoutChildrenMode.GRAPH) === LayoutChildrenMode.NESTED),
    [layoutName, modes]
  );

  useEffect(() => {
    if (nestedGridActive) {
      setSpacing(LIMITS.spacing.min);
      setNodeW(LIMITS.nodeW.max);
      setNodeH(LIMITS.nodeH.max);
    }
  }, [nestedGridActive]);

  return (
    <div style={Shell.outer}>
      <div style={Shell.bar}>
        <Segmented<LogLevel>
          label="Log"
          value={logLevel}
          onChange={setLogLevel}
          options={[
            { label: "Off",  value: LogLevel.Off },
            { label: "Warn", value: LogLevel.Warn },
            { label: "Info", value: LogLevel.Info },
            { label: "Debug",value: LogLevel.Debug },
          ]}
        />

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
        <LabeledSlider label="Spacing" value={spacing} min={LIMITS.spacing.min} max={LIMITS.spacing.max} onChange={setSpacing} />
        <LabeledSlider label="Node W" value={nodeW} min={LIMITS.nodeW.min} max={LIMITS.nodeW.max} onChange={setNodeW} disabled={nestedGridActive} />
        <LabeledSlider label="Node H" value={nodeH} min={LIMITS.nodeH.min} max={LIMITS.nodeH.max} onChange={setNodeH} disabled={nestedGridActive} />
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
          routerName={routerName}
          setRouterName={setRouterName}
        />
      </div>

      <div style={Shell.left}>
        <div style={Shell.title}>Graph (Edges)</div>
        <div style={Shell.rf}>
          <LayoutView kind={Target.ReactFlow} snapshot={snapshot} />
        </div>
      </div>

      <div style={Shell.right}>
        <div style={Shell.title}>Right Pane: {adapter}</div>
        <div style={{ position: "absolute", inset: 0 }}>
          <LayoutView kind={adapter} snapshot={snapshot} />
        </div>
      </div>
    </div>
  );
};

```

### src/components/render/ports/canvas.port.ts

``` ts
import type { RenderPort, RenderSession } from "./types";
import type { LayoutSnapshot } from "../../layout/types";
import type { Theme } from "../../adapters/theme";
import { defaultTheme } from "../../adapters/theme";
import { drawLayoutToCanvas } from "../../adapters/targets/canvas.core";
// src/components/render/ports/canvas.port.ts
export class CanvasPort implements RenderPort {
  mount(container: HTMLElement, initial: LayoutSnapshot, theme: Theme = defaultTheme): RenderSession {
    const canvas = document.createElement("canvas");
    Object.assign(canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%" });
    container.appendChild(canvas);

    const dpr = Math.max(1, (window.devicePixelRatio as number) || 1);
    const rect = container.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const toLegacy = (s: LayoutSnapshot) => ({
      boxes: Object.fromEntries(
        Object.values(s.boxes).map((b) => [
          b.id,
          { id: b.id, getPosition: () => b.position, getSize: () => b.size, parentId: b.parentId, depth: b.depth },
        ])
      ),
      wires: s.wires.map((w) => ({ source: w.source, target: w.target, polyline: w.polyline })),
    });

    let last = initial;
    const draw = (s: LayoutSnapshot) => {
      last = s;
      drawLayoutToCanvas(ctx, toLegacy(s), theme);
    };
    draw(initial);

    const ro = new ResizeObserver(() => {
      const rr = container.getBoundingClientRect();
      const w = Math.max(1, Math.round(rr.width * dpr));
      const h = Math.max(1, Math.round(rr.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw(last); // redraw after resize
      }
    });
    ro.observe(container);

    return {
      draw,
      destroy: () => {
        try {
          ro.disconnect();
          if (canvas.parentNode === container) {
            container.removeChild(canvas);
          } else {
            canvas.remove?.();
          }
        } catch { /* swallow */ }
      },
    };
  }
}

```

### src/components/render/ports/dom.port.ts

``` ts
import type { RenderPort, RenderSession } from "./types";
import type { LayoutSnapshot } from "../../layout/types";
import type { Theme } from "../../adapters/theme";
import { defaultTheme } from "../../adapters/theme";

export class DomPort implements RenderPort {
  mount(container: HTMLElement, initial: LayoutSnapshot, theme: Theme = defaultTheme): RenderSession {
    const root = document.createElement("div");
    Object.assign(root.style, { position: "relative", width: "100%", height: "100%" });

    const svgNS = "http://www.w3.org/2000/svg";
    const svg: SVGElement = document.createElementNS(svgNS, "svg") as SVGElement;
    Object.assign(svg.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: "0",
    });
    // Some browsers still prefer explicit attributes on <svg>
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    container.appendChild(root);
    root.appendChild(svg);

    const draw = (s: LayoutSnapshot) => {
      // NEW: update viewBox to match snapshot bounds
      // const b = s.stats.bounds;
      // const w = Math.max(1, b.size.x);
      // const h = Math.max(1, b.size.y);
      // (svg as SVGSVGElement).setAttribute("viewBox", `${b.position.x} ${b.position.y} ${w} ${h}`);

      root.querySelectorAll("[data-node]").forEach((n) => n.remove());
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      for (const w of s.wires) {
        if (w.polyline && w.polyline.length >= 2) {
          const poly = document.createElementNS(svgNS, "polyline");
          poly.setAttribute("points", w.polyline.map(p => `${p.x},${p.y}`).join(" "));
          poly.setAttribute("fill", "none");
          poly.setAttribute("stroke", theme.wire.stroke);
          poly.setAttribute("stroke-width", String(theme.wire.width));
          svg.appendChild(poly);
          continue;
        }
        const a = s.boxes[w.source]; const b = s.boxes[w.target];
        if (!a || !b) continue;
        const A = a.position.add(a.size.halve());
        const B = b.position.add(b.size.halve());
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", String(A.x));
        line.setAttribute("y1", String(A.y));
        line.setAttribute("x2", String(B.x));
        line.setAttribute("y2", String(B.y));
        line.setAttribute("stroke", theme.wire.stroke);
        line.setAttribute("stroke-width", String(theme.wire.width));
        svg.appendChild(line);
      }


      for (const b of Object.values(s.boxes).sort((a, c) => a.depth - c.depth || a.id.localeCompare(c.id))) {
        const el = document.createElement("div");
        el.dataset.node = b.id;
        const style = el.style;
        style.position = "absolute";
        style.left = `${b.position.x}px`;
        style.top = `${b.position.y}px`;
        style.width = `${b.size.x}px`;
        style.height = `${b.size.y}px`;
        style.border = `1px solid ${theme.node.border}`;
        style.borderRadius = `${theme.node.radius}px`;
        style.background = theme.node.bg;
        style.boxSizing = "border-box";
        style.fontSize = `${theme.node.fontSize}px`;
        style.color = theme.node.text;
        style.display = "flex";
        style.alignItems = "center";
        style.justifyContent = "center";
        (style as any).userSelect = "none";
        el.textContent = b.id;
        root.appendChild(el);
      }
    };

    draw(initial);

    return {
      draw,
      destroy: () => {
        try {
          if (root.parentNode === container) {
            container.removeChild(root);
          } else {
            // if React already removed it, no-op
            root.remove?.();
          }
        } catch { /* swallow */ }
      },
    };
  }
}

```

### src/components/render/ports/types.ts

``` ts
import type { LayoutSnapshot } from "../../layout/types";
import type { Theme } from "../../adapters/theme";

export interface RenderSession {
  draw(snapshot: LayoutSnapshot): void;  // full draw
  destroy(): void;
}

export interface RenderPort {
  mount(container: HTMLElement, initial: LayoutSnapshot, theme: Theme): RenderSession;
}

```

### src/components/render/views/LayoutView.tsx

``` tsx
// src/components/render/views/LayoutView.tsx
import { JSX, useEffect, useMemo, useRef } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import type { LayoutSnapshot } from "../../layout/types";
import { Target } from "../../adapters/env";
import { defaultTheme, type Theme } from "../../adapters/theme";
import { DomPort } from "../ports/dom.port";
import { CanvasPort } from "../ports/canvas.port";
import { toReactFlow } from "../../tooling/exporters/reactflow";
import type { RenderSession } from "../ports/types";

export type LayoutViewProps = {
  kind: Target;
  snapshot: LayoutSnapshot;
  theme?: Theme;
};

export const LayoutView = ({ kind, snapshot, theme = defaultTheme }: LayoutViewProps): JSX.Element => {
  // Always call hooks – no early return.
  const { nodes, edges } = useMemo(() => toReactFlow(snapshot), [snapshot]);

  const ref = useRef<HTMLDivElement | null>(null);
  const sessionRef = useRef<RenderSession | null>(null);

  useEffect(() => {
    // tear down any prior port session
    sessionRef.current?.destroy();
    sessionRef.current = null;

    // for DOM/Canvas only, mount a port into ref container
    if (ref.current && (kind === Target.DOM || kind === Target.Canvas)) {
      sessionRef.current =
        kind === Target.DOM
          ? new DomPort().mount(ref.current, snapshot, theme)
          : new CanvasPort().mount(ref.current, snapshot, theme);
    }

    // cleanup on kind/theme change or unmount
    return () => {
      sessionRef.current?.destroy();
      sessionRef.current = null;
    };
  }, [kind, theme]); // initial draw happens inside mount

  // push new frames to the active session
  useEffect(() => {
    sessionRef.current?.draw(snapshot);
  }, [snapshot]);

  // JSX branch only (hooks above are unconditional)
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {kind === Target.ReactFlow ? (
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background gap={16} />
          <Controls />
        </ReactFlow>
      ) : (
        <div ref={ref} style={{ position: "absolute", inset: 0 }} />
      )}
    </div>
  );
};

```

### src/components/tooling/diagnostics/audit.ts

``` ts
import type { LayoutSnapshot } from "../../layout/types";
import type { Config } from "../../config";
import type { LayoutTuning } from "../../layout/layout.tuning";
import { LayoutChildrenMode, LayoutTypes } from "../../layout/layout.enum";
import type { Plan } from "../../layout/engine/phases/plan";
import { Vector } from "../../core/geometry";

export type AuditIssue = {
  code: "NESTED_GRID_CHILD_NOT_SQUARE" | "NESTED_GRID_CHILD_TOO_BIG";
  parentId: string;
  childId: string;
  details?: Record<string, unknown>;
};

export function auditSnapshot(
  s: LayoutSnapshot,
  plan: Plan,
  tuning: Config<LayoutTuning>
): AuditIssue[] {
  // Build children map from wires (tree edges)
  const kids: Record<string, string[]> = {};
  for (const w of s.wires) {
    (kids[w.source] ??= []).push(w.target);
  }

  const issues: AuditIssue[] = [];

  for (const [id, box] of Object.entries(s.boxes)) {
    const mode = plan.modes[id] ?? LayoutChildrenMode.GRAPH;
    const layout = plan.layouts[id] ?? LayoutTypes.Grid;
    if (mode !== LayoutChildrenMode.NESTED || layout !== LayoutTypes.Grid) continue;

    const children = kids[id] ?? [];
    if (children.length === 0) continue;

    const pad = tuning.get("outerPad")(0); // spacing not needed for this check; caller can refine
    const inner = box.size.subtract(Vector.scalar(2 * pad)).clamp(1, Infinity);
    const rc = tuning.get("rowCol")(children.length);
    const ip = tuning.get("itemPad")(0);
    const cell = inner.divide(rc).subtract(Vector.scalar(2 * ip)).clamp(1, Infinity);
    const sideMax = Math.min(cell.x, cell.y);

    for (const cid of children) {
      const cb = s.boxes[cid];
      if (!cb) continue;
      if (Math.abs(cb.size.x - cb.size.y) > 1) {
        issues.push({
          code: "NESTED_GRID_CHILD_NOT_SQUARE",
          parentId: id,
          childId: cid,
          details: { size: cb.size, sideMax }
        });
      }
      if (cb.size.x - sideMax > 1 || cb.size.y - sideMax > 1) {
        issues.push({
          code: "NESTED_GRID_CHILD_TOO_BIG",
          parentId: id,
          childId: cid,
          details: { size: cb.size, sideMax }
        });
      }
    }
  }
  return issues;
}

```

### src/components/tooling/exporters/reactflow.ts

``` ts
import type { LayoutSnapshot } from "../../layout/types";
import type { Node, Edge } from "reactflow";

export function toReactFlow(snapshot: LayoutSnapshot): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = Object.values(snapshot.boxes).map((b) => {
    const style: React.CSSProperties = {
      width: b.size.x,
      height: b.size.y,
      border: "1px solid #cbd5e1",
      borderRadius: 10,
      background: "#fff",
      fontSize: 12,
      boxSizing: "border-box",
    };
    const rel = b.parentId
      ? { x: b.position.x - (snapshot.boxes[b.parentId].position.x), y: b.position.y - (snapshot.boxes[b.parentId].position.y) }
      : { x: b.position.x, y: b.position.y };
    const base: Node = { id: b.id, position: rel, data: { label: b.id }, style };
    return b.parentId ? { ...base, parentNode: b.parentId, extent: "parent" } : base;
  });

  const edges: Edge[] = (snapshot.wires ?? []).map((w) => ({
    id: w.id,
    source: w.source,
    target: w.target,
  }));

  return { nodes, edges };
}

```

### src/components/tooling/exporters/svg.ts

``` ts
import type { LayoutSnapshot } from "../../layout/types";

export function snapshotToSVG(s: LayoutSnapshot): string {
  const minX = s.stats.bounds.position.x;
  const minY = s.stats.bounds.position.y;
  const w = s.stats.bounds.size.x;
  const h = s.stats.bounds.size.y;

  const lines = s.wires
    .map((w) => {
      if (w.polyline && w.polyline.length >= 2) {
        const points = w.polyline.map(p => `${p.x},${p.y}`).join(" ");
        return `<polyline points="${points}" fill="none" stroke="#94a3b8" stroke-width="1" />`;
      }
      const a = s.boxes[w.source]; const b = s.boxes[w.target];
      if (!a || !b) return "";
      const ac = a.position.add(a.size.halve());
      const bc = b.position.add(b.size.halve());
      return `<line x1="${ac.x}" y1="${ac.y}" x2="${bc.x}" y2="${bc.y}" stroke="#94a3b8" stroke-width="1" />`;
    })
    .join("");

  const rects = Object.values(s.boxes)
    .sort((A, B) => A.depth - B.depth || A.id.localeCompare(B.id))
    .map(
      (b) =>
        `<rect x="${b.position.x}" y="${b.position.y}" width="${b.size.x}" height="${b.size.y}" rx="10" ry="10" fill="#fff" stroke="#cbd5e1" />`
    )
    .join("");

  const labels = Object.values(s.boxes)
    .map((b) => {
      const cx = b.position.x + b.size.x / 2;
      const cy = b.position.y + b.size.y / 2;
      return `<text x="${cx}" y="${cy}" font-size="12" text-anchor="middle" dominant-baseline="middle" fill="#0f172a">${b.id}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${minX} ${minY} ${w} ${h}">
    <rect x="${minX}" y="${minY}" width="${w}" height="${h}" fill="#ffffff"/>
    ${lines}
    ${rects}
    ${labels}
  </svg>`;
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
import { NodeConfig } from "../graph/types";
import { 
  LayoutChildrenMode, 
  LayoutTypes 
} from "../layout/layout.enum";

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
    modes               : Record<string, LayoutChildrenMode>;
    setModes            : (f: (prev: Record<string, LayoutChildrenMode>) => Record<string, LayoutChildrenMode>) => void;
    layout              : LayoutTypes;
    setLayout           : (l: LayoutTypes) => void;
    scope               : Scope;
    setScope            : (s: Scope) => void;
    applyToSubtree      : boolean;
    setApplyToSubtree   : (v: boolean) => void;
    routerName          : "line" | "ortho";
    setRouterName       : (r: "line" | "ortho") => void;
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
                                    setApplyToSubtree,
                                    routerName,
                                    setRouterName
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
            <button
                style={{ fontSize: 12, padding: "6px 8px", marginLeft: 8 }}
                onClick={() => setModes((_) => Object.fromEntries(ids.map((id) => [id, LayoutChildrenMode.GRAPH])))}
            >
                All Graph
            </button>
            <button
                style={{ fontSize: 12, padding: "6px 8px", marginLeft: 6 }}
                onClick={() => setModes((_) => Object.fromEntries(ids.map((id) => [id, LayoutChildrenMode.NESTED])))}
            >
                All Nested
            </button>
            <Segmented<"line" | "ortho">
                label="Router"
                value={routerName}
                options={[{ label: "Line", value: "line" }, { label: "Ortho", value: "ortho" }]}
                onChange={setRouterName}
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

### src/components/ui/playground/Testbed.tsx

``` tsx
import { JSX, useMemo } from "react";
import { LayoutView } from "../../render/views/LayoutView";
import { Target } from "../../adapters/env";
import { createLayoutAPI } from "../../layout/api";
import { createDefaultSystem } from "../../layout/engine/context";
import { ConsoleLogger, LogLevel } from "../../core/logging/logger";
import { LayoutChildrenMode, LayoutTypes } from "../../layout/layout.enum";
import { Vector } from "../../core/geometry";
import type { NodeConfig } from "../../graph/types";
import type { GraphInput } from "../../layout/api";

const BASE: NodeConfig = {
  id: "root",
  position: new Vector(40, 40),
  children: [
    { id: "A", children: [{ id: "A1" }, { id: "A2" }, { id: "A3" }] },
    { id: "B", children: [{ id: "B1" }, { id: "B2" }, { id: "B3" }, { id: "B4" }] },
    { id: "C", children: [{ id: "C1" }, { id: "C2" }, { id: "C3" }, { id: "C4" }] },
  ],
};

function stamp(layout: LayoutTypes, mode: LayoutChildrenMode): NodeConfig {
  const clone = (n: NodeConfig): NodeConfig => ({ ...n, children: (n.children ?? []).map(clone) });
  const root = clone(BASE);
  const apply = (n: NodeConfig) => {
    n.layout = layout;
    n.mode = mode;
    (n.children ?? []).forEach(apply);
  };
  apply(root);
  return root;
}

const RENDERERS: Target[] = [Target.DOM, Target.Canvas, Target.ReactFlow];
const LAYOUTS: LayoutTypes[] = [LayoutTypes.Grid, LayoutTypes.Radial];
const MODES: LayoutChildrenMode[] = [LayoutChildrenMode.GRAPH, LayoutChildrenMode.NESTED];

export function TestbedMatrix(): JSX.Element {
  const api = useMemo(() => createLayoutAPI(createDefaultSystem({ log: new ConsoleLogger(LogLevel.Warn) })), []);
  const combos = useMemo(() => {
    return RENDERERS.flatMap((r) =>
      LAYOUTS.flatMap((L) =>
        MODES.map((M) => ({
          key: `${Target[r]}-${LayoutTypes[L]}-${LayoutChildrenMode[M]}`,
          renderer: r,
          layout: L,
          mode: M,
          snapshot: api.compute({ kind: "tree", root: stamp(L, M) }, {
            nodeSize: new Vector(90, 50),
            spacing: 16,
            routerName: "ortho",
          }),
        }))
      )
    );
  }, [api]);

  const grid: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    top: 72,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gridAutoRows: "340px",
    gap: 12,
    padding: 12,
    boxSizing: "border-box",
  };

  const cell: React.CSSProperties = {
    position: "relative",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
  };

  const title: React.CSSProperties = { position: "absolute", left: 8, top: 8, fontSize: 12, color: "#64748b", zIndex: 1 };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={grid}>
        {combos.map((c) => (
          <div key={c.key} style={cell}>
            <div style={title}>
              {Target[c.renderer]} • {LayoutTypes[c.layout]} • {LayoutChildrenMode[c.mode]}
            </div>
            <LayoutView kind={c.renderer} snapshot={c.snapshot} />
          </div>
        ))}
      </div>
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
                    background      : "#242424", 
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

