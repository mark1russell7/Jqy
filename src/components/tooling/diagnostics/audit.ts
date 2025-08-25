import type { LayoutSnapshot } from "../../layout/types";
import type { Plan } from "../../layout/engine/phases/plan";
import type { LayoutTuning } from "../../layout/layout.tuning";
import { Config } from "../../config";

export type AuditIssue = {
  code:
    | "NESTED_CHILD_NOT_SQUARE"
    | "NESTED_CHILD_OUTSIDE_PARENT"
    | "NESTED_CHILD_TOO_BIG";
  severity: "warn" | "error";
  parentId: string;
  childId: string;
  detail?: unknown;
};

/** Build children map from snapshot.parentId relations. */
function childrenOf(s: LayoutSnapshot): Record<string, string[]> {
  const kids: Record<string, string[]> = {};
  for (const b of Object.values(s.boxes)) {
    if (!b.parentId) continue;
    (kids[b.parentId] ??= []).push(b.id);
  }
  return kids;
}

/** Simple post-hoc audit matching our sizing intent. */
export function auditSnapshot(
  s: LayoutSnapshot,
  _plan: Plan,
  tuning: Config<LayoutTuning>,
  opts: { spacing: number }
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const kids = childrenOf(s);
  const pad = (p: number) => tuning.get("outerPad")(p);

  for (const [pid, arr] of Object.entries(kids)) {
    const parent = s.boxes[pid];
    if (!parent) continue;

    const inner = parent.size.subtract(new (parent.size.constructor as any)(pad(opts.spacing) * 2, pad(opts.spacing) * 2));
    const maxSide = inner.min();

    for (const cid of arr) {
      const child = s.boxes[cid];
      if (!child) continue;

      // 1) square check
      if (child.size.x !== child.size.y) {
        issues.push({ code: "NESTED_CHILD_NOT_SQUARE", severity: "warn", parentId: pid, childId: cid });
      }
      // 2) too big vs inner box
      if (Math.max(child.size.x, child.size.y) > maxSide + 0.5) {
        issues.push({ code: "NESTED_CHILD_TOO_BIG", severity: "warn", parentId: pid, childId: cid });
      }
      // 3) outside parent bounds
      const cx1 = child.position.x, cy1 = child.position.y;
      const cx2 = cx1 + child.size.x, cy2 = cy1 + child.size.y;
      const px1 = parent.position.x, py1 = parent.position.y;
      const px2 = px1 + parent.size.x, py2 = py1 + parent.size.y;
      const outside = cx1 < px1 - 0.5 || cy1 < py1 - 0.5 || cx2 > px2 + 0.5 || cy2 > py2 + 0.5;
      if (outside) {
        issues.push({ code: "NESTED_CHILD_OUTSIDE_PARENT", severity: "warn", parentId: pid, childId: cid });
      }
    }
  }

  return issues;
}
