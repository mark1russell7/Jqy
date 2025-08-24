import "reactflow/dist/style.css";
import { 
    useMemo, 
    useState 
} from "react";
import { 
    NodeConfig
} from "./graph";
import { 
    Vector 
} from "./geometry";
import { 
    LayoutTypes 
} from "./layout/layout.enum";
import { LayoutView, ReactAdapterKind } from "./adapters/react-view.adapter";
import { computeLayout, ModeMap } from "./engine/computeLayout";
import { LabeledSlider, Select } from "./ui/controls";
import { Shell } from "./ui/styles";
import { Configurator } from "./ui/Configurator";

const DEMO: NodeConfig = {
  id: "root",
  label: "Root",
  position: new Vector(200, 60),
  children: [
    { id: "A", label: "A", children: [{ id: "A1" }, { id: "A2" }, { id: "A3" }] },
    { id: "B", label: "B", children: [{ id: "B1" }, { id: "B2" }, { id: "B3" }, { id: "B4" }] },
    { id: "C", label: "C", children: [{ id: "C1" }, { id: "C2" }, { id: "C3" }, { id: "C4" }] },
  ],
};
Object.freeze(DEMO);

const DEMO_MIXED: NodeConfig = {
  id: "root",
  label: "Root",
  position: new Vector(200, 60),
  layout: LayoutTypes.Grid,
  children: [
    { id: "A", label: "A", layout: LayoutTypes.Radial, children: [{ id: "A1" }, { id: "A2" }, { id: "A3" }] },
    { id: "B", label: "B", layout: LayoutTypes.Grid,   children: [{ id: "B1" }, { id: "B2" }, { id: "B3" }, { id: "B4" }] },
    { id: "C", label: "C", layout: LayoutTypes.Radial, children: [{ id: "C1" }, { id: "C2" }, { id: "C3" }, { id: "C4" }] },
  ],
};
Object.freeze(DEMO_MIXED);
/* -------------------------------------------
 * Helpers
 * ------------------------------------------- */
type LayoutOverrideMap = Record<string, LayoutTypes | undefined>;
type NodeIndex = { id: string; label: string };

const MIXED = "__mixed__";

function flattenNodes(n: NodeConfig): NodeIndex[] {
  const out: NodeIndex[] = [{ id: n.id, label: n.label ?? n.id }];
  for (const c of n.children ?? []) out.push(...flattenNodes(c));
  return out;
}
function findNode(root: NodeConfig, id: string): NodeConfig | undefined {
  if (root.id === id) return root;
  for (const c of root.children ?? []) {
    const hit = findNode(c, id);
    if (hit) return hit;
  }
  return undefined;
}
function subtreeIds(root: NodeConfig, startId: string): string[] {
  const node = findNode(root, startId);
  if (!node) return [];
  return flattenNodes(node).map(n => n.id);
}
function applyLayoutOverrides(node: NodeConfig, overrides: LayoutOverrideMap): NodeConfig {
  const overridden: NodeConfig = { ...node, layout: overrides[node.id] ?? node.layout };
  if (node.children?.length) overridden.children = node.children.map(c => applyLayoutOverrides(c, overrides));
  return overridden;
}
function allSame<T>(arr: T[]): { same: boolean; value: T | undefined } {
  if (!arr.length) return { same: true, value: undefined };
  const v = arr[0];
  return { same: arr.every(x => x === v), value: v };
}

/* -------------------------------------------
 * Main demo
 * ------------------------------------------- */
export type ParentChildLayoutsDemoProps = { config?: NodeConfig };

export function ParentChildLayoutsDemo({ config = DEMO_MIXED }: ParentChildLayoutsDemoProps) {
  const [adapter, setAdapter] = useState<ReactAdapterKind>("dom");
  const [spacing, setSpacing] = useState(24);
  const [nodeW, setNodeW] = useState(110);
  const [nodeH, setNodeH] = useState(54);

  // NEW: layout scope + mode map
  const [layoutName, setLayoutName] = useState<LayoutTypes>(LayoutTypes.Grid);
  const [modes, setModes] = useState<ModeMap>({ root: "graph", A: "nested", B: "graph", C: "nested" });
  const [scope, setScope] = useState<"all" | string>("all");
  const [applyToSubtree, setApplyToSubtree] = useState(true);

  // apply layout to scope by mutating a *derived* config (never the frozen constants)
  const effectiveConfig = useMemo<NodeConfig>(() => {
    function clone(n: NodeConfig): NodeConfig {
      return { ...n, children: (n.children ?? []).map(clone) };
    }
    const copy = clone(config);
    function setLayout(n: NodeConfig) {
      if (scope === "all" || n.id === scope) n.layout = layoutName;
      if (applyToSubtree || scope === "all") (n.children ?? []).forEach(setLayout);
    }
    setLayout(copy);
    return copy;
  }, [config, layoutName, scope, applyToSubtree]);

  const nodeSize = useMemo(() => new Vector(Math.max(20, nodeW), Math.max(20, nodeH)), [nodeW, nodeH]);
  const result   = useMemo(() => computeLayout(effectiveConfig, modes, nodeSize, spacing), [effectiveConfig, modes, nodeSize, spacing]);

  return (
    <div style={Shell.outer}>
      <div style={Shell.bar}>
        <Select label="Right Pane" value={adapter} onChange={(v) => setAdapter(v as ReactAdapterKind)}
                options={[{ label: "DOM", value: "dom" }, { label: "Canvas", value: "canvas" }, { label: "React Flow", value: "reactflow" }]} />
        <Configurator
          root={config}
          modes={modes} setModes={setModes}
          layout={layoutName} setLayout={setLayoutName}
          scope={scope} setScope={setScope}
          applyToSubtree={applyToSubtree} setApplyToSubtree={setApplyToSubtree}
        />
        <LabeledSlider label="Spacing" value={spacing} min={0} max={80} onChange={setSpacing} />
        <LabeledSlider label="Node W"  value={nodeW}   min={40} max={240} onChange={setNodeW} />
        <LabeledSlider label="Node H"  value={nodeH}   min={30} max={180} onChange={setNodeH} />
      </div>

      <div style={Shell.left}>
        <div style={Shell.title}>Graph (Edges)</div>
        <div style={Shell.rf}>
          <LayoutView kind="reactflow" result={result} />
        </div>
      </div>

      <div style={Shell.right}>
        <div style={Shell.title}>Right Pane: {adapter}</div>
        <div style={{ position: "absolute", inset: 0 }}>
          <LayoutView kind={adapter} result={result} />
        </div>
      </div>
    </div>
  );
}