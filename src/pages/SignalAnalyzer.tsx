import React, { useState, useEffect } from "react";
import { useWiFi } from "../hooks/useWiFi";
import { MetricCard } from "../components/ui/MetricCard";
import { AreaChart, type AreaDataPoint } from "../components/ui/AreaChart";
import { SignalStrength } from "../components/ui/SignalStrength";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { dash } from "../lib/format";
import { speedParts, usePrefs } from "../prefs";

export const SignalAnalyzerPage: React.FC = () => {
  const { currentWifi, reason, rescan, isScanning } = useWiFi();
  const { speedUnit } = usePrefs();
  const [signalStream, setSignalStream] = useState<number[]>([]);

  useEffect(() => {
    if (currentWifi?.signalDbm == null) return;
    setSignalStream((prev) => [...prev.slice(-19), currentWifi.signalDbm as number]);
  }, [currentWifi?.signalDbm]);

  const currentDbm = currentWifi?.signalDbm ?? signalStream[signalStream.length - 1];
  const chartData: AreaDataPoint[] = signalStream.map((val, idx) => ({
    label: idx === signalStream.length - 1 ? "Now" : `${signalStream.length - idx}`,
    value: Math.max(0, val + 100),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Signal"
        description="RSSI from Windows WLAN association. Unmeasured fields stay blank."
        actions={
          <>
            <StatusBadge status={currentDbm != null ? "passed" : "offline"} label={currentDbm != null ? "Live RSSI" : "No association"} size="sm" withPulse={currentDbm != null} />
            <button onClick={() => void rescan()} disabled={isScanning} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60">
              {isScanning ? "Scanning…" : "Rescan"}
            </button>
          </>
        }
      />

      {reason ? <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{reason}</p> : null}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Live Signal Level" value={dash(currentDbm)} unit="dBm" description="From Windows signal %" />
        <MetricCard label="Signal quality" value={dash(currentWifi?.signalPercent)} unit="%" />
        <MetricCard label="Channel" value={dash(currentWifi?.channel)} />
        <MetricCard label="PHY rate" value={speedParts(currentWifi?.linkSpeedMbps, speedUnit).value} unit={speedParts(currentWifi?.linkSpeedMbps, speedUnit).unit} />
      </div>

      <div className="dashboard-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">RSSI over recent polls</h3>
            <p className="text-xs text-slate-500">SSID {dash(currentWifi?.ssid)} · {dash(currentDbm)} dBm</p>
          </div>
          {currentDbm != null ? <SignalStrength dbm={currentDbm} size="md" showPercent /> : null}
        </div>
        {chartData.length ? (
          <AreaChart data={chartData} color="#10B981" fillColor="rgba(16, 185, 129, 0.15)" unit="dBm" height={240} />
        ) : (
          <p className="text-sm text-slate-500 text-center py-8">No RSSI samples yet. Associate to Wi-Fi on this Windows host and scan.</p>
        )}
      </div>
    </div>
  );
};
