// src/components/render/views/LayoutView.tsx
import { JSX, useEffect, useMemo, useRef } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import type { LayoutSnapshot } from "../../layout/types";
import { Target } from "../../adapters/env";
import { defaultTheme, type Theme } from "../../adapters/theme";
import { DomPort } from "../ports/dom.port";
import { CanvasPort } from "../ports/canvas.port";
import { toReactFlow } from "../../tooling/exporters/reactflow";
import type { RenderSession } from "../ports/types";

export type LayoutViewProps = {
  kind: Target;
  snapshot: LayoutSnapshot;
  theme?: Theme;
};

export const LayoutView = ({ kind, snapshot, theme = defaultTheme }: LayoutViewProps): JSX.Element => {
  // Always call hooks – no early return.
  const { nodes, edges } = useMemo(() => toReactFlow(snapshot), [snapshot]);

  const ref = useRef<HTMLDivElement | null>(null);
  const sessionRef = useRef<RenderSession | null>(null);

  useEffect(() => {
    // tear down any prior port session
    sessionRef.current?.destroy();
    sessionRef.current = null;

    // for DOM/Canvas only, mount a port into ref container
    if (ref.current && (kind === Target.DOM || kind === Target.Canvas)) {
      sessionRef.current =
        kind === Target.DOM
          ? new DomPort().mount(ref.current, snapshot, theme)
          : new CanvasPort().mount(ref.current, snapshot, theme);
    }

    // cleanup on kind/theme change or unmount
    return () => {
      sessionRef.current?.destroy();
      sessionRef.current = null;
    };
  }, [kind, theme]); // initial draw happens inside mount

  // push new frames to the active session
  useEffect(() => {
    sessionRef.current?.draw(snapshot);
  }, [snapshot]);

  // JSX branch only (hooks above are unconditional)
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {kind === Target.ReactFlow ? (
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background gap={16} />
          <Controls />
        </ReactFlow>
      ) : (
        <div ref={ref} style={{ position: "absolute", inset: 0 }} />
      )}
    </div>
  );
};
