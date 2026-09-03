import React, { useEffect, useRef } from "react";
import type { SpeedTestPhase } from "../../types";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";

interface SpeedGaugeProps {
  speedMbps: number;
  phase: SpeedTestPhase;
  pingMs?: number;
  jitterMs?: number;
  downloadMbps?: number;
  uploadMbps?: number;
  scaleMax?: 100 | 500 | 1000 | "auto";
  unitOverride?: "Mbps" | "MB/s" | "kB/s";
  className?: string;
}

const R = 78;
const CX = 100;
const CY = 100;
const ARC_LEN = (270 / 360) * 2 * Math.PI * R;

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + radius * Math.sin(rad),
    y: CY - radius * Math.cos(rad),
  };
}

function formatWithUnit(mbps: number | null | undefined, unit: "Mbps" | "MB/s" | "kB/s") {
  if (mbps == null || Number.isNaN(mbps) || mbps <= 0) {
    return { value: "0.0", unit };
  }
  if (unit === "MB/s") {
    const val = mbps / 8;
    return { value: val >= 100 ? val.toFixed(0) : val.toFixed(1), unit: "MB/s" };
  }
  if (unit === "kB/s") {
    const val = mbps * 125;
    return { value: val >= 1000 ? Math.round(val).toLocaleString() : val.toFixed(0), unit: "kB/s" };
  }
  return { value: mbps >= 100 ? mbps.toFixed(0) : mbps.toFixed(1), unit: "Mbps" };
}

export const SpeedGauge: React.FC<SpeedGaugeProps> = ({
  speedMbps,
  phase,
  pingMs = 0,
  jitterMs = 0,
  downloadMbps = 0,
  uploadMbps = 0,
  scaleMax = "auto",
  unitOverride = "Mbps",
  className = "",
}) => {
  const chasing = phase === "testing_download" || phase === "testing_upload";
  const animatedMbps = useAnimatedNumber(Math.max(0, speedMbps), chasing ? 100 : 200);
  const live = formatWithUnit(animatedMbps, unitOverride);
  const down = formatWithUnit(downloadMbps || null, unitOverride);
  const up = formatWithUnit(uploadMbps || null, unitOverride);
  const maxRef = useRef(250);

  useEffect(() => {
    if (phase === "idle" || phase === "error") maxRef.current = 250;
  }, [phase]);

  let max = 250;
  if (scaleMax === 100 || scaleMax === 500 || scaleMax === 1000) {
    max = scaleMax;
  } else {
    const needed = Math.max(animatedMbps, downloadMbps, 1);
    const nextMax = needed > 800 ? 1000 : needed > 400 ? 500 : needed > 200 ? 250 : 100;
    if (nextMax > maxRef.current) maxRef.current = nextMax;
    max = maxRef.current;
  }

  const ratio = Math.min(1, Math.max(0, animatedMbps / max));
  const angle = -135 + ratio * 270;

  const ticks =
    max === 1000
      ? [0, 250, 500, 750, 1000]
      : max === 500
      ? [0, 100, 250, 400, 500]
      : max === 250
      ? [0, 50, 100, 175, 250]
      : [0, 25, 50, 75, 100];

  const start = polar(-135, R);
  const end = polar(135, R);

  const phaseConfig = {
    idle: { label: "Ready to Test", color: "text-slate-500", dot: "bg-slate-400", gradId: "lightGaugeBlue" },
    connecting: { label: "Connecting...", color: "text-amber-600", dot: "bg-amber-500 animate-ping", gradId: "lightGaugeAmber" },
    selecting_server: { label: "Selecting Server...", color: "text-amber-600", dot: "bg-amber-500", gradId: "lightGaugeAmber" },
    testing_latency: { label: "Measuring Ping & Jitter...", color: "text-blue-600", dot: "bg-blue-500 animate-ping", gradId: "lightGaugeBlue" },
    testing_download: { label: "Downloading Multi-stream...", color: "text-blue-600", dot: "bg-blue-500 animate-pulse", gradId: "lightGaugeBlue" },
    testing_upload: { label: "Uploading Multi-stream...", color: "text-purple-600", dot: "bg-purple-500 animate-pulse", gradId: "lightGaugePurple" },
    finalizing: { label: "Synthesizing Metrics...", color: "text-indigo-600", dot: "bg-indigo-500 animate-pulse", gradId: "lightGaugeBlue" },
    completed: { label: "Benchmark Complete", color: "text-emerald-600", dot: "bg-emerald-500", gradId: "lightGaugeEmerald" },
    error: { label: "Benchmark Failed", color: "text-rose-600", dot: "bg-rose-500", gradId: "lightGaugeRose" },
  }[phase] || { label: "Ready to Test", color: "text-slate-500", dot: "bg-slate-400", gradId: "lightGaugeBlue" };

  return (
    <div className={`flex w-full flex-col items-center justify-center ${className}`}>
      {/* Central Interactive Gauge */}
      <div className="relative flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80">
        <svg viewBox="0 0 200 200" className="h-full w-full select-none overflow-visible">
          <defs>
            <linearGradient id="lightGaugeBlue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="60%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="lightGaugePurple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="60%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6d28d9" />
            </linearGradient>
            <linearGradient id="lightGaugeEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="60%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="lightGaugeAmber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id="lightGaugeRose" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fda4af" />
              <stop offset="60%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
          </defs>

          {/* Outer Ring Track */}
          <path
            d={`M ${start.x} ${start.y} A ${R} ${R} 0 1 1 ${end.x} ${end.y}`}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Active Value Arc */}
          <path
            d={`M ${start.x} ${start.y} A ${R} ${R} 0 1 1 ${end.x} ${end.y}`}
            fill="none"
            stroke={`url(#${phaseConfig.gradId})`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={ARC_LEN}
            strokeDashoffset={ARC_LEN * (1 - ratio)}
            className="transition-all duration-150 ease-out"
          />

          {/* Tick Marks & Scale Numbers */}
          {ticks.map((val) => {
            const tRatio = val / max;
            const tAngle = -135 + tRatio * 270;
            const pInner = polar(tAngle, R - 13);
            const pOuter = polar(tAngle, R - 7);
            const pText = polar(tAngle, R - 23);
            const isActive = ratio >= tRatio;

            return (
              <g key={val}>
                <line
                  x1={pInner.x}
                  y1={pInner.y}
                  x2={pOuter.x}
                  y2={pOuter.y}
                  stroke={isActive ? "#2563eb" : "#cbd5e1"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <text
                  x={pText.x}
                  y={pText.y}
                  fontSize="8.5"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isActive ? "#0f172a" : "#94a3b8"}
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Center Needle Pointer */}
          {(() => {
            const tip = polar(angle, R - 12);
            const baseL = polar(angle - 90, 5);
            const baseR = polar(angle + 90, 5);
            return (
              <g className="transition-all duration-150 ease-out">
                <polygon
                  points={`${tip.x},${tip.y} ${baseL.x},${baseL.y} ${CX},${CY} ${baseR.x},${baseR.y}`}
                  fill="#0f172a"
                  filter="drop-shadow(0px 1px 3px rgba(0,0,0,0.15))"
                />
                <circle cx={CX} cy={CY} r="6" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
              </g>
            );
          })()}
        </svg>

        {/* Center Digital Head-Up Display */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
            {live.value}
          </span>
          <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-blue-600 -mt-1">
            {live.unit}
          </span>
          {/* Phase Badge */}
          <div className="mt-2 flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 shadow-2xs">
            <span className={`h-1.5 w-1.5 rounded-full ${phaseConfig.dot}`} />
            <span className={`text-[10px] font-semibold ${phaseConfig.color}`}>
              {phaseConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Metric Breakdown Strip */}
      <div className="mt-4 grid w-full max-w-md grid-cols-4 gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-center shadow-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Ping</span>
          <span className="font-mono text-sm font-extrabold text-slate-900">
            {pingMs > 0 ? `${pingMs.toFixed(0)}` : "—"}
            <span className="text-[10px] font-normal text-slate-500 ml-0.5">ms</span>
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Jitter</span>
          <span className="font-mono text-sm font-extrabold text-slate-900">
            {jitterMs > 0 ? `${jitterMs.toFixed(1)}` : "—"}
            <span className="text-[10px] font-normal text-slate-500 ml-0.5">ms</span>
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Download</span>
          <span className="font-mono text-sm font-extrabold text-blue-600">
            {downloadMbps > 0 ? down.value : "—"}
            <span className="text-[10px] font-normal text-slate-500 ml-0.5">{down.unit}</span>
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Upload</span>
          <span className="font-mono text-sm font-extrabold text-purple-600">
            {uploadMbps > 0 ? up.value : "—"}
            <span className="text-[10px] font-normal text-slate-500 ml-0.5">{up.unit}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
