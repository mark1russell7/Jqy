import { 
    Config 
} from "../config";
import { 
    Vector 
} from "../geometry";
import { 
    LayoutTypes 
} from "./layout.enum";

export type LayoutConfigOptions = 
{
    mode        : LayoutTypes;
    spacing     : number;
    nodeSize    : Vector;
}

export const layoutConfig = new Config<LayoutConfigOptions>({
    mode     : LayoutTypes.Grid,
    spacing  : 10,
    nodeSize : new Vector(100, 100)
});

export const nestedGridConfig = new Config<{
    outerPadding : Vector;
}>({
    outerPadding : new Vector(20, 20),
});