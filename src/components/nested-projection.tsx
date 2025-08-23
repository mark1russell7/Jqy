import { Vector } from "./geometry";
import { NodeConfig } from "./graph";
import { LayoutTypes } from "./layout/layout.enum";
import { NestedBox } from "./nested-box";
export type NestedProjectionProps = 
{
    config     : NodeConfig;
    layoutName : LayoutTypes;
    nodeSize   : Vector;
    spacing    : number;
}
const NestedProjection =    (
                                { 
                                    config, 
                                    layoutName, 
                                    nodeSize, 
                                    spacing 
                                } : NestedProjectionProps
                            ) 
                            : React.JSX.Element =>
{
    return (
        <div style =    {
                            { 
                                position    : "absolute", 
                                left        : 12, 
                                top         : 12 
                            }
                        }
        >
            <NestedBox 
                node        =   {config     } 
                layoutName  =   {layoutName } 
                nodeSize    =   {nodeSize   } 
                spacing     =   {spacing    } 
            />
        </div>
    );
}

export { NestedProjection };