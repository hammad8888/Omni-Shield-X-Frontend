import React from "react";
import type { HealthBreakdown } from "../../types";

interface HealthScoreProps {
  score: number;
  label?: string;
  status?: string;
  breakdowns?: HealthBreakdown[];
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const HealthScore: React.FC<HealthScoreProps> = ({
  score,
  label = "Network Health Score",
  status = "Excellent",
  breakdowns = [],
  size = "md",
  className = "",
}) => {
  const radius = size === "lg" ? 54 : size === "sm" ? 34 : 44;
  const strokeWidth = size === "lg" ? 10 : size === "sm" ? 6 : 8;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = "#22C55E"; // Emerald
  let bgFillClass = "text-emerald-600";
  if (score < 60) {
    strokeColor = "#EF4444"; // Rose
    bgFillClass = "text-rose-600";
  } else if (score < 80) {
    strokeColor = "#F59E0B"; // Amber
    bgFillClass = "text-amber-600";
  } else if (score < 90) {
    strokeColor = "#3B82F6"; // Blue
    bgFillClass = "text-blue-600";
  }

  const dimension = radius * 2;

  return (
    <div className={`dashboard-card p-5 sm:p-6 ${className}`}>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative flex items-center justify-center shrink-0">
          <svg height={dimension} width={dimension} className="rotate-[-90deg]">
            <circle
              stroke="#E2E8F0"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke={strokeColor}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference + " " + circumference}
              style={{ strokeDashoffset, transition: "stroke-dashoffset 0.8s ease-in-out" }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`text-3xl font-extrabold tracking-tight ${bgFillClass}`}>
              {score}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400">/ 100</span>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h3 className="text-base font-bold text-slate-900">{label}</h3>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {status}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Overall connectivity, DNS speed, packet stability, and Wi-Fi link parameters.
          </p>

          {breakdowns.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {breakdowns.map((b) => (
                <div key={b.category} className="bg-slate-50 border border-slate-200/80 rounded-lg p-2">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                    <span className="truncate">{b.category}</span>
                    <span className="font-bold text-slate-800">{b.score}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        b.score >= 90
                          ? "bg-emerald-500"
                          : b.score >= 75
                          ? "bg-blue-500"
                          : b.score >= 60
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${b.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
