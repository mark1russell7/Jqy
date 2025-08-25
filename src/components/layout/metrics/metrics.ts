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
