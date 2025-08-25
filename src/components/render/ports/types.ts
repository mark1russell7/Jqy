import type { LayoutSnapshot } from "../../layout/types";
import type { Theme } from "../../adapters/theme";

export interface RenderSession {
  draw(snapshot: LayoutSnapshot): void;  // full draw
  destroy(): void;
}

export interface RenderPort {
  mount(container: HTMLElement, initial: LayoutSnapshot, theme: Theme): RenderSession;
}
