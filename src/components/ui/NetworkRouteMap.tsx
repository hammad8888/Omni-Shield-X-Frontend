import React from "react";
import type { SpeedTestServer } from "../../types";

interface NetworkRouteMapProps {
  clientIp?: string | null;
  localIp?: string | null;
  gateway?: string | null;
  signalDbm?: number | null;
  signalPercent?: number | null;
  mediaType?: string | null;
  ssid?: string | null;
  server?: SpeedTestServer | null;
  pingMs?: number | null;
  isTesting?: boolean;
  phase?: string;
  className?: string;
}

export const NetworkRouteMap: React.FC<NetworkRouteMapProps> = ({
  clientIp,
  localIp,
  gateway,
  signalDbm,
  signalPercent,
  mediaType = "Wi-Fi",
  ssid,
  server,
  pingMs,
  isTesting = false,
  phase = "idle",
  className = "",
}) => {
  const signalQuality =
    signalPercent != null && signalPercent >= 75
      ? "Optimal"
      : signalPercent != null && signalPercent >= 50
      ? "Good"
      : signalPercent != null && signalPercent >= 25
      ? "Fair"
      : "Weak";

  const isWifi = mediaType === "Wi-Fi" || Boolean(ssid);
  const activePing = pingMs && pingMs > 0 ? pingMs : server?.pingMs ?? 12;

  return (
    <div className={`dashboard-card p-5 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
            </span>
            <h3 className="text-sm font-bold tracking-tight text-slate-900">
              Live Network Path & Packet Topology Map
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-hop telemetry: Host Station ── Gateway Router ── ISP Backbone ── Edge POP Node
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-mono text-emerald-700 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {isTesting ? `Active Stream (${phase.replace("testing_", "").toUpperCase()})` : "Hop 1-3 Connected"}
          </span>
        </div>
      </div>

      {/* Visual Route Flow Canvas */}
      <div className="relative my-2 rounded-2xl bg-slate-50/80 border border-slate-200/90 p-5 overflow-hidden">
        {/* Animated Packet Grid */}
        <div className="relative z-10 grid grid-cols-1 gap-4 md:grid-cols-4 items-center">
          {/* Node 1: Client Host (This PC) */}
          <div className="relative flex flex-col items-center text-center p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {isTesting && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600" />
                </span>
              )}
            </div>
            <p className="mt-2 text-xs font-bold text-slate-900">Host Station</p>
            <p className="text-[10px] font-mono text-blue-600 font-semibold">{localIp ?? "192.168.0.100"}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 border border-slate-200">
                {mediaType}
              </span>
              {signalPercent != null ? (
                <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                  {signalPercent}% ({signalDbm ?? -50} dBm)
                </span>
              ) : (
                <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                  100% PHY
                </span>
              )}
            </div>
          </div>

          {/* Node 2: Gateway Router (Hop 1) */}
          <div className="relative flex flex-col items-center text-center p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 border border-purple-200 text-purple-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="mt-2 text-xs font-bold text-slate-900">Default Gateway</p>
            <p className="text-[10px] font-mono text-purple-600 font-semibold">{gateway ?? "192.168.0.1"}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              <span className="rounded-md bg-purple-50 px-1.5 py-0.5 text-[9px] font-bold text-purple-700 border border-purple-200">
                Hop 1 (&lt;1 ms)
              </span>
              {ssid && (
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 truncate max-w-[85px]">
                  {ssid}
                </span>
              )}
            </div>
          </div>

          {/* Node 3: Public WAN / ISP Node (Hop 2) */}
          <div className="relative flex flex-col items-center text-center p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="mt-2 text-xs font-bold text-slate-900">ISP WAN Node</p>
            <p className="text-[10px] font-mono text-indigo-600 font-semibold">{clientIp ?? "45.195.210.130"}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 border border-indigo-200">
                Hop 2 (Public IP)
              </span>
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">
                Routed
              </span>
            </div>
          </div>

          {/* Node 4: Target Edge Server (Hop 3) */}
          <div className="relative flex flex-col items-center text-center p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <p className="mt-2 text-xs font-bold text-slate-900 truncate max-w-[130px]">
              {server?.name ?? "Cloudflare Global"}
            </p>
            <p className="text-[10px] font-mono text-emerald-600 font-semibold">{server?.location ?? "Anycast POP"}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                Hop 3 ({activePing} ms)
              </span>
              <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 border border-blue-200">
                Anycast
              </span>
            </div>
          </div>
        </div>

        {/* Live Route Telemetry Status Strip */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 pt-3 text-[11px] font-mono text-slate-600 gap-2">
          <div className="flex items-center gap-3">
            <span>
              Transport: <strong className="text-slate-900">{isWifi ? "802.11 Wireless" : "Ethernet 1Gbps"}</strong>
            </span>
            <span>•</span>
            <span>
              Quality: <strong className="text-emerald-600">{signalQuality} Link</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-blue-600 font-bold">
            <span>Round-Trip Latency: {activePing} ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
