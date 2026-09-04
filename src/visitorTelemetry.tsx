import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { measureBrowserPingToHost, probeClientNetwork, type ClientNetworkInfo } from "./lib/clientNetwork";
import { loadHostCapability, peekHostCapability, shouldMeasureInBrowser, type HostCapability } from "./lib/hostMode";
import { networkQuality } from "./lib/quality";

export type VisitorSnapshot = {
  origin: "browser" | "windows-host";
  capability: HostCapability;
  publicIp: string | null;
  localIp: string | null;
  location: string | null;
  colo: string | null;
  isp: string | null;
  mediaType: "Wi-Fi" | "Ethernet" | "Cellular" | "Unknown";
  effectiveType: string | null;
  pingMs: number | null;
  jitterMs: number | null;
  lossPct: number | null;
  downloadMbps: number | null;
  uploadMbps: number | null;
  dnsLatencyMs: number | null;
  healthScore: number | null;
  healthLabel: string | null;
  pingSamples: number[];
  jitterSamples: number[];
  throughputSamples: number[];
};

const empty: VisitorSnapshot = {
  origin: "windows-host",
  capability: peekHostCapability(),
  publicIp: null,
  localIp: null,
  location: null,
  colo: null,
  isp: null,
  mediaType: "Unknown",
  effectiveType: null,
  pingMs: null,
  jitterMs: null,
  lossPct: null,
  downloadMbps: null,
  uploadMbps: null,
  dnsLatencyMs: null,
  healthScore: null,
  healthLabel: null,
  pingSamples: [],
  jitterSamples: [],
  throughputSamples: [],
};

type VisitorApi = VisitorSnapshot & {
  noteSpeed: (downloadMbps: number | null, uploadMbps: number | null) => void;
};

const Ctx = createContext<VisitorApi | null>(null);

let speedNote: ((downloadMbps: number | null, uploadMbps: number | null) => void) | null = null;

export function publishVisitorSpeed(downloadMbps: number | null, uploadMbps: number | null) {
  speedNote?.(downloadMbps, uploadMbps);
}

function mediaFromClient(client: ClientNetworkInfo): VisitorSnapshot["mediaType"] {
  const raw = `${client.type ?? ""} ${client.effectiveType ?? ""}`.toLowerCase();
  if (raw.includes("wifi") || raw.includes("wlan")) return "Wi-Fi";
  if (raw.includes("ethernet") || raw.includes("wired")) return "Ethernet";
  if (raw.includes("cell") || raw.includes("4g") || raw.includes("5g") || raw.includes("3g")) return "Cellular";
  if (client.downlinkMbps != null && client.downlinkMbps > 0) return "Wi-Fi";
  return "Unknown";
}

function computeJitter(samples: number[]) {
  if (samples.length < 2) return null;
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance = samples.reduce((sum, item) => sum + (item - mean) ** 2, 0) / (samples.length - 1);
  return Math.round(Math.sqrt(variance) * 10) / 10;
}

export function VisitorTelemetryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VisitorSnapshot>(empty);

  useEffect(() => {
    let closed = false;
    let pingHistory: number[] = [];

    const applyIdentity = (client: ClientNetworkInfo) => {
      setState((prev) => ({
        ...prev,
        publicIp: client.publicIp ?? prev.publicIp,
        localIp: client.localIp ?? prev.localIp,
        location: client.location ?? prev.location,
        colo: client.colo ?? prev.colo,
        isp: client.isp ?? prev.isp,
        effectiveType: client.effectiveType ?? prev.effectiveType,
        mediaType: mediaFromClient(client),
      }));
    };

    const tick = async () => {
      const ping = await measureBrowserPingToHost("1.1.1.1");
      if (closed) return;
      if (ping != null && ping > 0) {
        pingHistory = [...pingHistory.slice(-19), ping];
        const jitter = computeJitter(pingHistory);
        setState((prev) => {
          const quality = networkQuality(ping, jitter, 0, prev.downloadMbps);
          return {
            ...prev,
            pingMs: ping,
            jitterMs: jitter,
            lossPct: 0,
            dnsLatencyMs: ping,
            healthScore: quality.score,
            healthLabel: quality.label,
            pingSamples: pingHistory,
            jitterSamples: jitter != null ? [...prev.jitterSamples.slice(-19), jitter] : prev.jitterSamples,
            throughputSamples:
              prev.downloadMbps != null && prev.downloadMbps > 0
                ? [...prev.throughputSamples.slice(-19), prev.downloadMbps]
                : prev.throughputSamples,
          };
        });
      } else {
        setState((prev) => ({ ...prev, lossPct: 100 }));
      }
    };

    void loadHostCapability().then((capability) => {
      if (closed) return;
      const browser = shouldMeasureInBrowser(capability);
      setState((prev) => ({
        ...prev,
        origin: browser ? "browser" : "windows-host",
        capability,
      }));
      if (!browser) return;
      void probeClientNetwork().then((client) => {
        if (!closed) applyIdentity(client);
      });
      void tick();
    });

    const pingTimer = window.setInterval(() => {
      if (shouldMeasureInBrowser()) void tick();
    }, 1200);
    const identTimer = window.setInterval(() => {
      if (!shouldMeasureInBrowser()) return;
      void probeClientNetwork().then((client) => {
        if (!closed) applyIdentity(client);
      });
    }, 8000);

    return () => {
      closed = true;
      window.clearInterval(pingTimer);
      window.clearInterval(identTimer);
    };
  }, []);

  useEffect(() => {
    speedNote = (downloadMbps, uploadMbps) => {
      setState((prev) => {
        const quality = networkQuality(prev.pingMs, prev.jitterMs, prev.lossPct, downloadMbps);
        return {
          ...prev,
          downloadMbps,
          uploadMbps,
          healthScore: quality.score,
          healthLabel: quality.label,
          throughputSamples:
            downloadMbps != null && downloadMbps > 0
              ? [...prev.throughputSamples.slice(-19), downloadMbps]
              : prev.throughputSamples,
        };
      });
    };
    return () => {
      speedNote = null;
    };
  }, []);

  const value = useMemo<VisitorApi>(
    () => ({
      ...state,
      noteSpeed: (downloadMbps, uploadMbps) => publishVisitorSpeed(downloadMbps, uploadMbps),
    }),
    [state],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVisitorTelemetry() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useVisitorTelemetry must be used within VisitorTelemetryProvider");
  return ctx;
}
