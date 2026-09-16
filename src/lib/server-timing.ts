/// <reference types="node" />

export type TimingRecorder = (name: string, durationMs: number) => void;

export class ServerTimings {
  private readonly startedAt = performance.now();
  private readonly entries = new Map<string, number>();

  record: TimingRecorder = (name, durationMs) => {
    this.entries.set(name, (this.entries.get(name) ?? 0) + durationMs);
  };

  async measure<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const startedAt = performance.now();
    try {
      return await operation();
    } finally {
      this.record(name, performance.now() - startedAt);
    }
  }

  header() {
    this.entries.set("total", performance.now() - this.startedAt);
    return [...this.entries]
      .map(([name, duration]) => `${name};dur=${duration.toFixed(1)}`)
      .join(", ");
  }

  json(data: unknown, init: ResponseInit = {}) {
    const headers = new Headers(init.headers);
    headers.set("Server-Timing", this.header());
    return Response.json(data, { ...init, headers });
  }
}
