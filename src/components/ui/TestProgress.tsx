import React from "react";
import type { SpeedTestProgress } from "../../types";

export const TestProgress: React.FC<{ progress: SpeedTestProgress; className?: string }> = ({
  progress,
  className = "",
}) => {
  const steps = [
    {
      id: "ping",
      label: "Ping",
      active: progress.phase === "connecting" || progress.phase === "testing_latency",
      done: ["testing_download", "testing_upload", "finalizing", "completed"].includes(progress.phase),
      color: "from-cyan-500 to-blue-500",
    },
    {
      id: "down",
      label: "Download",
      active: progress.phase === "testing_download",
      done: ["testing_upload", "finalizing", "completed"].includes(progress.phase),
      color: "from-blue-600 to-indigo-600",
    },
    {
      id: "up",
      label: "Upload",
      active: progress.phase === "testing_upload" || progress.phase === "finalizing",
      done: progress.phase === "completed",
      color: "from-purple-600 to-pink-600",
    },
  ];

  const pct = Math.min(100, Math.max(0, progress.progressPercent));

  return (
    <div className={`mx-auto w-full max-w-lg ${className}`}>
      {/* Progress header */}
      <div className="mb-2 flex items-center justify-between text-xs font-mono">
        <span className="font-medium text-slate-600">Test Execution Progress</span>
        <span className="font-bold text-slate-900">{pct}%</span>
      </div>

      {/* Animated Glowing Progress Bar */}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 shadow-sm transition-[width] duration-200 ease-out relative overflow-hidden"
          style={{ width: `${pct}%` }}
        >
          {/* Shimmer light sweep animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[pulse_1.5s_ease-in-out_infinite]" />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
        {steps.map((step) => {
          const isDone = step.done;
          const isActive = step.active;

          return (
            <div
              key={step.id}
              className={`flex flex-col items-center gap-1 rounded-xl p-2 transition-all ${
                isActive
                  ? "bg-slate-100/90 ring-1 ring-slate-300 font-semibold shadow-xs"
                  : isDone
                  ? "bg-emerald-50/60 font-medium"
                  : "bg-slate-50/50 text-slate-400 opacity-70"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isActive
                      ? "bg-blue-600 animate-ping"
                      : isDone
                      ? "bg-emerald-500"
                      : "bg-slate-300"
                  }`}
                />
                <span
                  className={`text-xs ${
                    isActive
                      ? "text-slate-900 font-semibold"
                      : isDone
                      ? "text-emerald-700"
                      : "text-slate-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                {isDone ? "Done ✓" : isActive ? "Running…" : "Pending"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

