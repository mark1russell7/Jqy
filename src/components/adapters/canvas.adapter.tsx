import { useEffect, useRef } from "react";
import { LayoutResult } from "../engine/computeLayout";
import { Theme, defaultTheme } from "./theme";
import { drawLayoutToCanvas } from "./canvas.core";

export function Canvas2D({ result, theme = defaultTheme }: { result: LayoutResult; theme?: Theme }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cvs = ref.current!;
    const parent = cvs.parentElement!;
    const ro = new ResizeObserver(() => draw());
    ro.observe(parent);

    function draw() {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const rect = parent.getBoundingClientRect();
      cvs.width = Math.max(1, Math.round(rect.width * dpr));
      cvs.height = Math.max(1, Math.round(rect.height * dpr));
      const ctx = cvs.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawLayoutToCanvas(ctx, result, theme);
    }

    draw();
    return () => ro.disconnect();
  }, [result, theme]);

  return <canvas style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} ref={ref} />;
}

