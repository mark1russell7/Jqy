import type { RenderPort, RenderSession } from "./types";
import type { LayoutSnapshot } from "../../layout/types";
import type { Theme } from "../../adapters/theme";
import { defaultTheme } from "../../adapters/theme";

export class DomPort implements RenderPort {
  mount(container: HTMLElement, initial: LayoutSnapshot, theme: Theme = defaultTheme): RenderSession {
    const root = document.createElement("div");
    Object.assign(root.style, { position: "relative", width: "100%", height: "100%" });

    const svgNS = "http://www.w3.org/2000/svg";
    const svg: SVGSVGElement = document.createElementNS(svgNS, "svg") as SVGSVGElement;
    Object.assign(svg.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: "0",
    });
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    container.appendChild(root);
    root.appendChild(svg);

    const applyViewBox = (s: LayoutSnapshot) => {
      const b = s.stats.bounds;
      const w = Math.max(1, Math.ceil(b.size.x));
      const h = Math.max(1, Math.ceil(b.size.y));
      svg.setAttribute("viewBox", `${Math.floor(b.position.x)} ${Math.floor(b.position.y)} ${w} ${h}`);
    };

    const draw = (s: LayoutSnapshot) => {
  root.querySelectorAll("[data-node]").forEach((n) => n.remove());
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  // --- viewBox fix so lines outside initial CSS box are visible
  const b = s.stats.bounds;
  const vbW = Math.max(1, Math.ceil(b.size.x));
  const vbH = Math.max(1, Math.ceil(b.size.y));
  (svg as SVGSVGElement).setAttribute("viewBox", `${Math.floor(b.position.x)} ${Math.floor(b.position.y)} ${vbW} ${vbH}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  for (const w of s.wires) {
    if (w.polyline && w.polyline.length >= 2) {
      const poly = document.createElementNS(svgNS, "polyline");
      poly.setAttribute("points", w.polyline.map(p => `${p.x},${p.y}`).join(" "));
      poly.setAttribute("fill", "none");
      poly.setAttribute("stroke", theme.wire.stroke);
      poly.setAttribute("stroke-width", String(theme.wire.width));
      svg.appendChild(poly);
      continue;
    }
    const a = s.boxes[w.source]; const b2 = s.boxes[w.target];
    if (!a || !b2) continue;
    const A = a.position.add(a.size.halve());
    const B = b2.position.add(b2.size.halve());
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", String(A.x));
    line.setAttribute("y1", String(A.y));
    line.setAttribute("x2", String(B.x));
    line.setAttribute("y2", String(B.y));
    line.setAttribute("stroke", theme.wire.stroke);
    line.setAttribute("stroke-width", String(theme.wire.width));
    svg.appendChild(line);
  }

  for (const b3 of Object.values(s.boxes).sort((a, c) => a.depth - c.depth || a.id.localeCompare(c.id))) {
    const el = document.createElement("div");
    el.dataset.node = b3.id;
    const style = el.style;
    style.position = "absolute";
    style.left = `${b3.position.x}px`;
    style.top = `${b3.position.y}px`;
    style.width = `${b3.size.x}px`;
    style.height = `${b3.size.y}px`;
    style.border = `1px solid ${theme.node.border}`;
    style.borderRadius = `${theme.node.radius}px`;
    style.background = theme.node.bg;
    style.boxSizing = "border-box";
    style.fontSize = `${theme.node.fontSize}px`;
    style.color = theme.node.text;
    style.display = "flex";
    style.alignItems = "center";
    style.justifyContent = "center";
    (style as any).userSelect = "none";
    el.textContent = b3.id;
    root.appendChild(el);
  }
};


    draw(initial);

    return {
      draw,
      destroy: () => {
        try {
          if (root.parentNode === container) container.removeChild(root);
          else root.remove?.();
        } catch { /* swallow */ }
      },
    };
  }
}
