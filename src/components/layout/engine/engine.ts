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
