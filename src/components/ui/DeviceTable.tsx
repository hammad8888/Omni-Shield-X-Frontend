import React, { useState } from "react";
import type { ConnectedDevice, DeviceType } from "../../types";
import { StatusBadge } from "./StatusBadge";
import { SignalStrength } from "./SignalStrength";

interface DeviceTableProps {
  devices: ConnectedDevice[];
  onSelectDevice?: (device: ConnectedDevice) => void;
  className?: string;
}

export const DeviceTable: React.FC<DeviceTableProps> = ({
  devices,
  onSelectDevice,
  className = "",
}) => {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");

  const filtered = devices.filter((d) => {
    const matchesSearch =
      (d.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.ipAddress ?? "").includes(search) ||
      (d.macAddress ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.vendor ?? "").toLowerCase().includes(search.toLowerCase());

    const matchesType = selectedType === "All" || d.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case "Router":
        return "🌐";
      case "Computer":
        return "💻";
      case "Phone":
        return "📱";
      case "TV":
        return "📺";
      case "IoT":
        return "💡";
      case "Printer":
        return "🖨️";
      case "Tablet":
        return "📱";
      default:
        return "🔌";
    }
  };

  const types = ["All", "Router", "Computer", "Phone", "TV", "IoT", "Printer"];

  return (
    <div className={`dashboard-card overflow-hidden ${className}`}>
      {/* Table Filter / Search Controls */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by IP, MAC, device name..."
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                selectedType === t
                  ? "bg-blue-600 text-white shadow-subtle"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Device</th>
              <th className="py-3 px-4">IP Address</th>
              <th className="py-3 px-4">MAC & Vendor</th>
              <th className="py-3 px-4">Connection</th>
              <th className="py-3 px-4">Signal</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No devices match your search criteria.
                </td>
              </tr>
            ) : (
              filtered.map((dev) => (
                <tr
                  key={dev.id}
                  onClick={() => onSelectDevice?.(dev)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{getDeviceIcon(dev.type)}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{dev.name}</span>
                          {dev.isCurrentDevice && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-blue-50 text-blue-700 border border-blue-200">
                              This Device
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">{dev.type}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-800">{dev.ipAddress}</td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-slate-600">{dev.macAddress}</div>
                    <div className="text-[11px] text-slate-400">{dev.vendor}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                      {dev.connectionType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {dev.signalDbm ? (
                      <SignalStrength dbm={dev.signalDbm} size="sm" showPercent />
                    ) : (
                      <span className="text-slate-400">Wired / 1Gbps</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge
                      status={dev.status === "Online" ? "online" : "offline"}
                      size="sm"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDevice?.(dev);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                    >
                      Details →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
