import { JSX, useMemo } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import { LayoutResultEx } from "../layout/engine/layout.engine";
import { toReactFlow } from "./react-flow.adapter";
import { AbsoluteDOM } from "./react-dom.adapter";
import { Canvas2D } from "./canvas.adapter";
import { Theme, defaultTheme } from "./theme";
import { Target } from "./env";

export type ReactAdapterProps = {
  kind: Target;
  result: LayoutResultEx;
  theme?: Theme;
};

export const LayoutView = ({ kind, result, theme = defaultTheme }: ReactAdapterProps): JSX.Element => {
  if (kind === Target.ReactFlow) {
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
  if (kind === Target.Canvas) return <Canvas2D result={result} theme={theme} />;
  return <AbsoluteDOM result={result} theme={theme} />;
};
