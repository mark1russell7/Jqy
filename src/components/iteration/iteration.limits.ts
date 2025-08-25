// iteration/limits.ts
// Hard bounds + policy everywhere (depth, nodes, children, edges, ops)
import { Config } from "../config";
import type { LimitAction } from "./iterate";

export type IterationLimits = {
  maxDepth: number;
  maxNodes: number;
  maxChildrenPerNode: number;
  maxEdges: number;
  maxOpsPerPass: number; // coarse fuse for any while/for you add later
  onLimit: LimitAction;  // "throw" | "truncate" | "warn"
};

export const defaultIterationLimits: IterationLimits = {
  maxDepth: 1000,
  maxNodes: 5000,
  maxChildrenPerNode: 1000,
  maxEdges: 10000,
  maxOpsPerPass: 100_000,
  onLimit: "warn",
};

export const IterationConfig = new Config<IterationLimits>(defaultIterationLimits);

/** Simple guardable loop if you need it somewhere ad-hoc. */
export function boundedLoop(limit: number, body: (i: number) => boolean): void {
  let i = 0;
  for (; i < limit && body(i); i++);
  if (i >= limit) throw new Error(`boundedLoop: limit ${limit} reached`);
}
