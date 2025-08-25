// factory.ts
// - Adds makeTargetAdapter returning the new TargetAdapter using PortKind
// - Keeps existing getAdapter/makeRenderer exports for backwards-compat

import React, { JSX, ReactElement } from "react";
import { AdapterConfig, Framework, Target } from "./env";
import { runLayoutAPI, RunLayoutApiInput } from "./ports/api/api.adapter";
import { Canvas2D, Canvas2DProps } from "./ports/react/canvas.react.adapter";
import { AbsoluteDOM, AbsoluteDOMProps } from "./ports/react/dom.react.adapter";
import { LayoutView, ReactAdapterProps } from "./ports/react/react-view.adapter";
import { CanvasMount, mountCanvas2D } from "./ports/vanilla/canvas.vanilla";
import { DOMMount, mountAbsoluteDOM } from "./ports/vanilla/dom.vanilla.adapter";
import { LayoutResultEx } from "../layout/engine/layout.engine";
import { PortKind, TargetAdapter as NewTargetAdapter } from "./ports/ports";

// --- legacy Renderer + factories (unchanged API) -----------------------------

export type Renderer =
  | { kind: Target.API }
  | { kind: Target.DOM }
  | { kind: Target.Canvas }
  | { kind: Framework.React; Component: React.ComponentType<any> }
  | { kind: Target.ReactFlow; Component: React.ComponentType<any> };

export const makeRenderer = (target: Target): Renderer => {
  switch (target) {
    case Target.API:
      return { kind: Target.API };
    case Target.DOM:
      return { kind: Target.DOM };
    case Target.Canvas:
      return { kind: Target.Canvas };
    case Target.ReactFlow:
      return { kind: Target.ReactFlow, Component: LayoutView };
    case Target.ThreeJS:
    default:
      return { kind: Framework.React, Component: LayoutView };
  }
};

export type GetAdapterReturnRunLayoutAPI = {
  kind: Target.API;
  run: (input: RunLayoutApiInput) => LayoutResultEx;
};

export type GetAdapterReturnReact = {
  kind: Framework.React;
  render: (props: Canvas2DProps) => ReactElement;
};

export type GetAdapterReturnVanillaCanvas = {
  kind: Target.Canvas;
  mount: (container: HTMLElement, initial: LayoutResultEx) => CanvasMount;
};

export type GetAdapterReturnVanillaDOM = {
  kind: Target.DOM;
  mount: (container: HTMLElement, initial: LayoutResultEx) => DOMMount;
};

export type GetAdapterReturnReactFlow = {
  kind: Target.ReactFlow;
  render: (props: ReactAdapterProps) => ReactElement;
};

export type GetAdapterReturn =
  | GetAdapterReturnRunLayoutAPI
  | GetAdapterReturnReact
  | GetAdapterReturnVanillaCanvas
  | GetAdapterReturnVanillaDOM
  | GetAdapterReturnReactFlow;

export const getAdapter = (cfg: AdapterConfig): GetAdapterReturn => {
  switch (cfg.target) {
    case Target.API:
      return { kind: Target.API, run: runLayoutAPI };

    case Target.Canvas:
      if (cfg.framework === Framework.React) {
        return {
          kind: Framework.React,
          render: (props: Canvas2DProps): ReactElement => React.createElement(Canvas2D, props),
        };
      } else {
        return { kind: Target.Canvas, mount: mountCanvas2D };
      }

    case Target.DOM:
      if (cfg.framework === Framework.React) {
        return {
          kind: Framework.React,
          render: (props: AbsoluteDOMProps): JSX.Element => React.createElement(AbsoluteDOM, props),
        };
      } else {
        return { kind: Target.DOM, mount: mountAbsoluteDOM };
      }

    case Target.ReactFlow:
      return {
        kind: Target.ReactFlow,
        render: (props: ReactAdapterProps): JSX.Element =>
          React.createElement(LayoutView, { ...props, kind: Target.ReactFlow }),
      };

    case Target.ThreeJS:
      throw new Error("ThreeJS adapter not implemented yet.");

    default:
      throw new Error(`Unsupported target: ${cfg.target}`);
  }
};

// --- NEW: clean TargetAdapter using PortKind --------------------------------

export function makeTargetAdapter(cfg: AdapterConfig): NewTargetAdapter {
  switch (cfg.target) {
    case Target.API:
      return {
        target: Target.API,
        port: { kind: PortKind.API, run: runLayoutAPI },
      };
    case Target.DOM:
      if (cfg.framework === Framework.React) {
        return {
          target: Target.DOM,
          port: { kind: PortKind.React, component: AbsoluteDOM },
        };
      } else {
        return {
          target: Target.DOM,
          port: {
            kind: PortKind.Vanilla,
            mount: (container, initial) => mountAbsoluteDOM(container, initial),
          },
        };
      }
    case Target.Canvas:
      if (cfg.framework === Framework.React) {
        return {
          target: Target.Canvas,
          port: { kind: PortKind.React, component: Canvas2D },
        };
      } else {
        return {
          target: Target.Canvas,
          port: {
            kind: PortKind.Vanilla,
            mount: (container, initial) => mountCanvas2D(container, initial),
          },
        };
      }
    case Target.ReactFlow:
      return {
        target: Target.ReactFlow,
        port: { kind: PortKind.React, component: LayoutView },
      };
    default:
      throw new Error(`Unsupported target: ${cfg.target}`);
  }
}
