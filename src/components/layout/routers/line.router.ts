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
