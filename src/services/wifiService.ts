import type { WifiInfo, NearbyWifiNetwork, ChannelAnalysis } from "../types";
import { api } from "../api";
import { bandFromChannel, percentToDbm } from "../lib/format";
import type { LiveWifiPayload } from "../realtime";

type EnvResponse = {
  freshness?: string;
  reason?: string | null;
  item?: {
    connectedSsid?: string | null;
    connectedBssid?: string | null;
    signalPercent?: number | null;
    connectedChannel?: number | null;
    radioType?: string | null;
    gateway?: string | null;
    localIp?: string | null;
  } | null;
  items?: Array<{
    ssid?: string | null;
    bssid?: string | null;
    signalPercent?: number | null;
    channel?: number | null;
    band?: string | null;
    securityMode?: string | null;
    radioType?: string | null;
    vendor?: string | null;
    connected?: boolean;
  }>;
};

function mapNearby(obs: NonNullable<EnvResponse["items"]>[number], currentSsid?: string | null): NearbyWifiNetwork {
  const percent = obs.signalPercent ?? null;
  return {
    ssid: obs.ssid ?? "Hidden",
    bssid: obs.bssid ?? null,
    signalDbm: percentToDbm(percent),
    signalPercent: percent,
    channel: obs.channel ?? null,
    band: bandFromChannel(obs.channel, obs.radioType, obs.band),
    channelWidthMhz: null,
    security: obs.securityMode ?? null,
    vendor: obs.vendor ?? null,
    isCurrentNetwork: Boolean(obs.connected || (obs.ssid && currentSsid && obs.ssid === currentSsid)),
    snr: null,
  };
}

class WifiService {
  async getEnvironment(): Promise<EnvResponse> {
    return api<EnvResponse>("/api/wifi/environment");
  }

  async getCurrentNetwork(): Promise<WifiInfo | null> {
    const res = await this.getEnvironment();
    const item = res.item;
    if (!item?.connectedSsid && !item?.connectedBssid) {
      return null;
    }
    const percent = item.signalPercent ?? null;
    const channel = item.connectedChannel ?? null;
    return {
      ssid: item.connectedSsid ?? null,
      bssid: item.connectedBssid ?? null,
      signalDbm: percentToDbm(percent),
      signalPercent: percent,
      frequencyGhz: channel != null && channel <= 14 ? 2.4 : channel != null ? 5 : null,
      band: bandFromChannel(channel, item.radioType, null),
      channel,
      channelWidthMhz: null,
      linkSpeedMbps: null,
      security: null,
      phyType: item.radioType ?? null,
      noiseDbm: null,
      snrDb: null,
      channelUtilizationPercent: null,
      beaconIntervalMs: null,
      txPowerDbm: null,
      gateway: item.gateway ?? null,
      localIp: item.localIp ?? null,
      freshness: res.freshness,
      reason: res.reason,
    };
  }

  async getNearbyNetworks(): Promise<NearbyWifiNetwork[]> {
    const res = await this.getEnvironment();
    return (res.items ?? []).map((obs) => mapNearby(obs, res.item?.connectedSsid));
  }

  async getChannelAnalysis(band: "2.4 GHz" | "5 GHz"): Promise<{ items: ChannelAnalysis[]; recommendedChannel: number | null; connectedChannel: number | null; reason?: string | null }> {
    const res = await api<{ items: ChannelAnalysis[]; recommendedChannel?: number | null; connectedChannel?: number | null; reason?: string | null }>(
      `/api/wifi/channels?band=${encodeURIComponent(band)}`,
    );
    return {
      items: res.items ?? [],
      recommendedChannel: res.recommendedChannel ?? null,
      connectedChannel: res.connectedChannel ?? null,
      reason: res.reason,
    };
  }

  async scanNetworks(): Promise<NearbyWifiNetwork[]> {
    await api("/api/wifi/scan", { method: "POST" });
    return this.getNearbyNetworks();
  }

  mapAssociated(payload: LiveWifiPayload | null | undefined): WifiInfo | null {
    const connected = payload?.connected;
    if (!connected?.ssid && !connected?.bssid) return null;
    const percent = connected.signalPercent ?? null;
    const channel = connected.channel ?? null;
    return {
      ssid: connected.ssid ?? null,
      bssid: connected.bssid ?? null,
      signalDbm: connected.signalDbm ?? percentToDbm(percent),
      signalPercent: percent,
      frequencyGhz: channel != null && channel <= 14 ? 2.4 : channel != null ? 5 : null,
      band: bandFromChannel(channel, connected.radioType, null),
      channel,
      channelWidthMhz: null,
      linkSpeedMbps: connected.rxMbps ?? connected.txMbps ?? null,
      security: null,
      phyType: connected.radioType ?? null,
      noiseDbm: null,
      snrDb: null,
      channelUtilizationPercent: null,
      beaconIntervalMs: null,
      txPowerDbm: null,
      gateway: connected.gateway ?? null,
      localIp: connected.localIp ?? null,
      freshness: payload?.freshness,
      reason: payload?.reason,
    };
  }

  async pollAssociated(): Promise<WifiInfo | null> {
    try {
      const res = await api<{ connected?: { ssid?: string; bssid?: string; signalPercent?: number; channel?: number; radioType?: string; rxMbps?: number }; gateway?: string; localIp?: string; freshness?: string; reason?: string }>(
        "/api/network/live",
      );
      const status = (res as { status?: { ssid?: string; bssid?: string; signalPercent?: number; channel?: number; radioType?: string; linkSpeedMbps?: number; gateway?: string; ipAddress?: string } }).status;
      if (!status?.ssid && !status?.bssid) return this.getCurrentNetwork();
      return {
        ssid: status.ssid ?? null,
        bssid: status.bssid ?? null,
        signalDbm: percentToDbm(status.signalPercent ?? null),
        signalPercent: status.signalPercent ?? null,
        frequencyGhz: status.channel != null && status.channel <= 14 ? 2.4 : status.channel != null ? 5 : null,
        band: bandFromChannel(status.channel, status.radioType, null),
        channel: status.channel ?? null,
        channelWidthMhz: null,
        linkSpeedMbps: status.linkSpeedMbps ?? null,
        security: null,
        phyType: status.radioType ?? null,
        noiseDbm: null,
        snrDb: null,
        channelUtilizationPercent: null,
        beaconIntervalMs: null,
        txPowerDbm: null,
        gateway: status.gateway ?? null,
        localIp: (status as { ipAddress?: string }).ipAddress ?? null,
        freshness: (res as { freshness?: string }).freshness,
        reason: (res as { reason?: string }).reason,
      };
    } catch {
      return this.getCurrentNetwork();
    }
  }
}

export const wifiService = new WifiService();
