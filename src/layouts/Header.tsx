import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useRealtime } from "../realtime";

export const Header: React.FC<{ onToggleSidebar?: () => void }> = ({ onToggleSidebar }) => {
  const { status } = useNetworkStatus();
  const { transport } = useRealtime();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.toLowerCase();
    if (q.includes("game") || q.includes("pubg") || q.includes("valorant") || q.includes("cs2")) navigate("/gaming");
    else if (q.includes("speed") || q.includes("bandwidth") || q.includes("download") || q.includes("upload")) navigate("/speedtest");
    else if (q.includes("wifi") || q.includes("signal") || q.includes("channel") || q.includes("spectrum")) navigate("/wifi");
    else if (q.includes("device") || q.includes("client") || q.includes("mac") || q.includes("ip")) navigate("/devices");
    else if (q.includes("dns") || q.includes("ping") || q.includes("latency") || q.includes("icmp")) navigate("/ping");
    else if (q.includes("router") || q.includes("modem") || q.includes("gateway") || q.includes("firewall")) navigate("/router");
    else if (q.includes("stream") || q.includes("video") || q.includes("youtube") || q.includes("netflix") || q.includes("chrome")) navigate("/streaming");
    else if (q.includes("ethernet") || q.includes("nic") || q.includes("adapter") || q.includes("hardware")) navigate("/ethernet");
    else if (q.includes("setting") || q.includes("cloud") || q.includes("vercel") || q.includes("render")) navigate("/settings");
    else navigate("/");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {onToggleSidebar ? (
          <button
            onClick={onToggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 lg:hidden hover:bg-slate-100"
            aria-label="Menu"
          >
            ☰
          </button>
        ) : null}
        <Link to="/" className="flex items-center gap-2.5 lg:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-xs font-black text-white shadow-xs">OX</span>
          <span className="text-sm font-extrabold text-slate-900">OmniShield</span>
        </Link>
      </div>

      {/* Quick Jump Search Engine */}
      <form onSubmit={onSearch} className="mx-4 hidden max-w-md flex-1 md:block">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search PUBG, Speed, 4K Stream, Wi-Fi, Router, Ping..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
        </div>
      </form>

      {/* Status & Quick Actions */}
      <div className="flex items-center gap-3">
        {status?.publicIp && (
          <span className="hidden font-mono text-[11px] text-slate-600 sm:inline bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-semibold">
            IP: <strong className="text-slate-900">{status.publicIp}</strong>
          </span>
        )}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-bold border ${
            transport === "LIVE"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : transport === "STALE"
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-slate-100 text-slate-500 border-slate-200"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${transport === "LIVE" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
          {transport === "LIVE" ? "LIVE" : transport === "STALE" ? "POLL" : "OFF"}
        </span>
        <Link
          to="/speedtest"
          className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-all"
        >
          Speed Test →
        </Link>
      </div>
    </header>
  );
};
