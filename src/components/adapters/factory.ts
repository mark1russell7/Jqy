import React from "react";
import { AdapterConfig, Framework, Target } from "./env";
import { runLayoutAPI } from "./api.adapter";
import { Canvas2D } from "./canvas.adapter";
import { AbsoluteDOM } from "./react-dom.adapter";
import { LayoutView } from "./react-view.adapter";
import { mountCanvas2D } from "./canvas.vanilla";
import { mountAbsoluteDOM } from "./vanilla-dom.adapter";
// factory.ts
export type Renderer =
  | { kind: "api" }
  | { kind: "dom" }
  | { kind: "canvas" }
  | { kind: "react", Component: React.ComponentType<any> }
  | { kind: "reactflow", Component: React.ComponentType<any> };

export function makeRenderer(target: Target): Renderer {
  switch (target) {
    case Target.API:    return { kind: "api" };
    case Target.DOM:    return { kind: "dom" };
    case Target.Canvas: return { kind: "canvas" };
    case Target.ReactFlow:
    case Target.ThreeJS:
    default:            return { kind: "react", Component: LayoutView }; // imported from a .tsx file
  }
}

/**
 * getAdapter(cfg)
 * - For React: returns { kind: 'react', render: (props) => ReactElement }
 * - For Vanilla: returns { kind: 'vanilla', mount(container, initial) => { update, destroy } }
 * - For API: returns { kind: 'api', run(root, modes, nodeSize, spacing) => LayoutResult }
 */
export function getAdapter(cfg: AdapterConfig) {
  switch (cfg.target) {
    case Target.API:
      return { kind: "api" as const, run: runLayoutAPI };

    case Target.Canvas:
      if (cfg.framework === Framework.React) {
        return { kind: "react" as const, render: (props: any) => React.createElement(Canvas2D, props) };
      } else {
        return { kind: "vanilla" as const, mount: mountCanvas2D };
      }

    case Target.DOM:
      if (cfg.framework === Framework.React) {
        return { kind: "react" as const, render: (props: any) => React.createElement(AbsoluteDOM, props) };
      } else {
        return { kind: "vanilla" as const, mount: mountAbsoluteDOM };
      }

    case Target.ReactFlow:
      // React only – reuse <LayoutView kind="reactflow" />
      return {
        kind: "react" as const,
        render: (props: any) => React.createElement(LayoutView as any, { ...props, kind: "reactflow" }),
      };

    case Target.ThreeJS:
      throw new Error("ThreeJS adapter not implemented yet.");

    default:
      throw new Error(`Unsupported target: ${cfg.target}`);
  }
}
