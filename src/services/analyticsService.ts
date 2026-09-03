import type { HistoryEntry, NetworkEventItem } from "../types";
import { api } from "../api";

class AnalyticsService {
  async getTestHistory(): Promise<HistoryEntry[]> {
    const res = await api<{ items?: Array<Record<string, unknown>> }>("/api/speedtest");
    return (res.items ?? []).map((row) => ({
      id: String(row.id),
      timestamp: row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : "",
      networkName: String(row.connectionType ?? row.server ?? "Speed test"),
      connectionType: "Unknown",
      downloadMbps: Number(row.downloadMbps),
      uploadMbps: Number(row.uploadMbps),
      pingMs: Number(row.pingMs),
      jitterMs: Number(row.jitterMs),
      packetLossPercent: Number(row.packetLossPct ?? 0),
      score: typeof row.qualityScore === "number" ? row.qualityScore : 0,
      serverLocation: String(row.server ?? "speed.cloudflare.com"),
    }));
  }

  async getEvents(): Promise<NetworkEventItem[]> {
    const [speed, wifi] = await Promise.all([
      api<{ items?: Array<Record<string, unknown>> }>("/api/speedtest").catch(() => ({ items: [] as Array<Record<string, unknown>> })),
      api<{ item?: Record<string, unknown>; items?: unknown[]; freshness?: string }>("/api/wifi/environment").catch(() => ({ item: null, items: [] })),
    ]);
    const events: NetworkEventItem[] = [];
    for (const row of speed.items ?? []) {
      events.push({
        id: String(row.id),
        timestamp: row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : "",
        type: row.freshness === "LIVE" ? "success" : "info",
        category: "Speed",
        message: `Speed test ${row.downloadMbps ?? "—"} / ${row.uploadMbps ?? "—"} Mbps, ping ${row.pingMs ?? "—"} ms`,
      });
    }
    if (wifi.item) {
      events.push({
        id: "wifi-env",
        timestamp: wifi.item.createdAt ? new Date(String(wifi.item.createdAt)).toLocaleString() : "Latest scan",
        type: wifi.freshness === "LIVE" ? "success" : "warning",
        category: "Wi-Fi",
        message: wifi.item.connectedSsid
          ? `Associated with ${wifi.item.connectedSsid}; ${Array.isArray(wifi.items) ? wifi.items.length : 0} nearby BSSIDs`
          : "No WLAN association in the latest scan",
      });
    }
    return events;
  }

  async clearHistory(): Promise<void> {
    return;
  }
}

export const analyticsService = new AnalyticsService();
