import React, { useEffect, useState } from "react";
import { api } from "../api";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";

export const RouterSystemPage: React.FC = () => {
  const [data, setData] = useState<{ freshness?: string; reason?: string | null; note?: string | null } | null>(null);

  useEffect(() => {
    api<{ freshness?: string; reason?: string | null; note?: string | null }>("/api/router/system")
      .then(setData)
      .catch((err) => setData({ freshness: "UNAVAILABLE", reason: err instanceof Error ? err.message : "Unavailable" }));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Router system" description="Firmware, uptime, and reboot require an authorized vendor plugin." />
      <div className="dashboard-card p-6">
        <StatusBadge status={data?.freshness === "LIVE" ? "passed" : "warning"} label={data?.freshness ?? "UNAVAILABLE"} size="sm" />
        <p className="mt-3 text-sm text-slate-600">{data?.reason ?? data?.note ?? "PLUGIN REQUIRED"}</p>
      </div>
    </div>
  );
};
