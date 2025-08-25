import { JSX, useEffect, useRef } from "react";
import { LayoutResult } from "../../../layout/engine/layout.engine";
import { Theme, defaultTheme } from "../../theme";
import { CanvasRenderer2D } from "../../targets/canvas.core";

export type Canvas2DProps = {
  result: LayoutResult;
  theme?: Theme;
  /** enable partial redraw when new results come in */
  partial?: boolean;
};

export const Canvas2D = ({ result, theme = defaultTheme, partial = true }: Canvas2DProps): JSX.Element => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer2D | null>(null);

  const resizeAndRedraw = (parent: HTMLElement, cvs: HTMLCanvasElement): void => {
    const dpr = Math.max(1, (window.devicePixelRatio as number) || 1);
    const rect = parent.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (cvs.width !== w || cvs.height !== h) {
      cvs.width = w; cvs.height = h;
      const ctx = cvs.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // after size change, do a full draw to avoid artifacts
      rendererRef.current?.fullDraw(result);
    }
  };

  useEffect(() => {
    const cvs = ref.current!;
    const parent = cvs.parentElement!;
    // initial DPR + renderer
    const dpr = Math.max(1, (window.devicePixelRatio as number) || 1);
    const rect = parent.getBoundingClientRect();
    cvs.width = Math.max(1, Math.round(rect.width * dpr));
    cvs.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = cvs.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    rendererRef.current = new CanvasRenderer2D(cvs, theme);
    rendererRef.current.fullDraw(result);

    const ro = new ResizeObserver(() => resizeAndRedraw(parent, cvs));
    ro.observe(parent);

    return () => {
      ro.disconnect();
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount once

  // theme/result updates
  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.setTheme(theme);
    rendererRef.current.update(result, { partial });
  }, [result, theme, partial]);

  return (
    <canvas
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      ref={ref}
    />
  );
};
