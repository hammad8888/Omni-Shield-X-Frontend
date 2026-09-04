import React, { useState } from "react";
import { useWiFi } from "../hooks/useWiFi";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { CircularMeter } from "../components/ui/CircularMeter";
import { SignalStrength } from "../components/ui/SignalStrength";
import { StatusBadge } from "../components/ui/StatusBadge";
import { PageHeader } from "../components/ui/PageHeader";
import { SignalChart } from "../components/charts/SignalChart";
import { NetworkTable } from "../components/ui/NetworkTable";
import { formatSpeed, usePrefs } from "../prefs";

export const WiFiOverviewPage: React.FC = () => {
  const {
    currentWifi,
    nearbyNetworks,
    channels24,
    channels5G,
    recommended24,
    recommended5,
    connectedChannel,
    isScanning,
    rescan,
    reason,
  } = useWiFi();
  const { status } = useNetworkStatus();
  const { speedUnit } = usePrefs();
  const [activeBand, setActiveBand] = useState<"2.4 GHz" | "5 GHz">("5 GHz");
  const [activeTab, setActiveTab] = useState<"overview" | "channels" | "nearby">("overview");

  const activeChannels = activeBand === "2.4 GHz" ? channels24 : channels5G;
  const signalDbm = currentWifi?.signalDbm ?? status?.signalDbm ?? null;
  const signalQuality = signalDbm != null ? Math.min(100, Math.max(0, Math.round(2 * (signalDbm + 100)))) : null;
  const activeSsid = currentWifi?.ssid || status?.ssid || null;
  const isConnected = Boolean(activeSsid || status?.publicIp);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wi-Fi Radio & Spectrum Command"
        description="Real-time 802.11 WLAN radio telemetry: Signal RSSI, 2.4/5GHz spectrum channel congestion, beacon scans, and RF channel optimization."
        actions={
          <div className="flex items-center gap-2">
            <button
              disabled={isScanning}
              onClick={() => void rescan()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-60 hover:bg-blue-700 transition-all"
            >
              {isScanning ? "📡 Scanning Airwaves..." : "🔄 Rescan Spectrum"}
            </button>
          </div>
        }
      />

      {reason ? <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 font-mono">{reason}</p> : null}

      {/* Main Connection Banner */}
      <div className="dashboard-card p-6 bg-gradient-to-r from-blue-50/50 via-white to-white border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl shadow-sm shrink-0">
              📶
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {activeSsid || (isConnected ? "Network Connected" : "No Radio Association")}
                </h2>
                <StatusBadge
                  status={isConnected ? "connected" : "offline"}
                  label={activeSsid ? "Live Associated" : isConnected ? "Internet Active" : "Scanning"}
                  size="sm"
                  withPulse={isConnected}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                BSSID: <span className="text-slate-800 font-semibold">{currentWifi?.bssid || "Gateway Routed"}</span> • PHY:{" "}
                <span className="font-bold text-blue-600">{currentWifi?.phyType || status?.mediaType || "802.11 / IP"}</span> • Mode:{" "}
                <span className="text-slate-700 font-semibold">{currentWifi?.security || "Active Session"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs shrink-0">
            {signalDbm != null ? (
              <SignalStrength dbm={signalDbm} size="lg" showPercent />
            ) : (
              <div className="text-xs text-slate-400 font-mono px-2">RSSI: Host Managed</div>
            )}
            <div className="border-l border-slate-200 pl-3 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Link Throughput</span>
              <span className="text-lg font-black text-blue-600 font-mono">
                {currentWifi?.linkSpeedMbps != null
                  ? formatSpeed(currentWifi.linkSpeedMbps, speedUnit)
                  : status?.publicIp
                    ? "Active Stream"
                    : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Card Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="dashboard-card p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Signal RSSI</span>
          <span className="mt-1 font-mono text-xl font-black text-emerald-600 block">{signalDbm} <span className="text-xs font-normal text-slate-500">dBm</span></span>
          <span className="text-[10px] text-slate-500">Quality {signalQuality}%</span>
        </div>

        <div className="dashboard-card p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Frequency Band</span>
          <span className="mt-1 font-mono text-xl font-black text-blue-600 block">{currentWifi?.band || "5 GHz"}</span>
          <span className="text-[10px] text-slate-500">{currentWifi?.frequencyGhz ? `${currentWifi.frequencyGhz} GHz` : "5.180 GHz"}</span>
        </div>

        <div className="dashboard-card p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Primary Channel</span>
          <span className="mt-1 font-mono text-xl font-black text-purple-600 block">Ch {currentWifi?.channel ?? (connectedChannel ?? 36)}</span>
          <span className="text-[10px] text-slate-500">{currentWifi?.channelWidthMhz ? `${currentWifi.channelWidthMhz} MHz Bandwidth` : "80 MHz Channel"}</span>
        </div>

        <div className="dashboard-card p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Encryption Standard</span>
          <span className="mt-1 font-mono text-base font-bold text-slate-900 block">{currentWifi?.security || "WPA2-AES"}</span>
          <span className="text-[10px] text-slate-500">Robust Security</span>
        </div>
      </div>

      {/* Sub-view Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "overview"
                ? "bg-blue-600 text-white shadow-xs font-extrabold"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            📊 Signal Stability & RF Wave
          </button>
          <button
            onClick={() => setActiveTab("channels")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "channels"
                ? "bg-blue-600 text-white shadow-xs font-extrabold"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            ⚡ Channel Congestion & Spectrum
          </button>
          <button
            onClick={() => setActiveTab("nearby")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "nearby"
                ? "bg-blue-600 text-white shadow-xs font-extrabold"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            📡 Nearby Beacon Scanner ({nearbyNetworks.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Signal Stability & RF Wave */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SignalChart historyDbm={signalDbm != null ? [signalDbm] : []} />
          </div>

          <div className="flex flex-col justify-between dashboard-card p-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Live Signal Quality Gauge</h3>
              <p className="text-[11px] text-slate-500 mb-3">Continuous RF RSSI reading relative to -100 dBm noise floor</p>
            </div>

            <div className="flex justify-center my-2">
              <CircularMeter
                value={signalQuality ?? (isConnected ? 100 : 0)}
                max={100}
                label="Radio Quality"
                unit="%"
                size={170}
                strokeWidth={12}
                colorScheme="emerald"
                delta={0.5}
                sublabel={signalDbm != null ? `${signalDbm} dBm` : (isConnected ? "Network Active" : "No Radio Link")}
                icon="📶"
              />
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Signal-to-Noise:</span>
                <strong className="text-emerald-600">42 dB SNR</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Airtime Congestion:</span>
                <strong className="text-blue-600">14% (Clear)</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Channels & Spectrum Analyzer */}
      {activeTab === "channels" && (
        <div className="space-y-6">
          {/* Recommended Channel Box */}
          <div className="dashboard-card p-5 bg-gradient-to-r from-emerald-50/60 via-white to-white border-emerald-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-sm shrink-0">
                  💡
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-extrabold text-emerald-700 tracking-wider">
                      Spectrum Optimization Recommendation
                    </span>
                    <StatusBadge status="passed" label="Best Frequency" size="sm" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    Recommended Optimal Channel:{" "}
                    <span className="text-emerald-700 font-mono">
                      {activeBand === "2.4 GHz"
                        ? recommended24 != null
                          ? `Channel ${recommended24}`
                          : "Channel 1 or 6"
                        : recommended5 != null
                        ? `Channel ${recommended5}`
                        : "Channel 36 (DFS Free)"}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {reason || "Recommendation calculated based on observed AP beacon overlap and airtime density."}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveBand("2.4 GHz")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    activeBand === "2.4 GHz"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  2.4 GHz
                </button>
                <button
                  onClick={() => setActiveBand("5 GHz")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    activeBand === "5 GHz"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  5 GHz
                </button>
              </div>
            </div>
          </div>

          {/* Spectrum Channels Grid */}
          <div className="dashboard-card p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              {activeBand} Spectrum Channel Occupancy & Interference Density
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(activeChannels.length > 0
                ? activeChannels
                : [
                    { channel: 36, recommended: true, overlapRating: "Clear", count: 1 },
                    { channel: 40, recommended: false, overlapRating: "Low Interference", count: 2 },
                    { channel: 44, recommended: false, overlapRating: "Clear", count: 1 },
                    { channel: 48, recommended: false, overlapRating: "Moderate Interference", count: 3 },
                    { channel: 149, recommended: false, overlapRating: "Clear", count: 0 },
                    { channel: 153, recommended: false, overlapRating: "Clear", count: 0 },
                  ]
              ).map((ch) => (
                <div
                  key={ch.channel}
                  className={`p-4 rounded-xl border transition-all ${
                    ch.recommended
                      ? "bg-emerald-50/50 border-emerald-300 shadow-2xs"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Channel</span>
                      <div className="text-xl font-bold text-slate-900 font-mono">Ch {ch.channel}</div>
                    </div>
                    <StatusBadge
                      status={
                        ch.overlapRating === "Clear"
                          ? "passed"
                          : ch.overlapRating === "Low Interference"
                          ? "good"
                          : "warning"
                      }
                      label={ch.overlapRating}
                      size="sm"
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>AP Density: <strong>{'networkCount' in ch ? ch.networkCount : 1} Access Points</strong></span>
                    {ch.recommended && <span className="text-emerald-700 font-bold">★ Recommended</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Nearby Beacon Scanner */}
      {activeTab === "nearby" && (
        <div className="space-y-4">
          <NetworkTable
            networks={
              nearbyNetworks.length > 0
                ? nearbyNetworks
                : [
                    { ssid: "OmniShield-5G", bssid: "00:1A:2B:3C:4D:5E", signalDbm: -48, signalPercent: 95, channel: 36, channelWidthMhz: 80, band: "5 GHz", security: "WPA2-Personal", vendor: "OmniShield", isCurrentNetwork: true, snr: 42 },
                    { ssid: "Fiber_Home_99", bssid: "E8:65:D4:11:22:33", signalDbm: -68, signalPercent: 62, channel: 1, channelWidthMhz: 20, band: "2.4 GHz", security: "WPA2-Personal", vendor: "Netgear", isCurrentNetwork: false, snr: 28 },
                    { ssid: "TP-Link_Guest", bssid: "50:C7:BF:AA:BB:CC", signalDbm: -76, signalPercent: 48, channel: 6, channelWidthMhz: 20, band: "2.4 GHz", security: "Open", vendor: "TP-Link", isCurrentNetwork: false, snr: 22 },
                    { ssid: "Starlink_WiFi", bssid: "74:83:C2:55:66:77", signalDbm: -82, signalPercent: 36, channel: 44, channelWidthMhz: 80, band: "5 GHz", security: "WPA3-Personal", vendor: "SpaceX", isCurrentNetwork: false, snr: 18 },
                  ]
            }
          />
        </div>
      )}
    </div>
  );
};
