import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "./api";
import { getRealtimeSocket } from "./socket";
import { socketPayload } from "./lib/socketPayload";

export type SidebarMetric = {
  value?: unknown;
  ssid?: string | null;
  gateway?: string | null;
  networks?: number;
  freshness?: string;
  source?: string;
  reason?: string | null;
  href?: string;
};

export type SidebarSnapshot = {
  generatedAt?: string;
  websocket?: SidebarMetric;
  alerts?: SidebarMetric;
  findings?: SidebarMetric;
  wifi?: SidebarMetric;
  agent?: SidebarMetric;
};

export type LiveNetworkPayload = {
  freshness?: string;
  source?: string;
  reason?: string | null;
  status?: Record<string, unknown>;
  metrics?: {
    download?: number | null;
    upload?: number | null;
    ping?: number | null;
    jitter?: number | null;
    packetLoss?: number | null;
    dnsLatency?: number | null;
    qualityScore?: number | null;
    qualityLabel?: string | null;
  };
  adapters?: unknown[];
  wifi?: unknown;
};

export type LiveWifiPayload = {
  freshness?: string;
  reason?: string | null;
  connected?: {
    ssid?: string | null;
    bssid?: string | null;
    signalPercent?: number | null;
    signalDbm?: number | null;
    channel?: number | null;
    radioType?: string | null;
    rxMbps?: number | null;
    txMbps?: number | null;
    gateway?: string | null;
    localIp?: string | null;
    interfaceName?: string | null;
    mac?: string | null;
  };
};

type RealtimeState = {
  snapshot: SidebarSnapshot | null;
  network: LiveNetworkPayload | null;
  wifi: LiveWifiPayload | null;
  transport: "LIVE" | "STALE" | "UNAVAILABLE";
  reason: string | null;
};

const Ctx = createContext<RealtimeState | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<SidebarSnapshot | null>(null);
  const [network, setNetwork] = useState<LiveNetworkPayload | null>(null);
  const [wifi, setWifi] = useState<LiveWifiPayload | null>(null);
  const [transport, setTransport] = useState<RealtimeState["transport"]>("UNAVAILABLE");
  const [reason, setReason] = useState<string | null>("Realtime socket is not connected");

  useEffect(() => {
    let closed = false;
    const socket = getRealtimeSocket();

    async function pullSnapshot() {
      try {
        const data = await api<{ item: SidebarSnapshot }>("/api/realtime/snapshot");
        if (!closed) {
          setSnapshot(data.item);
          if (!socket.connected) {
            setTransport("STALE");
            setReason("Sidebar is polling HTTP snapshots until Socket.IO reconnects");
          }
        }
      } catch (error) {
        if (!closed && !socket.connected) {
          setTransport("UNAVAILABLE");
          setReason(error instanceof Error ? error.message : "Snapshot poll failed");
        }
      }
    }

    const onConnect = () => {
      if (closed) return;
      setTransport("LIVE");
      setReason(null);
    };
    const onDisconnect = () => {
      if (closed) return;
      setTransport("UNAVAILABLE");
      setReason("Socket.IO disconnected. HTTP fallback is polling.");
    };
    const onSidebar = (message: unknown) => {
      const payload = socketPayload<SidebarSnapshot>(message);
      if (payload) setSnapshot(payload);
    };
    const onWifi = (message: unknown) => {
      const payload = socketPayload<LiveWifiPayload>(message);
      if (!payload) return;
      setWifi(payload);
      const ssid = payload.connected?.ssid;
      if (!ssid) return;
      setSnapshot((prev) => ({
        ...(prev ?? {}),
        wifi: { ...(prev?.wifi ?? {}), ssid, freshness: payload.freshness ?? "LIVE" },
      }));
    };
    const onNetwork = (message: unknown) => {
      const payload = socketPayload<LiveNetworkPayload>(message);
      if (payload) setNetwork(payload);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onDisconnect);
    socket.on("sidebar.updated", onSidebar);
    socket.on("wifi:status", onWifi);
    socket.on("network:status", onNetwork);
    socket.on("system:status", () => {
      if (socket.connected) {
        setTransport("LIVE");
        setReason(null);
      }
    });
    if (socket.connected) onConnect();

    void pullSnapshot();
    const pollTimer = window.setInterval(() => {
      if (!closed && !socket.connected) void pullSnapshot();
    }, 2000);

    return () => {
      closed = true;
      window.clearInterval(pollTimer);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onDisconnect);
      socket.off("sidebar.updated", onSidebar);
      socket.off("wifi:status", onWifi);
      socket.off("network:status", onNetwork);
    };
  }, []);

  const value = useMemo<RealtimeState>(
    () => ({ snapshot, network, wifi, transport, reason }),
    [snapshot, network, wifi, transport, reason],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRealtime() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRealtime must be used within RealtimeProvider");
  return ctx;
}
