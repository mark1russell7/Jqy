import { LayoutResultEx, ModeMap, LayoutEngine } from "../layout/engine/layout.engine";
import { Vector } from "../geometry";
import { NodeConfig } from "../graph";

export type RunLayoutApiInput = {
  root: NodeConfig;
  modes: ModeMap;
  nodeSize: Vector;
  spacing: number;
};

const engine = new LayoutEngine();

export const runLayoutAPI = ({ root, modes, nodeSize, spacing }: RunLayoutApiInput): LayoutResultEx =>
  engine.compute({ root, modes, nodeSize, spacing });
