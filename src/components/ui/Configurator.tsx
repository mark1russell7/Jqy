import { JSX, useMemo } from "react";
import { Segmented, Select } from "./controls";
import { NodeConfig } from "../graph";
import { LayoutChildrenMode, LayoutTypes } from "../layout/layout.enum";
import { ModeMap } from "../engine/computeLayout";

type Scope = "all" | string;

function collect(root: NodeConfig): { ids: string[]; byId: Record<string, NodeConfig> } {
  const ids: string[] = [];
  const byId: Record<string, NodeConfig> = {};
  (function walk(n: NodeConfig) {
    ids.push(n.id); byId[n.id] = n;
    (n.children ?? []).forEach(walk);
  })(root);
  return { ids, byId };
}
function subtreeIds(byId: Record<string, NodeConfig>, start: string): string[] {
  const res: string[] = [];
  (function walk(n: NodeConfig) {
    res.push(n.id);
    (n.children ?? []).forEach(walk);
  })(byId[start]);
  return res;
}

export function Configurator({
  root, modes, setModes, layout, setLayout, scope, setScope,
  applyToSubtree, setApplyToSubtree,
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
  const { ids, byId } = useMemo(() => collect(root), [root]);

  const targetIds = useMemo(() => {
    if (scope === "all") return ids;
    return applyToSubtree ? subtreeIds(byId, scope) : [scope];
  }, [ids, byId, scope, applyToSubtree]);

  const modeOptions: { label: string; value: LayoutChildrenMode }[] = [
    { label: "Graph",  value: LayoutChildrenMode.GRAPH },
    { label: "Nested", value: LayoutChildrenMode.NESTED },
  ];
  const layoutOptions = [
    { label: "Grid",   value: LayoutTypes.Grid   },
    { label: "Radial", value: LayoutTypes.Radial },
  ];

  const currentModes = targetIds.map(id => modes[id] ?? LayoutChildrenMode.GRAPH);
  const allSame = currentModes.every(m => m === currentModes[0]);
  const activeMode = allSame ? currentModes[0] : undefined;

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


      {/* Segmented control for mode */}
       <Segmented
         label="Layout"
         value={layout}
         options={layoutOptions}
         onChange={(v) => setLayout(v as LayoutTypes)}
       />
 
       <Segmented
         label="Mode"
         value={allSame ? (activeMode as string | undefined) : undefined}
         options={modeOptions}
         onChange={(v) => {
           setModes(prev => {
             const next = { ...prev };
             for (const id of targetIds) next[id] = v as LayoutChildrenMode;
             return next;
           });
         }}
       />
    </div>
  );
}
