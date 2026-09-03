import React, { useEffect, useState } from "react";
import { api } from "../api";
import { dash } from "../lib/format";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";

type Modem = {
  freshness?: string;
  source?: string;
  reason?: string | null;
  note?: string | null;
  gateway?: string | null;
  localIp?: string | null;
  publicIp?: string | null;
  locationHint?: string | null;
  connectedSsid?: string | null;
  signalPercent?: number | null;
  dns?: string[];
  routers?: Array<{ id: string; name?: string; managementIp?: string | null; pluginKey?: string | null; wanStatus?: string | null; freshness?: string }>;
  pluginCapabilities?: Record<string, string>;
};

type Probe = {
  freshness?: string;
  host?: string;
  ports?: Array<{ port: number; open: boolean; connectMs?: number | null }>;
  http?: { url?: string; statusCode?: number; authRequired?: boolean; server?: string | null } | null;
  reason?: string | null;
  note?: string | null;
};

export const ModemPage: React.FC = () => {
  const [data, setData] = useState<Modem | null>(null);
  const [probe, setProbe] = useState<Probe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const body = await api<Modem>("/api/modem");
    setData(body);
  }

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
    const timer = window.setInterval(() => {
      void load().catch(() => undefined);
    }, 8000);
    return () => window.clearInterval(timer);
  }, []);

  async function runProbe(host?: string, routerId?: string) {
    setBusy(true);
    setError(null);
    try {
      setProbe(await api<Probe>("/api/modem/probe", { method: "POST", body: JSON.stringify(routerId ? { routerId } : { host }) }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Probe failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modem"
        description="Live gateway, public IP, and admin-UI reachability. This does not log in or change ISP Wi-Fi passwords."
        actions={
          data?.gateway ? (
            <button disabled={busy} onClick={() => void runProbe(data.gateway ?? undefined)} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60">
              {busy ? "Probing…" : "Probe gateway"}
            </button>
          ) : null
        }
      />

      {data?.note ? <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">{data.note}</p> : null}
      {error ? <p className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">{error}</p> : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="dashboard-card p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400">Default gateway</span>
          <div className="mt-1 font-bold text-slate-900">{dash(data?.gateway)}</div>
        </div>
        <div className="dashboard-card p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400">This PC</span>
          <div className="mt-1 font-bold text-slate-900">{dash(data?.localIp)}</div>
          <div className="text-[11px] text-slate-500">SSID {dash(data?.connectedSsid)}</div>
        </div>
        <div className="dashboard-card p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400">Public IP</span>
          <div className="mt-1 font-bold text-slate-900">{dash(data?.publicIp)}</div>
          <div className="text-[11px] text-slate-500">{dash(data?.locationHint)}</div>
        </div>
        <div className="dashboard-card p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400">DNS</span>
          <div className="mt-1 text-xs font-semibold text-slate-800">{(data?.dns ?? []).join(", ") || "—"}</div>
        </div>
      </div>

      {probe ? (
        <div className="dashboard-card p-5 space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <StatusBadge status={probe.freshness === "LIVE" ? "passed" : "warning"} label={probe.freshness ?? "Probe"} size="sm" />
            <span className="font-mono">{probe.host}</span>
          </div>
          <p>{probe.note}</p>
          <p>Open admin ports: {(probe.ports ?? []).filter((row) => row.open).map((row) => `${row.port}${row.connectMs != null ? ` (${row.connectMs} ms)` : ""}`).join(", ") || "none"}</p>
          {probe.http ? (
            <p>
              HTTP {probe.http.statusCode}
              {probe.http.authRequired ? " · login required" : ""} · {probe.http.server ?? "no Server header"}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="dashboard-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 text-sm font-bold">Registered routers</div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Management IP</th>
              <th className="px-4 py-2">Plugin</th>
              <th className="px-4 py-2">WAN</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {(data?.routers ?? []).length ? (
              (data?.routers ?? []).map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-semibold">{dash(row.name)}</td>
                  <td className="px-4 py-2 font-mono">{dash(row.managementIp)}</td>
                  <td className="px-4 py-2">{dash(row.pluginKey)}</td>
                  <td className="px-4 py-2">{dash(row.wanStatus)}</td>
                  <td className="px-4 py-2 text-right">
                    {row.managementIp ? (
                      <button disabled={busy} onClick={() => void runProbe(undefined, row.id)} className="rounded-lg bg-slate-100 px-3 py-1 font-bold">
                        Test
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-slate-500">
                  No router inventory yet. Gateway probe still uses the live default route from this PC.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
