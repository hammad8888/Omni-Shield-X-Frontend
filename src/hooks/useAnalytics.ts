import { useState, useEffect, useCallback } from "react";
import type { HistoryEntry, NetworkEventItem } from "../types";
import { analyticsService } from "../services/analyticsService";

export function useAnalytics() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [events, setEvents] = useState<NetworkEventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [h, e] = await Promise.all([
        analyticsService.getTestHistory(),
        analyticsService.getEvents(),
      ]);
      setHistory(h);
      setEvents(e);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const clearHistory = async () => {
    await analyticsService.clearHistory();
    setHistory([]);
  };

  return {
    history,
    events,
    loading,
    refresh,
    clearHistory,
  };
}
