import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../components/ui/StatusBadge";
import { api } from "../api";
import { dash } from "../lib/format";
import { formatSpeed, usePrefs } from "../prefs";

type Associated = {
  ssid?: string | null;
  bssid?: string | null;
  channel?: number | null;
  signalPercent?: number | null;
  radioType?: string | null;
  gateway?: string | null;
  localIp?: string | null;
  profiles?: string[];
  rxMbps?: number | null;
  txMbps?: number | null;
  securityMode?: string | null;
  state?: string | null;
};

type Driver = { interfaceName?: string; driver?: string; radioTypes?: string[]; firmware?: string; pmfSupported?: boolean };

type SettingsPayload = {
  freshness?: string;
  reason?: string | null;
  note?: string | null;
  associated?: Associated | null;
  drivers?: Driver[];
  canConnectSavedProfile?: boolean;
  adapter?: { canRead?: boolean; canWrite?: boolean; reason?: string | null; fields?: Record<string, { value?: unknown; freshness?: string; reason?: string | null }> };
};

export const RouterWiFiPage: React.FC = () => {
  const { speedUnit } = usePrefs();
  const [data, setData] = useState<SettingsPayload | null>(null);
  const [profile, setProfile] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ssid, setSsid] = useState("");
  const [channel, setChannel] = useState("");

  const load = useCallback(async () => {
    const res = await api<SettingsPayload>("/api/wifi/settings");
    setData(res);
    setProfile((prev) => prev || res.associated?.profiles?.[0] || "");
    setSsid((prev) => prev || res.associated?.ssid || "");
    setChannel((prev) => prev || (res.associated?.channel != null ? String(res.associated.channel) : ""));
  }, []);

  useEffect(() => {
    void load().catch((err: Error) => setMessage(err.message));
    const timer = window.setInterval(() => {
      void load().catch(() => undefined);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function connect() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await api<{ reason?: string | null; freshness?: string }>("/api/wifi/connect", {
        method: "POST",
        body: JSON.stringify({ profile }),
      });
      setMessage(res.reason ?? (res.freshness === "LIVE" ? `Connecting to saved profile ${profile}` : "Connect did not complete"));
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Connect failed");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await api<{ reason?: string | null; freshness?: string }>("/api/wifi/disconnect", { method: "POST", body: "{}" });
      setMessage(res.reason ?? "Disconnect requested for this PC's WLAN adapter");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Disconnect failed");
    } finally {
      setBusy(false);
    }
  }

  async function applyAp() {
    setBusy(true);
    setMessage(null);
    try {
      await api("/api/wifi/settings", {
        method: "POST",
        body: JSON.stringify({ ssid: ssid || undefined, channel: channel ? Number(channel) : undefined }),
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Access-point write is unavailable without a vendor plugin");
    } finally {
      setBusy(false);
    }
  }

  const assoc = data?.associated;
  const fields = Object.entries(data?.adapter?.fields ?? {});
  const profiles = assoc?.profiles ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Wi-Fi Client & Access Point Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            This PC can join saved Windows profiles and leave the current BSS. Changing the modem SSID or PSK needs a vendor plugin and is not simulated.
          </p>
        </div>
        <Link to="/wifi" className="text-xs font-bold text-blue-700">
          Radio overview →
        </Link>
      </div>

      {data?.note ? <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">{data.note}</p> : null}
      {message ? <p className="text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">{message}</p> : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="dashboard-card p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400">Associated SSID</span>
          <div className="mt-1 font-bold text-slate-900">{dash(assoc?.ssid)}</div>
          <div className="font-mono text-[11px] text-slate-500">{dash(assoc?.bssid)}</div>
        </div>
        <div className="dashboard-card p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400">Signal / channel</span>
          <div className="mt-1 font-bold text-slate-900">{assoc?.signalPercent != null ? `${assoc.signalPercent}%` : "—"} · ch {dash(assoc?.channel)}</div>
          <div className="text-[11px] text-slate-500">{dash(assoc?.radioType)} · {dash(assoc?.securityMode)}</div>
        </div>
        <div className="dashboard-card p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400">PHY rates</span>
          <div className="mt-1 font-bold text-slate-900">{formatSpeed(assoc?.rxMbps ?? null, speedUnit)} rx</div>
          <div className="text-[11px] text-slate-500">{formatSpeed(assoc?.txMbps ?? null, speedUnit)} tx</div>
        </div>
        <div className="dashboard-card p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400">Gateway</span>
          <div className="mt-1 font-bold text-slate-900">{dash(assoc?.gateway)}</div>
          <div className="font-mono text-[11px] text-slate-500">{dash(assoc?.localIp)}</div>
        </div>
      </div>

      <div className="dashboard-card p-6 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">This PC — saved Windows WLAN profiles</h3>
        <p className="text-xs text-slate-500">Connect only uses names already stored by Windows for this user. Nearby SSIDs without a saved profile cannot be joined from here.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {profiles.length ? profiles.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            )) : <option value="">No saved profiles</option>}
          </select>
          <button disabled={busy || !profile} onClick={() => void connect()} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
            Connect this PC
          </button>
          <button disabled={busy} onClick={() => void disconnect()} className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-800 disabled:opacity-60">
            Disconnect radio
          </button>
        </div>
      </div>

      {(data?.drivers ?? []).length ? (
        <div className="dashboard-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 text-sm font-bold">WLAN drivers</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-4 py-2">Interface</th>
                <th className="px-4 py-2">Driver</th>
                <th className="px-4 py-2">Radios</th>
                <th className="px-4 py-2">PMF</th>
              </tr>
            </thead>
            <tbody>
              {(data?.drivers ?? []).map((row) => (
                <tr key={row.interfaceName} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-semibold">{dash(row.interfaceName)}</td>
                  <td className="px-4 py-2">{dash(row.driver)}</td>
                  <td className="px-4 py-2">{(row.radioTypes ?? []).join(", ") || "—"}</td>
                  <td className="px-4 py-2">{row.pmfSupported ? "Yes" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="dashboard-card p-6 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Modem / AP Wi-Fi (vendor plugin)</h3>
        <p className="text-xs text-slate-500">
          Read {data?.adapter?.canRead ? "yes" : "no"} · Write {data?.adapter?.canWrite ? "yes" : "no"}. {data?.adapter?.reason}
        </p>
        {fields.length ? (
          <ul className="text-xs space-y-1 text-slate-600">
            {fields.slice(0, 8).map(([name, field]) => (
              <li key={name}>
                <b>{name}</b>: {field.value != null ? String(field.value) : "UNAVAILABLE"} — {field.freshness}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input value={ssid} onChange={(e) => setSsid(e.target.value)} placeholder="Requested SSID (owned AP)" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="Requested channel" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <button disabled={busy} onClick={() => void applyAp()} className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
            Apply via plugin
          </button>
        </div>
      </div>

      <StatusBadge status={assoc?.ssid ? "passed" : "warning"} label={assoc?.ssid ? "Association observed" : "No association"} size="sm" />
    </div>
  );
};
