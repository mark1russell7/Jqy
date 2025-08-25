import { Config } from "../../config";
import { Iterator } from "./iterator.types";
import { LayoutTypes } from "../layout.enum";
import { buildIterators, IteratorsSet } from "./layout.iterators";

export interface IteratorRegistry {
  [LayoutTypes.Grid]: Iterator;
  [LayoutTypes.Radial]: Iterator;
}
export const IteratorsConfig = new Config<Record<keyof IteratorRegistry, Iterator>>(buildIterators());
export type { IteratorsSet }; // re-export for convenience
