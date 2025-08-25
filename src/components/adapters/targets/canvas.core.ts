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
