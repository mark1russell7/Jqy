import { 
    computeLayout, 
    LayoutResult, 
    ModeMap 
} from "../engine/computeLayout";
import { 
    Vector 
} from "../geometry";
import { 
    NodeConfig 
} from "../graph";

export type RunLayoutApiInput = 
{
    root      : NodeConfig,
    modes     : ModeMap,
    nodeSize  : Vector,
    spacing   : number
}

export const runLayoutAPI = (
                                {
                                    root,
                                    modes,
                                    nodeSize,
                                    spacing
                                } : RunLayoutApiInput
                            ) : LayoutResult => 
                                computeLayout   (
                                                    root, 
                                                    modes, 
                                                    nodeSize, 
                                                    spacing
                                                );

