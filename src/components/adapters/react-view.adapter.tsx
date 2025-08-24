import React, { useMemo } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import { LayoutResult } from "../engine/computeLayout";
import { toReactFlow } from "./react-flow.adapter";
import { AbsoluteDOM } from "./react-dom.adapter";
import { Canvas2D } from "./canvas.adapter";
import { Theme, defaultTheme } from "./theme";

export type ReactAdapterKind = "reactflow" | "dom" | "canvas";

export function LayoutView({
  kind, result, theme = defaultTheme,
}: {
  kind: ReactAdapterKind;
  result: LayoutResult;
  theme?: Theme;
}) {
  if (kind === "reactflow") {
    const { nodes, edges } = useMemo(() => toReactFlow(result), [result]);
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background gap={16} />
          <Controls />
        </ReactFlow>
      </div>
    );
  }
  if (kind === "canvas") {
    return <Canvas2D result={result} theme={theme} />;
  }
  return <AbsoluteDOM result={result} theme={theme} />;
}
