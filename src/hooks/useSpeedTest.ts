import { useState, useEffect, useCallback } from "react";
import type { SpeedTestProgress, SpeedTestResult, SpeedTestServer } from "../types";
import { speedTestService, SPEED_SERVERS } from "../services/speedTestService";

const idle: SpeedTestProgress = {
  phase: "idle",
  progressPercent: 0,
  currentSpeedMbps: 0,
  pingMs: 0,
  jitterMs: 0,
  downloadMbps: 0,
  uploadMbps: 0,
  packetLossPercent: 0,
  downloadDataPoints: [],
  uploadDataPoints: [],
};

export function useSpeedTest() {
  const [progress, setProgress] = useState<SpeedTestProgress>(idle);
  const [servers, setServers] = useState<SpeedTestServer[]>(SPEED_SERVERS);
  const [selectedServer, setSelectedServerState] = useState<SpeedTestServer | null>(SPEED_SERVERS[0] ?? null);
  const [connectionType, setConnectionTypeState] = useState<"multi" | "single">("multi");
  const [history, setHistory] = useState<SpeedTestResult[]>([]);

  useEffect(() => {
    const unsubscribe = speedTestService.subscribe(setProgress);
    speedTestService.getServers().then((srvs) => {
      setServers(srvs);
      if (srvs.length > 0 && !selectedServer) {
        setSelectedServerState(srvs[0]);
        speedTestService.setServer(srvs[0]);
      }
    });
    speedTestService.getHistory().then(setHistory);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (progress.phase === "completed") {
      speedTestService.getHistory().then(setHistory);
    }
  }, [progress.phase]);

  const setSelectedServer = useCallback((srv: SpeedTestServer) => {
    setSelectedServerState(srv);
    speedTestService.setServer(srv);
  }, []);

  const setConnectionType = useCallback((type: "multi" | "single") => {
    setConnectionTypeState(type);
    speedTestService.setConnectionType(type);
  }, []);

  const startTest = useCallback(() => {
    speedTestService.startTest({ connectionType, server: selectedServer ?? undefined });
  }, [connectionType, selectedServer]);

  const resetTest = useCallback(() => {
    speedTestService.resetTest();
  }, []);

  return {
    progress,
    servers,
    selectedServer,
    setSelectedServer,
    connectionType,
    setConnectionType,
    history,
    startTest,
    resetTest,
    isTesting: progress.phase !== "idle" && progress.phase !== "completed" && progress.phase !== "error",
  };
}

