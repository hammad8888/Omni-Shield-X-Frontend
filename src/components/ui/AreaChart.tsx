import React from "react";

export interface AreaDataPoint {
  label: string;
  value: number;
}

interface AreaChartProps {
  data: AreaDataPoint[];
  color?: string;
  fillColor?: string;
  unit?: string;
  height?: number;
  className?: string;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  color = "#2563EB",
  fillColor,
  unit,
  height = 180,
  className = "",
}) => {
  if (!data || data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-400 ${className}`}
        style={{ height }}
      >
        No chart data
      </div>
    );
  }

  const padding = { top: 15, right: 15, bottom: 25, left: 40 };
  const chartWidth = 500;
  const chartHeight = height;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.value), 10);
  const minVal = 0;

  const getX = (index: number) => {
    if (data.length <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (data.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return padding.top + innerHeight - ((val - minVal) / (maxVal - minVal)) * innerHeight;
  };

  const linePoints = data.map((d, i) => `${getX(i)},${getY(d.value)}`);
  const linePath = `M ${linePoints.join(" L ")}`;
  const areaPath = `${linePath} L ${getX(data.length - 1)},${padding.top + innerHeight} L ${getX(0)},${
    padding.top + innerHeight
  } Z`;

  return (
    <div className={`w-full ${className}`}>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id={`areaGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={fillColor ? 0.35 : 0.25} />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio, i) => {
          const y = padding.top + innerHeight * ratio;
          const val = Math.round(maxVal * (1 - ratio));
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke="#F1F5F9"
                strokeWidth="1.5"
              />
              <text x={padding.left - 6} y={y + 4} fontSize="9" fill="#94A3B8" textAnchor="end">
                {val} {unit ? `(${unit})` : ""}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#areaGrad-${color})`} />

        {/* Top stroke line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />

        {/* Points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={getX(i)}
            cy={getY(d.value)}
            r="3.5"
            fill={color}
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        ))}
      </svg>
    </div>
  );
};
