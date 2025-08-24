import { computeLayout, LayoutResult, ModeMap } from "../engine/computeLayout";
import { Vector } from "../geometry";
import { NodeConfig } from "../graph";

export function runLayoutAPI(
  root: NodeConfig,
  modes: ModeMap,
  nodeSize: Vector,
  spacing: number
): LayoutResult {
  return computeLayout(root, modes, nodeSize, spacing);
}
