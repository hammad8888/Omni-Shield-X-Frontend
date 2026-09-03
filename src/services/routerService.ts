import type { RouterInfo, RouterWANConfig, RouterLANConfig } from "../types";
import { api } from "../api";

class RouterService {
  async getInfo(): Promise<RouterInfo | null> {
    const res = await api<{ info?: RouterInfo }>("/api/router/overview");
    return res.info ?? null;
  }

  async getWAN(): Promise<RouterWANConfig | null> {
    const res = await api<{ wan?: RouterWANConfig }>("/api/router/wan");
    return res.wan ?? null;
  }

  async getLAN(): Promise<RouterLANConfig | null> {
    const res = await api<{ lan?: RouterLANConfig }>("/api/router/lan");
    return res.lan ?? null;
  }

  async getDhcp(): Promise<{ neighbors?: unknown[]; leases?: unknown[]; pool?: { startIp?: string | null; endIp?: string | null; leaseTimeHours?: number | null }; reason?: string | null }> {
    return api("/api/router/dhcp");
  }

  async ping(host?: string): Promise<{ output: string[]; freshness?: string; pingMs?: number | null; reason?: string | null }> {
    return api("/api/router/diagnostics/ping", { method: "POST", body: JSON.stringify({ host }) });
  }
}

export const routerService = new RouterService();
