import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalytics } from "../hooks/useAnalytics";
import type { HistoryEntry } from "../types";
import { Drawer } from "../components/ui/FeedbackStates";
import { PageHeader } from "../components/ui/PageHeader";
import { LineChart } from "../components/ui/LineChart";
import { MetricCard } from "../components/ui/MetricCard";
import { dash } from "../lib/format";
import { convertFromMbps, formatSpeed, resolveSpeedUnit, speedParts, usePrefs } from "../prefs";

export const TestHistoryPage: React.FC = () => {
  const { history, loading } = useAnalytics();
  const { speedUnit } = usePrefs();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

  const filtered = history.filter((h) => {
    const q = search.toLowerCase();
    return (
      h.networkName.toLowerCase().includes(q) ||
      h.connectionType.toLowerCase().includes(q) ||
      h.serverLocation.toLowerCase().includes(q)
    );
  });

  const latest = history[0];
  const chartUnit = resolveSpeedUnit(latest?.downloadMbps ?? 0, speedUnit);
  const chart = useMemo(
    () =>
      [...history].slice(0, 12).reverse().map((row, idx) => ({
        label: String(idx + 1),
        value: convertFromMbps(row.downloadMbps, chartUnit),
        secondaryValue: convertFromMbps(row.uploadMbps, chartUnit),
      })),
    [history, chartUnit],
  );
  const avgDown = history.length ? history.reduce((sum, row) => sum + row.downloadMbps, 0) / history.length : null;
  const avgPing = history.length ? history.reduce((sum, row) => sum + row.pingMs, 0) / history.length : null;

  const exportData = (format: "csv" | "json") => {
    if (format === "json") {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `speed-history-${Date.now()}.json`);
      downloadAnchor.click();
    } else {
      const headers = "Timestamp,Network,Connection,Download_Mbps,Upload_Mbps,Ping_ms,Jitter_ms,PacketLoss,Score\n";
      const rows = history
        .map(
          (h) =>
            `"${h.timestamp}","${h.networkName}","${h.connectionType}",${h.downloadMbps},${h.uploadMbps},${h.pingMs},${h.jitterMs},${h.packetLossPercent},${h.score}`,
        )
        .join("\n");
      const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `speed-history-${Date.now()}.csv`);
      downloadAnchor.click();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analysis"
        description="Stored speed-test samples from this console. Empty until a test completes."
        actions={
          <>
            <button onClick={() => navigate("/speedtest")} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white">
              Speed test
            </button>
            <button onClick={() => exportData("csv")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">
              CSV
            </button>
            <button onClick={() => exportData("json")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">
              JSON
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Last download" value={speedParts(latest?.downloadMbps, speedUnit).value} unit={speedParts(latest?.downloadMbps, speedUnit).unit} />
        <MetricCard label="Last upload" value={speedParts(latest?.uploadMbps, speedUnit).value} unit={speedParts(latest?.uploadMbps, speedUnit).unit} />
        <MetricCard label="Avg download" value={speedParts(avgDown, speedUnit).value} unit={speedParts(avgDown, speedUnit).unit} />
        <MetricCard label="Avg ping" value={dash(avgPing == null ? null : Number(avgPing.toFixed(1)))} unit="ms" />
      </div>

      <div className="dashboard-card p-5">
        <h2 className="text-sm font-semibold text-slate-900">Download / upload over recent tests</h2>
        <p className="mt-0.5 text-xs text-slate-500">Oldest on the left. {history.length} stored sample{history.length === 1 ? "" : "s"}.</p>
        {loading ? <p className="mt-6 text-sm text-slate-500">Loading…</p> : null}
        {chart.length ? (
          <div className="mt-3">
            <LineChart data={chart} primaryLabel="Download" secondaryLabel="Upload" unit={chartUnit} height={240} />
          </div>
        ) : (
          !loading ? <p className="py-8 text-center text-sm text-slate-500">Run a speed test to build this chart.</p> : null
        )}
      </div>

      <div className="dashboard-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-72 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800"
          />
          <span className="text-xs text-slate-400">{filtered.length} tests</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Server</th>
                <th className="px-4 py-3 font-medium">Download</th>
                <th className="px-4 py-3 font-medium">Upload</th>
                <th className="px-4 py-3 font-medium">Ping</th>
                <th className="px-4 py-3 font-medium">Jitter</th>
                <th className="px-4 py-3 font-medium">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No stored tests yet.</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} onClick={() => setSelectedEntry(item)} className="cursor-pointer hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{item.timestamp}</td>
                    <td className="px-4 py-3">{item.serverLocation}</td>
                    <td className="px-4 py-3 font-mono">{formatSpeed(item.downloadMbps, speedUnit)}</td>
                    <td className="px-4 py-3 font-mono">{formatSpeed(item.uploadMbps, speedUnit)}</td>
                    <td className="px-4 py-3 font-mono">{item.pingMs ? `${item.pingMs} ms` : "—"}</td>
                    <td className="px-4 py-3 font-mono">{item.jitterMs ? `${item.jitterMs} ms` : "—"}</td>
                    <td className="px-4 py-3">{item.score ? `${item.score}` : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer isOpen={Boolean(selectedEntry)} onClose={() => setSelectedEntry(null)} title="Test details">
        {selectedEntry ? (
          <div className="space-y-4 text-xs">
            <p className="text-sm font-medium text-slate-900">{selectedEntry.timestamp}</p>
            <p className="text-slate-500">{selectedEntry.serverLocation}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 p-3 text-center">
                <p className="text-[10px] uppercase text-slate-400">Download</p>
                <p className="mt-1 font-mono text-xl font-semibold">{speedParts(selectedEntry.downloadMbps, speedUnit).value}</p>
                <p className="text-[10px] text-slate-500">{speedParts(selectedEntry.downloadMbps, speedUnit).unit}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 text-center">
                <p className="text-[10px] uppercase text-slate-400">Upload</p>
                <p className="mt-1 font-mono text-xl font-semibold">{speedParts(selectedEntry.uploadMbps, speedUnit).value}</p>
                <p className="text-[10px] text-slate-500">{speedParts(selectedEntry.uploadMbps, speedUnit).unit}</p>
              </div>
            </div>
            <p className="text-slate-600">Ping {dash(selectedEntry.pingMs)} ms · jitter {dash(selectedEntry.jitterMs)} ms · loss {dash(selectedEntry.packetLossPercent)}%</p>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
};
