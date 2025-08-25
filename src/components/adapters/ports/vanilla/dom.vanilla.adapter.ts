import { LayoutResult, LayoutResultEx } from "../../../layout/engine/layout.engine";
import { Theme, defaultTheme } from "../../theme";

export type DOMMount = {
  update: (r: LayoutResultEx) => void;
  destroy: () => void;
};

const draw =    (
                    {
                        r,
                        root,
                        svg,
                        svgNS,
                        theme
                    } : {
                        r : LayoutResult,
                        root : HTMLElement,
                        svg : SVGElement,
                        svgNS : string,
                        theme : Theme,
                    }
                ) : void => 
{
    // clear
    root
        .querySelectorAll("[data-node]")
        .forEach(n => n.remove());
    
    while (svg.firstChild) 
    {
        svg.removeChild(svg.firstChild);
    }

    // wires
    for (const w of r.wires) 
    {
        const a = r.boxes[w.source];
        const b = r.boxes[w.target];
        if (!a || !b) 
        {
            continue;
        }
        const A = a.getPosition().add(a.getSize().halve());
        const B = b.getPosition().add(b.getSize().halve());
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", String(A.x));
        line.setAttribute("y1", String(A.y));
        line.setAttribute("x2", String(B.x));
        line.setAttribute("y2", String(B.y));
        line.setAttribute("stroke", theme.wire.stroke);
        line.setAttribute("stroke-width", String(theme.wire.width));
        svg.appendChild(line);
    }

    // nodes
    for (const box of Object.values(r.boxes)) 
    {
        const element               = document.createElement("div");
        element.dataset.node        = box.id;
        const style                 = element.style;
        style.position              = "absolute";
        style.left                  = `${box.getPosition().x}px`;
        style.top                   = `${box.getPosition().y}px`;
        style.width                 = `${box.getSize().x}px`;
        style.height                = `${box.getSize().y}px`;
        style.border                = `1px solid ${theme.node.border}`;
        style.borderRadius          = `${theme.node.radius}px`;
        style.background            = theme.node.bg;
        style.boxSizing             = "border-box";
        style.fontSize              = `${theme.node.fontSize}px`;
        style.color                 = theme.node.text;
        style.display               = "flex";
        style.alignItems            = "center";
        style.justifyContent        = "center";
        (style as any).userSelect   = "none"; // TS dom lib sometimes misses this
        element.textContent         = box.id;
        root.appendChild(element);
    }
};

export const mountAbsoluteDOM = (
                                    container   : HTMLElement,
                                    initial     : LayoutResult,
                                    theme       : Theme = defaultTheme
                                ) : DOMMount => 
{
    const root          : HTMLDivElement = document.createElement("div");
    root.style.position = "relative";
    root.style.width    = "100%";
    root.style.height   = "100%";
    container.appendChild(root);

    const svgNS : string        = "http://www.w3.org/2000/svg";
    const svg   : SVGElement    = document.createElementNS(svgNS, "svg") as SVGElement;
    Object.assign   (
                        svg.style, 
                        { 
                            position        : "absolute", 
                            inset           : "0", 
                            pointerEvents   : "none" 
                        }
                    );
    root.appendChild(svg);

    draw(
            {
                r: initial,
                root,
                svg,
                svgNS,
                theme
            }
        );

    return  {
                update  :   (r : LayoutResult) => 
                                draw(
                                        {
                                            r,
                                            root,
                                            svg,
                                            svgNS,
                                            theme
                                        }
                                    ),
                destroy :   () => 
                                container.removeChild(root),
            };
}
