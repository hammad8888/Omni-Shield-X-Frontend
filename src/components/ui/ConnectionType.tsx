import React from "react";
import type { NetworkMediaType } from "../../types";
import { formatSpeed, usePrefs } from "../../prefs";

interface ConnectionTypeProps {
  type: NetworkMediaType;
  speedMbps?: number;
  className?: string;
}

export const ConnectionType: React.FC<ConnectionTypeProps> = ({
  type,
  speedMbps,
  className = "",
}) => {
  const { speedUnit } = usePrefs();
  let icon = "📶";
  let bgClass = "bg-blue-50 text-blue-700 border-blue-200/80";

  if (type === "Ethernet") {
    icon = "🔌";
    bgClass = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
  } else if (type === "Fiber") {
    icon = "⚡";
    bgClass = "bg-indigo-50 text-indigo-700 border-indigo-200/80";
  } else if (type === "Cellular") {
    icon = "📱";
    bgClass = "bg-amber-50 text-amber-700 border-amber-200/80";
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-semibold ${bgClass} ${className}`}
    >
      <span className="text-sm">{icon}</span>
      <span>{type}</span>
      {speedMbps ? <span className="opacity-80 font-normal">({formatSpeed(speedMbps, speedUnit)})</span> : null}
    </div>
  );
};
