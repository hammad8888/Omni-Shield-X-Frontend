import React, { useState } from "react";
import type { NearbyWifiNetwork } from "../../types";
import { SignalStrength } from "./SignalStrength";
import { StatusBadge } from "./StatusBadge";

interface NetworkTableProps {
  networks: NearbyWifiNetwork[];
  onSelectNetwork?: (network: NearbyWifiNetwork) => void;
  className?: string;
}

export const NetworkTable: React.FC<NetworkTableProps> = ({
  networks,
  onSelectNetwork,
  className = "",
}) => {
  const [search, setSearch] = useState("");
  const [bandFilter, setBandFilter] = useState<string>("All");

  const filtered = networks.filter((net) => {
    const matchesSearch =
      (net.ssid ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (net.bssid ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (net.vendor ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesBand = bandFilter === "All" || net.band === bandFilter;
    return matchesSearch && matchesBand;
  });

  return (
    <div className={`dashboard-card overflow-hidden ${className}`}>
      {/* Table Top Controls */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SSID, BSSID, vendor..."
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {["All", "2.4 GHz", "5 GHz", "6 GHz"].map((b) => (
            <button
              key={b}
              onClick={() => setBandFilter(b)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                bandFilter === b
                  ? "bg-blue-600 text-white shadow-subtle"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Security notice disclaimer banner */}
      <div className="bg-amber-50/70 border-b border-amber-200/60 px-4 py-2 flex items-center gap-2 text-[11px] text-amber-800 font-medium">
        <span>🛡️</span>
        <span>
          <b>Ethical Wi-Fi Scanner:</b> Passwords belonging to neighboring networks are strictly protected and never intercepted or exposed.
        </span>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Network (SSID)</th>
              <th className="py-3 px-4">Signal</th>
              <th className="py-3 px-4">Band & Channel</th>
              <th className="py-3 px-4">Channel Width</th>
              <th className="py-3 px-4">Security Protocol</th>
              <th className="py-3 px-4">Hardware Vendor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No nearby networks found matching filters.
                </td>
              </tr>
            ) : (
              filtered.map((net) => (
                <tr
                  key={net.bssid}
                  onClick={() => onSelectNetwork?.(net)}
                  className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                    net.isCurrentNetwork ? "bg-blue-50/30" : ""
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{net.ssid}</span>
                      {net.isCurrentNetwork && (
                        <StatusBadge status="connected" label="Connected" size="sm" />
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 block">{net.bssid}</span>
                  </td>
                  <td className="py-3 px-4">
                    <SignalStrength dbm={net.signalDbm} size="sm" />
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800">{net.band}</span>
                    <span className="text-slate-400 ml-1.5">(Ch {net.channel})</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{net.channelWidthMhz != null ? `${net.channelWidthMhz} MHz` : "—"}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        net.security === "WPA3"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : net.security === "Open"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {net.security}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{net.vendor}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
