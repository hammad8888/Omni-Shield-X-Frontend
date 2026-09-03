import React, { useState, useMemo } from "react";

export interface TradingDataPoint {
  time?: string;
  label: string;
  value: number;
  volume?: number;
  secondaryValue?: number;
}

interface TradingWaveChartProps {
  data: TradingDataPoint[];
  title?: string;
  subtitle?: string;
  unit?: string;
  height?: number;
  colorScheme?: "blue" | "emerald" | "purple" | "cyan" | "amber" | "rose";
  showVolume?: boolean;
  showPeakLine?: boolean;
  showAvgLine?: boolean;
  showDeltaBadge?: boolean;
  className?: string;
}

export const TradingWaveChart: React.FC<TradingWaveChartProps> = ({
  data,
  title = "Real-Time Telemetry Stream",
  subtitle = "Live tick-by-tick continuous wave telemetry with momentum delta vectors",
  unit = "Mbps",
  height = 240,
  colorScheme = "blue",
  showVolume = true,
  showPeakLine = true,
  showAvgLine = true,
  showDeltaBadge = true,
  className = "",
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Normalize data points
  const points = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((d, i) => {
      const val = d.value;
      const prevVal = i > 0 ? data[i - 1].value : val;
      const volume = d.volume ?? Math.max(1, Math.round(val * 12 + ((i * 7) % 30)));
      return {
        label: d.label || `${i + 1}`,
        value: val,
        volume,
        isBull: val >= prevVal,
      };
    });
  }, [data]);

  if (points.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-xs text-slate-400 shadow-xs ${className}`}
        style={{ height }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-500 mb-2">
          📈
        </div>
        <span className="font-semibold text-slate-700">Waiting for live stream telemetry...</span>
        <span className="text-[11px] text-slate-400 mt-1">Connecting to real-time collector</span>
      </div>
    );
  }

  const latestPoint = points[points.length - 1];
  const prevPoint = points.length > 1 ? points[points.length - 2] : latestPoint;
  const delta = latestPoint.value - prevPoint.value;
  const isUp = delta >= 0;

  const allValues = points.map((p) => p.value);
  const minVal = Math.max(0, Math.min(...allValues) * 0.85);
  const maxVal = Math.max(...allValues, minVal + 1);
  const avgVal = points.reduce((acc, p) => acc + p.value, 0) / points.length;
  const peakVal = Math.max(...allValues);
  const maxVolume = Math.max(...points.map((p) => p.volume), 10);

  const padding = { top: 28, right: 35, bottom: showVolume ? 45 : 30, left: 45 };
  const chartWidth = 700;
  const chartHeight = height;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;
  const volumeHeight = showVolume ? 24 : 0;
  const waveHeight = innerHeight - volumeHeight;

  const getX = (index: number) => {
    if (points.length <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (points.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    if (maxVal === minVal) return padding.top + waveHeight / 2;
    return padding.top + waveHeight - ((val - minVal) / (maxVal - minVal)) * waveHeight;
  };

  // Build smooth cubic bezier spline curve
  const pathCoordinates = points.map((p, i) => ({ x: getX(i), y: getY(p.value) }));

  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length <= 1) return "";
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  };

  const waveLinePath = createSmoothPath(pathCoordinates);
  const waveAreaPath =
    pathCoordinates.length > 1
      ? `${waveLinePath} L ${pathCoordinates[pathCoordinates.length - 1].x},${padding.top + waveHeight} L ${pathCoordinates[0].x},${padding.top + waveHeight} Z`
      : "";

  const themeConfig = {
    blue: {
      primary: "#2563eb",
      gradStart: "rgba(37, 99, 235, 0.25)",
      gradEnd: "rgba(37, 99, 235, 0.0)",
      lightBadge: "bg-blue-50 text-blue-700 border-blue-200",
    },
    emerald: {
      primary: "#10b981",
      gradStart: "rgba(16, 185, 129, 0.25)",
      gradEnd: "rgba(16, 185, 129, 0.0)",
      lightBadge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    purple: {
      primary: "#8b5cf6",
      gradStart: "rgba(139, 92, 246, 0.25)",
      gradEnd: "rgba(139, 92, 246, 0.0)",
      lightBadge: "bg-purple-50 text-purple-700 border-purple-200",
    },
    cyan: {
      primary: "#06b6d4",
      gradStart: "rgba(6, 182, 212, 0.25)",
      gradEnd: "rgba(6, 182, 212, 0.0)",
      lightBadge: "bg-cyan-50 text-cyan-700 border-cyan-200",
    },
    amber: {
      primary: "#f59e0b",
      gradStart: "rgba(245, 158, 11, 0.25)",
      gradEnd: "rgba(245, 158, 11, 0.0)",
      lightBadge: "bg-amber-50 text-amber-700 border-amber-200",
    },
    rose: {
      primary: "#ef4444",
      gradStart: "rgba(239, 68, 68, 0.25)",
      gradEnd: "rgba(239, 68, 68, 0.0)",
      lightBadge: "bg-rose-50 text-rose-700 border-rose-200",
    },
  }[colorScheme];

  const gridTicks = [
    { val: minVal, y: getY(minVal) },
    { val: minVal + (maxVal - minVal) * 0.5, y: getY(minVal + (maxVal - minVal) * 0.5) },
    { val: maxVal, y: getY(maxVal) },
  ];

  const activePoint = hoverIndex !== null ? points[hoverIndex] : latestPoint;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs ${className}`}>
      {/* Top Header Bar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5">
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm" />
            </span>
            <h4 className="text-sm font-bold tracking-tight text-slate-900">{title}</h4>
            {showDeltaBadge && (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] font-bold border ${
                  isUp ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {isUp ? "▲ +" : "▼ "}
                {Math.abs(delta).toFixed(1)} {unit}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Active Ticker Readout */}
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Live Telemetry</span>
          <span className="font-mono text-lg font-black text-slate-900 tracking-tight">
            {activePoint.value.toFixed(1)}{" "}
            <span className="text-xs font-semibold text-slate-500">{unit}</span>
          </span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {/* Smooth Area Gradient */}
            <linearGradient id={`lightGrad-${colorScheme}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={themeConfig.primary} stopOpacity="0.22" />
              <stop offset="80%" stopColor={themeConfig.primary} stopOpacity="0.03" />
              <stop offset="100%" stopColor={themeConfig.primary} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={chartWidth - padding.right}
                y2={tick.y}
                stroke="#f1f5f9"
                strokeWidth="1.5"
              />
              <text
                x={padding.left - 8}
                y={tick.y + 3.5}
                fontSize="9.5"
                fill="#94a3b8"
                textAnchor="end"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="600"
              >
                {tick.val.toFixed(0)}
              </text>
            </g>
          ))}

          {/* Average Reference Line */}
          {showAvgLine && (
            <g>
              <line
                x1={padding.left}
                y1={getY(avgVal)}
                x2={chartWidth - padding.right}
                y2={getY(avgVal)}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                strokeWidth="1.2"
                opacity="0.8"
              />
              <text
                x={chartWidth - padding.right + 6}
                y={getY(avgVal) + 3}
                fontSize="8.5"
                fill="#64748b"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                AVG
              </text>
            </g>
          )}

          {/* Peak Reference Line */}
          {showPeakLine && (
            <g>
              <line
                x1={padding.left}
                y1={getY(peakVal)}
                x2={chartWidth - padding.right}
                y2={getY(peakVal)}
                stroke="#f59e0b"
                strokeDasharray="2 3"
                strokeWidth="1.2"
                opacity="0.8"
              />
              <text
                x={chartWidth - padding.right + 6}
                y={getY(peakVal) + 3}
                fontSize="8.5"
                fill="#d97706"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                PEAK
              </text>
            </g>
          )}

          {/* Volume Histogram Sub-bars */}
          {showVolume && (
            <g className="opacity-60">
              {points.map((p, i) => {
                const x = getX(i);
                const barWidth = Math.max(3, innerWidth / (points.length * 1.8));
                const vHeight = (p.volume / maxVolume) * volumeHeight;
                const y = padding.top + innerHeight - vHeight;
                return (
                  <rect
                    key={`vol-${i}`}
                    x={x - barWidth / 2}
                    y={y}
                    width={barWidth}
                    height={vHeight}
                    fill={p.isBull ? "#a7f3d0" : "#fecdd3"}
                    rx="1"
                  />
                );
              })}
            </g>
          )}

          {/* Filled Glow Area */}
          <path d={waveAreaPath} fill={`url(#lightGrad-${colorScheme})`} />

          {/* Smooth Spline Wave Path */}
          <path
            d={waveLinePath}
            fill="none"
            stroke={themeConfig.primary}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Trailing Dots */}
          {points.map((p, i) => {
            const x = getX(i);
            const y = getY(p.value);
            const isHovered = hoverIndex === i;
            const isLatest = i === points.length - 1;

            return (
              <g key={`pt-${i}`}>
                {/* Pulsing ring on the latest head point */}
                {isLatest && (
                  <circle
                    cx={x}
                    cy={y}
                    r="7"
                    fill="none"
                    stroke={themeConfig.primary}
                    strokeWidth="1.5"
                    opacity="0.6"
                    className="animate-ping"
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 5 : isLatest ? 4.5 : 2.5}
                  fill={isLatest ? "#ffffff" : themeConfig.primary}
                  stroke={themeConfig.primary}
                  strokeWidth={isLatest ? 2.5 : 1}
                  className="transition-all duration-150"
                />
              </g>
            );
          })}

          {/* Crosshair & Tooltip Overlay */}
          {points.map((_, i) => {
            const x = getX(i);
            return (
              <rect
                key={`hit-${i}`}
                x={x - innerWidth / (points.length * 2)}
                y={padding.top}
                width={innerWidth / points.length}
                height={innerHeight}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoverIndex(i)}
              />
            );
          })}

          {/* Active Hover Crosshair Line */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={padding.top + innerHeight}
                stroke="#cbd5e1"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(points[hoverIndex].value)}
                r="5.5"
                fill="#ffffff"
                stroke={themeConfig.primary}
                strokeWidth="2.5"
              />
            </g>
          )}
        </svg>

        {/* Floating Tooltip Pill */}
        {hoverIndex !== null && (
          <div
            className="pointer-events-none absolute top-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-1.5 shadow-lg backdrop-blur-md transition-all text-xs"
            style={{
              left: `${(getX(hoverIndex) / chartWidth) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-slate-500">T+{points[hoverIndex].label}</span>
              <span className="font-mono font-bold text-slate-900">
                {points[hoverIndex].value.toFixed(1)} {unit}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Benchmark Bar */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] font-mono text-slate-500">
        <div className="flex items-center gap-4">
          <span>
            PEAK: <strong className="text-amber-700">{peakVal.toFixed(1)}</strong> {unit}
          </span>
          <span>
            AVG: <strong className="text-blue-700">{avgVal.toFixed(1)}</strong> {unit}
          </span>
          <span>
            MIN: <strong className="text-slate-700">{minVal.toFixed(1)}</strong> {unit}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-slate-400">1000ms WebSocket Sync</span>
        </div>
      </div>
    </div>
  );
};
