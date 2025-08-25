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
