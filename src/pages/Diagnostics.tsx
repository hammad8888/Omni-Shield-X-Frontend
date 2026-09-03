import React, { useState } from "react";
import type { DiagnosticStage } from "../types";
import { DiagnosticItem } from "../components/ui/DiagnosticItem";
import { StatusBadge } from "../components/ui/StatusBadge";
import { PageHeader } from "../components/ui/PageHeader";
import { api } from "../api";
import { wifiService } from "../services/wifiService";

const TEMPLATE: DiagnosticStage[] = [
  { id: "adapters", name: "Host adapters", category: "Network", status: "pending" },
  { id: "gateway", name: "Default gateway", category: "Routing", status: "pending" },
  { id: "public", name: "Public IP trace", category: "Internet", status: "pending" },
  { id: "ping", name: "TCP ping 1.1.1.1", category: "Internet", status: "pending" },
  { id: "dns", name: "DNS lookup", category: "DNS", status: "pending" },
  { id: "wifi", name: "Wi-Fi radio scan", category: "Wi-Fi", status: "pending" },
  { id: "neighbors", name: "ARP neighbors", category: "LAN", status: "pending" },
  { id: "gaming", name: "Gaming path (Cloudflare 443)", category: "Gaming", status: "pending" },
];

export const DiagnosticsPage: React.FC = () => {
  const [stages, setStages] = useState<DiagnosticStage[]>(TEMPLATE);
  const [isRunning, setIsRunning] = useState(false);

  const patch = (id: string, update: Partial<DiagnosticStage>) => {
    setStages((prev) => prev.map((row) => (row.id === id ? { ...row, ...update } : row)));
  };

  const handleRunDiagnostics = async () => {
    setIsRunning(true);
    setStages(TEMPLATE.map((row) => ({ ...row, status: "pending", metric: undefined, detail: undefined })));
    const run = async (id: string, fn: () => Promise<Partial<DiagnosticStage>>) => {
      patch(id, { status: "running" });
      try {
        const result = await fn();
        patch(id, { status: result.status ?? "passed", ...result });
      } catch (err) {
        patch(id, { status: "failed", detail: err instanceof Error ? err.message : "Failed" });
      }
    };

    await run("adapters", async () => {
      const live = await api<{ status?: { ipAddress?: string }; adapters?: unknown[] }>("/api/network/live");
      return { status: live.adapters?.length ? "passed" : "warning", metric: `${live.adapters?.length ?? 0} NICs`, detail: live.status?.ipAddress ?? "No local IP" };
    });
    await run("gateway", async () => {
      const live = await api<{ status?: { gateway?: string | null } }>("/api/network/live");
      return { status: live.status?.gateway ? "passed" : "failed", metric: live.status?.gateway ?? "—", detail: live.status?.gateway ? "From host routing table" : "No default route" };
    });
    await run("public", async () => {
      const live = await api<{ status?: { publicIp?: string | null; state?: string } }>("/api/network/live");
      return { status: live.status?.publicIp ? "passed" : "warning", metric: live.status?.publicIp ?? "—", detail: live.status?.state ?? "" };
    });
    await run("ping", async () => {
      const ping = await api<{ pingMs?: number | null; freshness?: string; reason?: string }>("/api/ping?host=1.1.1.1&port=443");
      return { status: ping.pingMs != null ? "passed" : "failed", metric: ping.pingMs != null ? `${ping.pingMs} ms` : "UNAVAILABLE", detail: ping.reason };
    });
    await run("dns", async () => {
      const dns = await api<{ items?: Array<{ responseTimeMs?: number | null; isCurrent?: boolean; serverName?: string }> }>("/api/dns/benchmark");
      const current = dns.items?.find((row) => row.isCurrent) ?? dns.items?.find((row) => row.responseTimeMs != null);
      return { status: current?.responseTimeMs != null ? "passed" : "failed", metric: current?.responseTimeMs != null ? `${current.responseTimeMs} ms` : "UNAVAILABLE", detail: current?.serverName };
    });
    await run("wifi", async () => {
      const nearby = await wifiService.scanNetworks();
      return { status: nearby.length ? "passed" : "warning", metric: `${nearby.length} BSSID(s)`, detail: nearby[0]?.ssid ? `Includes ${nearby[0].ssid}` : "No beacons" };
    });
    await run("neighbors", async () => {
      const res = await api<{ items?: unknown[]; reason?: string }>("/api/network/neighbors");
      return { status: res.items?.length ? "passed" : "warning", metric: `${res.items?.length ?? 0} ARP entries`, detail: res.reason };
    });
    await run("gaming", async () => {
      const probe = await api<{ item?: { pingMs?: number | null; quality?: string | null; freshness?: string } }>("/api/gaming", {
        method: "POST",
        body: JSON.stringify({ game: "Internet baseline", region: "Cloudflare", host: "one.one.one.one", port: 443, notes: "Diagnostics suite baseline path probe." }),
      });
      return {
        status: probe.item?.pingMs != null ? "passed" : "warning",
        metric: probe.item?.pingMs != null ? `${probe.item.pingMs} ms` : "UNAVAILABLE",
        detail: probe.item?.quality ? `${probe.item.quality} · not an official game server` : "HTTPS path to Cloudflare",
      };
    });
    setIsRunning(false);
  };

  const passed = stages.filter((s) => s.status === "passed").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnostics"
        description="Runs live collectors: adapters, gateway, public IP, ping, DNS, Wi-Fi scan, ARP, and a Cloudflare path probe."
        actions={
          <>
            <StatusBadge status={isRunning ? "testing" : passed ? "passed" : "neutral"} label={isRunning ? "Running" : `${passed}/${stages.length} live`} size="sm" />
            <button
              disabled={isRunning}
              onClick={() => void handleRunDiagnostics()}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
            >
              {isRunning ? "Running…" : "Run diagnostics"}
            </button>
          </>
        }
      />
      <div className="space-y-2">
        {stages.map((stage) => (
          <DiagnosticItem key={stage.id} stage={stage} />
        ))}
      </div>
    </div>
  );
};
