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
