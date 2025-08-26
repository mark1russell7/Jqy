import type { RenderPort, RenderSession } from "./types";
import type { LayoutSnapshot } from "../../layout/types";
import type { Theme } from "../../adapters/theme";
import { defaultTheme } from "../../adapters/theme";
import type { ViewportController } from "./viewport";

export class DomPort implements RenderPort {
  mount(
    container: HTMLElement,
    initial: LayoutSnapshot,
    theme: Theme = defaultTheme,
    opts?: { viewport?: ViewportController; interactive?: boolean }
  ): RenderSession {
    const root = document.createElement("div");
    Object.assign(root.style, { position: "relative", width: "100%", height: "100%", overflow: "hidden" });
    container.appendChild(root);

    // content layer gets translate/scale
    const content = document.createElement("div");
    Object.assign(content.style, { position: "absolute", inset: "0", transformOrigin: "0 0", willChange: "transform" });
    root.appendChild(content);

    // edges
    const svgNS = "http://www.w3.org/2000/svg";
    const svg: SVGSVGElement = document.createElementNS(svgNS, "svg") as SVGSVGElement;
    Object.assign(svg.style, { position: "absolute", left: "0", top: "0", pointerEvents: "none", zIndex: "0" });
    content.appendChild(svg);

    // nodes
    const nodesLayer = document.createElement("div");
    Object.assign(nodesLayer.style, { position: "absolute", left: "0", top: "0", zIndex: "1" });
    content.appendChild(nodesLayer);

    const vp = opts?.viewport;
    const syncTransform = () => {
      if (!vp) return;
      const { x, y, scale } = vp.get();
      content.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    };
    const offVp = vp?.onChange(syncTransform);
    syncTransform();

    const draw = (s: LayoutSnapshot) => {
      nodesLayer.querySelectorAll("[data-node]").forEach((n) => n.remove());
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      const b = s.stats.bounds;
      const stageW = Math.max(1, Math.ceil(b.size.x));
      const stageH = Math.max(1, Math.ceil(b.size.y));
      Object.assign(nodesLayer.style, { width: `${stageW}px`, height: `${stageH}px` });
      svg.setAttribute("width", String(stageW));
      svg.setAttribute("height", String(stageH));

      // wires (local coords inside stage)
      for (const w of s.wires) {
        if (w.polyline && w.polyline.length >= 2) {
          const poly = document.createElementNS(svgNS, "polyline");
          poly.setAttribute("points", w.polyline.map(p => `${p.x - b.position.x},${p.y - b.position.y}`).join(" "));
          poly.setAttribute("fill", "none");
          poly.setAttribute("stroke", theme.wire.stroke);
          poly.setAttribute("stroke-width", String(theme.wire.width));
          svg.appendChild(poly);
          continue;
        }
        const a = s.boxes[w.source], c = s.boxes[w.target];
        if (!a || !c) continue;
        const A = a.position.add(a.size.halve()).subtract(b.position);
        const B = c.position.add(c.size.halve()).subtract(b.position);
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", String(A.x)); line.setAttribute("y1", String(A.y));
        line.setAttribute("x2", String(B.x)); line.setAttribute("y2", String(B.y));
        line.setAttribute("stroke", theme.wire.stroke);
        line.setAttribute("stroke-width", String(theme.wire.width));
        svg.appendChild(line);
      }

      for (const bx of Object.values(s.boxes).sort((a, c) => a.depth - c.depth || a.id.localeCompare(c.id))) {
        const el = document.createElement("div");
        el.dataset.node = bx.id;
        const st = el.style;
        st.position = "absolute";
        st.left = `${bx.position.x - b.position.x}px`;
        st.top = `${bx.position.y - b.position.y}px`;
        st.width = `${bx.size.x}px`; st.height = `${bx.size.y}px`;
        st.border = `1px solid ${theme.node.border}`;
        st.borderRadius = `${theme.node.radius}px`;
        st.background = theme.node.bg;
        st.boxSizing = "border-box"; st.fontSize = `${theme.node.fontSize}px`; st.color = theme.node.text;
        st.display = "flex"; st.alignItems = "center"; st.justifyContent = "center";
        (st as any).userSelect = "none";
        el.textContent = bx.id;
        nodesLayer.appendChild(el);
      }
    };

    draw(initial);
    let detachInputs: (() => void) | undefined;
    if (opts?.interactive && vp) detachInputs = vp.attachWheelAndDrag(root);

    return {
      draw,
      destroy: () => {
        try { offVp?.(); detachInputs?.(); if (root.parentNode === container) container.removeChild(root); else root.remove?.(); } catch {}
      },
    };
  }
}
