import { Config } from "../../config";
import { LayoutTuning, LayoutTuningConfig } from "../../layout/layout.tuning";
import { IterationConfig, IterationLimits } from "../limits";
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

export function createDefaultSystem(overrides?: Partial<SystemContext>): SystemContext {
  const layouts = new InMemoryLayoutRegistry();
  layouts.register(LayoutTypes.Grid, new GridLayout());
  layouts.register(LayoutTypes.Radial, new RadialLayout());

  const routers = new InMemoryRouterRegistry();
  routers.register("line", new LineRouter());
  routers.register("ortho", new OrthoRouter());
  return {
    log: overrides?.log ?? new NoopLogger(),
    tunings: overrides?.tunings ?? LayoutTuningConfig,
    limits: overrides?.limits ?? IterationConfig,
    layouts: overrides?.layouts ?? layouts,
    routers: overrides?.routers ?? routers,
  };
}
