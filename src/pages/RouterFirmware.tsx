import React from "react";
import { StatusBadge } from "../components/ui/StatusBadge";
import { routerService } from "../services/routerService";
import { useEffect, useState } from "react";
import { dash } from "../lib/format";

export const RouterFirmwarePage: React.FC = () => {
  const [model, setModel] = useState<string | null>(null);
  const [firmware, setFirmware] = useState<string | null>(null);

  useEffect(() => {
    void routerService.getInfo().then((info) => {
      setModel(info?.model ?? null);
      setFirmware(info?.firmwareVersion ?? null);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Router Firmware</h1>
        <p className="text-xs text-slate-500 mt-0.5">Firmware strings come from inventory if you registered a router. Cloud update checks are not simulated.</p>
      </div>
      <div className="dashboard-card p-6 space-y-2 text-sm">
        <StatusBadge status={firmware ? "passed" : "warning"} label={firmware ? "Recorded" : "UNAVAILABLE"} size="sm" />
        <p>Model: <b>{dash(model)}</b></p>
        <p>Firmware: <b>{dash(firmware)}</b></p>
      </div>
    </div>
  );
};
