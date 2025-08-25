import { JSX, useMemo } from "react";
import { LayoutView } from "../../render/views/LayoutView";
import { Target } from "../../adapters/env";
import { createLayoutAPI } from "../../layout/api";
import { createDefaultSystem } from "../../layout/engine/context";
import { ConsoleLogger, LogLevel } from "../../core/logging/logger";
import { LayoutChildrenMode, LayoutTypes } from "../../layout/layout.enum";
import { Vector } from "../../core/geometry";
import type { NodeConfig } from "../../graph/types";
import type { GraphInput } from "../../layout/api";

const BASE: NodeConfig = {
  id: "root",
  position: new Vector(40, 40),
  children: [
    { id: "A", children: [{ id: "A1" }, { id: "A2" }, { id: "A3" }] },
    { id: "B", children: [{ id: "B1" }, { id: "B2" }, { id: "B3" }, { id: "B4" }] },
    { id: "C", children: [{ id: "C1" }, { id: "C2" }, { id: "C3" }, { id: "C4" }] },
  ],
};

function stamp(layout: LayoutTypes, mode: LayoutChildrenMode): NodeConfig {
  const clone = (n: NodeConfig): NodeConfig => ({ ...n, children: (n.children ?? []).map(clone) });
  const root = clone(BASE);
  const apply = (n: NodeConfig) => {
    n.layout = layout;
    n.mode = mode;
    (n.children ?? []).forEach(apply);
  };
  apply(root);
  return root;
}

const RENDERERS: Target[] = [Target.DOM, Target.Canvas, Target.ReactFlow];
const LAYOUTS: LayoutTypes[] = [LayoutTypes.Grid, LayoutTypes.Radial];
const MODES: LayoutChildrenMode[] = [LayoutChildrenMode.GRAPH, LayoutChildrenMode.NESTED];

export function TestbedMatrix(): JSX.Element {
  const api = useMemo(() => createLayoutAPI(createDefaultSystem({ log: new ConsoleLogger(LogLevel.Warn) })), []);
  const combos = useMemo(() => {
    return RENDERERS.flatMap((r) =>
      LAYOUTS.flatMap((L) =>
        MODES.map((M) => ({
          key: `${Target[r]}-${LayoutTypes[L]}-${LayoutChildrenMode[M]}`,
          renderer: r,
          layout: L,
          mode: M,
          snapshot: api.compute({ kind: "tree", root: stamp(L, M) }, {
            nodeSize: new Vector(90, 50),
            spacing: 16,
            routerName: "ortho",
          }),
        }))
      )
    );
  }, [api]);

  const grid: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    top: 72,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gridAutoRows: "340px",
    gap: 12,
    padding: 12,
    boxSizing: "border-box",
  };

  const cell: React.CSSProperties = {
    position: "relative",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
  };

  const title: React.CSSProperties = { position: "absolute", left: 8, top: 8, fontSize: 12, color: "#64748b", zIndex: 1 };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={grid}>
        {combos.map((c) => (
          <div key={c.key} style={cell}>
            <div style={title}>
              {Target[c.renderer]} • {LayoutTypes[c.layout]} • {LayoutChildrenMode[c.mode]}
            </div>
            <LayoutView kind={c.renderer} snapshot={c.snapshot} />
          </div>
        ))}
      </div>
    </div>
  );
}
