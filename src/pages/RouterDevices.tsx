import React, { useEffect, useState } from "react";
import { api } from "../api";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";

type Neighbor = { ip?: string; mac?: string; kind?: string; hostname?: string; manufacturer?: string; state?: string };

export const RouterDevicesPage: React.FC = () => {
  const [items, setItems] = useState<Neighbor[]>([]);
  const [reason, setReason] = useState<string | null>(null);
  const [freshness, setFreshness] = useState<string>("UNAVAILABLE");

  useEffect(() => {
    api<{ items?: Neighbor[]; reason?: string | null; freshness?: string }>("/api/router/devices")
      .then((res) => {
        setItems(res.items ?? []);
        setReason(res.reason ?? null);
        setFreshness(res.freshness ?? "UNAVAILABLE");
      })
      .catch((err) => setReason(err instanceof Error ? err.message : "Unavailable"));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Router devices" description="ARP neighbors from this PC. Hostname and manufacturer stay UNKNOWN unless an authorized plugin provides them." />
      <StatusBadge status={freshness === "LIVE" ? "passed" : "warning"} label={freshness} size="sm" />
      {reason ? <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{reason}</p> : null}
      <div className="dashboard-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-2">IP</th>
              <th className="px-4 py-2">MAC</th>
              <th className="px-4 py-2">State</th>
              <th className="px-4 py-2">Hostname</th>
              <th className="px-4 py-2">Manufacturer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((row) => (
              <tr key={`${row.ip}-${row.mac}`}>
                <td className="px-4 py-2 font-mono">{row.ip ?? "UNAVAILABLE"}</td>
                <td className="px-4 py-2 font-mono">{row.mac ?? "UNAVAILABLE"}</td>
                <td className="px-4 py-2">{row.state ?? row.kind ?? "UNKNOWN"}</td>
                <td className="px-4 py-2">{row.hostname ?? "UNKNOWN"}</td>
                <td className="px-4 py-2">{row.manufacturer ?? "UNKNOWN"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length ? <p className="px-4 py-6 text-sm text-slate-500">No ARP neighbors were observed.</p> : null}
      </div>
    </div>
  );
};
