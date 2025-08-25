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

function childrenOf(s: LayoutSnapshot): Record<string, string[]> {
  const kids: Record<string, string[]> = {};
  for (const b of Object.values(s.boxes)) {
    if (!b.parentId) continue;
    (kids[b.parentId] ??= []).push(b.id);
  }
  return kids;
}

export function auditSnapshot(
  s: LayoutSnapshot,
  _plan: Plan,
  tuning: Config<LayoutTuning>,
  opts: { spacing: number }
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const kids = childrenOf(s);
  const padOuter = tuning.get("outerPad")(opts.spacing);

  for (const [pid, arr] of Object.entries(kids)) {
    const parent = s.boxes[pid];
    if (!parent) continue;

    const innerX = parent.size.x - 2 * padOuter;
    const innerY = parent.size.y - 2 * padOuter;
    const innerX1 = parent.position.x + padOuter;
    const innerY1 = parent.position.y + padOuter;
    const innerX2 = innerX1 + innerX;
    const innerY2 = innerY1 + innerY;
    const maxSide = Math.min(innerX, innerY);

    for (const cid of arr) {
      const child = s.boxes[cid];
      if (!child) continue;

      if (child.size.x !== child.size.y) {
        issues.push({ code: "NESTED_CHILD_NOT_SQUARE", severity: "warn", parentId: pid, childId: cid });
      }
      if (Math.max(child.size.x, child.size.y) > maxSide + 0.5) {
        issues.push({ code: "NESTED_CHILD_TOO_BIG", severity: "warn", parentId: pid, childId: cid });
      }

      const cx1 = child.position.x, cy1 = child.position.y;
      const cx2 = cx1 + child.size.x, cy2 = cy1 + child.size.y;
      const outsideInner =
        cx1 < innerX1 - 0.5 || cy1 < innerY1 - 0.5 || cx2 > innerX2 + 0.5 || cy2 > innerY2 + 0.5;
      if (outsideInner) {
        issues.push({ code: "NESTED_CHILD_OUTSIDE_PARENT", severity: "warn", parentId: pid, childId: cid });
      }
    }
  }

  return issues;
}
