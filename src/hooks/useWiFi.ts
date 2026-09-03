import { useState, useEffect, useCallback } from "react";
import type { WifiInfo, NearbyWifiNetwork, ChannelAnalysis } from "../types";
import { wifiService } from "../services/wifiService";
import { useRealtime } from "../realtime";

export function useWiFi() {
  const { wifi, transport } = useRealtime();
  const [currentWifi, setCurrentWifi] = useState<WifiInfo | null>(null);
  const [nearbyNetworks, setNearbyNetworks] = useState<NearbyWifiNetwork[]>([]);
  const [channels24, setChannels24] = useState<ChannelAnalysis[]>([]);
  const [channels5G, setChannels5G] = useState<ChannelAnalysis[]>([]);
  const [recommended24, setRecommended24] = useState<number | null>(null);
  const [recommended5, setRecommended5] = useState<number | null>(null);
  const [connectedChannel, setConnectedChannel] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<string | null>(null);

  const loadScanSurfaces = useCallback(async () => {
    try {
      const [nearby, ch24, ch5] = await Promise.all([
        wifiService.getNearbyNetworks(),
        wifiService.getChannelAnalysis("2.4 GHz"),
        wifiService.getChannelAnalysis("5 GHz"),
      ]);
      setNearbyNetworks(nearby);
      setChannels24(ch24.items);
      setChannels5G(ch5.items);
      setRecommended24(ch24.recommendedChannel);
      setRecommended5(ch5.recommendedChannel);
      setConnectedChannel(ch24.connectedChannel ?? ch5.connectedChannel ?? null);
      setReason(ch24.reason ?? ch5.reason ?? null);
    } catch (err) {
      setReason(err instanceof Error ? err.message : "Wi-Fi collector unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const mapped = wifiService.mapAssociated(wifi);
    if (mapped) {
      setCurrentWifi(mapped);
      setConnectedChannel((prev) => mapped.channel ?? prev);
      setReason(mapped.reason ?? null);
      setLoading(false);
    }
  }, [wifi]);

  useEffect(() => {
    void loadScanSurfaces();
  }, [loadScanSurfaces]);

  useEffect(() => {
    if (transport === "LIVE") return;
    const associated = setInterval(() => {
      void wifiService.pollAssociated().then((curr) => {
        if (curr) setCurrentWifi(curr);
      });
    }, 1000);
    return () => clearInterval(associated);
  }, [transport]);

  const rescan = async () => {
    setIsScanning(true);
    try {
      const updated = await wifiService.scanNetworks();
      setNearbyNetworks(updated);
      await loadScanSurfaces();
    } finally {
      setIsScanning(false);
    }
  };

  return {
    currentWifi,
    nearbyNetworks,
    channels24,
    channels5G,
    recommended24,
    recommended5,
    connectedChannel,
    isScanning,
    loading,
    reason,
    rescan,
  };
}
