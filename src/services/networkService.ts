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
    
    const { shouldMeasureInBrowser } = await import("../lib/hostMode");
    const remote = shouldMeasureInBrowser();

    let clientEffectiveType: string | null = null;
    let clientPublicIp: string | null = null;
    let clientLocation: string | null = null;
    let clientLocalIp: string | null = null;
    let clientIsp: string | null = null;

    try {
      const { probeClientNetwork } = await import("../lib/clientNetwork");
      const client = await probeClientNetwork();
      clientEffectiveType = client.effectiveType ? client.effectiveType.toUpperCase() : null;
      clientPublicIp = client.publicIp ?? null;
      clientLocation = client.location ?? null;
      clientLocalIp = client.localIp ?? null;
      clientIsp = client.isp ?? null;
    } catch {
      /* ignore */
    }

    const publicIp = remote ? (clientPublicIp || s.publicIp || null) : (s.publicIp || clientPublicIp || null);
    const hostMedia = s.mediaType as NetworkStatus["mediaType"] | undefined;
    const mediaType = remote
      ? (clientEffectiveType?.includes("4G") || clientEffectiveType?.includes("5G")
          ? "Cellular"
          : clientEffectiveType
            ? "Wi-Fi"
            : "Unknown")
      : hostMedia && hostMedia !== "Unknown"
        ? hostMedia
        : clientEffectiveType
          ? (clientEffectiveType.includes("4G") || clientEffectiveType.includes("5G") ? "Cellular" : "Wi-Fi")
          : "Unknown";

    return {
      state: publicIp ? "Connected" : (s.state as NetworkStatus["state"]) || "Offline",
      mediaType,
      ssid: remote ? null : (s.ssid ?? null),
      interfaceName: remote
        ? (clientEffectiveType ? `Visitor browser (${clientEffectiveType})` : "Visitor browser")
        : (s.interfaceName ?? (clientEffectiveType ? `Browser Client (${clientEffectiveType})` : null)),
      ipAddress: remote ? (clientLocalIp ?? null) : (s.ipAddress ?? clientLocalIp ?? null),
      gateway: remote ? null : (s.gateway ?? null),
      macAddress: remote ? null : (s.macAddress ?? null),
      dnsServers: remote ? [] : (s.dnsServers ?? []),
      isp: remote ? (clientIsp ?? (publicIp ? "Cloudflare Edge (visitor)" : null)) : (s.isp ?? (publicIp ? "Cloudflare Anycast" : null)),
      publicIp,
      signalDbm: remote ? null : (s.signalDbm ?? null),
      signalPercent: remote ? null : (s.signalPercent ?? null),
      linkSpeedMbps: remote ? null : (s.linkSpeedMbps ?? null),
      healthScore: s.healthScore ?? null,
      healthLabel: s.healthLabel ?? null,
      freshness: "LIVE",
      source: remote ? "visitor-browser" : (live.source || "client-browser"),
      reason: remote
        ? "WAN identity and latency are measured from this browser. LAN/Wi-Fi radio fields require a local Windows agent."
        : (live.reason ?? null),
      locationHint: clientLocation ?? (remote ? null : (s.locationHint ?? null)),
    };
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const live = this.last ?? (await this.getLive());
    const m = live.metrics ?? {};
    
    const { shouldMeasureInBrowser } = await import("../lib/hostMode");
    const remote = shouldMeasureInBrowser();

    let browserDownlink: number | null = null;
    let browserRtt: number | null = null;
    try {
      const { probeClientNetwork } = await import("../lib/clientNetwork");
      const client = await probeClientNetwork();
      browserDownlink = client.downlinkMbps ?? null;
      browserRtt = client.rttMs ?? null;
    } catch {
      /* ignore */
    }

    const downloadVal = remote ? (browserDownlink ?? m.download ?? null) : (m.download ?? browserDownlink ?? null);
    const pingVal = remote ? (browserRtt ?? null) : (m.ping ?? browserRtt ?? null);

    return {
      download: metric(downloadVal, "Mbps", "speed"),
      upload: metric(m.upload ?? null, "Mbps", "speed"),
      ping: metric(pingVal, "ms", "latency"),
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
