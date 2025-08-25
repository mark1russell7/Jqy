// layout.registry.ts
import { Config } from "../config";
import { Layout } from "./layout";
import { LayoutTypes } from "./layout.enum";
import { GridLayout } from "./strategies/grid/grid.layout";
import { RadialLayout } from "./strategies/radial/radial.layout";

export interface LayoutRegistry {
  [LayoutTypes.Grid]: import("./strategies/grid/grid.layout").GridLayout;
  [LayoutTypes.Radial]: import("./strategies/radial/radial.layout").RadialLayout;
}

export type LayoutKind = keyof LayoutRegistry;

export const LayoutConfigs = new Config<Record<LayoutKind, Layout>>({
  [LayoutTypes.Grid]: new GridLayout(),
  [LayoutTypes.Radial]: new RadialLayout(),
});
