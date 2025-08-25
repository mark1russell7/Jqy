import { Config } from "../../config";
import { defaultTuning, LayoutTuning, LayoutTuningConfig } from "../../layout/layout.tuning";
import { defaultLayoutLimits, IterationConfig, IterationLimits } from "../limits";
import { Logger, NoopLogger } from "../../core/logging/logger";
import { InMemoryLayoutRegistry } from "../registries/layout.registry";
import { InMemoryRouterRegistry } from "../registries/router.registry";
import { GridLayout } from "../strategies/grid/grid.layout";
import { RadialLayout } from "../strategies/radial/radial.layout";
import { LineRouter } from "../routers/line.router";
import type { LayoutRegistry } from "../registries/layout.registry";
import type { RouterRegistry } from "../registries/router.registry";
import { LayoutTypes } from "../layout.enum";
import { OrthoRouter } from "../routers/ortho.router";

export type SystemContext = {
  log: Logger;
  tunings: Config<LayoutTuning>;
  limits: Config<IterationLimits>;
  layouts: LayoutRegistry;
  routers: RouterRegistry;
};

// context.ts
export function createDefaultSystem(overrides?: Partial<SystemContext>): SystemContext {
  const tunings = overrides?.tunings ?? new Config<LayoutTuning>({ ...defaultTuning });
  const limits  = overrides?.limits  ?? new Config<IterationLimits>({ ...defaultLayoutLimits });

  const layouts = new InMemoryLayoutRegistry();
  layouts.register(LayoutTypes.Grid,  new GridLayout(tunings /* pass ctx */));
  layouts.register(LayoutTypes.Radial,new RadialLayout(tunings /* pass ctx */));

  const routers = new InMemoryRouterRegistry(); // routers usually stateless
  routers.register("line",  new LineRouter());
  routers.register("ortho", new OrthoRouter());

  return { log: overrides?.log ?? new NoopLogger(), tunings, limits, layouts, routers };
}
