import React, { useEffect, useState } from "react";
import { routerService } from "../services/routerService";
import { StatusBadge } from "../components/ui/StatusBadge";
import { dash } from "../lib/format";

type Neighbor = { ip?: string; mac?: string; kind?: string };
type Lease = { id: string; hostname?: string | null; displayName?: string | null; ipv4?: string | null; mac?: string | null };

export const RouterDHCPPage: React.FC = () => {
  const [neighbors, setNeighbors] = useState<Neighbor[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    void routerService.getDhcp().then((res) => {
      setNeighbors((res.neighbors as Neighbor[]) ?? []);
      setLeases((res.leases as Lease[]) ?? []);
      setReason(res.reason ?? "ARP neighbors are not DHCP leases. Modem DHCP is UNAVAILABLE without a plugin.");
    });
  }, []);

  const rows = [
    ...leases.map((d) => ({ name: d.displayName || d.hostname || d.ipv4 || "Device", ip: d.ipv4, mac: d.mac, source: "inventory" })),
    ...neighbors.map((n) => ({ name: n.ip || "Neighbor", ip: n.ip, mac: n.mac, source: "arp" })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">DHCP & LAN neighbors</h1>
        <p className="text-xs text-slate-500 mt-0.5">{reason}</p>
      </div>
      <div className="dashboard-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase">
              <th className="py-3 px-4">Name / IP</th>
              <th className="py-3 px-4">MAC</th>
              <th className="py-3 px-4">Source</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length ? (
              rows.map((row, idx) => (
                <tr key={`${row.mac}-${idx}`}>
                  <td className="py-3 px-4 font-bold">{dash(row.name)}</td>
                  <td className="py-3 px-4 font-mono">{dash(row.mac)}</td>
                  <td className="py-3 px-4">{row.source}</td>
                  <td className="py-3 px-4 text-right">
                    <StatusBadge status="online" size="sm" />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-6 px-4 text-slate-500">
                  No ARP neighbors or registered devices.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
