import type { DnsBenchmarkResult } from "../types";
import { api } from "../api";

class DnsService {
  async getBenchmarks(): Promise<DnsBenchmarkResult[]> {
    try {
      const res = await api<{ items?: Array<Record<string, unknown>> }>("/api/dns/benchmark");
      return (res.items ?? []).map((row) => ({
        serverName: String(row.serverName || "DNS Resolver"),
        primaryIp: String(row.primaryIp || ""),
        secondaryIp: row.secondaryIp ? String(row.secondaryIp) : null,
        responseTimeMs: typeof row.responseTimeMs === "number" ? row.responseTimeMs : null,
        status: String(row.status || "Unreachable"),
        reliabilityPercent: typeof row.reliabilityPercent === "number" ? row.reliabilityPercent : null,
        isCurrent: Boolean(row.isCurrent),
        features: {
          dnsSec: Boolean((row.features as Record<string, unknown>)?.dnsSec ?? row.dnsSec),
          doh: Boolean((row.features as Record<string, unknown>)?.doh ?? row.doh),
          dot: Boolean((row.features as Record<string, unknown>)?.dot ?? row.dot),
          malwareBlocking: Boolean((row.features as Record<string, unknown>)?.malwareBlocking ?? row.malwareBlocking),
        },
      }));
    } catch {
      return [];
    }
  }

  async runBenchmark(): Promise<DnsBenchmarkResult[]> {
    return this.getBenchmarks();
  }
}

export const dnsService = new DnsService();
