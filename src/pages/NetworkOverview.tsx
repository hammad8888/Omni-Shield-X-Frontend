import React from "react";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { MetricCard } from "../components/ui/MetricCard";
import { StatusBadge } from "../components/ui/StatusBadge";
import { PageHeader } from "../components/ui/PageHeader";
import { dash } from "../lib/format";
import { formatSpeed, usePrefs } from "../prefs";

type Adapter = {
  name?: string;
  up?: boolean;
  speedMbps?: number | null;
  mtu?: number | null;
  ipv4?: string | null;
  ipv6?: string | null;
  mac?: string | null;
};

export const NetworkOverviewPage: React.FC = () => {
  const { status, adapters } = useNetworkStatus();
  const { speedUnit } = usePrefs();
  const nics = (adapters ?? []) as Adapter[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interfaces"
        description="Adapters, default gateway, DNS, and public IP from this PC."
        actions={
          <StatusBadge
            status={status?.state === "Connected" ? "connected" : "offline"}
            label={status?.state || "Unknown"}
            size="sm"
            withPulse={status?.state === "Connected"}
          />
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Public IPv4" value={String(dash(status?.publicIp))} description={status?.locationHint ? `Location hint ${status.locationHint}` : "Cloudflare trace"} />
        <MetricCard label="ISP Name" value={String(dash(status?.isp))} description="Not claimed unless a registry is configured" />
        <MetricCard label="Local Interface" value={String(dash(status?.ipAddress))} description={status?.interfaceName ?? undefined} />
        <MetricCard label="Default Gateway" value={String(dash(status?.gateway))} description="Host routing table" />
      </div>

      <div className="dashboard-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">Network Interface Cards (NICs)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Adapter / Interface</th>
                <th className="py-3 px-4">IPv4 Address</th>
                <th className="py-3 px-4">MAC Address</th>
                <th className="py-3 px-4">MTU</th>
                <th className="py-3 px-4">Speed</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {nics.length ? (
                nics.map((nic) => (
                  <tr key={nic.name}>
                    <td className="py-3 px-4 font-bold text-slate-900">{nic.name}</td>
                    <td className="py-3 px-4 font-mono">{dash(nic.ipv4)}</td>
                    <td className="py-3 px-4 font-mono">{dash(nic.mac)}</td>
                    <td className="py-3 px-4 font-mono">{dash(nic.mtu)}</td>
                    <td className="py-3 px-4 font-mono">{formatSpeed(nic.speedMbps ?? null, speedUnit)}</td>
                    <td className="py-3 px-4 text-right">
                      <StatusBadge status={nic.up ? "connected" : "offline"} label={nic.up ? "Up" : "Down"} size="sm" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 px-4 text-slate-500">
                    No adapters reported by this Windows host.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
