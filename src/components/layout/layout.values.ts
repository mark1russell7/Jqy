import { Config } from "../config";
import { GridLayout } from "./strategies/grid.layout";
import { Layout, LayoutTypes } from "./layout";
import { RadialLayout } from "./strategies/radial.layout";

/* =========================================================
 * Public API (functional, no mutations)
 * ========================================================= */

export type ClassOf<T> = { new(...args: any[]): T };
export const LayoutConfigs = new Config<Record<LayoutTypes, ClassOf<Layout>>>(
    {
        grid   : GridLayout,
        radial : RadialLayout,
    }
);
export const resolveLayoutName = (node, fallback) => node.layout && LayoutConfigs[node.layout] ? node.layout : fallback;