// src/components/render/views/LayoutView.tsx
import { JSX, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, { Background, Controls, useReactFlow } from "reactflow";
import type { LayoutSnapshot } from "../../layout/types";
import { Target } from "../../adapters/env";
import { defaultTheme, type Theme } from "../../adapters/theme";
import { DomPort } from "../ports/dom.port";
import { CanvasPort } from "../ports/canvas.port";
import { toReactFlow } from "../../tooling/exporters/reactflow";
import type { RenderSession } from "../ports/types";
import { PolylineEdge } from "./edges/PolylineEdge";
import { ViewportController } from "../ports/viewport";

// prop type
export type LayoutViewProps = {
  kind: Target;
  snapshot: LayoutSnapshot;
  theme?: Theme;
  unifiedZoom?: boolean | { controller?: ViewportController; attachInputs?: boolean };
  showZoomControls?: boolean;
};


export const LayoutView = ({ kind, snapshot, theme = defaultTheme, unifiedZoom, showZoomControls }: LayoutViewProps): JSX.Element => {
  // Always call hooks – no early return.
  const { nodes, edges } = useMemo(() => toReactFlow(snapshot), [snapshot]);

  const ref = useRef<HTMLDivElement | null>(null);
  const sessionRef = useRef<RenderSession | null>(null);

    // resolve (optional) shared viewport
   const sharedVp = useMemo(() => {
    if (!unifiedZoom) return undefined;
    if (typeof unifiedZoom === "object" && unifiedZoom.controller) return unifiedZoom.controller;
    return new ViewportController();
  }, [unifiedZoom]);
  const attachInputs = typeof unifiedZoom === "object" ? unifiedZoom.attachInputs !== false : !!unifiedZoom;

    // React Flow instance (no useReactFlow -> avoids provider error)
  const rfInstanceRef = useRef<import("reactflow").ReactFlowInstance | null>(null);
  const onRFInit = (inst: import("reactflow").ReactFlowInstance) => {
    rfInstanceRef.current = inst;
    // drive RF from the controller
    if (sharedVp) {
      const off = sharedVp.onChange(({ x, y, scale }) => inst.setViewport({ x, y, zoom: scale }, { duration: 0 }));
      // store on ref to clean on remount
      (onRFInit as any)._off?.(); (onRFInit as any)._off = off;
    }
  };
  // mirror RF user panning/zooming back to controller (end-only to avoid feedback loops)
  const onRFMoveEnd = (_: any, vp: { x: number; y: number; zoom: number }) => {
    if (sharedVp) sharedVp.set({ x: vp.x, y: vp.y, scale: vp.zoom });
  };
  const edgeTypes = useMemo(() => ({ poly: PolylineEdge }), []);
  useEffect(() => {
    // tear down any prior port session
    sessionRef.current?.destroy();
    sessionRef.current = null;

    // for DOM/Canvas only, mount a port into ref container
    if (ref.current && (kind === Target.DOM || kind === Target.Canvas)) {
      sessionRef.current =
        kind === Target.DOM
          ? new DomPort().mount(ref.current, snapshot, theme, { viewport: sharedVp, interactive: attachInputs })
          : new CanvasPort().mount(ref.current, snapshot, theme,{ viewport: sharedVp, interactive: attachInputs });
    }

    // cleanup on kind/theme change or unmount
    return () => {
      sessionRef.current?.destroy();
      sessionRef.current = null;
    };
  }, [kind, theme, sharedVp, attachInputs]); // initial draw happens inside mount

  // push new frames to the active session
  useEffect(() => {
    sessionRef.current?.draw(snapshot);
  }, [snapshot]);

  // Top bar zoom controls
  const ZoomUI = () => {
    const [percent, setPercent] = useState(100);
    useEffect(() => {
      if (!sharedVp) return () => {};
      return sharedVp.onChange(v => setPercent(Math.round(v.scale * 100)));
    }, [sharedVp]);
    const zoomBy = (f: number) => {
      if (sharedVp) { sharedVp.set({ scale: (sharedVp.get().scale * f) }); return; }
      // Fallback: drive RF directly
      if (rfInstanceRef.current && kind === Target.ReactFlow) {
        const z = rfInstanceRef.current.getZoom() * f;
        rfInstanceRef.current.setViewport({ ...rfInstanceRef.current.getViewport(), zoom: z }, { duration: 0 });
      }
    };
    const fit = () => {
      if (sharedVp && ref.current) { sharedVp.fitTo(ref.current, snapshot.stats.bounds, 24); return; }
      rfInstanceRef.current?.fitView({ duration: 300 });
    };
    return (
      <div style={{
        position: "absolute", top: 8, right: 8, zIndex: 10,
        display: "flex", gap: 6, background: "rgba(255,255,255,.9)",
        border: "1px solid #e5e7eb", borderRadius: 8, padding: "4px 6px",
        boxShadow: "0 1px 2px rgba(0,0,0,.06)"
      }}>
        <button onClick={fit} style={btn}>Fit</button>
        <button onClick={() => zoomBy(1/1.1)} style={btn}>−</button>
        <div style={{ minWidth: 44, textAlign: "center", lineHeight: "24px" }}>{percent}%</div>
        <button onClick={() => zoomBy(1.1)} style={btn}>+</button>
      </div>
    );
  };
  const btn: React.CSSProperties = { padding: "2px 8px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: "pointer" };



  // JSX branch only (hooks above are unconditional)
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {showZoomControls && <ZoomUI />}
      {kind === Target.ReactFlow ? (
         <ReactFlow
           nodes={nodes}
           edges={edges}
           edgeTypes={edgeTypes}
           onInit={onRFInit}
           onMoveEnd={onRFMoveEnd}
           fitView
         >
          <Background gap={16} />
          <Controls />
        </ReactFlow>
      ) : (
        <div ref={ref} style={{ position: "absolute", inset: 0 }} />
      )}
    </div>
  );
};
