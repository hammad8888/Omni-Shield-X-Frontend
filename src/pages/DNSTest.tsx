import React, { useState, useEffect } from "react";
import { dnsService } from "../services/dnsService";
import type { DnsBenchmarkResult } from "../types";
import { MetricCard } from "../components/ui/MetricCard";
import { StatusBadge } from "../components/ui/StatusBadge";
import { PageHeader } from "../components/ui/PageHeader";
import { dash } from "../lib/format";

export const DNSTestPage: React.FC = () => {
  const [benchmarks, setBenchmarks] = useState<DnsBenchmarkResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const load = async () => {
    setIsTesting(true);
    try {
      setBenchmarks(await dnsService.runBenchmark());
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const currentDns = benchmarks.find((b) => b.isCurrent) || benchmarks[0];
  const liveCount = benchmarks.filter((b) => b.responseTimeMs != null).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="DNS"
        description="TCP connect time to resolver port 53 from this PC. This is not a recursive query benchmark and does not measure 30-day uptime."
        actions={
          <button
            disabled={isTesting}
            onClick={() => void load()}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
          >
            {isTesting ? "Measuring…" : "Run benchmark"}
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard
          label="Host resolver"
          value={currentDns?.serverName ?? "—"}
          description={currentDns?.isCurrent ? "Configured on this PC" : "No host resolver in this sample"}
        />
        <MetricCard
          label="TCP RTT"
          value={dash(currentDns?.responseTimeMs)}
          unit="ms"
          description="Connect to port 53"
        />
        <MetricCard
          label="Reachable"
          value={`${liveCount}/${benchmarks.length || 0}`}
          description="Resolvers that accepted TCP:53"
        />
      </div>

      <div className="dashboard-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Resolvers</h3>
            <p className="text-xs text-slate-500">Sorted by measured TCP time. Feature tags are public resolver capabilities, not a live probe of DNSSEC/DoH.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <th className="px-4 py-3 font-medium">Resolver</th>
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3 font-medium">TCP :53</th>
                <th className="px-4 py-3 font-medium">Published features</th>
                <th className="px-4 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {benchmarks.map((res) => (
                <tr key={res.serverName} className={res.isCurrent ? "bg-slate-50" : undefined}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{res.serverName}</span>
                      {res.isCurrent ? <StatusBadge status="connected" label="Host" size="sm" /> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">
                    {res.primaryIp}
                    {res.secondaryIp ? ` / ${res.secondaryIp}` : ""}
                  </td>
                  <td className="px-4 py-3 font-mono font-medium text-slate-900">
                    {res.responseTimeMs != null ? `${res.responseTimeMs} ms` : "—"}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-500">
                    {[res.features.dnsSec ? "DNSSEC" : null, res.features.doh ? "DoH" : null, res.features.malwareBlocking ? "Filtering" : null]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <StatusBadge status={res.status.toLowerCase()} label={res.status} size="sm" />
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
