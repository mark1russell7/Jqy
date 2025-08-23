import { Vector } from "./geometry";
import { NodeConfig } from "./graph";
import { PlaceChildrenReturn } from "./layout/layout";
import { LayoutTypes } from "./layout/layout.enum";
import { NestedBox } from "./nested-box";

export type RadialChildProps = 
{
    nodeConfig  : NodeConfig;
    layoutName  : LayoutTypes;
    nodeSize    : Vector;
    spacing     : number;
    level       : number;
    centers     : PlaceChildrenReturn;
    origin      : Vector;
}
const RadialChild = (
                        {
                            nodeConfig,
                            layoutName,
                            nodeSize,
                            spacing,
                            level,
                            centers,
                            origin
                        } : RadialChildProps
                    ) 
                    : React.JSX.Element => 
{
     // RADIAL (or any center-based nested): place by center, size stays nodeSize
    const p = centers[nodeConfig.id] ?? { 
                                            x : origin.x, 
                                            y : origin.y 
                                        };
    const position  = p.subtract(nodeSize.halve());
    const childNode =   { 
                            ...nodeConfig, 
                            size : nodeSize 
                        };
    const childStyle : React.CSSProperties = {
        position    : "absolute",
        left        : position.x,
        top         : position.y,
        width       : nodeSize.x,
        height      : nodeSize.y
    };
    return (
        <div
                key     =   {nodeConfig.id  } 
                style   =   {childStyle     }
        >
            <NestedBox 
                node        =   {childNode  } 
                layoutName  =   {layoutName } 
                nodeSize    =   {nodeSize   } 
                spacing     =   {spacing    } 
                level       =   {level + 1  } 
            />
        </div>
    );    
}

export { RadialChild };