import type { SpeedTestProgress, SpeedTestResult, SpeedTestServer } from "../types";
import { api } from "../api";
import { shouldMeasureInBrowser } from "../lib/hostMode";
import { getRealtimeSocket } from "../socket";
import { socketPayload } from "../lib/socketPayload";

export type SpeedTestSubscriber = (progress: SpeedTestProgress) => void;

const idleProgress = (): SpeedTestProgress => ({
  phase: "idle",
  progressPercent: 0,
  currentSpeedMbps: 0,
  pingMs: 0,
  jitterMs: 0,
  downloadMbps: 0,
  uploadMbps: 0,
  packetLossPercent: 0,
  server: undefined,
  downloadDataPoints: [],
  uploadDataPoints: [],
});

export const SPEED_SERVERS: SpeedTestServer[] = [
  {
    id: "cloudflare-anycast",
    name: "Cloudflare Global Anycast",
    sponsor: "Cloudflare CDN Edge",
    location: "Auto (Nearest POP)",
    country: "Global",
    distanceKm: 15,
    pingMs: 11,
  },
  {
    id: "cloudflare-na",
    name: "Cloudflare North America (US-East)",
    sponsor: "Cloudflare Ashburn",
    location: "Virginia, United States",
    country: "US",
    distanceKm: 620,
    pingMs: 25,
  },
  {
    id: "cloudflare-eu",
    name: "Cloudflare Europe (Frankfurt)",
    sponsor: "Cloudflare Frankfurt",
    location: "Frankfurt, Germany",
    country: "DE",
    distanceKm: 4100,
    pingMs: 82,
  },
  {
    id: "cloudflare-ap",
    name: "Cloudflare Asia-Pacific (Singapore)",
    sponsor: "Cloudflare Singapore",
    location: "Singapore",
    country: "SG",
    distanceKm: 3750,
    pingMs: 68,
  },
  {
    id: "gateway-lan",
    name: "Local Gateway Router Probe",
    sponsor: "Local Subnet (Hop 1)",
    location: "Local Network",
    country: "Local",
    distanceKm: 0,
    pingMs: 1,
  },
];

function asMedia(value: unknown): import("../types").NetworkMediaType {
  const raw = String(value ?? "");
  if (/wifi|wlan/i.test(raw)) return "Wi-Fi";
  if (/eth|wired/i.test(raw)) return "Ethernet";
  if (/cell|lte|5g/i.test(raw)) return "Cellular";
  if (/fiber/i.test(raw)) return "Fiber";
  return "Unknown";
}

function asNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function asSamples(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is number => typeof item === "number" && Number.isFinite(item) && item >= 0);
}

function mapResult(row: Record<string, unknown>, server: SpeedTestServer): SpeedTestResult {
  const downloadMbps = asNumber(row.downloadMbps);
  const uploadMbps = asNumber(row.uploadMbps);
  const pingMs = asNumber(row.pingMs);
  const jitterMs = asNumber(row.jitterMs);
  const packetLossPercent = asNumber(row.packetLossPct ?? row.packetLossPercent);
  return {
    id: String(row.id ?? `res-${Date.now()}`),
    timestamp: row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : new Date().toLocaleString(),
    downloadMbps,
    uploadMbps,
    pingMs,
    jitterMs,
    packetLossPercent,
    server: {
      ...server,
      name: String(row.server ?? server.name),
      pingMs: pingMs || server.pingMs,
    },
    isp: typeof row.isp === "string" ? row.isp : "Cloudflare Edge",
    networkName: typeof row.connectionType === "string" ? row.connectionType : "multi",
    connectionType: asMedia(row.connectionType),
    healthScore: typeof row.qualityScore === "number" ? row.qualityScore : 92,
    rating: typeof row.qualityLabel === "string" ? row.qualityLabel : "Excellent",
  };
}

type LiveProgress = {
  phase?: string;
  currentMbps?: number | null;
  downloadMbps?: number | null;
  uploadMbps?: number | null;
  pingMs?: number | null;
  jitterMs?: number | null;
  packetLossPct?: number | null;
  bytes?: number;
  totalBytes?: number;
  downloadSamples?: number[];
  uploadSamples?: number[];
};

function percentFor(
  phase: SpeedTestProgress["phase"],
  bytes?: number,
  totalBytes?: number,
  samplesCount = 0
): number {
  if (phase === "connecting") return 8;
  if (phase === "testing_latency") return 18;
  if (phase === "testing_download") {
    if (totalBytes && totalBytes > 0 && typeof bytes === "number" && bytes > 0) {
      const frac = Math.min(1, Math.max(0, bytes / totalBytes));
      return Math.round(20 + frac * 45);
    }
    return Math.min(65, Math.round(20 + samplesCount * 1.2));
  }
  if (phase === "testing_upload") {
    if (totalBytes && totalBytes > 0 && typeof bytes === "number" && bytes > 0) {
      const frac = Math.min(1, Math.max(0, bytes / totalBytes));
      return Math.round(65 + frac * 30);
    }
    return Math.min(95, Math.round(65 + samplesCount * 1.5));
  }
  if (phase === "finalizing") return 96;
  if (phase === "completed") return 100;
  return 5;
}

class SpeedTestService {
  private subscribers = new Set<SpeedTestSubscriber>();
  private isRunning = false;
  private currentProgress: SpeedTestProgress = idleProgress();
  private history: SpeedTestResult[] = [];
  private activeServer: SpeedTestServer = SPEED_SERVERS[0];
  private connectionType: "multi" | "single" = "multi";
  private pollTimer: number | null = null;

  subscribe(callback: SpeedTestSubscriber): () => void {
    this.subscribers.add(callback);
    callback({ ...this.currentProgress });
    return () => this.subscribers.delete(callback);
  }

  private notify() {
    for (const sub of this.subscribers) sub({ ...this.currentProgress });
  }

  async getServers(): Promise<SpeedTestServer[]> {
    return SPEED_SERVERS;
  }

  setServer(srv: SpeedTestServer) {
    this.activeServer = srv;
    if (this.currentProgress.phase === "idle") {
      this.currentProgress.server = srv;
      this.notify();
    }
  }

  setConnectionType(type: "multi" | "single") {
    this.connectionType = type;
  }

  getConnectionType(): "multi" | "single" {
    return this.connectionType;
  }

  async getHistory(): Promise<SpeedTestResult[]> {
    try {
      const res = await api<{ items?: Record<string, unknown>[] }>("/api/speedtest");
      if (res.items?.length) {
        this.history = res.items.map((row) => mapResult(row, this.activeServer));
      }
    } catch {
      /* keep last local history */
    }
    return [...this.history];
  }

  async getLatestResult(): Promise<SpeedTestResult | null> {
    if (!this.history.length) await this.getHistory();
    return this.history[0] ?? null;
  }

  startTest(opts?: { connectionType?: "multi" | "single"; server?: SpeedTestServer }): void {
    if (this.isRunning) return;
    if (opts?.connectionType) this.connectionType = opts.connectionType;
    if (opts?.server) this.activeServer = opts.server;

    this.isRunning = true;
    this.currentProgress = {
      ...idleProgress(),
      phase: "connecting",
      progressPercent: 8,
      server: this.activeServer,
    };
    this.notify();
    const browserOrigin = shouldMeasureInBrowser();
    if (!browserOrigin) {
      this.pollTimer = window.setInterval(() => {
        void this.pullLiveProgress();
      }, 200);
    }
    const socket = getRealtimeSocket();
    const onProgress = (message: unknown) => {
      if (browserOrigin) return;
      const live = socketPayload<LiveProgress>(message);
      if (live) this.applyLive(live);
    };
    const onComplete = (message: unknown) => {
      if (browserOrigin) return;
      const result = socketPayload<LiveProgress & { freshness?: string; packetLossPct?: number | null }>(message);
      if (!result) return;
      this.applyLive({
        ...result,
        phase: result.phase === "error" || result.freshness === "UNAVAILABLE" ? "error" : "completed",
      });
    };
    socket.on("speedtest:progress", onProgress);
    socket.on("speedtest:complete", onComplete);
    const cleanup = () => {
      socket.off("speedtest:progress", onProgress);
      socket.off("speedtest:complete", onComplete);
    };
    if (!browserOrigin) void this.pullLiveProgress();
    void this.runLive().finally(cleanup);
  }

  private async runBrowserOrigin() {
    const { shouldMeasureInBrowser } = await import("../lib/hostMode");
    if (!shouldMeasureInBrowser()) return false;
    const { runBrowserSpeedTest } = await import("../lib/browserSpeedTest");
    const result = await runBrowserSpeedTest({
      connectionType: this.connectionType,
      serverName: this.activeServer.name,
      onProgress: (live) => this.applyLive(live),
    });
    if (!this.isRunning) return true;
    this.stopPoll();
    this.applyLive({ ...result, phase: result.freshness === "UNAVAILABLE" ? "error" : "completed" });
    const mapped = mapResult(
      {
        id: `browser-${Date.now()}`,
        createdAt: new Date().toISOString(),
        downloadMbps: result.downloadMbps,
        uploadMbps: result.uploadMbps,
        pingMs: result.pingMs,
        jitterMs: result.jitterMs,
        packetLossPct: result.packetLossPct,
        server: result.server,
        isp: result.isp,
        connectionType: result.connectionType,
        qualityScore: result.qualityScore,
        qualityLabel: result.qualityLabel,
      },
      this.activeServer,
    );
    this.history.unshift(mapped);
    this.currentProgress = {
      phase: result.freshness === "UNAVAILABLE" ? "error" : "completed",
      progressPercent: 100,
      currentSpeedMbps: result.downloadMbps ?? 0,
      pingMs: result.pingMs ?? 0,
      jitterMs: result.jitterMs ?? 0,
      downloadMbps: result.downloadMbps ?? 0,
      uploadMbps: result.uploadMbps ?? 0,
      packetLossPercent: result.packetLossPct ?? 0,
      server: this.activeServer,
      downloadDataPoints: result.downloadSamples,
      uploadDataPoints: result.uploadSamples,
    };
    this.isRunning = false;
    this.notify();
    try {
      const { publishVisitorSpeed } = await import("../visitorTelemetry");
      publishVisitorSpeed(result.downloadMbps, result.uploadMbps);
    } catch {
      /* ignore */
    }
    try {
      await api("/api/speedtest", {
        method: "POST",
        body: JSON.stringify({
          origin: "browser",
          connectionType: this.connectionType,
          serverId: this.activeServer.id,
          serverName: this.activeServer.name,
          downloadMbps: result.downloadMbps,
          uploadMbps: result.uploadMbps,
          pingMs: result.pingMs,
          jitterMs: result.jitterMs,
          packetLossPct: result.packetLossPct,
          isp: result.isp,
          publicIp: result.publicIp,
          localIp: result.localIp,
          locationHint: result.locationHint,
          downloadSamples: result.downloadSamples,
          uploadSamples: result.uploadSamples,
        }),
      });
    } catch {
      /* history still kept locally */
    }
    return true;
  }

  private applyLive(live: LiveProgress) {
    if (!this.isRunning) return;
    const raw = live.phase;
    if (!raw || raw === "idle") return;

    let phase: SpeedTestProgress["phase"] = this.currentProgress.phase;
    if (raw === "testing_latency") phase = "testing_latency";
    else if (raw === "testing_download") phase = "testing_download";
    else if (raw === "testing_upload") phase = "testing_upload";
    else if (raw === "completed") phase = "completed";
    else if (raw === "error") phase = "error";

    const downloadSamples = asSamples(live.downloadSamples);
    const uploadSamples = asSamples(live.uploadSamples);
    const totalSamples = phase === "testing_upload" ? uploadSamples.length : downloadSamples.length;
    const measured = typeof live.currentMbps === "number" && live.currentMbps >= 0 ? live.currentMbps : null;
    const downloadMbps = typeof live.downloadMbps === "number" ? live.downloadMbps : this.currentProgress.downloadMbps;
    const uploadMbps = typeof live.uploadMbps === "number" ? live.uploadMbps : this.currentProgress.uploadMbps;

    this.currentProgress = {
      ...this.currentProgress,
      phase,
      progressPercent: percentFor(phase, live.bytes, live.totalBytes, totalSamples),
      currentSpeedMbps:
        phase === "completed"
          ? (downloadMbps || measured || this.currentProgress.currentSpeedMbps)
          : (measured ?? this.currentProgress.currentSpeedMbps),
      pingMs: typeof live.pingMs === "number" ? live.pingMs : this.currentProgress.pingMs,
      jitterMs: typeof live.jitterMs === "number" ? live.jitterMs : this.currentProgress.jitterMs,
      packetLossPercent: typeof live.packetLossPct === "number" ? live.packetLossPct : this.currentProgress.packetLossPercent,
      downloadMbps,
      uploadMbps,
      downloadDataPoints: downloadSamples.length ? downloadSamples : this.currentProgress.downloadDataPoints,
      uploadDataPoints: uploadSamples.length ? uploadSamples : this.currentProgress.uploadDataPoints,
      server: this.activeServer,
    };
    this.notify();
  }

  private async pullLiveProgress() {
    if (!this.isRunning) return;
    try {
      const live = await api<LiveProgress>("/api/speedtest/progress");
      this.applyLive(live);
    } catch {
      /* keep last measured sample */
    }
  }

  private stopPoll() {
    if (this.pollTimer != null) {
      window.clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async runLive() {
    try {
      if (await this.runBrowserOrigin()) return;
      const res = await api<{
        item: Record<string, unknown>;
        downloadSamples?: number[];
        uploadSamples?: number[];
      }>("/api/speedtest", {
        method: "POST",
        body: JSON.stringify({
          connectionType: this.connectionType,
          serverId: this.activeServer.id,
          serverName: this.activeServer.name,
        }),
      });
      if (!this.isRunning) return;
      this.stopPoll();
      const result = mapResult(res.item, this.activeServer);
      this.history.unshift(result);
      const downloadSamples = asSamples(res.downloadSamples).length
        ? asSamples(res.downloadSamples)
        : asSamples(res.item.downloadSamples);
      const uploadSamples = asSamples(res.uploadSamples).length
        ? asSamples(res.uploadSamples)
        : asSamples(res.item.uploadSamples);
      this.currentProgress = {
        phase: "completed",
        progressPercent: 100,
        currentSpeedMbps: result.downloadMbps,
        pingMs: result.pingMs,
        jitterMs: result.jitterMs,
        downloadMbps: result.downloadMbps,
        uploadMbps: result.uploadMbps,
        packetLossPercent: result.packetLossPercent,
        server: result.server,
        downloadDataPoints: downloadSamples.length
          ? downloadSamples
          : this.currentProgress.downloadDataPoints.length
            ? this.currentProgress.downloadDataPoints
            : result.downloadMbps
              ? [result.downloadMbps]
              : [],
        uploadDataPoints: uploadSamples.length
          ? uploadSamples
          : this.currentProgress.uploadDataPoints.length
            ? this.currentProgress.uploadDataPoints
            : result.uploadMbps
              ? [result.uploadMbps]
              : [],
      };
      this.isRunning = false;
      this.notify();
    } catch {
      this.stopPoll();
      this.isRunning = false;
      this.currentProgress = {
        ...idleProgress(),
        phase: "error",
        server: this.activeServer,
      };
      this.notify();
    }
  }

  resetTest(): void {
    this.stopPoll();
    this.isRunning = false;
    this.currentProgress = idleProgress();
    this.currentProgress.server = this.activeServer;
    this.notify();
  }
}

export const speedTestService = new SpeedTestService();

