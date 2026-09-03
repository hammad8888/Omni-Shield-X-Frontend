import React from "react";
import { StatusBadge, type StatusVariant } from "./StatusBadge";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: StatusVariant | string;
  statusLabel?: string;
  trend?: "up" | "down" | "neutral";
  trendPercentage?: number;
  sparkline?: number[];
  icon?: React.ReactNode;
  description?: string;
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  status,
  statusLabel,
  trend,
  trendPercentage,
  sparkline,
  icon,
  description,
  onClick,
  className = "",
}) => {
  // Generate sparkline SVG path
  const renderSparkline = () => {
    if (!sparkline || sparkline.length < 2) return null;
    const width = 80;
    const height = 28;
    const min = Math.min(...sparkline);
    const max = Math.max(...sparkline);
    const range = max - min || 1;

    const points = sparkline.map((val, idx) => {
      const x = (idx / (sparkline.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    });

    const pathData = `M ${points.join(" L ")}`;

    return (
      <svg
        width={width}
        height={height}
        className="overflow-visible stroke-brand-500 fill-none stroke-[2]"
      >
        <path d={pathData} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`dashboard-card dashboard-card-hover p-4 sm:p-5 ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon && <span className="text-slate-500">{icon}</span>}
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </span>
        </div>
        {status && <StatusBadge status={status} label={statusLabel} size="sm" />}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            {value}
          </span>
          {unit && <span className="text-sm font-semibold text-slate-500">{unit}</span>}
        </div>
        {renderSparkline()}
      </div>

      {(trend || trendPercentage !== undefined || description) && (
        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
          {trendPercentage !== undefined && (
            <div className="flex items-center gap-1">
              <span
                className={`font-semibold ${
                  trend === "up"
                    ? "text-emerald-600"
                    : trend === "down"
                    ? "text-rose-600"
                    : "text-slate-600"
                }`}
              >
                {trend === "up" ? "▲" : trend === "down" ? "▼" : "•"}{" "}
                {Math.abs(trendPercentage)}%
              </span>
              <span>vs previous</span>
            </div>
          )}
          {description && <span className="truncate text-slate-400">{description}</span>}
        </div>
      )}
    </div>
  );
};
