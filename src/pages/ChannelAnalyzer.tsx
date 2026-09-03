import React, { useState } from "react";
import { useWiFi } from "../hooks/useWiFi";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";

export const ChannelAnalyzerPage: React.FC = () => {
  const { channels24, channels5G, recommended24, recommended5, connectedChannel, reason, rescan, isScanning } = useWiFi();
  const [activeBand, setActiveBand] = useState<"2.4 GHz" | "5 GHz">("5 GHz");

  const activeChannels = activeBand === "2.4 GHz" ? channels24 : channels5G;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Channels"
        description="Occupancy from the last beacon scan on this PC."
        actions={
          <>
            <button onClick={() => void rescan()} disabled={isScanning} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60">
              {isScanning ? "Scanning…" : "Rescan"}
            </button>
            <div className="flex rounded-lg bg-slate-100 p-1 text-xs">
              <button onClick={() => setActiveBand("2.4 GHz")} className={`rounded-md px-3 py-1.5 ${activeBand === "2.4 GHz" ? "bg-white font-medium text-slate-900" : "text-slate-500"}`}>2.4 GHz</button>
              <button onClick={() => setActiveBand("5 GHz")} className={`rounded-md px-3 py-1.5 ${activeBand === "5 GHz" ? "bg-white font-medium text-slate-900" : "text-slate-500"}`}>5 GHz</button>
            </div>
          </>
        }
      />

      {/* Recommended Channel Highlight Box */}
      <div className="dashboard-card p-5 bg-gradient-to-r from-emerald-50/60 via-white to-white border-emerald-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-sm shrink-0">
              💡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold text-emerald-800 tracking-wider">
                  Spectrum Optimization
                </span>
                <StatusBadge status="passed" label="Recommended" size="sm" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
            Recommended Channel:{" "}
            <span className="text-emerald-700 font-mono">
              {activeBand === "2.4 GHz"
                ? recommended24 != null
                  ? `Channel ${recommended24}`
                  : "No scan yet"
                : recommended5 != null
                  ? `Channel ${recommended5}`
                  : "No scan yet"}
            </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {reason || "Recommendation uses observed beacon occupancy only."}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="px-3 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-subtle">
              Current AP Channel: {connectedChannel ?? "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Channel Spectrum Occupancy Grid */}
      <div className="dashboard-card p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4">
          {activeBand} Channel Distribution & Congestion Map
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeChannels.map((ch) => (
            <div
              key={ch.channel}
              className={`p-4 rounded-xl border transition-all ${
                ch.recommended
                  ? "bg-emerald-50/40 border-emerald-200/90 shadow-subtle"
                  : "bg-slate-50/60 border-slate-200/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400">Channel</span>
                  <div className="text-xl font-semibold text-slate-900 font-mono">Ch {ch.channel}</div>
                </div>
                <StatusBadge
                  status={
                    ch.overlapRating === "Clear"
                      ? "passed"
                      : ch.overlapRating === "Low Interference"
                      ? "good"
                      : "warning"
                  }
                  label={ch.overlapRating}
                  size="sm"
                />
              </div>

              <div className="mt-3 text-xs space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Frequency:</span>
                  <span className="font-mono text-slate-800 font-bold">{ch.centerFreqMhz} MHz</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Co-Channel APs:</span>
                  <span className="font-bold text-slate-800">{ch.networkCount} detected</span>
                </div>
              </div>

              {ch.networks.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Broadcasting SSIDs
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {ch.networks.map((n) => (
                      <span
                        key={n}
                        className="px-1.5 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded text-slate-700 truncate max-w-[150px]"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
