import { Vector } from "../core/geometry";

export type Box = {
  id: string;
  position: Vector;  // top-left
  size: Vector;
  parentId?: string;
  depth: number;
};

export type Wire = { id: string; source: string; target: string; polyline?: Vector[] };

export type LayoutStats = {
  nodeCount: number;
  edgeCount: number;
  maxDepth: number;
  bounds: { position: Vector; size: Vector };
  overlaps?: Array<[string, string]>;
};

export type LayoutSnapshot = Readonly<{
  boxes: Readonly<Record<string, Box>>;
  wires: ReadonlyArray<Wire>;
  stats: LayoutStats;
  version: number;
  meta?: Record<string, unknown>;
}>;
