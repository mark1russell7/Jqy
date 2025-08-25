import { 
    Config 
} from "../config";
import { 
    Layout 
} from "./layout";
import { 
    LayoutTypes 
} from "./layout.enum";

export interface LayoutRegistry
{
    [LayoutTypes.Grid   ] : import("./strategies/grid/grid.layout").GridLayout;
    [LayoutTypes.Radial ] : import("./strategies/radial/radial.layout").RadialLayout;
}

export type LayoutKind      = keyof LayoutRegistry;
export const LayoutConfigs  = new Config<Record<LayoutKind, Layout>>(
    {
        [LayoutTypes.Grid   ]   : new (await import("./strategies/grid/grid.layout"  )).GridLayout(),
        [LayoutTypes.Radial ]   : new (await import("./strategies/radial/radial.layout")).RadialLayout(),
    }
);
