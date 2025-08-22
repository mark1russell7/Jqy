import { useMemo, useState } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import { LAYOUTS, resolveLayoutName } from "./layout.strategy";
import { cloneDeep } from "./object.utils";
import { buildGraph } from "./graph";

/** ----------------------------
 * Nested projection renderer
 * ---------------------------- */
function NestedBox({ node, layoutName, nodeSize, spacing, level = 0 }) {
  const children = node.children ?? [];
  const chosen   = resolveLayoutName(node, layoutName);
  const strategy = LAYOUTS[chosen];

  // Size parent (if not specified)
  const minSize = { w: nodeSize.w * 2, h: nodeSize.h * 2 };
  const size    = node.size ?? strategy.autosizeParent({ count: children.length, nodeSize, spacing, min: minSize });

  // Parent container
  const pad     = Math.max(12, spacing * 1.0); // keep in sync with outerPad
  const innerW  = Math.max(1, size.w - 2 * pad);
  const innerH  = Math.max(1, size.h - 2 * pad);

  // For nested GRID we want tight cells; for RADIAL we use centers
  const origin = { x: innerW / 2, y: innerH / 2 }; // local origin of INNER container
  const nestedArgs = { mode: "nested", children, parent: node, origin, level, nodeSize, spacing, parentSize: { w: innerW, h: innerH } };

  const gridFrames = chosen === "grid" ? strategy.nestedFrames(nestedArgs) : null;
  const centers    = strategy.placeChildren(nestedArgs); // used by radial; grid still OK

  return (
    <div style={{ position: "relative", width: size.w, height: size.h, border: "1px solid #d0d7de", borderRadius: 10, background: "#fff", boxSizing: "border-box" }}>
      {/* label */}
      <div style={{ position: "absolute", left: 6, top: 4, fontSize: 11, color: "#475569", userSelect: "none" }}>
        {node.label ?? node.id}
      </div>

      {/* INNER CONTENT area (parent − padding) */}
      <div style={{ position: "absolute", left: pad, top: pad, width: innerW, height: innerH }}>
        {children.map((c) => {
          if (chosen === "grid" && gridFrames) {
            // Tight cell rect
            const frame = gridFrames.frames[c.id];
            const childNode = { ...c, size: { w: frame.w, h: frame.h } };
            return (
              <div key={c.id} style={{ position: "absolute", left: frame.left, top: frame.top, width: frame.w, height: frame.h }}>
                <NestedBox node={childNode} layoutName={layoutName} nodeSize={nodeSize} spacing={spacing} level={level + 1} />
              </div>
            );
          } else {
            // RADIAL (or any center-based nested): place by center, size stays nodeSize
            const p = centers[c.id] ?? { x: origin.x, y: origin.y };
            const left = p.x - nodeSize.w / 2;
            const top  = p.y - nodeSize.h / 2;
            const childNode = { ...c, size: { w: nodeSize.w, h: nodeSize.h } };
            return (
              <div key={c.id} style={{ position: "absolute", left, top, width: nodeSize.w, height: nodeSize.h }}>
                <NestedBox node={childNode} layoutName={layoutName} nodeSize={nodeSize} spacing={spacing} level={level + 1} />
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
function NestedProjection({ config, layoutName, nodeSize, spacing }) {
  return (
    <div style={{ position: "absolute", left: 12, top: 12 }}>
      <NestedBox node={config} layoutName={layoutName} nodeSize={nodeSize} spacing={spacing} />
    </div>
  );
}

/** ----------------------------
 * Demo config
 * ---------------------------- */

const DEMO = {
  id: "root",
  label: "Root",
  position: { x: 400, y: 60 },
  layout: "grid", // try "radial" too
  children: [
    {
      id: "A",
      label: "A",
      layout: "radial",
      children: [{ id: "A1", label: "A1" }, { id: "A2", label: "A2" }, { id: "A3", label: "A3" }],
    },
    {
      id: "B",
      label: "B",
      layout: "grid",
      children: [{ id: "B1", label: "B1" }, { id: "B2", label: "B2" }, { id: "B3", label: "B3" }, { id: "B4", label: "B4" }],
    },
    {
      id: "C",
      label: "C",
      layout: "radial",
      children: [{ id: "C1", label: "C1" }, { id: "C2", label: "C2" }, { id: "C3", label: "C3" }, { id: "C4", label: "C4" }],
    },
  ],
};

/** ----------------------------
 * Main demo
 * ---------------------------- */

export default function ParentChildLayoutsDemo({ config = DEMO }) {
  const [layoutName, setLayoutName] = useState("grid"); // "tree" | "radial"
  const [spacing, setSpacing] = useState(24);
  const [nodeW, setNodeW] = useState(110);
  const [nodeH, setNodeH] = useState(54);
  const nodeSize = useMemo(() => ({ w: nodeW, h: nodeH }), [nodeW, nodeH]);

  const graphData = useMemo(() => {
    const c = cloneDeep(config);
    return buildGraph({ config: c, layoutName, nodeSize, spacing });
  }, [config, layoutName, nodeSize, spacing]);

  const BAR_H = 72;

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
      {/* Controls */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: BAR_H,
          background: "#f6f8fa",
          borderBottom: "1px solid #d0d7de",
          zIndex: 1000,
          padding: 8,
          boxSizing: "border-box",
        }}
      >
        <label style={{ marginRight: 8, fontSize: 12 }}>Layout</label>
        <select name="layout" value={layoutName} onChange={(e) => setLayoutName(e.target.value)} style={{ marginRight: 12 }}>
          <option value="grid">Grid</option>
          <option value="radial">Radial</option>
        </select>

        <label style={{ marginLeft: 8, marginRight: 6, fontSize: 12 }}>Spacing</label>
        <input type="range" min={8} max={80} value={spacing} onChange={(e) => setSpacing(parseInt(e.target.value, 10))} />
        <span style={{ marginLeft: 6, fontSize: 12 }}>{spacing}</span>

        <label style={{ marginLeft: 12, marginRight: 6, fontSize: 12 }}>Node W</label>
        <input type="range" min={80} max={220} value={nodeW} onChange={(e) => setNodeW(parseInt(e.target.value, 10))} />
        <span style={{ marginLeft: 6, fontSize: 12 }}>{nodeW}px</span>

        <label style={{ marginLeft: 12, marginRight: 6, fontSize: 12 }}>Node H</label>
        <input type="range" min={40} max={160} value={nodeH} onChange={(e) => setNodeH(parseInt(e.target.value, 10))} />
        <span style={{ marginLeft: 6, fontSize: 12 }}>{nodeH}px</span>
      </div>

      {/* Left: Graph (edges) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: BAR_H,
          bottom: 0,
          width: "50%",
          borderRight: "1px solid #e5e7eb",
          boxSizing: "border-box",
        }}
      >
        <div style={{ position: "absolute", left: 8, top: 8, fontSize: 11, color: "#64748b", zIndex: 2 }}>
          Graph (Edges)
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}>
          <ReactFlow nodes={graphData.nodes} edges={graphData.edges} fitView>
            <Background gap={16} />
            <Controls />
          </ReactFlow>
        </div>
      </div>

      {/* Right: Nested projection (true nesting) */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          right: 0,
          top: BAR_H,
          bottom: 0,
          overflow: "auto",
          boxSizing: "border-box",
        }}
      >
        <div style={{ position: "absolute", left: 8, top: 8, fontSize: 11, color: "#64748b", zIndex: 1 }}>
          Nested Projection
        </div>
        <NestedProjection config={config} layoutName={layoutName} nodeSize={nodeSize} spacing={spacing} />
      </div>
    </div>
  );
}
