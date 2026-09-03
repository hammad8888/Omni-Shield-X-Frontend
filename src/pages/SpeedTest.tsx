import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSpeedTest } from "../hooks/useSpeedTest";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { formatSpeed } from "../prefs";
import { SpeedGauge } from "../components/ui/SpeedGauge";
import { TestProgress } from "../components/ui/TestProgress";
import { TestResult } from "../components/ui/TestResult";
import { SpeedChart } from "../components/charts/SpeedChart";
import { PageHeader } from "../components/ui/PageHeader";
import { NetworkRouteMap } from "../components/ui/NetworkRouteMap";

export const SpeedTestPage: React.FC = () => {
  const {
    progress,
    servers,
    selectedServer,
    setSelectedServer,
    connectionType,
    setConnectionType,
    history,
    startTest,
    resetTest,
    isTesting,
  } = useSpeedTest();

  const { status } = useNetworkStatus();
  const navigate = useNavigate();

  // User Selections
  const [selectedUnit, setSelectedUnit] = useState<"Mbps" | "MB/s" | "kB/s">("Mbps");
  const [selectedScale, setSelectedScale] = useState<100 | 500 | 1000 | "auto">("auto");
  const [showServerSelect, setShowServerSelect] = useState(false);

  const isCompleted = progress.phase === "completed";
  const latestResult = history[0];
  const previous = history[1];

  const runAgain = () => {
    resetTest();
    window.setTimeout(() => startTest(), 40);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Multi-Threaded Speed & Bandwidth Engine"
        description="High-precision parallel HTTP throughput benchmark with live vector telemetry, edge server routing, and latency under load."
        actions={
          <button
            onClick={() => navigate("/")}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50"
          >
            ← Live Telemetry Matrix
          </button>
        }
      />


      {/* Main Interactive Speedometer Gauge Card */}
      <div className="dashboard-card p-6 sm:p-8 flex flex-col items-center">
        <SpeedGauge
          speedMbps={progress.phase === "completed" ? progress.downloadMbps : progress.currentSpeedMbps}
          phase={progress.phase}
          pingMs={progress.pingMs}
          jitterMs={progress.jitterMs}
          downloadMbps={progress.downloadMbps}
          uploadMbps={progress.uploadMbps}
          scaleMax={selectedScale}
          unitOverride={selectedUnit}
        />

        {progress.phase === "idle" ? (
          <button
            onClick={startTest}
            className="mt-6 group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-blue-600 px-12 py-4 text-sm font-extrabold text-white shadow-md hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />
            <span>START BENCHMARK ({connectionType.toUpperCase()})</span>
          </button>
        ) : null}

        {progress.phase === "error" ? (
          <div className="mt-6 flex flex-col items-center rounded-xl border border-rose-200 bg-rose-50 px-6 py-4 text-center">
            <p className="text-sm font-semibold text-rose-800">The collector did not return a valid speed sample.</p>
            <button
              onClick={runAgain}
              className="mt-2 text-xs font-bold text-rose-700 underline hover:text-rose-900"
            >
              Retry Test
            </button>
          </div>
        ) : null}

        {isTesting ? (
          <div className="mt-8 w-full">
            <TestProgress progress={progress} />
          </div>
        ) : null}

        {isCompleted && latestResult ? (
          <div className="mt-8 w-full space-y-4">
            <TestResult
              result={latestResult}
              onRetest={runAgain}
              onShare={() => {
                const text = `OmniShield: ${latestResult.downloadMbps} Mbps down, ${latestResult.uploadMbps} Mbps up, ${latestResult.pingMs} ms ping`;
                void navigator.clipboard?.writeText(text);
              }}
            />
            {previous ? (
              <p className="text-center text-xs text-slate-500 font-mono">
                Δ versus previous test: download {delta(latestResult.downloadMbps, previous.downloadMbps, selectedUnit)} · ping {deltaMs(latestResult.pingMs, previous.pingMs)}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Live Pure Wave Throughput Progression Chart */}
      {(progress.downloadDataPoints.length > 0 || isCompleted) && (
        <SpeedChart downloadData={progress.downloadDataPoints} uploadData={progress.uploadDataPoints} />
      )}

      {/* Control & Configuration Bar */}
      <div className="dashboard-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
        {/* Units Selection */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Display Units
          </label>
          <div className="flex rounded-xl bg-slate-100 p-1">
            {(["Mbps", "MB/s", "kB/s"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setSelectedUnit(u)}
                className={`flex-1 rounded-lg py-1 text-xs font-bold transition-all ${selectedUnit === u
                  ? "bg-white text-blue-700 shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Scale Selection */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Gauge Max Range
          </label>
          <div className="flex rounded-xl bg-slate-100 p-1">
            {([100, 500, 1000, "auto"] as const).map((s) => (
              <button
                key={String(s)}
                onClick={() => setSelectedScale(s)}
                className={`flex-1 rounded-lg py-1 text-xs font-bold transition-all ${selectedScale === s
                  ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                {s === "auto" ? "Auto" : `${s}`}
              </button>
            ))}
          </div>
        </div>

        {/* Connection Type Selection */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Concurrency Mode
          </label>
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setConnectionType("multi")}
              className={`flex-1 rounded-lg py-1 text-xs font-bold transition-all ${connectionType === "multi"
                ? "bg-white text-blue-700 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Multi (Parallel)
            </button>
            <button
              onClick={() => setConnectionType("single")}
              className={`flex-1 rounded-lg py-1 text-xs font-bold transition-all ${connectionType === "single"
                ? "bg-white text-blue-700 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Single (Linear)
            </button>
          </div>
        </div>
      </div>
      {/* Edge Server & Host Info Bar */}
      <div className="dashboard-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Host Info */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-mono text-xs font-bold shadow-2xs">
            HOST
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                {status?.publicIp ?? "Detecting IP..."}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600 font-bold border border-slate-200">
                {status?.mediaType ?? "Wi-Fi"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Gateway: <span className="font-mono text-slate-700">{status?.gateway ?? "192.168.1.1"}</span>
              {status?.ssid ? ` · SSID: ${status.ssid}` : ""}
              {status?.signalPercent != null ? ` (${status.signalPercent}%)` : ""}
            </p>
          </div>
        </div>

        {/* Server Selector */}
        <div className="relative">
          <button
            onClick={() => setShowServerSelect(!showServerSelect)}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-left hover:bg-slate-100 transition-all"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold">
              ⚡
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                {selectedServer?.name ?? "Cloudflare Global Anycast"}
              </p>
              <p className="text-[10px] text-slate-500 truncate max-w-[200px]">
                {selectedServer?.location ?? "Anycast POP"} · {selectedServer?.pingMs ?? 11}ms RTT
              </p>
            </div>
            <span className="text-xs text-slate-400">▼</span>
          </button>

          {showServerSelect && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-30">
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Choose Edge Test Server
              </p>
              <div className="space-y-1 mt-1">
                {servers.map((srv) => (
                  <button
                    key={srv.id}
                    onClick={() => {
                      setSelectedServer(srv);
                      setShowServerSelect(false);
                    }}
                    className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-all ${selectedServer?.id === srv.id
                      ? "bg-blue-50 text-blue-700 border border-blue-200 font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                      }`}
                  >
                    <div>
                      <p className="font-semibold">{srv.name}</p>
                      <p className="text-[10px] text-slate-400">{srv.location}</p>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-blue-600">{srv.pingMs}ms</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Realtime Signal & Network Path Topology Visualizer */}
      <NetworkRouteMap
        clientIp={status?.publicIp}
        localIp={status?.ipAddress}
        gateway={status?.gateway}
        signalDbm={status?.signalDbm}
        signalPercent={status?.signalPercent}
        mediaType={status?.mediaType}
        ssid={status?.ssid}
        server={selectedServer}
        pingMs={progress.pingMs || selectedServer?.pingMs}
        isTesting={isTesting}
        phase={progress.phase}
      />
    </div>
  );
};

function delta(now: number, before: number, unit: "Mbps" | "MB/s" | "kB/s") {
  const diff = now - before;
  const sign = diff > 0.05 ? "+" : diff < -0.05 ? "−" : "";
  return `${sign}${formatSpeed(Math.abs(diff), unit)}`;
}

function deltaMs(now: number, before: number) {
  const diff = now - before;
  if (Math.abs(diff) < 0.5) return "same";
  return `${diff > 0 ? "+" : ""}${diff.toFixed(0)} ms`;
}
