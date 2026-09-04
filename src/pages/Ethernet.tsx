import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { StatusBadge } from "../components/ui/StatusBadge";
import { PageHeader } from "../components/ui/PageHeader";
import { dash } from "../lib/format";
import { formatSpeed, speedParts, usePrefs } from "../prefs";
import { OriginBanner } from "../components/ui/OriginBanner";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { shouldMeasureInBrowser } from "../lib/hostMode";
import { useVisitorTelemetry } from "../visitorTelemetry";

type Adapter = {
  name: string;
  up: boolean;
  speedMbps: number | null;
  mtu?: number | null;
  ipv4: string | null;
  ipv6: string | null;
  mac: string | null;
  duplex: string | null;
  rxBytes: number | null;
  txBytes: number | null;
  rxErrors: number | null;
  txErrors: number | null;
};

type EthernetResponse = {
  freshness?: string;
  source?: string;
  reason?: string;
  note?: string;
  items?: Adapter[];
};

export const EthernetPage: React.FC = () => {
  const { speedUnit } = usePrefs();
  const { adapters, error, refresh, loading, status } = useNetworkStatus();
  const visitor = useVisitorTelemetry();
  const browserOrigin = shouldMeasureInBrowser(visitor.capability);
  const [note, setNote] = useState<string | null>(null);

  const load = async () => {
    try {
      const body = await api<EthernetResponse>("/api/ethernet");
      setNote(body.note ?? null);
    } catch {
      /* live */
    }
    await refresh();
  };

  useEffect(() => {
    void load();
  }, []);

  const items = (browserOrigin
    ? [
        {
          name: status?.interfaceName || "Visitor browser session",
          up: Boolean(status?.publicIp || status?.ipAddress),
          speedMbps: null,
          mtu: null,
          ipv4: status?.ipAddress ?? null,
          ipv6: null,
          mac: null,
          duplex: null,
          rxBytes: null,
          txBytes: null,
          rxErrors: null,
          txErrors: null,
        },
      ]
    : adapters && adapters.length > 0
      ? adapters
      : []) as Adapter[];

  const up = items.filter((row) => row.up);
  const fastest = up.reduce<number | null>((max, row) => {
    if (row.speedMbps == null) return max;
    return max == null || row.speedMbps > max ? row.speedMbps : max;
  }, null);
  const fastestParts = speedParts(fastest || (status?.linkSpeedMbps ?? 0), speedUnit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ethernet & Physical Hardware Adapters"
        description="Live physical NIC counters, link duplex synchronization, MTU payload sizes, MAC addresses, and live RX/TX throughput counters."
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/speedtest"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
            >
              Speed Benchmark
            </Link>
            <button
              onClick={() => void load()}
              disabled={loading}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-60 hover:bg-blue-700 transition-all"
            >
              {loading ? "Refreshing..." : "🔄 Refresh Adapters"}
            </button>
          </div>
        }
      />

      <OriginBanner surface="lan" />
      {note && !browserOrigin ? <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono">{note}</p> : null}
      {error ? <p className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 font-mono">{error}</p> : null}

      {/* Hero 4-Card Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="dashboard-card p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Adapters</span>
          <span className="mt-1 font-mono text-2xl font-black text-slate-900 block">{items.length}</span>
          <span className="text-[10px] text-slate-500">{browserOrigin ? "Browser session" : "Hardware controllers"}</span>
        </div>

        <div className="dashboard-card p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Link Status</span>
          <span className="mt-1 font-mono text-2xl font-black text-emerald-600 block">{up.length} UP</span>
          <span className="text-[10px] text-emerald-700 font-bold">PHY Connected</span>
        </div>

        <div className="dashboard-card p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Fastest PHY Link</span>
          <span className="mt-1 font-mono text-2xl font-black text-blue-600 block">{fastestParts.value} <span className="text-xs font-normal text-slate-500">{fastestParts.unit}</span></span>
          <span className="text-[10px] text-slate-500">Gigabit Capacity</span>
        </div>

        <div className="dashboard-card p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Packet Error Rate</span>
          <span className="mt-1 font-mono text-2xl font-black text-emerald-600 block">
            {items.some((row) => row.rxErrors != null || row.txErrors != null)
              ? items.reduce((sum, row) => sum + (row.rxErrors ?? 0) + (row.txErrors ?? 0), 0)
              : "—"}
          </span>
          <span className="text-[10px] text-slate-500">Zero frame drops</span>
        </div>
      </div>

      {/* Hardware Adapters Table */}
      <div className="dashboard-card overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-bold text-slate-900">Physical Network Interface Controllers (NIC)</h3>
          <p className="text-xs text-slate-500">Real-time driver counters, MTU frame constraints, and duplex synchronizations</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-bold font-sans">Adapter Name</th>
                <th className="px-4 py-3 font-bold font-sans">Status</th>
                <th className="px-4 py-3 font-bold font-sans">PHY Link Speed</th>
                <th className="px-4 py-3 font-bold font-sans">IPv4 Address</th>
                <th className="px-4 py-3 font-bold font-sans">Hardware MAC</th>
                <th className="px-4 py-3 font-bold font-sans">Duplex / MTU</th>
                <th className="px-4 py-3 font-bold font-sans">RX Bytes</th>
                <th className="px-4 py-3 font-bold font-sans">TX Bytes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {items.map((ad) => (
                <tr key={ad.name} className={ad.up ? "bg-white" : "bg-slate-50/50 opacity-60"}>
                  <td className="px-4 py-3.5 font-sans font-bold text-slate-900">{ad.name}</td>
                  <td className="px-4 py-3.5 font-sans">
                    <StatusBadge status={ad.up ? "online" : "offline"} size="sm" />
                  </td>
                  <td className="px-4 py-3.5 font-bold text-blue-600">
                    {ad.speedMbps != null ? formatSpeed(ad.speedMbps, speedUnit) : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-slate-800">{dash(ad.ipv4)}</td>
                  <td className="px-4 py-3.5 text-slate-500">{dash(ad.mac)}</td>
                  <td className="px-4 py-3.5 text-slate-600">
                    {ad.duplex || "—"} · MTU {ad.mtu ?? "—"}
                  </td>
                  <td className="px-4 py-3.5 text-emerald-600">
                    {ad.rxBytes ? `${(ad.rxBytes / (1024 * 1024)).toFixed(1)} MB` : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-purple-600">
                    {ad.txBytes ? `${(ad.txBytes / (1024 * 1024)).toFixed(1)} MB` : "—"}
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
