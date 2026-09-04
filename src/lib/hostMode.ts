import { resolveApiBase } from "../api";

export type HostCapability = {
  platform: string;
  hostname: string | null;
  measurementOrigin: "windows-host" | "cloud-host";
  canScanWifi: boolean;
  canScanLan: boolean;
  canReadNicCounters?: boolean;
  visitorBrowserRequired: boolean;
  reason?: string | null;
};

const fallbackCapability = (): HostCapability => {
  const remote = isRemoteApiHost();
  return {
    platform: remote ? "linux" : "win32",
    hostname: null,
    measurementOrigin: remote ? "cloud-host" : "windows-host",
    canScanWifi: !remote,
    canScanLan: !remote,
    canReadNicCounters: !remote,
    visitorBrowserRequired: remote,
    reason: remote
      ? "Remote API host. Visitor WAN metrics are measured in this browser."
      : null,
  };
};

let cached: HostCapability | null = null;

export function isRemoteApiHost(): boolean {
  const base = resolveApiBase();
  if (!base) return false;
  try {
    const host = new URL(base.startsWith("http") ? base : `https://${base}`).hostname;
    return host !== "localhost" && host !== "127.0.0.1";
  } catch {
    return true;
  }
}

export function shouldMeasureInBrowser(capability?: HostCapability | null): boolean {
  if (capability?.visitorBrowserRequired) return true;
  if (cached?.visitorBrowserRequired) return true;
  return isRemoteApiHost();
}

export function peekHostCapability(): HostCapability {
  return cached ?? fallbackCapability();
}

export async function loadHostCapability(): Promise<HostCapability> {
  if (cached) return cached;
  try {
    const { api } = await import("../api");
    const data = await api<{ capability?: HostCapability }>("/api/system/health", { allowStatuses: [503] });
    if (data.capability) {
      cached = data.capability;
      return cached;
    }
  } catch {
    /* use fallback */
  }
  cached = fallbackCapability();
  return cached;
}
