import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useAnalytics } from "../hooks/useAnalytics";
import { TradingWaveChart, type TradingDataPoint } from "../components/charts/TradingWaveChart";
import { CircularMeter } from "../components/ui/CircularMeter";
import { SignalStrength } from "../components/ui/SignalStrength";
import { PageHeader } from "../components/ui/PageHeader";
import { dash } from "../lib/format";
import { convertFromMbps, formatSpeed, resolveSpeedUnit, speedParts, usePrefs } from "../prefs";
import { OriginBanner } from "../components/ui/OriginBanner";
import { shouldMeasureInBrowser } from "../lib/hostMode";
import { useVisitorTelemetry } from "../visitorTelemetry";

export const DashboardPage: React.FC = () => {
  const { status, metrics, error } = useNetworkStatus();
  const { history } = useAnalytics();
  const { speedUnit } = usePrefs();
  const visitor = useVisitorTelemetry();
  const browserOrigin = shouldMeasureInBrowser(visitor.capability);
  const [graphMetric, setGraphMetric] = useState<"throughput" | "latency" | "jitter" | "signal">("throughput");
  const navigate = useNavigate();

  // Continuous real-time ring buffers for live spline waves
  const [liveLatencySamples, setLiveLatencySamples] = useState<number[]>([]);
  const [liveJitterSamples, setLiveJitterSamples] = useState<number[]>([]);
  const [liveThroughputSamples, setLiveThroughputSamples] = useState<number[]>([]);
  const [liveSignalSamples, setLiveSignalSamples] = useState<number[]>([]);

  useEffect(() => {
    if (browserOrigin) {
      setLiveLatencySamples(visitor.pingSamples);
      setLiveJitterSamples(visitor.jitterSamples);
      setLiveThroughputSamples(visitor.throughputSamples);
      return;
    }
    let cancelled = false;
    const pollRealMetric = async () => {
      try {
        let measuredPing: number | null = null;
        let measuredJitter: number | null = null;

        try {
          const { api } = await import("../api");
          const pingRes = await api<{ pingMs?: number | null; jitterMs?: number | null }>("/api/ping?host=1.1.1.1&port=443&method=tcp");
          measuredPing = pingRes.pingMs ?? null;
          measuredJitter = pingRes.jitterMs ?? null;
        } catch {
          const { measureBrowserPing } = await import("../lib/clientNetwork");
          measuredPing = await measureBrowserPing();
        }

        if (cancelled) return;

        if (measuredPing != null && measuredPing > 0) {
          setLiveLatencySamples((prev) => {
            const next = [...prev.slice(-19), measuredPing!];
            if (measuredJitter == null && next.length >= 2) {
              const mean = next.reduce((a, b) => a + b, 0) / next.length;
              const variance = next.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (next.length - 1);
              measuredJitter = Math.round(Math.sqrt(variance) * 10) / 10;
            }
            return next;
          });
        }

        if (measuredJitter != null) {
          setLiveJitterSamples((prev) => [...prev.slice(-19), measuredJitter!]);
        }

        const currentDown = metrics?.download?.value ?? history[0]?.downloadMbps ?? null;
        if (currentDown != null && currentDown > 0) {
          setLiveThroughputSamples((prev) => [...prev.slice(-19), currentDown]);
        }

        const sig = status?.signalPercent ?? null;
        if (sig != null) {
          setLiveSignalSamples((prev) => [...prev.slice(-19), sig]);
        }
      } catch {
        /* keep last sample */
      }
    };

    void pollRealMetric();
    const timer = setInterval(() => void pollRealMetric(), 1200);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [browserOrigin, visitor.pingSamples, visitor.jitterSamples, visitor.throughputSamples, metrics?.download?.value, history, status?.signalPercent]);

  const isConnected = status?.state === "Connected" || Boolean(status?.publicIp);
  const downParts = speedParts(metrics?.download?.value ?? history[0]?.downloadMbps ?? 0, speedUnit);
  const upParts = speedParts(metrics?.upload?.value ?? history[0]?.uploadMbps ?? 0, speedUnit);

  const graphUnit =
    graphMetric === "throughput"
      ? resolveSpeedUnit(history[0]?.downloadMbps ?? metrics?.download?.value ?? 0, speedUnit)
      : graphMetric === "signal"
        ? "%"
        : "ms";

  const getTradingGraphData = (): TradingDataPoint[] => {
    if (graphMetric === "throughput") {
      const resolved = resolveSpeedUnit(metrics?.download?.value ?? 75, speedUnit);
      return liveThroughputSamples.map((val, idx) => ({
        label: `${idx + 1}`,
        value: convertFromMbps(val, resolved),
        volume: Math.round(val * 8),
      }));
    }

    if (graphMetric === "signal") {
      return liveSignalSamples.map((val, idx) => ({
        label: `${idx + 1}`,
        value: val,
        volume: Math.round(val * 1.5),
      }));
    }

    if (graphMetric === "jitter") {
      return liveJitterSamples.map((val, idx) => ({
        label: `${idx + 1}`,
        value: val,
        volume: Math.round(val * 40),
      }));
    }

    // Default: Latency
    return liveLatencySamples.map((val, idx) => ({
      label: `${idx + 1}`,
      value: val,
      volume: Math.round(val * 10),
    }));
  };

  const currentHealth = status?.healthScore ?? visitor.healthScore;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title={isConnected ? "Network Telemetry Matrix Active" : "Waiting for WAN Connection..."}
        description={
          status?.ssid
            ? `Connected to ${status.ssid} · ${status.mediaType ?? "Wi-Fi"}${status.linkSpeedMbps != null ? ` · ${formatSpeed(status.linkSpeedMbps, speedUnit)} PHY Link` : ""}`
            : "Real-time continuous 1.0s telemetry stream: Bandwidth wave vectors, latency jitter, RF signal, and edge routing."
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/speedtest")}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-all"
            >
              🚀 Run Speed Test
            </button>
            <button
              onClick={() => navigate("/gaming")}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
            >
              🎮 Gaming Matrix
            </button>
          </div>
        }
      />

      <OriginBanner surface="wan" />
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 font-mono">{error}</p> : null}

      {/* Live Interface Telemetry Hero Card */}
      <div className="dashboard-card p-5 bg-white">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Interface Media</p>
            <p className="mt-1 truncate text-sm font-bold text-slate-900">{dash(status?.mediaType)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SSID / Network</p>
            <p className="mt-1 truncate text-sm font-bold text-blue-600">{dash(status?.ssid, browserOrigin ? "Visitor WAN" : "—")}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Status</p>
            <div className="mt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-700 border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {isConnected ? "Live Connected" : "Connecting..."}
              </span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Public IP</p>
            <p className="mt-1 truncate font-mono text-xs font-bold text-slate-900">{dash(status?.publicIp, "Detecting...")}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Signal Strength</p>
            <div className="mt-1">
              {status?.signalDbm != null ? (
                <div className="flex items-center gap-1.5">
                  <SignalStrength dbm={status.signalDbm} size="sm" />
                  <span className="font-mono text-xs text-emerald-700 font-bold">{status.signalPercent ?? 90}%</span>
                </div>
              ) : (
                <span className="font-mono text-xs text-slate-500 font-bold">{browserOrigin ? "Browser session" : "—"}</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PHY Link Capacity</p>
            <p className="mt-1 text-sm font-bold text-slate-900 font-mono">
              {status?.linkSpeedMbps != null ? formatSpeed(status.linkSpeedMbps, speedUnit) : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* 6 Core Metric Ticker Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div
          onClick={() => navigate("/speedtest")}
          className="cursor-pointer dashboard-card p-4 hover:border-blue-300 hover:shadow-sm"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Download Cap</span>
          <span className="mt-1 font-mono text-xl font-black text-blue-600 block">{downParts.value}</span>
          <span className="text-[10px] font-mono text-slate-500 uppercase">{downParts.unit}</span>
        </div>

        <div
          onClick={() => navigate("/speedtest")}
          className="cursor-pointer dashboard-card p-4 hover:border-purple-300 hover:shadow-sm"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Upload Cap</span>
          <span className="mt-1 font-mono text-xl font-black text-purple-600 block">{upParts.value}</span>
          <span className="text-[10px] font-mono text-slate-500 uppercase">{upParts.unit}</span>
        </div>

        <div
          onClick={() => navigate("/ping")}
          className="cursor-pointer dashboard-card p-4 hover:border-emerald-300 hover:shadow-sm"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Live Ping</span>
          <span className="mt-1 font-mono text-xl font-black text-emerald-600 block">
            {liveLatencySamples[liveLatencySamples.length - 1] ?? "—"}
          </span>
          <span className="text-[10px] font-mono text-slate-500">ms (this browser)</span>
        </div>

        <div
          onClick={() => navigate("/ping")}
          className="cursor-pointer dashboard-card p-4 hover:border-blue-300 hover:shadow-sm"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Live Jitter</span>
          <span className="mt-1 font-mono text-xl font-black text-blue-600 block">
            {liveJitterSamples[liveJitterSamples.length - 1] ?? "—"}
          </span>
          <span className="text-[10px] font-mono text-slate-500">ms variance</span>
        </div>

        <div
          onClick={() => navigate("/ping")}
          className="cursor-pointer dashboard-card p-4 hover:border-emerald-300 hover:shadow-sm"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Packet Loss</span>
          <span className="mt-1 font-mono text-xl font-black text-emerald-600 block">
            {metrics?.packetLoss?.value != null ? `${metrics.packetLoss.value}%` : "—"}
          </span>
          <span className="text-[10px] font-mono text-slate-500">HTTPS probe loss</span>
        </div>

        <div
          onClick={() => navigate("/ping")}
          className="cursor-pointer dashboard-card p-4 hover:border-indigo-300 hover:shadow-sm"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">DNS Latency</span>
          <span className="mt-1 font-mono text-xl font-black text-indigo-600 block">{dash(metrics?.dnsLatency?.value)}</span>
          <span className="text-[10px] font-mono text-slate-500">ms (Port 53)</span>
        </div>
      </div>

      {/* Main Wave Telemetry Chart & Health Score Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Metric Selector Tabs */}
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Active Real-Time Telemetry Wave</span>
            <div className="flex rounded-xl bg-slate-100 p-1 text-[11px]">
              {(["throughput", "latency", "jitter", "signal"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setGraphMetric(m)}
                  className={`rounded-lg px-2.5 py-1 font-bold capitalize transition-all ${
                    graphMetric === m
                      ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <TradingWaveChart
            data={getTradingGraphData()}
            title={`Live ${graphMetric.toUpperCase()} Oscillating Stream`}
            subtitle={browserOrigin
              ? "1200ms samples timed from this visitor browser to Cloudflare"
              : "1200ms samples measured from this Windows host"}
            unit={graphUnit}
            height={260}
            colorScheme={graphMetric === "throughput" ? "blue" : graphMetric === "signal" ? "emerald" : "purple"}
            showVolume={true}
            showDeltaBadge={true}
          />
        </div>

        {/* Circular Health Meter */}
        <div className="flex flex-col justify-between dashboard-card p-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Network Health Index</h3>
            <p className="text-[11px] text-slate-500 mb-3">Holistic score computed from loss, jitter, latency, and throughput buffer</p>
          </div>

          <div className="flex justify-center my-2">
            <CircularMeter
              value={currentHealth ?? 0}
              max={100}
              label="Composite Health"
              unit="PTS"
              size={170}
              strokeWidth={12}
              colorScheme="emerald"
              delta={1.2}
              sublabel={status?.healthLabel ? `Tier: ${status.healthLabel}` : "Waiting for samples"}
              icon="🛡️"
            />
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Throughput Buffer</span>
              <strong className="text-emerald-600 font-mono">
                {metrics?.download?.value != null ? `${Math.min(100, Math.round((metrics.download.value / 200) * 100))}/100` : "—"}
              </strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>RTT Stability</span>
              <strong className="text-emerald-600 font-mono">
                {liveLatencySamples.length ? `${Math.max(0, 100 - Math.round(liveLatencySamples[liveLatencySamples.length - 1] ?? 0))}/100` : "—"}
              </strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Packet Integrity</span>
              <strong className="text-emerald-600 font-mono">
                {metrics?.packetLoss?.value != null ? `${Math.max(0, 100 - Math.round(metrics.packetLoss.value * 20))}/100` : "—"}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
