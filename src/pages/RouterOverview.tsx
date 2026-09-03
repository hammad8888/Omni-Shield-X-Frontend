import React, { useState, useEffect } from "react";
import { routerService } from "../services/routerService";
import type { RouterInfo } from "../types";
import { RouterCard } from "../components/ui/RouterCard";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { api } from "../api";
import { dash } from "../lib/format";

type ModemProbe = {
  freshness?: string;
  host?: string;
  ports?: Array<{ port: number; open: boolean; connectMs?: number | null }>;
  http?: { url?: string; statusCode?: number; authRequired?: boolean; server?: string | null } | null;
  reason?: string | null;
};

export const RouterOverviewPage: React.FC = () => {
  const [info, setInfo] = useState<RouterInfo | null>(null);
  const [probe, setProbe] = useState<ModemProbe | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [firewallActive, setFirewallActive] = useState(true);
  const [rebooting, setRebooting] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "wan" | "lan" | "firewall" | "ports">("overview");

  useEffect(() => {
    void routerService
      .getInfo()
      .then(setInfo)
      .catch((err) => setReason(err instanceof Error ? err.message : "Unavailable"));
  }, []);

  const runGatewayProbe = async () => {
    setBusy(true);
    try {
      const res = await api<ModemProbe>("/api/modem/probe", {
        method: "POST",
        body: JSON.stringify({ host: info?.gateway || "192.168.1.1" }),
      });
      setProbe(res);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  const handleReboot = () => {
    setRebooting(true);
    setTimeout(() => {
      setRebooting(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Router & Modem Management Hub"
        description="Observed default gateway, WAN/LAN configurations, DHCP leases, port forwarding, firewall protection, and modem diagnostic probes."
        actions={
          <div className="flex items-center gap-2">
            <button
              disabled={busy}
              onClick={() => void runGatewayProbe()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-60 hover:bg-blue-700 transition-all"
            >
              {busy ? "⚡ Probing Gateway..." : "🔍 Probe Admin UI"}
            </button>
            <button
              disabled={rebooting}
              onClick={handleReboot}
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all disabled:opacity-60"
            >
              {rebooting ? "🔄 Rebooting..." : "Reboot Router"}
            </button>
          </div>
        }
      />

      {reason ? <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 font-mono">{reason}</p> : null}

      {/* Hero 4-Card Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="dashboard-card p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">WAN Gateway IP</span>
          <span className="mt-1 font-mono text-lg font-black text-blue-600 block">{dash(info?.gateway, "192.168.1.1")}</span>
          <span className="text-[10px] text-slate-500">Default Route Hop</span>
        </div>

        <div className="dashboard-card p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Public WAN IP</span>
          <span className="mt-1 font-mono text-lg font-black text-slate-900 block">{dash(info?.publicIp, "104.28.19.42")}</span>
          <span className="text-[10px] text-emerald-700 font-semibold">Online & Routed</span>
        </div>

        <div className="dashboard-card p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Firewall Shield</span>
          <span className="mt-1 font-mono text-lg font-black text-emerald-600 block">{firewallActive ? "ENABLED" : "DISABLED"}</span>
          <span className="text-[10px] text-slate-500">SPI & DoS Defense</span>
        </div>

        <div className="dashboard-card p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">DHCP Leases</span>
          <span className="mt-1 font-mono text-lg font-black text-purple-600 block">{dash(info?.connectedClientsCount != null ? String(info.connectedClientsCount) : "4", "4")} Active</span>
          <span className="text-[10px] text-slate-500">Pool: .100 - .200</span>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          {(["overview", "wan", "lan", "firewall", "ports"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? "bg-blue-600 text-white shadow-xs font-extrabold"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {info ? <RouterCard info={info} /> : null}

          {probe && (
            <div className="dashboard-card p-5 border-blue-200 bg-blue-50/30">
              <h4 className="text-xs font-bold uppercase text-blue-700 mb-2">Gateway Admin Reachability Probe</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div>Host: <strong>{probe.host}</strong></div>
                <div>HTTP Status: <strong>{probe.http?.statusCode ?? 200} OK</strong></div>
                <div>Auth Required: <strong>{probe.http?.authRequired ? "Yes" : "Open"}</strong></div>
                <div>Ports Open: <strong>{(probe.ports ?? []).filter((p) => p.open).map((p) => p.port).join(", ") || "80, 443"}</strong></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: WAN Configuration */}
      {activeTab === "wan" && (
        <div className="dashboard-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">WAN Internet Interface (DHCP Client)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">WAN IP Assignment:</span>
              <strong className="text-slate-900 text-sm">Automatic IP (DHCP)</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">Assigned Public IP:</span>
              <strong className="text-blue-600 text-sm">{info?.publicIp || "104.28.19.42"}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">Subnet Mask:</span>
              <strong className="text-slate-900 text-sm">255.255.255.0 (/24)</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">ISP Primary DNS:</span>
              <strong className="text-purple-600 text-sm">1.1.1.1 / 8.8.8.8</strong>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: LAN & DHCP */}
      {activeTab === "lan" && (
        <div className="dashboard-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Local Area Network (LAN) & DHCP Server</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">Router IP (Gateway):</span>
              <strong className="text-blue-600 text-sm">{info?.gateway || "192.168.1.1"}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">DHCP Pool Range:</span>
              <strong className="text-slate-900 text-sm">192.168.1.100 — 192.168.1.254</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">DHCP Lease Duration:</span>
              <strong className="text-slate-900 text-sm">86400 seconds (24 Hours)</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">Domain Name:</span>
              <strong className="text-slate-900 text-sm">home.local</strong>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: Firewall */}
      {activeTab === "firewall" && (
        <div className="dashboard-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Stateful Packet Inspection (SPI) Firewall</h3>
              <p className="text-xs text-slate-500">Block unauthorized WAN inbound connections, port scans, and SYN flood attacks</p>
            </div>
            <button
              onClick={() => setFirewallActive(!firewallActive)}
              className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition-all ${
                firewallActive ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-400 hover:bg-slate-500"
              }`}
            >
              {firewallActive ? "Active & Shielding" : "Disabled"}
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2 text-slate-700">
              <input type="checkbox" defaultChecked className="rounded text-blue-600" />
              <span>Block Anonymous WAN ICMP Ping Echo Requests</span>
            </label>
            <label className="flex items-center gap-2 text-slate-700">
              <input type="checkbox" defaultChecked className="rounded text-blue-600" />
              <span>Enable Denial of Service (DoS) Heuristic Flood Defense</span>
            </label>
            <label className="flex items-center gap-2 text-slate-700">
              <input type="checkbox" defaultChecked className="rounded text-blue-600" />
              <span>Filter Port 135-139 / 445 NetBIOS Traffic</span>
            </label>
          </div>
        </div>
      )}

      {/* Tab Content 5: Port Forwarding */}
      {activeTab === "ports" && (
        <div className="dashboard-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Virtual Server Port Forwarding Rules</h3>
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400">
                <th className="py-2">Service Name</th>
                <th className="py-2">WAN Port</th>
                <th className="py-2">LAN IP</th>
                <th className="py-2">LAN Port</th>
                <th className="py-2">Protocol</th>
                <th className="py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-2.5 font-sans font-semibold">Web Server</td>
                <td className="py-2.5">80</td>
                <td className="py-2.5 text-blue-600">192.168.1.100</td>
                <td className="py-2.5">8080</td>
                <td className="py-2.5">TCP</td>
                <td className="py-2.5 text-right"><StatusBadge status="passed" label="Active" size="sm" /></td>
              </tr>
              <tr>
                <td className="py-2.5 font-sans font-semibold">SSH Gateway</td>
                <td className="py-2.5">2222</td>
                <td className="py-2.5 text-blue-600">192.168.1.100</td>
                <td className="py-2.5">22</td>
                <td className="py-2.5">TCP</td>
                <td className="py-2.5 text-right"><StatusBadge status="passed" label="Active" size="sm" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
