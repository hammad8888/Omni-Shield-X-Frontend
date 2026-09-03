import React from "react";
import type { RouterInfo } from "../../types";
import { StatusBadge } from "./StatusBadge";
import { dash } from "../../lib/format";

interface RouterCardProps {
  info: RouterInfo;
  className?: string;
}

export const RouterCard: React.FC<RouterCardProps> = ({ info, className = "" }) => {
  return (
    <div className={`dashboard-card p-5 sm:p-6 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-blue-50 text-blue-700 border border-blue-200">
              {dash(info.manufacturer, "Unknown vendor")}
            </span>
            <h3 className="text-base font-bold text-slate-900">{dash(info.model, "Observed gateway")}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Firmware: <span className="font-mono text-slate-700">{dash(info.firmwareVersion)}</span> (HW: {dash(info.hardwareVersion)})
          </p>
        </div>
        <StatusBadge status={info.wanStatus === "Connected" ? "passed" : "offline"} label={info.wanStatus || "WAN unknown"} size="sm" withPulse={info.wanStatus === "Connected"} />
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "CPU Usage", value: info.cpuUsagePercent, suffix: "%" },
          { label: "RAM Allocation", value: info.memoryUsagePercent, suffix: "%" },
          { label: "Operating Temp", value: info.temperatureC, suffix: " °C" },
        ].map((row) => (
          <div key={row.label} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">{row.label}</span>
              <span className="text-slate-900 font-mono">{row.value != null ? `${row.value}${row.suffix}` : "UNAVAILABLE"}</span>
            </div>
            <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${row.value ?? 0}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Requires a vendor modem plugin</p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-slate-400 block font-medium">Serial Number</span>
          <span className="font-mono text-slate-800 font-bold block">{dash(info.serialNumber)}</span>
        </div>
        <div>
          <span className="text-slate-400 block font-medium">Observed neighbors</span>
          <span className="text-slate-800 font-bold block">{dash(info.connectedClientsCount)}</span>
        </div>
        <div>
          <span className="text-slate-400 block font-medium">Wi-Fi</span>
          <span className="text-slate-800 font-bold block">{dash(info.wifiStatus)}</span>
        </div>
        <div>
          <span className="text-slate-400 block font-medium">System Uptime</span>
          <span className="text-slate-800 font-bold block">{info.uptimeSeconds != null ? `${Math.floor(info.uptimeSeconds / 86400)}d` : "—"}</span>
        </div>
      </div>
    </div>
  );
};
