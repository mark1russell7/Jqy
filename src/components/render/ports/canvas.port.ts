import type { MountOptions, RenderPort, RenderSession } from "./types";
import type { LayoutSnapshot } from "../../layout/types";
import type { Theme } from "../../adapters/theme";
import { defaultTheme } from "../../adapters/theme";
import { CanvasRenderer2D } from "../../adapters/targets/canvas.core";
import { ViewportController } from "./viewport";

export class CanvasPort implements RenderPort {
  mount(container: HTMLElement, initial: LayoutSnapshot, theme: Theme = defaultTheme, options?: MountOptions): RenderSession {
    const canvas = document.createElement("canvas");
    Object.assign(canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%" });
    container.appendChild(canvas);

    const ctx = canvas.getContext("2d")!;
    const vp = options?.viewport ?? new ViewportController();

    let dpr = Math.max(1, (window.devicePixelRatio as number) || 1);
    const applyCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      const v = vp.get();
      ctx.setTransform(dpr * v.scale, 0, 0, dpr * v.scale, dpr * v.x, dpr * v.y);
    };

    applyCanvasSize();

    const renderer = new CanvasRenderer2D(canvas, theme);
    const toLegacy = (s: LayoutSnapshot) => ({
      boxes: Object.fromEntries(Object.values(s.boxes).map((b) => [
        b.id,
        { id: b.id, getPosition: () => b.position, getSize: () => b.size, parentId: b.parentId, depth: b.depth },
      ])),
      wires: s.wires.map((w) => ({ id: w.id, source: w.source, target: w.target, polyline: w.polyline })),
    });

    let last = initial;
    renderer.fullDraw(toLegacy(initial));

    const onVP = () => { applyCanvasSize(); renderer.fullDraw(toLegacy(last)); };
    const detachVP = vp.onChange(() => { applyCanvasSize(); renderer.fullDraw(toLegacy(last)); });
    const detachInput = (options?.interactive === false) ? (() => {}) : vp.attachWheelAndDrag(canvas);

    const draw = (s: LayoutSnapshot) => { last = s; renderer.update(toLegacy(s), { partial: true }); };

    // ResizeObserver for container
    const ro = new ResizeObserver(() => applyCanvasSize());
    ro.observe(container);

    // DPR change: window resize usually fires; also guard via polling media query fallback
    const onWindowResize = () => {
      const next = Math.max(1, (window.devicePixelRatio as number) || 1);
      if (next !== dpr) { dpr = next; applyCanvasSize(); renderer.fullDraw(toLegacy(last)); }
    };
    window.addEventListener("resize", onWindowResize);

    return {
      draw,
      destroy: () => {
        try {
          detachVP(); detachInput(); ro.disconnect(); window.removeEventListener("resize", onWindowResize);
          if (canvas.parentNode === container) container.removeChild(canvas); else canvas.remove?.();
        } catch {}
      },
      setViewport: (v) => vp.set(v ?? {}),
      getViewport: () => vp.get(),
    };
  }
}
