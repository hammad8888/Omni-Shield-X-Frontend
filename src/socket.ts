import { io, type Socket } from "socket.io-client";
import { getAccessToken, API_BASE } from "./api";

let socket: Socket | null = null;

export function getRealtimeSocket() {
  if (socket) return socket;
  const wsUrl = import.meta.env.VITE_WS_URL || API_BASE || undefined;
  socket = io(wsUrl, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    auth: () => ({ token: getAccessToken() ?? "" }),
  });
  return socket;
}

export function disconnectRealtimeSocket() {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}
