// src/components/ui/Configurator.tsx
import { JSX, useMemo } from "react";
import { Select } from "./controls";
import { NodeConfig } from "../graph";
import { LayoutTypes } from "../layout/layout.enum";
import { Mode, ModeMap } from "../engine/computeLayout";

type Scope = "all" | string; // "all" or a node id

function collectIds(root: NodeConfig): string[] {
  const ids: string[] = [];
  (function walk(n: NodeConfig) {
    ids.push(n.id);
    (n.children ?? []).forEach(walk);
  })(root);
  return ids;
}

export function Configurator({
  root, modes, setModes, layout, setLayout, scope, setScope, applyToSubtree, setApplyToSubtree,
}: {
  root: NodeConfig;
  modes: ModeMap;
  setModes: (f: (prev: ModeMap) => ModeMap) => void;
  layout: LayoutTypes;
  setLayout: (l: LayoutTypes) => void;
  scope: Scope;
  setScope: (s: Scope) => void;
  applyToSubtree: boolean;
  setApplyToSubtree: (v: boolean) => void;
}): JSX.Element {
  const ids = useMemo(() => collectIds(root), [root]);

  const modeOptions = [
    { label: "Graph",  value: "graph"  },
    { label: "Nested", value: "nested" },
  ];
  const layoutOptions = [
    { label: "Grid",   value: LayoutTypes.Grid   },
    { label: "Radial", value: LayoutTypes.Radial },
  ];

  function idsInScope(): string[] {
    if (scope === "all") return ids;
    if (!applyToSubtree) return [scope];
    const res: string[] = [];
    (function walk(n: NodeConfig) {
      res.push(n.id);
      (n.children ?? []).forEach(walk);
    })((function find(n: NodeConfig, id: string): NodeConfig {
      if (n.id === id) return n;
      for (const c of n.children ?? []) {
        const r = find(c, id);
        if (r) return r;
      }
      return n; // should not get here
    })(root, scope as string));
    return res;
  }

  return (
    <div style={{ display: "inline-flex", gap: 12, alignItems: "center" }}>
      <Select
        label="Edit"
        value={scope}
        onChange={(v) => setScope(v as Scope)}
        options={[{ label: "All nodes", value: "all" }, ...ids.map(id => ({ label: id, value: id }))]}
      />
      <label style={{ fontSize: 12 }}>
        <input type="checkbox" checked={applyToSubtree} onChange={(e) => setApplyToSubtree(e.target.checked)} /> Apply to subtree
      </label>
      <Select
        label="Layout"
        value={layout}
        onChange={(v) => setLayout(v as LayoutTypes)}
        options={layoutOptions}
      />
      <Select
        label="Mode"
        value={"graph"} // display-only; we set by click below
        onChange={() => {}}
        options={modeOptions}
      />
      <div style={{ display: "inline-flex", gap: 8 }}>
        {modeOptions.map(m => (
          <button
            key={m.value}
            onClick={() => {
              const targetIds = idsInScope();
              setModes(prev => {
                const next = { ...prev };
                for (const id of targetIds) next[id] = m.value as Mode;
                return next;
              });
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
