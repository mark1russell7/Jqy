import { 
    JSX,
    useEffect, 
    useRef 
} from "react";
import { 
    LayoutResult 
} from "../engine/layout.engine";
import { 
    Theme, 
    defaultTheme 
} from "./theme";
import { 
    drawLayoutToCanvas 
} from "./canvas.core";

export type Canvas2DProps =
{
  result  : LayoutResult;
  theme?  : Theme;
}
export const Canvas2D = ( 
                            { 
                                result, 
                                theme = defaultTheme 
                            } : Canvas2DProps
                        ) : JSX.Element => 
                        {
                            const ref : React.RefObject<HTMLCanvasElement | null> = useRef<HTMLCanvasElement | null>(null);
                            const draw =    (
                                                parent : HTMLElement,
                                                cvs    : HTMLCanvasElement
                                            ) : void => 
                                            {
                                                const dpr  : number                   = Math.max(
                                                                                                    1, 
                                                                                                        window.devicePixelRatio 
                                                                                                    ||  1
                                                                                                );
                                                const rect : DOMRect                  = parent.getBoundingClientRect();
                                                cvs.width                             = Math.max(
                                                                                                    1, 
                                                                                                    Math.round  (
                                                                                                                        rect.width  
                                                                                                                    *   dpr
                                                                                                                )
                                                                                                );
                                                cvs.height                            = Math.max(
                                                                                                    1, 
                                                                                                    Math.round  (
                                                                                                                        rect.height 
                                                                                                                    *   dpr
                                                                                                                )
                                                                                                );
                                                const ctx  : CanvasRenderingContext2D = cvs.getContext("2d")!;
                                                ctx.setTransform(
                                                                    dpr, 
                                                                    0, 
                                                                    0, 
                                                                    dpr, 
                                                                    0, 
                                                                    0
                                                                );
                                                drawLayoutToCanvas  (
                                                                        ctx, 
                                                                        result, 
                                                                        theme
                                                                    );
                                            }
                            useEffect   (
                                            () : (() => void) => 
                                            {
                                                const cvs       : HTMLCanvasElement = ref.current!;
                                                const parent    : HTMLElement       = cvs.parentElement!;
                                                const ro        : ResizeObserver    = new ResizeObserver(
                                                                                                            () : void => 
                                                                                                                draw(parent, cvs)
                                                                                                        );
                                                ro.observe(parent);
                                                draw(
                                                        parent, 
                                                        cvs
                                                    );
                                                return  () : void => 
                                                            ro.disconnect();
                                            }, 
                                            [
                                                result, 
                                                theme
                                            ]
                                        );

                            return  <canvas style   =   {
                                                            { 
                                                                position    : "absolute", 
                                                                inset       : 0, 
                                                                width       : "100%", 
                                                                height      : "100%", 
                                                                display     : "block" 
                                                            }
                                                        } 
                                            ref     =   {
                                                            ref
                                                        } 
                                    />;
                        }

