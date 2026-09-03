import { useState, useEffect } from "react";
import { getRealtimeSocket } from "../socket";

export interface WebSocketStatus {
  isConnected: boolean;
  transport: "LIVE_WS" | "SSE" | "UNAVAILABLE";
  latencyMs: number | null;
  lastHeartbeat: Date | null;
}

export function useWebSocket() {
  const [status, setStatus] = useState<WebSocketStatus>({
    isConnected: false,
    transport: "UNAVAILABLE",
    latencyMs: null,
    lastHeartbeat: null,
  });

  useEffect(() => {
    const socket = getRealtimeSocket();
    const opened = Date.now();
    const onConnect = () => {
      setStatus({
        isConnected: true,
        transport: "LIVE_WS",
        latencyMs: Date.now() - opened,
        lastHeartbeat: new Date(),
      });
    };
    const onAny = () => {
      setStatus((prev) => ({ ...prev, lastHeartbeat: new Date(), isConnected: socket.connected, transport: socket.connected ? "LIVE_WS" : "UNAVAILABLE" }));
    };
    const onDisconnect = () => {
      setStatus((prev) => ({ ...prev, isConnected: false, transport: "UNAVAILABLE" }));
    };
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("system:status", onAny);
    if (socket.connected) onConnect();
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("system:status", onAny);
    };
  }, []);

  return status;
}
