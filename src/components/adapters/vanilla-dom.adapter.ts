import { LayoutResult } from "../engine/computeLayout";
import { Theme, defaultTheme } from "./theme";

export type DOMMount = { update: (r: LayoutResult) => void; destroy: () => void };

export function mountAbsoluteDOM(
    container: HTMLElement,
    initial: LayoutResult,
    theme: Theme = defaultTheme
): DOMMount {
    const root = document.createElement("div");
    root.style.position = "relative";
    root.style.width = "100%";
    root.style.height = "100%";
    container.appendChild(root);

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    Object.assign(svg.style, { position: "absolute", inset: "0", pointerEvents: "none" });
    root.appendChild(svg);

    const draw = (r: LayoutResult) => {
        // clear
        root.querySelectorAll("[data-node]").forEach(n => n.remove());
        while (svg.firstChild) svg.removeChild(svg.firstChild);

        // wires
        for (const w of r.wires) {
            const a = r.boxes[w.source], b = r.boxes[w.target];
            if (!a || !b) continue;
            const ax = a.tl.x + a.size.x / 2, ay = a.tl.y + a.size.y / 2;
            const bx = b.tl.x + b.size.x / 2, by = b.tl.y + b.size.y / 2;
            const line = document.createElementNS(svgNS, "line");
            line.setAttribute("x1", String(ax));
            line.setAttribute("y1", String(ay));
            line.setAttribute("x2", String(bx));
            line.setAttribute("y2", String(by));
            line.setAttribute("stroke", theme.wire.stroke);
            line.setAttribute("stroke-width", String(theme.wire.width));
            svg.appendChild(line);
        }

        // nodes
        for (const b of Object.values(r.boxes)) {
            const el = document.createElement("div");
            el.dataset.node = b.id;
            const s = el.style;
            s.position = "absolute";
            s.left = `${b.tl.x}px`;
            s.top = `${b.tl.y}px`;
            s.width = `${b.size.x}px`;
            s.height = `${b.size.y}px`;
            s.border = `1px solid ${theme.node.border}`;
            s.borderRadius = `${theme.node.radius}px`;
            s.background = theme.node.bg;
            s.boxSizing = "border-box";
            s.fontSize = `${theme.node.fontSize}px`;
            s.color = theme.node.text;
            s.display = "flex";
            s.alignItems = "center";
            s.justifyContent = "center";
            (s as any).userSelect = "none"; // TS dom lib sometimes misses this
            el.textContent = b.id;
            root.appendChild(el);
        }
    };

    draw(initial);

    return {
        update: draw,
        destroy: () => container.removeChild(root),
    };
}
