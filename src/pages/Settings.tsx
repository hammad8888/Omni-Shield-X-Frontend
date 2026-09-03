import React, { useState } from "react";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { SPEED_UNIT_OPTIONS, usePrefs, type SpeedUnit } from "../prefs";
import { dash } from "../lib/format";
import { PageHeader } from "../components/ui/PageHeader";
import { useRealtime } from "../realtime";
import { API_BASE } from "../api";

const POLLS = [
  { ms: 1000, label: "1 second (HTTP fallback)" },
  { ms: 2000, label: "2 seconds" },
  { ms: 3000, label: "3 seconds" },
  { ms: 5000, label: "5 seconds" },
  { ms: 10000, label: "10 seconds" },
];

export const SettingsPage: React.FC = () => {
  const { status } = useNetworkStatus();
  const { speedUnit, pollIntervalMs, setSpeedUnit, setPollIntervalMs } = usePrefs();
  const { transport, reason } = useRealtime();

  // Deployment tester state
  const [testUrl, setTestUrl] = useState(API_BASE || window.location.origin);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestBackend = async () => {
    setTestStatus("testing");
    setTestResult(null);
    try {
      const fullUrl = testUrl.replace(/\/+$/, "") + "/health";
      const start = Date.now();
      const res = await fetch(fullUrl);
      const elapsed = Date.now() - start;
      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        setTestStatus("success");
        setTestResult(`✅ Connected! HTTP ${res.status} in ${elapsed}ms. API Version: ${(body as { version?: string })?.version || "1.0.0"}`);
      } else {
        setTestStatus("error");
        setTestResult(`❌ Server reachable but returned HTTP ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      setTestStatus("error");
      setTestResult(`❌ Connection Failed: ${err instanceof Error ? err.message : "Network error"}. Check CORS and URL.`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings & Cloud Deployment Hub"
        description="Configure display telemetry units, real-time sync intervals, and deploy OmniShield-X seamlessly on Vercel (Frontend) and Render (Backend)."
      />

      {/* Preferences Section */}
      <div className="dashboard-card p-6 space-y-4 text-xs">
        <h3 className="text-sm font-bold text-slate-900">Realtime & Display Preferences</h3>
        <p className="text-slate-500">
          Socket Status: <b className="text-blue-600">{transport}</b>
          {reason ? ` · ${reason}` : ""}
          . Real-time metrics sync every second over WebSockets with automatic reconnection.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="font-bold text-slate-700">Throughput Metric Unit</span>
            <select
              value={speedUnit}
              onChange={(e) => void setSpeedUnit(e.target.value as SpeedUnit)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
            >
              {SPEED_UNIT_OPTIONS.map((row) => (
                <option key={row.value} value={row.value}>
                  {row.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">{SPEED_UNIT_OPTIONS.find((row) => row.value === speedUnit)?.hint}</p>
          </label>

          <label className="block">
            <span className="font-bold text-slate-700">HTTP Polling Fallback Interval</span>
            <select
              value={pollIntervalMs}
              onChange={(e) => void setPollIntervalMs(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
            >
              {POLLS.map((row) => (
                <option key={row.ms} value={row.ms}>
                  {row.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">Used automatically if WebSocket disconnects.</p>
          </label>
        </div>
      </div>

      {/* Cloud Deployment Guide & Tester */}
      <div className="dashboard-card p-6 space-y-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200 mb-2">
            🚀 Vercel (Frontend) + Render (Backend)
          </span>
          <h3 className="text-base font-bold text-slate-900">Cloud Deployment Instructions</h3>
          <p className="text-xs text-slate-500 mt-1">
            OmniShield-X is engineered to run seamlessly with the React SPA hosted on <b>Vercel</b> and the Express/Socket.IO server hosted on <b>Render</b>.
          </p>
        </div>

        {/* Step 1: Render Backend */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm">Step 1: Deploy Backend to Render</h4>
            <span className="rounded bg-purple-100 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-700">Web Service</span>
          </div>
          <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 leading-relaxed">
            <li>Push this repository to your GitHub account.</li>
            <li>Log in to <a href="https://render.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">Render.com</a> and click <b>New +</b> → <b>Web Service</b>.</li>
            <li>Select your repository and configure the service:
              <ul className="list-disc pl-4 mt-1 space-y-0.5 font-mono text-[11px] text-slate-800">
                <li><b>Root Directory:</b> <span className="bg-white px-1 border rounded">backend</span></li>
                <li><b>Build Command:</b> <span className="bg-white px-1 border rounded">npm install && npm run build</span></li>
                <li><b>Start Command:</b> <span className="bg-white px-1 border rounded">npm start</span></li>
              </ul>
            </li>
            <li>In the <b>Environment Variables</b> tab on Render, add:
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] space-y-1 text-slate-800 mt-1">
                <div>NODE_ENV = <span className="text-blue-600">production</span></div>
                <div>PORT = <span className="text-blue-600">10000</span></div>
                <div>CORS_ORIGINS = <span className="text-blue-600">*</span></div>
                <div>MONGODB_URI = <span className="text-purple-600">mongodb+srv://... (or memory fallback)</span></div>
              </div>
            </li>
            <li>Deploy! Copy your assigned Render URL (e.g. <code className="bg-white px-1 border rounded text-blue-700">https://omnishield-api.onrender.com</code>).</li>
          </ol>
        </div>

        {/* Step 2: Vercel Frontend */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm">Step 2: Deploy Frontend to Vercel</h4>
            <span className="rounded bg-black px-2 py-0.5 font-mono text-[10px] font-bold text-white">Vercel SPA</span>
          </div>
          <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 leading-relaxed">
            <li>Log in to <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">Vercel.com</a> and click <b>Add New...</b> → <b>Project</b>.</li>
            <li>Import your GitHub repository and set:
              <ul className="list-disc pl-4 mt-1 space-y-0.5 font-mono text-[11px] text-slate-800">
                <li><b>Root Directory:</b> <span className="bg-white px-1 border rounded">frontend</span></li>
                <li><b>Framework Preset:</b> <span className="bg-white px-1 border rounded">Vite</span></li>
              </ul>
            </li>
            <li>In the <b>Environment Variables</b> section, add your Render backend URL:
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] space-y-1 text-slate-800 mt-1">
                <div>VITE_API_URL = <span className="text-blue-600">https://your-backend.onrender.com</span></div>
                <div>VITE_WS_URL = <span className="text-blue-600">https://your-backend.onrender.com</span></div>
              </div>
            </li>
            <li>Click <b>Deploy</b>. Vercel will automatically build the production bundle and route all SPA URLs via <code className="bg-white px-1 border rounded">vercel.json</code>.</li>
          </ol>
        </div>

        {/* Live Backend Connectivity Tester */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800">Live Backend Health & Connectivity Tester</h4>
          <p className="text-xs text-slate-600">
            Enter your Render backend URL below to test live HTTP and WebSocket connectivity:
          </p>

          <div className="flex gap-2">
            <input
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="https://your-backend.onrender.com"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-mono text-slate-900 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={() => void handleTestBackend()}
              disabled={testStatus === "testing" || !testUrl}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {testStatus === "testing" ? "Testing..." : "Test Connection"}
            </button>
          </div>

          {testResult && (
            <p
              className={`text-xs font-mono rounded-lg p-2.5 border ${
                testStatus === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              {testResult}
            </p>
          )}
        </div>
      </div>

      {/* Live Collector Sources */}
      <div className="dashboard-card p-6 space-y-3 text-xs">
        <h3 className="text-sm font-bold text-slate-900">Active Real-Time Telemetry Collectors</h3>
        <ul className="list-disc pl-5 space-y-1 text-slate-600 leading-relaxed">
          <li>WLAN Interface driver: Real-time 802.11 association, nearby BSSID beacon scanning, RSSI, channel metrics</li>
          <li>Host routing table: Default gateway hop and LAN subnet interface allocation</li>
          <li>ARP Cache: Subnet neighbor device discovery (IP + MAC + Vendor lookup)</li>
          <li>Cloudflare CDN: Live public WAN IP identification and multi-threaded throughput engine</li>
          <li>TCP Connect Probing: Low-jitter round-trip time measurements to game and DNS endpoints</li>
        </ul>
        <p className="text-slate-400 font-mono text-[11px]">
          Freshness: {dash(status?.freshness)} · Telemetry Source: {dash(status?.source)}
        </p>
      </div>
    </div>
  );
};
