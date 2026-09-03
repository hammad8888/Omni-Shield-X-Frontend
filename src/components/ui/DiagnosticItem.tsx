import React from "react";
import type { DiagnosticStage } from "../../types";

interface DiagnosticItemProps {
  stage: DiagnosticStage;
  className?: string;
}

export const DiagnosticItem: React.FC<DiagnosticItemProps> = ({ stage, className = "" }) => {
  let icon = "⏳";
  let statusClass = "text-slate-400 bg-slate-100 border-slate-200";
  let statusText = "Pending";

  if (stage.status === "running") {
    icon = "🔄";
    statusClass = "text-blue-700 bg-blue-50 border-blue-200 animate-pulse";
    statusText = "Verifying...";
  } else if (stage.status === "passed") {
    icon = "✓";
    statusClass = "text-emerald-700 bg-emerald-50 border-emerald-200 font-bold";
    statusText = "Passed";
  } else if (stage.status === "warning") {
    icon = "⚠️";
    statusClass = "text-amber-700 bg-amber-50 border-amber-200 font-bold";
    statusText = "Warning";
  } else if (stage.status === "failed") {
    icon = "✕";
    statusClass = "text-rose-700 bg-rose-50 border-rose-200 font-bold";
    statusText = "Failed";
  }

  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-xl border bg-white shadow-subtle ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className={`h-7 w-7 rounded-lg border flex items-center justify-center text-xs ${statusClass}`}>
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">{stage.name}</span>
            <span className="text-[10px] uppercase font-semibold text-slate-400">
              {stage.category}
            </span>
          </div>
          {stage.detail && <p className="text-[11px] text-slate-500 mt-0.5">{stage.detail}</p>}
        </div>
      </div>

      <div className="text-right">
        <span className={`px-2 py-0.5 text-[11px] rounded-md border ${statusClass}`}>
          {statusText}
        </span>
        {stage.metric && (
          <span className="text-xs font-mono font-bold text-slate-800 block mt-1">
            {stage.metric}
          </span>
        )}
      </div>
    </div>
  );
};
