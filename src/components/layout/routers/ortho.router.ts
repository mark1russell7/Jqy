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
