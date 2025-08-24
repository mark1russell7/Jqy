import { 
    Config 
} from "../config";
import { 
    GridLayout 
} from "./strategies/grid.layout";
import { 
    Layout 
} from "./layout";
import { 
    LayoutTypes 
} from "./layout.enum";
import { 
    RadialLayout 
} from "./strategies/radial.layout";
import { 
    NodeConfig 
} from "../graph";

/* =========================================================
 * Public API (functional, no mutations)
 * ========================================================= */

export type ClassOf<T> = { new(...args: any[]): T };
export const LayoutConfigs = new Config<Record<LayoutTypes, Layout>>(
    {
        grid   : new GridLayout(),
        radial : new RadialLayout(),
    }
);
export const resolveLayoutName = (node : NodeConfig, fallback : LayoutTypes) : LayoutTypes => node.layout && LayoutConfigs.get<LayoutTypes>(node.layout) ? node.layout : fallback;