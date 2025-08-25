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