import React from "react";
import type { NetworkStatus as NetworkStatusType } from "../../types";
import { StatusBadge } from "./StatusBadge";
import { dash } from "../../lib/format";
import { formatSpeed, usePrefs } from "../../prefs";

interface NetworkStatusProps {
  status: NetworkStatusType | null;
  compact?: boolean;
  className?: string;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  status,
  compact = false,
  className = "",
}) => {
  const { speedUnit } = usePrefs();
  if (!status) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="h-2 w-2 rounded-full bg-slate-300 animate-pulse" />
        Detecting network status...
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <StatusBadge status={status.state} size="sm" withPulse={status.state === "Connected"} />
        <span className="text-xs font-semibold text-slate-700 truncate max-w-[140px]">
          {status.ssid || status.mediaType}
        </span>
      </div>
    );
  }

  return (
    <div className={`dashboard-card p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">{status.ssid || "No WLAN association"}</h4>
              <StatusBadge status={status.state} size="sm" withPulse={status.state === "Connected"} />
            </div>
            <p className="text-xs text-slate-500">{dash(status.interfaceName)}</p>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-slate-400 block font-medium">ISP</span>
          <span className="font-semibold text-slate-800 truncate block">{dash(status.isp)}</span>
        </div>
        <div>
          <span className="text-slate-400 block font-medium">Public IP</span>
          <span className="font-semibold text-slate-800 font-mono block">{dash(status.publicIp)}</span>
        </div>
        <div>
          <span className="text-slate-400 block font-medium">Local IP / Gateway</span>
          <span className="font-semibold text-slate-800 font-mono block">
            {dash(status.ipAddress)} / {dash(status.gateway)}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block font-medium">Link Speed / Signal</span>
          <span className="font-semibold text-slate-800 block">
            {status.linkSpeedMbps != null ? formatSpeed(status.linkSpeedMbps, speedUnit) : "—"} ({status.signalDbm != null ? `${status.signalDbm} dBm` : "—"})
          </span>
        </div>
      </div>
    </div>
  );
};
