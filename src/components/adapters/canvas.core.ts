import { 
    LayoutResult 
} from "../engine/computeLayout";
import { 
    Shapes, 
    Vector 
} from "../geometry";
import { 
    Theme, 
    defaultTheme 
} from "./theme";

export const MAX_DEPTH      = 1_000;
export const finite_loop    =   (
                                    f : () => boolean
                                ) : void => 
                                {
                                    let i : number = 1;
                                    for (
                                            let keepGoing : boolean = true; 
                                            i <= MAX_DEPTH && keepGoing; 
                                            i++, keepGoing = f()
                                        );
                                    if(i === MAX_DEPTH)
                                    {
                                        throw new Error("Maximum depth exceeded");
                                    }
                                        
                                }

export const depthOf =  (
                            box     : Shapes.Box, 
                            boxes   : LayoutResult["boxes"]
                        ) : number => 
                        {
                            let     d           : number     = 0
                            const   boxesBox    : Shapes.Box = boxes[box.id];
                            if(boxesBox.parentId === undefined)
                            {
                                return d;
                            }
                            let p : string = boxesBox.parentId;
                            finite_loop(
                                            () => 
                                            {
                                                d++;
                                                const boxesBox      : Shapes.Box = boxes[p];
                                                const parentBoxID   :  string | undefined = boxesBox.parentId;
                                                if(parentBoxID === undefined)
                                                {
                                                    return false;
                                                }
                                                p = parentBoxID;
                                                return true;
                                            }
                                        );
                            return d;
                        }

export const drawLayoutToCanvas =   (
                                        ctx     : CanvasRenderingContext2D,
                                        result  : LayoutResult,
                                        theme   : Theme = defaultTheme
                                    ) : void => 
                                    {
                                        const   { 
                                                    width, 
                                                    height 
                                                } 
                                                : 
                                                { 
                                                    width   : number, 
                                                    height  : number 
                                                } = ctx.canvas;

                                        // background
                                        ctx.save();
                                        ctx.fillStyle   = theme.canvas.bg;
                                        ctx.fillRect(
                                                        0, 
                                                        0, 
                                                        width, 
                                                        height
                                                    );
                                        ctx.restore();

                                        // wires first (under boxes)
                                        ctx.save();
                                        ctx.strokeStyle = theme.wire.stroke;
                                        ctx.lineWidth   = theme.wire.width;
                                        for (const w of result.wires) 
                                        {
                                            const a : Shapes.Box = result.boxes[w.source];
                                            const b : Shapes.Box = result.boxes[w.target];
                                            if (!a || !b) 
                                            {
                                                continue;
                                            }
                                            const va : Vector = a
                                                                    .size
                                                                    .halve()
                                                                    .add(a.getPosition());
                                            const vb : Vector = b
                                                                    .size
                                                                    .halve()
                                                                    .add(b.getPosition());
                                            ctx.beginPath   ();
                                            ctx.moveTo      (
                                                                va.x, 
                                                                va.y
                                                            );
                                            ctx.lineTo      (
                                                                vb.x, 
                                                                vb.y
                                                            );
                                            ctx.stroke      ();
                                        }
                                        ctx.restore();

                                        // draw boxes sorted by depth (parents under children)
                                        const sorted = Object
                                                        .values (result.boxes)
                                                        .sort   (
                                                                    (
                                                                        A : Shapes.Box, 
                                                                        B : Shapes.Box
                                                                    ) : number =>
                                                                        depthOf(A, result.boxes) 
                                                                    -   depthOf(B, result.boxes)
                                                                );

                                        ctx.save();
                                        ctx.font            = `${theme.node.fontSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
                                        ctx.textAlign       = "center";
                                        ctx.textBaseline    = "middle";
                                        for (const b of sorted) 
                                        {
                                            const r         : number            = theme.node.radius;
                                            const rectangle : Shapes.Rectangle  = new Shapes.Rectangle  (
                                                                                                            b.getSize(), 
                                                                                                            b.getPosition()
                                                                                                        );
                                            const center    : Vector            = b.getPosition().add(b.getSize().halve());

                                            ctx.beginPath();
                                            roundedRect (
                                                            ctx, 
                                                            rectangle, 
                                                            r
                                                        );
                                            ctx.fillStyle   = theme.node.bg;
                                            ctx.fill();
                                            ctx.strokeStyle = theme.node.border;
                                            ctx.lineWidth = 1;
                                            ctx.stroke();

                                            ctx.fillStyle = theme.node.text;
                                            ctx.fillText(
                                                            b.id, 
                                                            center.x, 
                                                            center.y
                                                        );
                                        }
                                        ctx.restore();
                                    }

const roundedRect = (
                                        ctx         : CanvasRenderingContext2D,
                                        rectangle   : Shapes.Rectangle, 
                                        r           : number
                    ) : void => 
                    {
                        const size              : Vector    = rectangle.getSize();
                        const position          : Vector    = rectangle.getPosition();
                        const rr                : number    = Math.min  (
                                                                            r, 
                                                                            size
                                                                                .halve()
                                                                                .min()
                                                                        );
                        const sizeAndPosition   : Vector    = size.add(position);
                        ctx.moveTo  (
                                        position.x + rr, 
                                        position.y
                                    );
                        ctx.arcTo   (
                                        sizeAndPosition.x, 
                                        position.y, 
                                        sizeAndPosition.x, 
                                        sizeAndPosition.y, 
                                        rr
                                    );
                        ctx.arcTo   (
                                        sizeAndPosition.x, 
                                        sizeAndPosition.y, 
                                        position.x, 
                                        sizeAndPosition.y, 
                                        rr
                                    );
                        ctx.arcTo   (
                                        position.x, 
                                        sizeAndPosition.y, 
                                        position.x, 
                                        position.y, 
                                        rr
                                    );
                        ctx.arcTo   (
                                        position.x, 
                                        position.y, 
                                        sizeAndPosition.x, 
                                        position.y, 
                                        rr
                                    );
                        ctx.closePath();
                    }
