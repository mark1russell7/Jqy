// iteration/limits.ts
// - central place to configure iteration/recursion limits
// - replaces ad-hoc finite_loop usage

import { Config } from "../config";

export type IterationLimits = {
  maxDepth: number;
  maxNodes?: number;
};

export const defaultIterationLimits: IterationLimits = {
  maxDepth: 1000,
};

export const IterationConfig = new Config<IterationLimits>(defaultIterationLimits);

/** Utility if you need a guardable loop elsewhere. */
export function boundedLoop(limit: number, body: (i: number) => boolean): void {
  let i = 0;
  for (; i < limit && body(i); i++);
  if (i >= limit) throw new Error(`boundedLoop: limit ${limit} reached`);
}
