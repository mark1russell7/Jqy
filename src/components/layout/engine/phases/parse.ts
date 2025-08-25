import type { GraphInput } from "../../api/contracts";
import type { Graph } from "../../../graph/model";
import { fromTree } from "../../../graph/builders/tree";
import type { NodeConfig } from "../../../graph/types";
import { makePhase, type Phase } from "./contracts";

export type Parsed = {
  graph: Graph;
  /** If a faithful tree is available, we keep it for high-fidelity placement. */
  tree?: NodeConfig;
};

export function parse(input: GraphInput): Parsed {
  if (input.kind === "tree") {
    const graph = fromTree(input.root);
    return { graph, tree: input.root };
  }
  // Graph path: keep as-is; naive parents map if single inbound edge.
  const parents: Record<string, string | undefined> = {};
  const inbound = new Map<string, string[]>();
  for (const id of Object.keys(input.nodes)) inbound.set(id, []);
  for (const e of input.edges) {
    const arr = inbound.get(e.target);
    if (arr) arr.push(e.source);
  }
  for (const [k, v] of inbound.entries()) parents[k] = v.length > 0 ? v[0] : undefined;

  return { graph: { nodes: input.nodes, edges: input.edges, parents } };
}

export const ParsePhase: Phase<GraphInput, Parsed> = makePhase("parse", parse);