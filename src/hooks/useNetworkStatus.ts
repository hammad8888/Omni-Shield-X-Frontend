import { useState, useEffect, useCallback } from "react";
import type { NetworkStatus, DashboardMetrics, HealthBreakdown, ConnectionQualityRating } from "../types";
import { networkService } from "../services/networkService";
import { usePrefs } from "../prefs";
import { useRealtime } from "../realtime";

export function useNetworkStatus() {
  const { pollIntervalMs } = usePrefs();
  const { network, transport } = useRealtime();
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
    networkService.ingest(network);
    void applyFromService();
  }, [network, applyFromService]);

  useEffect(() => {
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
  }, [refresh, pollIntervalMs, transport]);

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
