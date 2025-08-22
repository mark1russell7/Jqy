
type Rect = {
  left: number;
  top: number;
  w: number;
  h: number;
}
// layout.strategy.js
/** @typedef {{ x:number, y:number }} Point */
/** @typedef {{ w:number, h:number }} Size */
/** @typedef {{ id:string, label?:string, position?:Point, size?:Size, layout?:"grid"|"radial", children?:NodeConfig[] }} NodeConfig */

/* ---------- Tunables (pure) ---------- */
const outerPad = s => Math.max(12, s * 1.0);  // padding inside PARENT (nested)
const itemPad  = s => Math.max(4,  s * 0.25); // inner padding inside each GRID CELL

/* ---------- Functional helpers ---------- */
const ceilSqrt = n => Math.ceil(Math.sqrt(Math.max(1, n)));
const rcSquare = n => { const r = ceilSqrt(n); const c = Math.ceil(n / r); return { rows: r, cols: c }; };
const mapIdx   = (n, f) => Array.from({ length: n }, (_, i) => f(i));

/* Split an integer total into `parts` integers that sum to total.
   Distribute the remainder one px at a time to the first `remainder` parts. */
const splitEven = (total, parts) => {
  const base = Math.floor(total / parts);
  const rem  = total - base * parts;
  const sizes = Array.from({ length: parts }, (_, i) => base + (i < rem ? 1 : 0));
  const offs  = sizes.map((_, i) => sizes.slice(0, i).reduce((a, b) => a + b, 0));
  return { sizes, offs };
};

/* ---------- GRAPH anchoring ---------- */
const pcTreeBelow = ({ parentSize, spacing }) => ({ dx: 0, dy: (parentSize?.h ?? 0) / 2 + spacing * 1.25 });

/* ---------- UNIT placers (sibling-only) ---------- */
const radialAngles = (count) => mapIdx(count, i => (i / Math.max(1, count)) * Math.PI * 2);

/* =========================================================
 * NESTED GRID
 *  - Outer grid cells perfectly tessellate inner content
 *  - Each child renders inside a "cellInner" = (cell − 2*itemPad)
 * ========================================================= */
function nestedGridFrames({ children, parentSize, spacing }) {
  const n = children.length;
  const { rows, cols } = rcSquare(n);
  const pad = outerPad(spacing);
  const ip  = itemPad(spacing);

  // Inner content (tessellated space)
  const contentW = Math.max(1, Math.round(parentSize.w - 2 * pad));
  const contentH = Math.max(1, Math.round(parentSize.h - 2 * pad));

  // Perfect integer subdivision with remainder distribution
  const X = splitEven(contentW, cols);
  const Y = splitEven(contentH, rows);

  const frames = {};
  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const left = X.offs[col];
    const top  = Y.offs[row];
    const w    = X.sizes[col];
    const h    = Y.sizes[row];
    frames[children[i].id] = { col, row, left, top, w, h };
  }

  return {
    pad,
    ip,
    content: { w: contentW, h: contentH },
    frames,   // outer grid cells
  };
}

/* =========================================================
 * NESTED RADIAL
 *  - Place on a circle and uniform-scale to fit inner content
 * ========================================================= */
function nestedRadialCenters({ children, parentSize, nodeSize, spacing }) {
  const pad = outerPad(spacing);
  const innerW = Math.max(1, Math.round(parentSize.w - 2 * pad));
  const innerH = Math.max(1, Math.round(parentSize.h - 2 * pad));
  const cx = innerW / 2, cy = innerH / 2;

  const ang = radialAngles(children.length);
  // raw radius before fit
  const baseR = Math.min(innerW, innerH) / 2 - Math.max(nodeSize.w, nodeSize.h) / 2 - itemPad(spacing);
  const r = Math.max(8, baseR);

  const centers = {};
  ang.forEach((t, i) => {
    centers[children[i].id] = { x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r };
  });

  return { pad, centers, inner: { w: innerW, h: innerH, cx, cy } };
}

/* =========================================================
 * GRAPH (non-nested)
 *  - Grid uses tree-below anchor; "gaps" are created by itemPad
 *    because each logical cell = node + 2*itemPad.
 * ========================================================= */
function graphGridCenters({ children, origin, nodeSize, spacing, level, parentSize }) {
  const n = children.length;
  const { rows, cols } = rcSquare(n);
  const ip = itemPad(spacing);

  const cellW = nodeSize.w + 2 * ip;
  const cellH = nodeSize.h + 2 * ip;

  const totalW = cols * cellW;
  const totalH = rows * cellH;

  const a = pcTreeBelow({ parentSize, spacing });
  const left = origin.x + a.dx - totalW / 2;
  const top  = origin.y + a.dy - totalH / 2;

  const pos = {};
  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = left + col * cellW + cellW / 2;
    const cy = top  + row * cellH + cellH / 2;
    pos[children[i].id] = { x: Math.round(cx), y: Math.round(cy) };
  }
  return pos;
}

function graphRadialCenters({ children, origin, nodeSize, spacing, level, parentSize }) {
  const base = Math.max(nodeSize.w, nodeSize.h);
  const r = (base + spacing * 3) * (1 + level * 0.6);
  const a = pcTreeBelow({ parentSize, spacing });
  const cx = origin.x + a.dx, cy = origin.y + a.dy;

  const ang = radialAngles(children.length);
  const pos = {};
  ang.forEach((t, i) => {
    pos[children[i].id] = { x: Math.round(cx + Math.cos(t) * r), y: Math.round(cy + Math.sin(t) * r) };
  });
  return pos;
}

/* =========================================================
 * Public API (functional, no mutations)
 * ========================================================= */
export const LAYOUTS = {
  grid: {
    /* Nested returns both the exact grid frames and we also expose
       a convenience 'centers' for consumers that want centers. */
    nestedFrames: (args) => nestedGridFrames(args),
    placeChildren: (args) => (args.mode === "nested"
      ? Object.fromEntries(
          Object.entries<Rect>(nestedGridFrames(args).frames).map(([id, f]) => [id, { x: f.left + f.w / 2, y: f.top + f.h / 2 }])
        )
      : graphGridCenters(args)
    ),
    autosizeParent: ({ count, nodeSize, spacing }) => {
      const { rows, cols } = rcSquare(count);
      const ip = itemPad(spacing), pad = outerPad(spacing);
      const w = cols * (nodeSize.w + 2 * ip) + 2 * pad;
      const h = rows * (nodeSize.h + 2 * ip) + 2 * pad;
      return { w, h };
    },
  },

  radial: {
    nestedFrames: () => null,
    placeChildren: (args) => (args.mode === "nested"
      ? nestedRadialCenters(args).centers
      : graphRadialCenters(args)
    ),
    autosizeParent: ({ nodeSize, spacing }) => {
      const pad = outerPad(spacing);
      const d = Math.max(nodeSize.w, nodeSize.h) * 6 + 2 * pad;
      return { w: d, h: d };
    },
  },
};

export const resolveLayoutName = (node, fallback) =>
  node.layout && LAYOUTS[node.layout] ? node.layout : fallback;
