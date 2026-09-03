import React, { useEffect, useState } from "react";
import { StatusBadge } from "../components/ui/StatusBadge";
import { routerService } from "../services/routerService";
import { dash } from "../lib/format";

export const RouterDNSPage: React.FC = () => {
  const [primary, setPrimary] = useState<string | null>(null);
  const [secondary, setSecondary] = useState<string | null>(null);

  useEffect(() => {
    void routerService.getWAN().then((wan) => {
      setPrimary(wan?.dnsPrimary ?? null);
      setSecondary(wan?.dnsSecondary ?? null);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Router DNS</h1>
        <p className="text-xs text-slate-500 mt-0.5">Resolvers observed on this host via ipconfig/resolv.conf. Changing the modem DNS requires a vendor plugin.</p>
      </div>
      <div className="dashboard-card p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-slate-500">Primary DNS</span>
          <div className="font-mono font-bold mt-1">{dash(primary)}</div>
        </div>
        <div>
          <span className="text-slate-500">Secondary DNS</span>
          <div className="font-mono font-bold mt-1">{dash(secondary)}</div>
        </div>
      </div>
      <StatusBadge status={primary ? "passed" : "warning"} label={primary ? "Observed on host" : "UNAVAILABLE"} size="sm" />
    </div>
  );
};
