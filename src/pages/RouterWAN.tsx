import React, { useState, useEffect } from "react";
import { routerService } from "../services/routerService";
import type { RouterWANConfig } from "../types";
import { StatusBadge } from "../components/ui/StatusBadge";
import { dash } from "../lib/format";

export const RouterWANPage: React.FC = () => {
  const [wan, setWan] = useState<RouterWANConfig | null>(null);

  useEffect(() => {
    void routerService.getWAN().then(setWan);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Router WAN</h1>
          <p className="text-xs text-slate-500 mt-0.5">Public IP from HTTPS trace. ISP WAN counters require a modem plugin.</p>
        </div>
        <StatusBadge status={wan?.status === "Connected" ? "connected" : "offline"} label={wan?.status || "Unknown"} size="sm" />
      </div>
      <div className="dashboard-card p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-xs">
        {[
          ["Public IPv4", wan?.publicIp],
          ["Location hint", wan?.locationHint],
          ["ISP", wan?.isp],
          ["LAN-side gateway", wan?.gateway],
          ["Primary DNS", wan?.dnsPrimary],
          ["Secondary DNS", wan?.dnsSecondary],
          ["IPv6", wan?.ipv6Address],
          ["MAC", wan?.macAddress],
          ["MTU", wan?.mtu],
          ["Connection mode", wan?.connectionType],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">{label}</span>
            <span className="font-mono font-bold text-slate-900">{dash(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
