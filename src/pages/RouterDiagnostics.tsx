import React, { useState } from "react";
import { StatusBadge } from "../components/ui/StatusBadge";
import { routerService } from "../services/routerService";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

export const RouterDiagnosticsPage: React.FC = () => {
  const { status } = useNetworkStatus();
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string[]>(["Ready. Execute a live TCP probe to the gateway or 1.1.1.1."]);
  const [freshness, setFreshness] = useState<string>("UNAVAILABLE");

  const handleRunPing = async () => {
    setIsRunning(true);
    setOutput(["Probing…"]);
    try {
      const res = await routerService.ping(status?.gateway || "1.1.1.1");
      setFreshness(res.freshness ?? "UNAVAILABLE");
      setOutput(res.output?.length ? res.output : [res.reason || "No output"]);
    } catch (err) {
      setOutput([err instanceof Error ? err.message : "Probe failed"]);
      setFreshness("UNAVAILABLE");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Gateway diagnostic probe</h1>
          <p className="text-xs text-slate-500 mt-0.5">TCP connect timing from the collector. Not ICMP. Target: {status?.gateway || "1.1.1.1"}</p>
        </div>
        <button disabled={isRunning} onClick={() => void handleRunPing()} className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl disabled:opacity-60">
          {isRunning ? "Running…" : "Execute live probe"}
        </button>
      </div>
      <div className="dashboard-card p-5 bg-slate-900 text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
          <span className="font-mono text-slate-400">live-probe</span>
          <StatusBadge status={freshness === "LIVE" ? "passed" : "warning"} label={freshness} size="sm" />
        </div>
        <div className="mt-4 font-mono text-xs text-emerald-400 space-y-1 min-h-[120px]">
          {output.map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
