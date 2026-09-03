import React from "react";
import type { SpeedTestResult } from "../../types";
import { StatusBadge } from "./StatusBadge";
import { speedParts, usePrefs } from "../../prefs";

interface TestResultProps {
  result: SpeedTestResult;
  onRetest?: () => void;
  onShare?: () => void;
  className?: string;
}

export const TestResult: React.FC<TestResultProps> = ({
  result,
  onRetest,
  onShare,
  className = "",
}) => {
  const { speedUnit } = usePrefs();
  const down = speedParts(result.downloadMbps, speedUnit);
  const up = speedParts(result.uploadMbps, speedUnit);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Result</h3>
            <StatusBadge status="passed" label={result.rating} size="sm" />
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {result.timestamp} · {result.networkName} · {result.connectionType}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onShare ? (
            <button onClick={onShare} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              Copy
            </button>
          ) : null}
          {onRetest ? (
            <button onClick={onRetest} className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800">
              Test again
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Download", value: down.value, unit: down.unit },
          { label: "Upload", value: up.value, unit: up.unit },
          { label: "Ping", value: result.pingMs || "—", unit: "ms" },
          { label: "Jitter", value: result.jitterMs || "—", unit: "ms" },
        ].map((row) => (
          <div key={row.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{row.label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-slate-900">{row.value}</p>
            <p className="text-[11px] text-slate-500">{row.unit}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2 rounded-xl border border-slate-200 p-3 text-xs sm:grid-cols-2">
        <div>
          <p className="text-slate-400">Server</p>
          <p className="mt-0.5 font-medium text-slate-800">{result.server.name}</p>
        </div>
        <div>
          <p className="text-slate-400">ISP</p>
          <p className="mt-0.5 font-medium text-slate-800">{result.isp}</p>
        </div>
      </div>
    </div>
  );
};
