import type { RenderPort, RenderSession } from "./types";
import type { LayoutSnapshot } from "../../layout/types";
import type { Theme } from "../../adapters/theme";
import { defaultTheme } from "../../adapters/theme";
import { CanvasRenderer2D } from "../../adapters/targets/canvas.core";

export class CanvasPort implements RenderPort {
  mount(container: HTMLElement, initial: LayoutSnapshot, theme: Theme = defaultTheme): RenderSession {
    const canvas = document.createElement("canvas");
    Object.assign(canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%" });
    container.appendChild(canvas);

    const dpr = Math.max(1, (window.devicePixelRatio as number) || 1);
    const rect = container.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));

    // set the device-pixel transform before constructing the renderer (same context)
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const renderer = new CanvasRenderer2D(canvas, theme);

    const toLegacy = (s: LayoutSnapshot) => ({
      boxes: Object.fromEntries(
        Object.values(s.boxes).map((b) => [
          b.id,
          { id: b.id, getPosition: () => b.position, getSize: () => b.size, parentId: b.parentId, depth: b.depth },
        ])
      ),
      wires: s.wires.map((w) => ({ id: w.id, source: w.source, target: w.target, polyline: w.polyline })),
    });

    let last = initial;
    renderer.fullDraw(toLegacy(initial));

    const draw = (s: LayoutSnapshot) => {
      last = s;
      renderer.update(toLegacy(s), { partial: true });
    };

    const ro = new ResizeObserver(() => {
      const rr = container.getBoundingClientRect();
      const w = Math.max(1, Math.round(rr.width * dpr));
      const h = Math.max(1, Math.round(rr.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderer.fullDraw(toLegacy(last)); // full redraw after resize
      }
    });
    ro.observe(container);

    return {
      draw,
      destroy: () => {
        try {
          ro.disconnect();
          if (canvas.parentNode === container) container.removeChild(canvas);
          else canvas.remove?.();
        } catch {}
      },
    };
  }
}
