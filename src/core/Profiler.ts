type ProfilingEvent = "stroke" | "fill" | "export";

interface TimingEntry {
  name: ProfilingEvent;
  duration: number;
  timestamp: number;
}

const MAX_TIMINGS = 6;

class Profiler {
  private enabled = false;
  private overlay: HTMLDivElement | null = null;
  private timings: TimingEntry[] = [];
  private counter = 0;
  private active = new Map<string, { name: ProfilingEvent; startMark: string }>();
  private rafHandle: number | null = null;
  private fps = 0;
  private lastFpsSample = 0;
  private frameCount = 0;

  initialize(): void {
    if (this.overlay) return;
    const overlay = document.createElement("div");
    overlay.className = "profiling-hud";
    overlay.setAttribute("aria-live", "polite");
    overlay.style.display = "none";
    document.body.appendChild(overlay);
    this.overlay = overlay;
  }

  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    if (this.overlay) {
      this.overlay.style.display = enabled ? "block" : "none";
      if (!enabled) {
        this.overlay.innerHTML = "";
      }
    }
    this.timings = [];
    this.resetFps();
    if (enabled) {
      this.startFpsLoop();
      this.render();
    } else {
      this.stopFpsLoop();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  begin(name: ProfilingEvent): string | null {
    if (!this.enabled || typeof performance === "undefined") {
      return null;
    }
    const id = `${name}-${++this.counter}`;
    const startMark = `${id}-start`;
    this.active.set(id, { name, startMark });
    performance.mark(startMark);
    return id;
  }

  end(token: string | null): void {
    if (!token || !this.enabled || typeof performance === "undefined") {
      return;
    }
    const data = this.active.get(token);
    if (!data) return;
    const endMark = `${token}-end`;
    const measureName = `${token}-measure`;
    performance.mark(endMark);
    const measure = performance.measure(measureName, data.startMark, endMark);
    this.recordTiming(data.name, measure.duration);
    performance.clearMarks(data.startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
    this.active.delete(token);
  }

  run<T>(name: ProfilingEvent, fn: () => T): T {
    const token = this.begin(name);
    try {
      return fn();
    } finally {
      this.end(token);
    }
  }

  private recordTiming(name: ProfilingEvent, duration: number): void {
    if (!this.enabled) return;
    this.timings.unshift({ name, duration, timestamp: performance.now() });
    if (this.timings.length > MAX_TIMINGS) {
      this.timings.length = MAX_TIMINGS;
    }
    this.render();
  }

  private render(): void {
    if (!this.enabled || !this.overlay) return;
    const labels: Record<ProfilingEvent, string> = {
      stroke: "Stroke",
      fill: "Fill",
      export: "Export",
    };
    const lines = this.timings
      .map((entry) => {
        const age = Math.max(0, performance.now() - entry.timestamp);
        const secondsAgo = (age / 1000).toFixed(1);
        const duration = entry.duration.toFixed(1);
        const label = labels[entry.name];
        return `<li><span>${label}</span><span>${duration}ms</span><span>${secondsAgo}s ago</span></li>`;
      })
      .join("");
    this.overlay.innerHTML = `
      <div class="profiling-hud__header">
        <span>FPS: ${this.fps.toFixed(1)}</span>
        <span>Profiling On</span>
      </div>
      <ul class="profiling-hud__list">${lines || "<li>No timings yet</li>"}</ul>
    `;
  }

  private startFpsLoop(): void {
    if (this.rafHandle !== null) return;
    const tick = (time: number) => {
      if (!this.enabled) {
        this.stopFpsLoop();
        return;
      }
      this.frameCount += 1;
      if (!this.lastFpsSample) {
        this.lastFpsSample = time;
      }
      const elapsed = time - this.lastFpsSample;
      if (elapsed >= 1000) {
        this.fps = (this.frameCount * 1000) / elapsed;
        this.frameCount = 0;
        this.lastFpsSample = time;
        this.render();
      }
      this.rafHandle = window.requestAnimationFrame(tick);
    };
    this.rafHandle = window.requestAnimationFrame(tick);
  }

  private stopFpsLoop(): void {
    if (this.rafHandle !== null) {
      window.cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
  }

  private resetFps(): void {
    this.fps = 0;
    this.lastFpsSample = 0;
    this.frameCount = 0;
  }
}

export const profiler = new Profiler();
export type { ProfilingEvent };
