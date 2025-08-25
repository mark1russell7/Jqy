import { Vector } from "../../core/geometry";
import { NodeConfig } from "../../graph/types";
import { IterationLimits } from "../limits";
import { LayoutChildrenMode, LayoutTypes } from "../layout.enum";
import { LayoutTuning } from "../layout.tuning";

/** Minimal attrs we may get for a node (graph-agnostic). */
export type NodeAttrs = {
  label?: string;
  position?: Vector;
  size?: Vector;           // optional: preferred box
  layout?: LayoutTypes;    // preferred layout strategy for this node
  mode?: LayoutChildrenMode; // GRAPH | NESTED
  data?: unknown;
};

export type Edge = { id?: string; source: string; target: string; data?: unknown };

/** Unified input contract for the pipeline. */
export type GraphInput =
  | { kind: "tree"; root: NodeConfig }
  | { kind: "graph"; nodes: Record<string, NodeAttrs>; edges: Edge[] };

/** Engine options (all optional & shallow-merged with defaults). */
export type ComputeOptions = {
  nodeSize?: Vector;
  spacing?: number;
  collectOverlaps?: boolean;
  limitsOverride?: Partial<IterationLimits>;
  tuningOverride?: Partial<LayoutTuning>;
  routerName?: "line" | "ortho";
  /** What to do if validate() returns issues. */
  onValidateIssues?: "ok" | "warn" | "error";
};
