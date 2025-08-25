import { NodeConfig } from "../graph";
import { Target } from "../adapters/env";
import { LayoutTypes } from "../layout/layout.enum";
import { LayoutEngine, LayoutResultEx, ModeMap } from "../layout/engine/layout.engine";
import { Vector } from "../geometry";

export type PlaygroundState = {
  adapter: Target;
  spacing: number;
  nodeW: number;
  nodeH: number;
  layout: LayoutTypes;
  scope: "all" | string;
  applyToSubtree: boolean;
  modes: ModeMap;
};

export type PlaygroundController = {
  compute(config: NodeConfig, s: PlaygroundState): LayoutResultEx;
  deriveOverrides(config: NodeConfig, s: PlaygroundState): NodeConfig;
};

export function makePlaygroundController(engine = new LayoutEngine()): PlaygroundController {
  const deriveOverrides = (root: NodeConfig, s: PlaygroundState): NodeConfig => {
    const clone = (n: NodeConfig): NodeConfig => ({ ...n, children: (n.children ?? []).map(clone) });
    const copy = clone(root);
    const apply = (n: NodeConfig): void => {
      if (s.scope === "all" || n.id === s.scope) n.layout = s.layout;
      if (s.applyToSubtree || s.scope === "all") (n.children ?? []).forEach(apply);
    };
    apply(copy);
    return copy;
  };

  const compute = (config: NodeConfig, s: PlaygroundState): LayoutResultEx => {
    const nodeSize = new Vector(s.nodeW, s.nodeH).asSize();
    return engine.compute({
      root: config,
      modes: s.modes,
      nodeSize,
      spacing: s.spacing,
    });
  };

  return { compute, deriveOverrides };
}
