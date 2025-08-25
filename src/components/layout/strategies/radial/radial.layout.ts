import { Vector } from "../../../geometry";
import {
  PreferredSizeParam, PreferredSizeReturn, Layout, PlaceChildrenReturn, PlaceChildrenParam, NestedFramesReturn
} from "../../layout";
import { LayoutChildrenMode } from "../../layout.enum";
import { MappedGrid } from "../grid/grid.mapped";
import { Config } from "../../../config";
import { LayoutTuning, LayoutTuningConfig } from "../../layout.tuning";
import { IterationConfig } from "../../../iteration/iteration.limits";
import { mapIndexBounded } from "../../../iteration/iterate";

export class RadialLayout extends Layout {
  constructor(private tuning: Config<LayoutTuning> = LayoutTuningConfig) { super(); }
  nestedFrames = (): NestedFramesReturn => ({
    ip: 0,
    content: new Vector(0, 0),
    grid: MappedGrid.emptyMapped(new Vector(0, 0), () => ({ id: "" })),
  });

  placeChildren = (args: PlaceChildrenParam): PlaceChildrenReturn =>
    args.mode === LayoutChildrenMode.NESTED ? nestedRadialCenters(this.tuning, args) : graphRadialCenters(this.tuning, args);

  preferredSize = ({ count, nodeSize, spacing, mode }: PreferredSizeParam): PreferredSizeReturn =>
    mode === LayoutChildrenMode.NESTED ? this.tuning.get("nestedRadialPreferred")(count, nodeSize, spacing) : nodeSize;
}

/* ==================== helpers ==================== */
export const nestedRadialCenters = (
  tuning: Config<LayoutTuning>,
  { children, parentSize, nodeSize, spacing }: PlaceChildrenParam
): PlaceChildrenReturn => {
  const maxPer = IterationConfig.get("maxChildrenPerNode");
  const policy = IterationConfig.get("onLimit");

  const inner: Vector = parentSize.round().clamp(1, Infinity);
  const c: Vector = inner.scale(1 / 2);
  const start = tuning.get("startAngle")();
  const cw = tuning.get("clockwise")();
  const baseR = inner.min() / 2 - nodeSize.max() / 2 - tuning.get("itemPad")(spacing);
  const r = Math.max(tuning.get("minRadius")(), baseR);

  return Object.fromEntries(
    mapIndexBounded(children.length, maxPer, policy, (i) => [
      children[i].id,
      Vector.scalar(tuning.get("angleOf")(i, children.length, start, cw)).trig().scale(r).add(c),
    ])
  );
};

export const graphRadialCenters = (
  tuning: Config<LayoutTuning>,
  { children, origin, nodeSize, spacing, level, parentSize }: PlaceChildrenParam
): PlaceChildrenReturn => {
  const maxPer = IterationConfig.get("maxChildrenPerNode");
  const policy = IterationConfig.get("onLimit");

  const base = tuning.get("radialBase")(nodeSize, spacing);
  const r = Math.max(tuning.get("minRadius")(), base * (1 + level * tuning.get("radialLevelScale")()));
  const a = tuning.get("anchor")({ mode: LayoutChildrenMode.GRAPH, parentSize, spacing });
  const c = origin.add(a);

  const start = tuning.get("startAngle")();
  const cw = tuning.get("clockwise")();

  return Object.fromEntries(
    mapIndexBounded(children.length, maxPer, policy, (i) => [
      children[i].id,
      Vector.scalar(tuning.get("angleOf")(i, children.length, start, cw)).trig().scale(r).add(c).round(),
    ])
  );
};
