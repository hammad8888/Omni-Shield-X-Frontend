import React from "react";
import { NavLink } from "react-router-dom";
import { useRealtime } from "../realtime";

const NAV = [
  {
    title: "Diagnostics & Performance",
    items: [
      { to: "/", label: "Dashboard", icon: "⚡" },
      { to: "/speedtest", label: "Speed Analyzer", icon: "🚀" },
      { to: "/gaming", label: "Gaming & Matrix", icon: "🎮" },
      { to: "/streaming", label: "Streaming Quality", icon: "🎬" },
      { to: "/ping", label: "Ping & DNS", icon: "📡" },
    ],
  },
  {
    title: "Network & Hardware",
    items: [
      { to: "/wifi", label: "Wi-Fi & Spectrum", icon: "📶" },
      { to: "/devices", label: "Connected Devices", icon: "📱" },
      { to: "/router", label: "Router & Modem", icon: "🌐" },
      { to: "/ethernet", label: "Ethernet & Hardware", icon: "🔌" },
    ],
  },
  {
    title: "System & Cloud",
    items: [
      { to: "/settings", label: "Settings & Deploy", icon: "⚙️" },
    ],
  },
];

export const Sidebar: React.FC<{ onCloseMobile?: () => void }> = ({ onCloseMobile }) => {
  const { transport, snapshot, reason } = useRealtime();
  const live = transport === "LIVE";
  const ssid = snapshot?.wifi?.ssid ?? (snapshot?.wifi?.gateway ? "Connected LAN" : "Active Interface");

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white text-slate-700">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-sm">
          OX
        </div>
        <div>
          <h1 className="text-sm font-extrabold tracking-wider text-slate-900">OMNISHIELD<span className="text-blue-600">.X</span></h1>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Pro Network Matrix</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{group.title}</p>
            <div className="mt-1 space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-bold border border-blue-100 shadow-2xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`
                  }
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Real-time Status Card */}
      <div className="border-t border-slate-100 p-3 bg-slate-50 m-3 rounded-2xl border">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${live ? "bg-emerald-500 animate-pulse" : transport === "STALE" ? "bg-amber-500" : "bg-rose-500"}`} />
            {live ? "Realtime Live" : transport === "STALE" ? "HTTP Polling" : "Offline"}
          </span>
          <span className="rounded bg-white border border-slate-200 px-1.5 py-0.5 font-mono text-[9px] text-blue-700 font-bold">1.0s Feed</span>
        </div>
        <p className="mt-1.5 truncate text-[11px] font-mono text-slate-500">
          {ssid ? `Link: ${ssid}` : "Detecting interface..."}
        </p>
        {reason && !live ? <p className="mt-1 text-[10px] text-amber-700">{reason}</p> : null}
      </div>
    </aside>
  );
};
