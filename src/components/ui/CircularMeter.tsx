import React from "react";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";

interface CircularMeterProps {
  value: number;
  max?: number;
  min?: number;
  label: string;
  unit?: string;
  size?: number;
  strokeWidth?: number;
  colorScheme?: "blue" | "emerald" | "purple" | "cyan" | "amber" | "rose";
  delta?: number;
  sublabel?: string;
  icon?: string;
  className?: string;
}

export const CircularMeter: React.FC<CircularMeterProps> = ({
  value,
  max = 100,
  min = 0,
  label,
  unit = "",
  size = 180,
  strokeWidth = 12,
  colorScheme = "blue",
  delta,
  sublabel,
  icon,
  className = "",
}) => {
  const animatedValue = useAnimatedNumber(value, 200);
  const clamped = Math.min(max, Math.max(min, animatedValue));
  const ratio = (clamped - min) / (max - min || 1);

  const radius = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // 240 degree arc from -120 to 120
  const startAngle = -120;
  const endAngle = 120;
  const totalAngle = endAngle - startAngle;
  const currentAngle = startAngle + ratio * totalAngle;

  const polarToCartesian = (angleDeg: number, r: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const describeArc = (start: number, end: number, r: number) => {
    const p1 = polarToCartesian(start, r);
    const p2 = polarToCartesian(end, r);
    const largeArcFlag = end - start <= 180 ? "0" : "1";
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${p2.x} ${p2.y}`;
  };

  const bgPath = describeArc(startAngle, endAngle, radius);
  const valPath = ratio > 0 ? describeArc(startAngle, currentAngle, radius) : "";

  const themeColors = {
    blue: { start: "#60a5fa", end: "#2563eb" },
    emerald: { start: "#34d399", end: "#10b981" },
    purple: { start: "#c084fc", end: "#8b5cf6" },
    cyan: { start: "#38bdf8", end: "#06b6d4" },
    amber: { start: "#fbbf24", end: "#f59e0b" },
    rose: { start: "#fb7185", end: "#ef4444" },
  }[colorScheme];

  // Generate tick markers
  const tickCount = 9;
  const ticks = Array.from({ length: tickCount }).map((_, i) => {
    const angle = startAngle + (i / (tickCount - 1)) * totalAngle;
    const inner = polarToCartesian(angle, radius - strokeWidth / 2 - 4);
    const outer = polarToCartesian(angle, radius - strokeWidth / 2);
    return { inner, outer, active: i / (tickCount - 1) <= ratio };
  });

  return (
    <div className={`flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 bg-white shadow-xs ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible select-none">
          <defs>
            <linearGradient id={`lightMeterGrad-${colorScheme}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={themeColors.start} />
              <stop offset="100%" stopColor={themeColors.end} />
            </linearGradient>
          </defs>

          {/* Background Arc Track */}
          <path
            d={bgPath}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value Arc */}
          {valPath && (
            <path
              d={valPath}
              fill="none"
              stroke={`url(#lightMeterGrad-${colorScheme})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          )}

          {/* Segmented Ticks */}
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.inner.x}
              y1={t.inner.y}
              x2={t.outer.x}
              y2={t.outer.y}
              stroke={t.active ? themeColors.end : "#cbd5e1"}
              strokeWidth="1.5"
            />
          ))}

          {/* Needle / Indicator Head */}
          {(() => {
            const headPos = polarToCartesian(currentAngle, radius);
            return (
              <circle
                cx={headPos.x}
                cy={headPos.y}
                r={strokeWidth * 0.55}
                fill="#ffffff"
                stroke={themeColors.end}
                strokeWidth="2.5"
                className="drop-shadow-sm"
              />
            );
          })()}
        </svg>

        {/* Center Digital Display */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          {icon && <span className="text-sm mb-0.5">{icon}</span>}
          <span className="font-mono text-2xl font-black text-slate-900 tracking-tight">
            {animatedValue >= 100 ? animatedValue.toFixed(0) : animatedValue.toFixed(1)}
          </span>
          {unit && <span className="font-mono text-[10px] font-bold text-slate-500 -mt-0.5 uppercase">{unit}</span>}
        </div>
      </div>

      {/* Label and Delta Badge */}
      <div className="mt-2 flex flex-col items-center">
        <span className="text-xs font-bold text-slate-900">{label}</span>
        {sublabel && <span className="text-[10px] text-slate-500 mt-0.5">{sublabel}</span>}
        {delta !== undefined && (
          <span
            className={`mt-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold border ${
              delta >= 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {delta >= 0 ? "▲ +" : "▼ "}
            {Math.abs(delta).toFixed(1)} {unit}
          </span>
        )}
      </div>
    </div>
  );
};
