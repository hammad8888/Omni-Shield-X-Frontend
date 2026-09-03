import React from "react";

export type StatusVariant =
  | "connected"
  | "limited"
  | "offline"
  | "testing"
  | "excellent"
  | "good"
  | "fair"
  | "poor"
  | "critical"
  | "passed"
  | "warning"
  | "failed"
  | "demo"
  | "neutral";

interface StatusBadgeProps {
  status: StatusVariant | string;
  label?: string;
  size?: "sm" | "md" | "lg";
  withPulse?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = "md",
  withPulse = false,
  className = "",
}) => {
  const norm = (status || "").toLowerCase();

  let bg = "bg-slate-100 text-slate-700 border-slate-200";
  let dotBg = "bg-slate-400";
  let pulseBg = "bg-slate-300";
  let displayLabel = label || status;

  if (norm === "connected" || norm === "passed" || norm === "excellent" || norm === "online" || norm === "active") {
    bg = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
    dotBg = "bg-emerald-500";
    pulseBg = "bg-emerald-400";
  } else if (norm === "good" || norm === "clear") {
    bg = "bg-blue-50 text-blue-700 border-blue-200/80";
    dotBg = "bg-blue-500";
    pulseBg = "bg-blue-400";
  } else if (norm === "warning" || norm === "fair" || norm === "limited" || norm === "idle") {
    bg = "bg-amber-50 text-amber-700 border-amber-200/80";
    dotBg = "bg-amber-500";
    pulseBg = "bg-amber-400";
  } else if (norm === "failed" || norm === "critical" || norm === "poor" || norm === "offline") {
    bg = "bg-rose-50 text-rose-700 border-rose-200/80";
    dotBg = "bg-rose-500";
    pulseBg = "bg-rose-400";
  } else if (norm === "demo" || norm === "sample") {
    bg = "bg-cyan-50 text-cyan-800 border-cyan-200";
    dotBg = "bg-cyan-500";
    pulseBg = "bg-cyan-400";
  } else if (norm === "testing" || norm === "running") {
    bg = "bg-indigo-50 text-indigo-700 border-indigo-200";
    dotBg = "bg-indigo-500";
    pulseBg = "bg-indigo-400";
  }

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-xs"
      : size === "lg"
      ? "px-3 py-1 text-sm font-semibold"
      : "px-2.5 py-0.5 text-xs font-medium";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-subtle ${bg} ${sizeClasses} ${className}`}
    >
      <span className="relative flex h-2 w-2 items-center justify-center">
        {withPulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseBg}`} />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotBg}`} />
      </span>
      <span className="capitalize">{displayLabel}</span>
    </span>
  );
};
