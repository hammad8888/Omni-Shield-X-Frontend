import React, { useState, useEffect } from "react";
import { TradingWaveChart, type TradingDataPoint } from "../components/charts/TradingWaveChart";
import { StatusBadge } from "../components/ui/StatusBadge";
import { PageHeader } from "../components/ui/PageHeader";
import { api } from "../api";
import { OriginBanner } from "../components/ui/OriginBanner";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { dash } from "../lib/format";
import { measureBrowserPingToHost } from "../lib/clientNetwork";
import { shouldMeasureInBrowser } from "../lib/hostMode";
import { dnsService } from "../services/dnsService";
import { useVisitorTelemetry } from "../visitorTelemetry";
import type { DnsBenchmarkResult } from "../types";

export const PingTestPage: React.FC = () => {
  const { status } = useNetworkStatus();
  const visitor = useVisitorTelemetry();
  const browserOrigin = shouldMeasureInBrowser(visitor.capability);
  const [targetHost, setTargetHost] = useState("1.1.1.1");
  const [method, setMethod] = useState<"tcp" | "icmp">("tcp");
  const [isPinging, setIsPinging] = useState(true);
  const [pingHistory, setPingHistory] = useState<number[]>([]);
  const [jitterHistory, setJitterHistory] = useState<number[]>([]);
  const [loss, setLoss] = useState<number | null>(0);
  const [reason, setReason] = useState<string | null>(null);

  // DNS Benchmarks state
  const [benchmarks, setBenchmarks] = useState<DnsBenchmarkResult[]>([]);
  const [isTestingDns, setIsTestingDns] = useState(false);

  useEffect(() => {
    void loadDns();
  }, []);

  const loadDns = async () => {
    setIsTestingDns(true);
    try {
      setBenchmarks(await dnsService.runBenchmark());
    } finally {
      setIsTestingDns(false);
    }
  };

  useEffect(() => {
    if (!isPinging) return;
    let cancelled = false;
    const tick = async () => {
      const host = targetHost === "gateway" ? status?.gateway || "1.1.1.1" : targetHost;
      try {
        let measuredPing: number | null = null;
        let measuredJitter: number | null = null;
        let measuredLoss: number | null = 0;

        if (browserOrigin) {
          measuredPing = await measureBrowserPingToHost(host);
          measuredLoss = measuredPing != null ? 0 : 100;
          if (method === "icmp") {
            setReason("ICMP is not available in the browser. This stream uses HTTPS RTT from your device.");
          }
        } else {
          try {
            const query =
              method === "icmp"
                ? `/api/ping?host=${encodeURIComponent(host)}&method=icmp`
                : `/api/ping?host=${encodeURIComponent(host)}&port=443&method=tcp`;
            const res = await api<{
              pingMs?: number | null;
              jitterMs?: number | null;
              packetLossPct?: number | null;
              reason?: string;
              freshness?: string;
            }>(query);
            measuredPing = res.pingMs ?? null;
            measuredJitter = res.jitterMs ?? null;
            measuredLoss = res.packetLossPct ?? 0;
            if (res.reason) setReason(res.reason);
          } catch {
            measuredPing = await measureBrowserPingToHost(host);
            measuredLoss = measuredPing != null ? 0 : 100;
          }
        }

        if (cancelled) return;

        setLoss(measuredLoss);
        if (measuredPing != null && measuredPing > 0) {
          setReason(null);
          setPingHistory((prev) => {
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
          setJitterHistory((prev) => [...prev.slice(-19), measuredJitter!]);
        }
      } catch (err) {
        if (!cancelled) setReason(err instanceof Error ? err.message : "Ping collector unavailable");
      }
    };
    void tick();
    const interval = setInterval(() => void tick(), 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isPinging, targetHost, method, status?.gateway, browserOrigin]);

  const currentPing = pingHistory.length ? pingHistory[pingHistory.length - 1] : null;
  const currentJitter = jitterHistory.length ? jitterHistory[jitterHistory.length - 1] : null;
  const minPing = pingHistory.length ? Math.min(...pingHistory) : null;
  const maxPing = pingHistory.length ? Math.max(...pingHistory) : null;
  const avgPing = pingHistory.length
    ? Number((pingHistory.reduce((a, b) => a + b, 0) / pingHistory.length).toFixed(1))
    : null;

  const chartData: TradingDataPoint[] = pingHistory.map((val, idx) => ({
    label: `${idx + 1}`,
    value: val,
    volume: Math.round(val * 8 + (jitterHistory[idx] || 1) * 12),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ping & DNS Diagnostic Telemetry"
        description="Continuous 1000ms round-trip latency stream with live momentum vectors, ICMP echo / TCP :443 timing, and global DNS resolver benchmark."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={method}
              onChange={(e) => {
                setPingHistory([]);
                setJitterHistory([]);
                setMethod(e.target.value as "tcp" | "icmp");
              }}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none shadow-2xs"
            >
              <option value="tcp">TCP :443 Mode</option>
              <option value="icmp">ICMP Echo Mode</option>
            </select>
            <select
              value={targetHost}
              onChange={(e) => {
                setPingHistory([]);
                setJitterHistory([]);
                setTargetHost(e.target.value);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none shadow-2xs"
            >
              <option value="1.1.1.1">Cloudflare (1.1.1.1)</option>
              <option value="8.8.8.8">Google (8.8.8.8)</option>
              <option value="9.9.9.9">Quad9 (9.9.9.9)</option>
              <option value="208.67.222.222">OpenDNS</option>
              {status?.gateway ? <option value="gateway">Local Gateway ({status.gateway})</option> : null}
            </select>
            <button
              onClick={() => setIsPinging(!isPinging)}
              className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition-all ${
                isPinging ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isPinging ? "⏸ Pause Stream" : "▶ Resume Stream"}
            </button>
          </div>
        }
      />

      <OriginBanner surface="wan" />
      {reason ? <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 font-mono">{reason}</p> : null}

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="dashboard-card p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Current Ping</span>
          <span className="mt-1 font-mono text-2xl font-black text-emerald-600 block">
            {currentPing != null ? `${currentPing} ` : "— "}
            <span className="text-xs font-normal text-slate-500">ms</span>
          </span>
          <span className="text-[10px] text-emerald-700 font-bold">
            {currentPing != null ? (currentPing < 30 ? "★ Optimal Latency" : "Live Stream") : "Sampling..."}
          </span>
        </div>

        <div className="dashboard-card p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Average RTT</span>
          <span className="mt-1 font-mono text-2xl font-black text-blue-600 block">
            {avgPing != null ? `${avgPing} ` : "— "}
            <span className="text-xs font-normal text-slate-500">ms</span>
          </span>
          <span className="text-[10px] text-slate-500">
            Min: {minPing != null ? `${minPing}ms` : "—"} • Max: {maxPing != null ? `${maxPing}ms` : "—"}
          </span>
        </div>

        <div className="dashboard-card p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Jitter Variance</span>
          <span className="mt-1 font-mono text-2xl font-black text-purple-600 block">
            {currentJitter != null ? `${currentJitter} ` : "— "}
            <span className="text-xs font-normal text-slate-500">ms</span>
          </span>
          <span className="text-[10px] text-slate-500">
            {currentJitter != null ? (currentJitter < 3 ? "Stable stream" : "Fluctuating") : "Calculating..."}
          </span>
        </div>

        <div className="dashboard-card p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Packet Loss</span>
          <span className="mt-1 font-mono text-2xl font-black text-emerald-600 block">{dash(loss != null ? `${loss}%` : "—")}</span>
          <span className="text-[10px] text-slate-500">
            {loss === 0 ? "0 dropped packets" : `${loss}% loss rate`}
          </span>
        </div>
      </div>

      {/* Live Continuous Wave Latency Stream */}
      <TradingWaveChart
        data={chartData}
        title={`Live ${targetHost} Latency Stream (${method.toUpperCase()})`}
        subtitle={browserOrigin
          ? "1000ms HTTPS RTT from this browser. Not the Render host path."
          : "1000ms TCP/ICMP RTT from this Windows host"}
        unit="ms"
        height={260}
        colorScheme="blue"
        showVolume={true}
        showDeltaBadge={true}
      />

      {/* Multi-Resolver DNS Benchmark Matrix */}
      <div className="dashboard-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Global DNS Resolver Benchmark Matrix</h3>
            <p className="text-[11px] text-slate-500">Direct TCP port 53 connect latency comparison across Tier-1 public anycast resolvers</p>
          </div>
          <button
            disabled={isTestingDns}
            onClick={() => void loadDns()}
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50 hover:bg-blue-700"
          >
            {isTestingDns ? "⚡ Benchmarking DNS..." : "🔄 Run DNS Benchmark"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-bold">Resolver Name</th>
                <th className="px-4 py-3 font-bold">Primary Anycast IP</th>
                <th className="px-4 py-3 font-bold">TCP :53 RTT</th>
                <th className="px-4 py-3 font-bold">Security Features</th>
                <th className="px-4 py-3 text-right font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
              {!benchmarks.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center font-sans text-slate-500">
                    Run the DNS benchmark to measure resolver RTT from this device.
                  </td>
                </tr>
              ) : null}
              {benchmarks.map((res) => (
                <tr key={res.serverName} className={res.isCurrent ? "bg-blue-50/40" : undefined}>
                  <td className="px-4 py-3.5 font-sans font-bold text-slate-900 flex items-center gap-2">
                    {res.serverName}
                    {res.isCurrent ? <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">Active Host</span> : null}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{res.primaryIp} {res.secondaryIp ? ` / ${res.secondaryIp}` : ""}</td>
                  <td className="px-4 py-3.5 font-bold text-emerald-600">
                    {res.responseTimeMs != null ? `${res.responseTimeMs} ms` : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-[11px] text-slate-600 font-sans">
                    <span className="inline-flex gap-1.5">
                      {res.features.dnsSec && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-blue-700">DNSSEC</span>}
                      {res.features.doh && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-purple-700">DoH</span>}
                      {res.features.malwareBlocking && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-emerald-700">Filtered</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-sans">
                    <StatusBadge status="passed" label="Optimal" size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
