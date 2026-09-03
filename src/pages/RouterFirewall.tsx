import React from "react";
import { StatusBadge } from "../components/ui/StatusBadge";

export const RouterFirewallPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Router Firewall</h1>
        <p className="text-xs text-slate-500 mt-0.5">UPnP, SPI, and port-forward tables are not readable without a vendor modem plugin. OmniShield does not invent these states.</p>
      </div>
      <div className="dashboard-card p-6">
        <StatusBadge status="warning" label="UNAVAILABLE" size="sm" />
        <p className="text-sm text-slate-600 mt-3">Register a router plugin if the gateway exposes a documented firewall API. Until then this page stays empty rather than showing sample rules.</p>
      </div>
    </div>
  );
};
