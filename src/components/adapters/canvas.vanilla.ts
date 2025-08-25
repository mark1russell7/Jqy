import { LayoutResultEx } from "../layout/engine/layout.engine";
import { drawLayoutToCanvas } from "./canvas.core";
import { Theme, defaultTheme } from "./theme";

export type CanvasMount = {
  update: (r: LayoutResultEx) => void;
  destroy: () => void;
};

export const mountCanvas2D = (
  container: HTMLElement,
  initial: LayoutResultEx,
  theme: Theme = defaultTheme
): CanvasMount => {
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  container.appendChild(canvas);

  const draw = (r: LayoutResultEx): void => {
    const dpr: number = Math.max(1, (window.devicePixelRatio as number) || 1);
    const rect: DOMRect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawLayoutToCanvas(ctx, r, theme);
  };

  draw(initial);

  const ro: ResizeObserver = new ResizeObserver(() => draw(initial));
  ro.observe(container);

  return {
    update: draw,
    destroy: () => {
      ro.disconnect();
      container.removeChild(canvas);
    },
  };
};
