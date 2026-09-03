import React, { useState } from "react";

export interface DataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface LineChartProps {
  data: DataPoint[];
  primaryLabel?: string;
  secondaryLabel?: string;
  unit?: string;
  height?: number;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  primaryLabel = "Primary",
  secondaryLabel,
  unit = "Mbps",
  height = 200,
  className = "",
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-400 ${className}`}
        style={{ height }}
      >
        No chart data available
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 30, left: 45 };
  const chartWidth = 600;
  const chartHeight = height;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const allValues = data.flatMap((d) => [d.value, d.secondaryValue].filter((v): v is number => v !== undefined));
  const maxVal = Math.max(...allValues, 10);
  const minVal = 0;

  const getX = (index: number) => {
    if (data.length <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (data.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return padding.top + innerHeight - ((val - minVal) / (maxVal - minVal)) * innerHeight;
  };

  // Primary Path
  const primaryPoints = data.map((d, i) => `${getX(i)},${getY(d.value)}`);
  const primaryPath = `M ${primaryPoints.join(" L ")}`;

  // Secondary Path (if any)
  let secondaryPath = "";
  if (secondaryLabel && data.some((d) => d.secondaryValue !== undefined)) {
    const secPoints = data.map((d, i) => `${getX(i)},${getY(d.secondaryValue || 0)}`);
    secondaryPath = `M ${secPoints.join(" L ")}`;
  }

  // Grid lines
  const gridCount = 4;
  const yTicks = Array.from({ length: gridCount + 1 }, (_, i) => {
    const val = minVal + (i / gridCount) * (maxVal - minVal);
    return { val: Math.round(val), y: getY(val) };
  });

  return (
    <div className={`relative w-full ${className}`}>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto overflow-visible select-none"
      >
        {/* Horizontal Grid lines & Y Axis */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={tick.y}
              x2={chartWidth - padding.right}
              y2={tick.y}
              stroke="#F1F5F9"
              strokeWidth="1.5"
            />
            <text
              x={padding.left - 8}
              y={tick.y + 4}
              fontSize="10"
              fill="#94A3B8"
              textAnchor="end"
              fontWeight="500"
            >
              {tick.val}
            </text>
          </g>
        ))}

        {/* X Axis Labels */}
        {data.map((d, i) => {
          if (data.length > 8 && i % 2 !== 0 && i !== data.length - 1) return null;
          return (
            <text
              key={i}
              x={getX(i)}
              y={chartHeight - 8}
              fontSize="10"
              fill="#94A3B8"
              textAnchor="middle"
              fontWeight="500"
            >
              {d.label}
            </text>
          );
        })}

        {/* Secondary Line */}
        {secondaryPath && (
          <path
            d={secondaryPath}
            fill="none"
            stroke="#06B6D4"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Primary Line */}
        <path
          d={primaryPath}
          fill="none"
          stroke="#2563EB"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points & hover triggers */}
        {data.map((d, i) => (
          <g
            key={i}
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
            className="cursor-pointer"
          >
            <circle
              cx={getX(i)}
              cy={getY(d.value)}
              r={hoverIndex === i ? 6 : 4}
              fill="#2563EB"
              stroke="#FFFFFF"
              strokeWidth="2"
              className="transition-all"
            />
            {d.secondaryValue !== undefined && (
              <circle
                cx={getX(i)}
                cy={getY(d.secondaryValue)}
                r={hoverIndex === i ? 6 : 4}
                fill="#06B6D4"
                stroke="#FFFFFF"
                strokeWidth="2"
                className="transition-all"
              />
            )}
            {/* Transparent wide rect for hover capture */}
            <rect
              x={getX(i) - 15}
              y={padding.top}
              width="30"
              height={innerHeight}
              fill="transparent"
            />
          </g>
        ))}

        {/* Hover Guideline */}
        {hoverIndex !== null && (
          <line
            x1={getX(hoverIndex)}
            y1={padding.top}
            x2={getX(hoverIndex)}
            y2={padding.top + innerHeight}
            stroke="#94A3B8"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}
      </svg>

      {/* Floating Tooltip */}
      {hoverIndex !== null && data[hoverIndex] && (
        <div
          className="absolute pointer-events-none z-10 bg-slate-900 text-white rounded-lg px-3 py-2 text-xs shadow-xl transition-all duration-100"
          style={{
            left: `${((getX(hoverIndex) / chartWidth) * 100).toFixed(1)}%`,
            top: "10px",
            transform: "translateX(-50%)",
          }}
        >
          <p className="font-bold text-slate-300">{data[hoverIndex].label}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <span>
              {primaryLabel}: <b className="text-white">{data[hoverIndex].value} {unit}</b>
            </span>
          </div>
          {data[hoverIndex].secondaryValue !== undefined && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span>
                {secondaryLabel}: <b className="text-white">{data[hoverIndex].secondaryValue} {unit}</b>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
