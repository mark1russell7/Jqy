import { Vector } from "./geometry";
import { NodeConfig } from "./graph";
import { NestedFramesReturn } from "./layout/layout";
import { LayoutTypes } from "./layout/layout.enum";
import { NestedBox } from "./nested-box";

export type GridChildProps = 
{
    nodeConfig  : NodeConfig;
    layoutName  : LayoutTypes;
    nodeSize    : Vector;
    spacing     : number;
    level       : number;
    gridFrames  : NestedFramesReturn;
}

const GridChild =   (
                        {
                            nodeConfig,
                            layoutName,
                            nodeSize,
                            spacing,
                            level,
                            gridFrames
                        } : GridChildProps
                    ) 
                    : React.JSX.Element => 
{

    // Tight cell rect
    const frame = gridFrames.grid.getItem(nodeConfig.id);
    if(!frame)
    {
        return <>Error {nodeConfig.id}</>;
    }
    const position      : Vector = frame.dimensions.getPosition();
    const size          : Vector = frame.dimensions.getSize();
    const ip            : number = gridFrames.ip;
    const inner         : Vector = size.subtract(Vector.scalar(2 * ip)).clamp(1, Infinity);
    const WrapperStyle  : React.CSSProperties =
    {
        position    : "absolute",
        left        : position.x,
        top         : position.y,
        width       : size.x,
        height      : size.y
    }
    const ChildStyle    : React.CSSProperties = 
    {
        position    : "absolute",
        left        : ip,
        top         : ip,
        width       : inner.x,
        height      : inner.y
    };
    return (
        <div style={WrapperStyle}>
            <div 
                key     =   {nodeConfig.id  } 
                style   =   {ChildStyle     }
            >
                <NestedBox 
                    node        =   {nodeConfig } 
                    layoutName  =   {layoutName } 
                    nodeSize    =   {inner      } 
                    spacing     =   {spacing    } 
                    level       =   {level + 1  } 
                />
            </div>
        </div>
    );
}

export { GridChild };