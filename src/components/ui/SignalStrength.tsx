import React from "react";

interface SignalStrengthProps {
  dbm: number | null | undefined;
  showText?: boolean;
  showPercent?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const SignalStrength: React.FC<SignalStrengthProps> = ({
  dbm,
  showText = true,
  showPercent = false,
  size = "md",
  className = "",
}) => {
  if (dbm == null) {
    return <span className={`text-xs font-semibold text-slate-400 ${className}`}>—</span>;
  }
  // Signal classifications:
  // Excellent: > -50 dBm
  // Good: -50 to -60 dBm
  // Fair: -60 to -70 dBm
  // Weak: -70 to -80 dBm
  // Critical: < -80 dBm

  let activeBars = 1;
  let label = "Critical";
  let colorClass = "bg-rose-500 text-rose-700";

  if (dbm >= -50) {
    activeBars = 4;
    label = "Excellent";
    colorClass = "bg-emerald-500 text-emerald-700";
  } else if (dbm >= -60) {
    activeBars = 3;
    label = "Good";
    colorClass = "bg-blue-500 text-blue-700";
  } else if (dbm >= -70) {
    activeBars = 2;
    label = "Fair";
    colorClass = "bg-amber-500 text-amber-700";
  } else if (dbm >= -80) {
    activeBars = 1;
    label = "Weak";
    colorClass = "bg-rose-400 text-rose-600";
  } else {
    activeBars = 0;
    label = "Critical";
    colorClass = "bg-rose-600 text-rose-700";
  }

  // Calculate approximate percentage (from -100 dBm to -30 dBm)
  const percent = Math.min(100, Math.max(0, Math.round(((dbm + 100) / 70) * 100)));

  const barHeights = ["h-1.5", "h-2.5", "h-3.5", "h-4.5"];
  const barWidth = size === "lg" ? "w-1.5" : size === "sm" ? "w-0.5" : "w-1";

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* 4-bar Signal Icon */}
      <div className="flex items-end gap-0.5 h-5 px-0.5">
        {[0, 1, 2, 3].map((idx) => {
          const isActive = idx < activeBars;
          return (
            <div
              key={idx}
              className={`${barWidth} ${barHeights[idx]} rounded-full transition-all duration-300 ${
                isActive ? colorClass.split(" ")[0] : "bg-slate-200"
              }`}
            />
          );
        })}
      </div>

      {showText && (
        <div className="flex flex-col text-left leading-none">
          <span className="text-xs font-bold text-slate-800">{dbm} dBm</span>
          <span className="text-[10px] font-medium text-slate-500">
            {label} {showPercent && `(${percent}%)`}
          </span>
        </div>
      )}
    </div>
  );
};
