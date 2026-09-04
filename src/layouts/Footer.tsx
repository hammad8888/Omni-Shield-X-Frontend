import React from "react";
import { shouldMeasureInBrowser } from "../lib/hostMode";
import { useRealtime } from "../realtime";
import { useVisitorTelemetry } from "../visitorTelemetry";

export const Footer: React.FC = () => {
  const { transport, reason } = useRealtime();
  const visitor = useVisitorTelemetry();
  const browserOrigin = shouldMeasureInBrowser(visitor.capability);
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-500 sm:px-6">
      <div className="flex flex-col items-center justify-between gap-1 sm:flex-row">
        <span className="font-semibold text-slate-700">OmniShield-X · Professional Network Matrix & Analyzer</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-slate-600">
            <span className={`h-1.5 w-1.5 rounded-full ${transport === "LIVE" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            {browserOrigin
              ? "Visitor browser 1.2s WAN feed"
              : transport === "LIVE"
                ? "Socket.IO 1.0s Continuous Telemetry"
                : reason ?? "HTTP Polling Sync"}
          </span>
        </div>
      </div>
    </footer>
  );
};
