// canvas.core.ts
// - uses stored Box.depth; removes depthOf/finite_loop
// - adds stable tie-break by id

import { LayoutResult } from "../layout/engine/layout.engine";
import { Shapes, Vector } from "../geometry";
import { Theme, defaultTheme } from "./theme";

export const drawLayoutToCanvas = (
  ctx: CanvasRenderingContext2D,
  result: LayoutResult,
  theme: Theme = defaultTheme
): void => {
  const { width, height }: { width: number; height: number } = ctx.canvas;

  // background
  ctx.save();
  ctx.fillStyle = theme.canvas.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // wires first (under boxes)
  ctx.save();
  ctx.strokeStyle = theme.wire.stroke;
  ctx.lineWidth = theme.wire.width;
  for (const w of result.wires) {
    const a: Shapes.Box = result.boxes[w.source];
    const b: Shapes.Box = result.boxes[w.target];
    if (!a || !b) continue;
    const va: Vector = a.size.halve().add(a.getPosition());
    const vb: Vector = b.size.halve().add(b.getPosition());
    ctx.beginPath();
    ctx.moveTo(va.x, va.y);
    ctx.lineTo(vb.x, vb.y);
    ctx.stroke();
  }
  ctx.restore();

  // draw boxes sorted by stable (depth, id)
  const sorted = Object.values(result.boxes).sort(
    (A, B) => A.depth - B.depth || A.id.localeCompare(B.id)
  );

  ctx.save();
  ctx.font = `${theme.node.fontSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const b of sorted) {
    const r = theme.node.radius;
    const rectangle: Shapes.Rectangle = new Shapes.Rectangle(b.getSize(), b.getPosition());
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
  ctx.restore();
};

const roundedRect = (ctx: CanvasRenderingContext2D, rectangle: Shapes.Rectangle, r: number): void => {
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
};
