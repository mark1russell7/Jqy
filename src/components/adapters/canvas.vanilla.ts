import { LayoutResult } from "../engine/computeLayout";
import { drawLayoutToCanvas } from "./canvas.core";
import { Theme, defaultTheme } from "./theme";

export type CanvasMount = {
  update: (r: LayoutResult) => void;
  destroy: () => void;
};

export function mountCanvas2D(
  container: HTMLElement,
  initial: LayoutResult,
  theme: Theme = defaultTheme
): CanvasMount {
  const canvas = document.createElement("canvas");
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  container.appendChild(canvas);

  const draw = (r: LayoutResult) => {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawLayoutToCanvas(ctx, r, theme);
  };

  draw(initial);

  const ro = new ResizeObserver(() => draw(initial));
  ro.observe(container);

  return {
    update: draw,
    destroy: () => {
      ro.disconnect();
      container.removeChild(canvas);
    }
  };
}
