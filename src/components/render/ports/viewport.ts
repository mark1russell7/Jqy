export type ViewportState = { scale: number; x: number; y: number; min?: number; max?: number };

export type Viewport = { x: number; y: number; scale: number };
type Sub = (v: Viewport) => void;

export class ViewportController {
  private v: Viewport = { x: 0, y: 0, scale: 1 };
  private subs = new Set<Sub>();
  private clampScale(s: number) { return Math.max(0.1, Math.min(8, s)); }

  get(): Viewport { return this.v; }
  set(patch: Partial<Viewport>) {
    const next = {
      x: patch.x ?? this.v.x,
      y: patch.y ?? this.v.y,
      scale: this.clampScale(patch.scale ?? this.v.scale),
    };
    this.v = next; for (const f of this.subs) f(next);
  }
  onChange(f: Sub) { this.subs.add(f); return () => this.subs.delete(f); }

  attachWheelAndDrag(el: HTMLElement) {
    let dragging = false; let lx = 0; let ly = 0;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && Math.abs(e.deltaX) + Math.abs(e.deltaY) < 1) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = (e.clientX - rect.left), my = (e.clientY - rect.top);
      const old = this.v.scale;
      const factor = e.deltaY > 0 ? 1/1.1 : 1.1;
      const next = this.clampScale(old * factor);
      const k = next / old;
      const nx = mx - k * (mx - this.v.x);
      const ny = my - k * (my - this.v.y);
      this.set({ x: nx, y: ny, scale: next });
    }, opt = { passive: false } as AddEventListenerOptions;

    const onDown = (e: MouseEvent) => { dragging = true; lx = e.clientX; ly = e.clientY; };
    const onUp = () => { dragging = false; };
    const onMove = (e: MouseEvent) => { if (!dragging) return;
      this.set({ x: this.v.x + (e.clientX - lx), y: this.v.y + (e.clientY - ly) }); lx = e.clientX; ly = e.clientY; };

    el.addEventListener("wheel", onWheel, opt);
    el.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
    };
  }

  fitTo(container: HTMLElement, bounds: { position: any; size: any }, pad = 24) {
    const rect = container.getBoundingClientRect();
    const W = Math.max(1, rect.width - pad * 2);
    const H = Math.max(1, rect.height - pad * 2);
    const bw = Math.max(1, bounds.size.x), bh = Math.max(1, bounds.size.y);
    const s = Math.min(W / bw, H / bh);
    const x = pad - bounds.position.x * s + (W - bw * s) / 2;
    const y = pad - bounds.position.y * s + (H - bh * s) / 2;
    this.set({ x, y, scale: s });
  }
}
