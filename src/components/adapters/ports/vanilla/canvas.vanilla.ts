import { LayoutResultEx } from "../../../layout/engine/layout.engine";
import { Theme, defaultTheme } from "../../theme";
import { CanvasRenderer2D } from "../../targets/canvas.core";

export type CanvasMount = {
  update: (r: LayoutResultEx, opts?: { partial?: boolean }) => void;
  destroy: () => void;
};

export const mountCanvas2D = (
  container: HTMLElement,
  initial: LayoutResultEx,
  theme: Theme = defaultTheme
): CanvasMount => {
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  Object.assign(canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%" });
  container.appendChild(canvas);

  // initial sizing + DPR
  const dpr: number = Math.max(1, (window.devicePixelRatio as number) || 1);
  const rect: DOMRect = container.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const renderer = new CanvasRenderer2D(canvas, theme);
  renderer.fullDraw(initial);

  const ro: ResizeObserver = new ResizeObserver(() => {
    const rr = container.getBoundingClientRect();
    const w = Math.max(1, Math.round(rr.width * dpr));
    const h = Math.max(1, Math.round(rr.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      const c = canvas.getContext("2d")!;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderer.fullDraw(initial);
    }
  });
  ro.observe(container);

  return {
    update: (r, opts) => renderer.update(r, { partial: opts?.partial ?? true }),
    destroy: () => {
      ro.disconnect();
      container.removeChild(canvas);
    },
  };
};
