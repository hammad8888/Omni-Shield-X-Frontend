import type { ConnectedDevice } from "../types";
import { api } from "../api";

class DeviceService {
  async getDevices(): Promise<ConnectedDevice[]> {
    const [inventory, neighbors] = await Promise.all([
      api<{ items?: Array<Record<string, unknown>> }>("/api/devices").catch(() => ({ items: [] as Array<Record<string, unknown>> })),
      api<{ items?: Array<{ ip?: string; mac?: string; kind?: string }> }>("/api/network/neighbors").catch(() => ({ items: [] })),
    ]);

    const fromDb: ConnectedDevice[] = (inventory.items ?? []).map((d) => ({
      id: String(d.id),
      name: String(d.displayName || d.hostname || d.ipv4 || "Registered device"),
      ipAddress: (d.ipv4 as string) ?? null,
      macAddress: (d.mac as string) ?? null,
      vendor: (d.vendor as string) ?? null,
      type: "Unknown",
      connectionType: (d.connectionType as string) ?? null,
      signalDbm: null,
      status: d.status === "ONLINE" ? "Online" : d.status === "OFFLINE" ? "Offline" : "Idle",
      firstSeen: d.firstSeenAt ? String(d.firstSeenAt) : null,
      lastSeen: d.lastSeenAt ? String(d.lastSeenAt) : null,
      rxBytes: null,
      txBytes: null,
      source: (d.source as string) ?? "inventory",
    }));

    const fromArp: ConnectedDevice[] = (neighbors.items ?? []).map((n, idx) => ({
      id: `arp-${n.mac ?? n.ip ?? idx}`,
      name: n.ip ?? "Neighbor",
      ipAddress: n.ip ?? null,
      macAddress: n.mac ?? null,
      vendor: null,
      type: "Unknown",
      connectionType: null,
      signalDbm: null,
      status: "Online",
      firstSeen: null,
      lastSeen: "ARP cache",
      rxBytes: null,
      txBytes: null,
      source: "arp",
    }));

    const seen = new Set(fromDb.map((d) => (d.macAddress || d.ipAddress || d.id).toLowerCase()));
    const merged = [...fromDb];
    for (const row of fromArp) {
      const key = (row.macAddress || row.ipAddress || row.id).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(row);
    }
    return merged;
  }

  async scanSubnet(): Promise<ConnectedDevice[]> {
    return this.getDevices();
  }
}

export const deviceService = new DeviceService();
