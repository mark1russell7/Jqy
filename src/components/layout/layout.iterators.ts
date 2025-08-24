import { Shapes, Vector } from "../geometry";
import { Iterator, IteratorOps } from "./iterators.types";
import { LayoutChildrenMode } from "./layout.enum";
import { Config } from "../config";
import { LayoutTuning, LayoutTuningConfig } from "./layout.tuning";

/** map unit [0,1]² → top-left rect (position + u * size). */
export const mapToRect = (u: Vector, r: Shapes.Rectangle): Vector =>
     r.getPosition().add(u.multiply(r.getSize()));

/** correct grid centers: ((col+.5)/cols, (row+.5)/rows) */
export const gridUnit = (i: number, n: number, rowCol: Vector): Vector => {
    const cols = Math.max(1, rowCol.x);
    const rows = Math.max(1, rowCol.y);
    const col = i % cols;
    const row = Math.floor(i / cols);
    return new Vector((col + 0.5) / cols, (row + 0.5) / rows);
};

/** iterator registry */
export type IteratorsSet = {
    grid: Iterator;
    radial: Iterator;
};

export const buildIterators = (tuning: Config<LayoutTuning> = LayoutTuningConfig): IteratorsSet => {
    const opsGrid: IteratorOps = {
        unit: gridUnit,
        mapToRect,
        anchor: ({ mode, parentSize, spacing }) =>
            mode === LayoutChildrenMode.GRAPH ? tuning.get("anchor")({ mode, parentSize, spacing }) : new Vector(0, 0),
    };

    const opsRadial: IteratorOps = {
        anchor: ({ mode, parentSize, spacing }) =>
            mode === LayoutChildrenMode.GRAPH ? tuning.get("anchor")({ mode, parentSize, spacing }) : new Vector(0, 0),
        angle: (i, n) => {
            const start = tuning.get("startAngle")();
            const cw    = tuning.get("clockwise")();
            return tuning.get("angleOf")(i, n, start, cw);
        },
    };

    return {
        grid:   new Iterator(opsGrid),
        radial: new Iterator(opsRadial),
    };
};

/** default singleton */
export const IteratorsConfig = new Config<IteratorsSet>(buildIterators());
