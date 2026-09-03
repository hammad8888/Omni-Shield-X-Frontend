import type { NetworkStatus, DashboardMetrics, HealthBreakdown, ConnectionQualityRating } from "../types";
import { api } from "../api";
import { metricStatus } from "../lib/format";

type LiveResponse = {
  freshness?: string;
  source?: string;
  reason?: string | null;
  status?: Partial<NetworkStatus> & { signalPercent?: number | null };
  metrics?: {
    download?: number | null;
    upload?: number | null;
    ping?: number | null;
    jitter?: number | null;
    packetLoss?: number | null;
    dnsLatency?: number | null;
    qualityScore?: number | null;
    qualityLabel?: string | null;
  };
  adapters?: unknown[];
};

function metric(value: number | null, unit: string, kind: "speed" | "latency" | "loss"): DashboardMetrics["download"] {
  return {
    value,
    unit,
    trend: "neutral",
    trendPercentage: null,
    status: metricStatus(value, kind),
    sparkline: value != null ? [value] : [],
  };
}

class NetworkService {
  private last: LiveResponse | null = null;
  private inflight: Promise<LiveResponse> | null = null;
  private lastAt = 0;

  ingest(data: Partial<LiveResponse>) {
    this.last = {
      ...this.last,
      ...data,
      status: { ...(this.last?.status ?? {}), ...(data.status ?? {}) },
      metrics: data.metrics ?? this.last?.metrics,
      adapters: data.adapters ?? this.last?.adapters,
    };
    this.lastAt = Date.now();
  }

  async getLive(): Promise<LiveResponse> {
    if (this.inflight) return this.inflight;
    if (this.last && Date.now() - this.lastAt < 800) return this.last;
    this.inflight = api<LiveResponse>("/api/network/live")
      .then((data) => {
        this.last = data;
        this.lastAt = Date.now();
        return data;
      })
      .finally(() => {
        this.inflight = null;
      });
    return this.inflight;
  }

  async getStatus(): Promise<NetworkStatus> {
    const live = this.last ?? (await this.getLive());
    const s = live.status ?? {};
    return {
      state: (s.state as NetworkStatus["state"]) || "Offline",
      mediaType: (s.mediaType as NetworkStatus["mediaType"]) || "Unknown",
      ssid: s.ssid ?? null,
      interfaceName: s.interfaceName ?? null,
      ipAddress: s.ipAddress ?? null,
      gateway: s.gateway ?? null,
      macAddress: s.macAddress ?? null,
      dnsServers: s.dnsServers ?? [],
      isp: s.isp ?? null,
      publicIp: s.publicIp ?? null,
      signalDbm: s.signalDbm ?? null,
      signalPercent: s.signalPercent ?? null,
      linkSpeedMbps: s.linkSpeedMbps ?? null,
      healthScore: s.healthScore ?? null,
      healthLabel: s.healthLabel ?? null,
      freshness: live.freshness,
      source: live.source,
      reason: live.reason,
      locationHint: s.locationHint ?? null,
    };
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const live = this.last ?? (await this.getLive());
    const m = live.metrics ?? {};
    return {
      download: metric(m.download ?? null, "Mbps", "speed"),
      upload: metric(m.upload ?? null, "Mbps", "speed"),
      ping: metric(m.ping ?? null, "ms", "latency"),
      jitter: metric(m.jitter ?? null, "ms", "latency"),
      packetLoss: metric(m.packetLoss ?? null, "%", "loss"),
      dnsLatency: metric(m.dnsLatency ?? null, "ms", "latency"),
    };
  }

  async getHealthBreakdown(): Promise<HealthBreakdown[]> {
    const live = this.last ?? (await this.getLive());
    const m = live.metrics ?? {};
    const rows: HealthBreakdown[] = [];
    const asHb = (kind: "speed" | "latency" | "loss", value: number): HealthBreakdown["status"] => {
      const status = metricStatus(value, kind);
      return status === "neutral" ? "fair" : status;
    };
    if (m.download != null) rows.push({ category: "Throughput", score: Math.min(100, Math.round((m.download / 200) * 100)), weight: 0.3, status: asHb("speed", m.download) });
    if (m.ping != null) rows.push({ category: "Latency", score: Math.max(0, 100 - Math.round(m.ping)), weight: 0.25, status: asHb("latency", m.ping) });
    if (m.jitter != null) rows.push({ category: "Jitter", score: Math.max(0, 100 - Math.round(m.jitter * 8)), weight: 0.2, status: asHb("latency", m.jitter) });
    if (m.packetLoss != null) rows.push({ category: "Loss", score: Math.max(0, 100 - Math.round(m.packetLoss * 20)), weight: 0.25, status: asHb("loss", m.packetLoss) });
    return rows;
  }

  async getConnectionQualities(): Promise<ConnectionQualityRating[]> {
    const live = this.last ?? (await this.getLive());
    const download = live.metrics?.download ?? null;
    const ping = live.metrics?.ping ?? null;
    if (download == null && ping == null) return [];
    const rate = (minDown: number, maxPing: number): ConnectionQualityRating["rating"] => {
      if (download != null && download >= minDown && (ping == null || ping <= maxPing)) return "Excellent";
      if (download != null && download >= minDown * 0.6) return "Good";
      if (download != null && download >= minDown * 0.3) return "Fair";
      return "Poor";
    };
    return [
      { service: "Web browsing", rating: rate(5, 80), score: live.metrics?.qualityScore ?? 0, description: "From last measured speed test and ping." },
      { service: "HD video", rating: rate(10, 80), score: live.metrics?.qualityScore ?? 0, description: "Requires ~10 Mbps sustained download." },
      { service: "4K video", rating: rate(35, 50), score: live.metrics?.qualityScore ?? 0, description: "Requires ~35 Mbps sustained download." },
      { service: "Video calls", rating: rate(5, 50), score: live.metrics?.qualityScore ?? 0, description: "Sensitive to ping and loss." },
      { service: "Online gaming", rating: rate(5, 40), score: live.metrics?.qualityScore ?? 0, description: "Open Gaming setup for path probes. Sensitive to ping and jitter, not just Mbps." },
    ];
  }

  async getAdapters(): Promise<unknown[]> {
    const live = this.last ?? (await this.getLive());
    return live.adapters ?? [];
  }
}

export const networkService = new NetworkService();
