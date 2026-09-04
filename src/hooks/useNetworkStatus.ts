import { useState, useEffect, useCallback } from "react";
import type { NetworkStatus, DashboardMetrics, HealthBreakdown, ConnectionQualityRating, MetricWithTrend } from "../types";
import { networkService } from "../services/networkService";
import { usePrefs } from "../prefs";
import { useRealtime } from "../realtime";
import { shouldMeasureInBrowser } from "../lib/hostMode";
import { useVisitorTelemetry } from "../visitorTelemetry";
import { metricStatus } from "../lib/format";

function metricLike(value: number | null, unit: string, kind: "speed" | "latency" | "loss"): MetricWithTrend {
  return {
    value,
    unit,
    trend: "neutral",
    trendPercentage: null,
    status: metricStatus(value, kind),
    sparkline: value != null ? [value] : [],
  };
}

export function useNetworkStatus() {
  const { pollIntervalMs } = usePrefs();
  const { network, transport } = useRealtime();
  const visitor = useVisitorTelemetry();
  const browserOrigin = shouldMeasureInBrowser(visitor.capability);
  const [status, setStatus] = useState<NetworkStatus | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [healthBreakdowns, setHealthBreakdowns] = useState<HealthBreakdown[]>([]);
  const [qualityRatings, setQualityRatings] = useState<ConnectionQualityRating[]>([]);
  const [adapters, setAdapters] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyFromService = useCallback(async () => {
    const [s, m, hb, qr, nics] = await Promise.all([
      networkService.getStatus(),
      networkService.getDashboardMetrics(),
      networkService.getHealthBreakdown(),
      networkService.getConnectionQualities(),
      networkService.getAdapters(),
    ]);
    setStatus(s);
    setMetrics(m);
    setHealthBreakdowns(hb);
    setQualityRatings(qr);
    setAdapters(nics);
    setError(null);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    try {
      await networkService.getLive();
      await applyFromService();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Live telemetry unavailable");
      setLoading(false);
    }
  }, [applyFromService]);

  useEffect(() => {
    if (!network) return;
    if (browserOrigin) return;
    networkService.ingest(network);
    void applyFromService();
  }, [network, applyFromService, browserOrigin]);

  useEffect(() => {
    if (!browserOrigin) return;
    setStatus((prev) => ({
      state: visitor.publicIp ? "Connected" : prev?.state ?? "Offline",
      mediaType: visitor.mediaType,
      ssid: null,
      interfaceName: visitor.effectiveType ? `Visitor browser (${visitor.effectiveType.toUpperCase()})` : "Visitor browser",
      ipAddress: visitor.localIp,
      gateway: null,
      macAddress: null,
      dnsServers: [],
      isp: visitor.isp,
      publicIp: visitor.publicIp,
      signalDbm: null,
      signalPercent: null,
      linkSpeedMbps: null,
      healthScore: visitor.healthScore,
      healthLabel: visitor.healthLabel,
      freshness: "LIVE",
      source: "visitor-browser",
      reason: visitor.capability.reason ?? "WAN metrics are measured from this browser.",
      locationHint: visitor.location,
    }));
    setMetrics({
      download: metricLike(visitor.downloadMbps, "Mbps", "speed"),
      upload: metricLike(visitor.uploadMbps, "Mbps", "speed"),
      ping: metricLike(visitor.pingMs, "ms", "latency"),
      jitter: metricLike(visitor.jitterMs, "ms", "latency"),
      packetLoss: metricLike(visitor.lossPct, "%", "loss"),
      dnsLatency: metricLike(visitor.dnsLatencyMs, "ms", "latency"),
    });
    setError(null);
    setLoading(false);
  }, [browserOrigin, visitor]);

  useEffect(() => {
    if (browserOrigin) return;
    let mounted = true;
    if (transport !== "LIVE") void refresh();
    const interval = setInterval(() => {
      if (!mounted) return;
      if (transport === "LIVE") return;
      void refresh();
    }, Math.max(1000, pollIntervalMs));
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [refresh, pollIntervalMs, transport, browserOrigin]);

  return {
    status,
    metrics,
    healthBreakdowns,
    qualityRatings,
    adapters,
    loading,
    error,
    refresh,
  };
}
