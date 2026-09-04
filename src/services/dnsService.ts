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
    const { shouldMeasureInBrowser } = await import("../lib/hostMode");
    if (shouldMeasureInBrowser()) {
      const { measureBrowserPingToHost } = await import("../lib/clientNetwork");
      const resolvers = [
        { serverName: "Cloudflare DNS", primaryIp: "1.1.1.1", secondaryIp: "1.0.0.1", features: { dnsSec: true, doh: true, dot: true, malwareBlocking: true } },
        { serverName: "Google Public DNS", primaryIp: "8.8.8.8", secondaryIp: "8.8.4.4", features: { dnsSec: true, doh: true, dot: true, malwareBlocking: false } },
        { serverName: "Quad9 DNS", primaryIp: "9.9.9.9", secondaryIp: "149.112.112.112", features: { dnsSec: true, doh: true, dot: true, malwareBlocking: true } },
        { serverName: "OpenDNS / Cisco", primaryIp: "208.67.222.222", secondaryIp: "208.67.220.220", features: { dnsSec: true, doh: true, dot: false, malwareBlocking: true } },
      ];
      const items: DnsBenchmarkResult[] = [];
      for (const row of resolvers) {
        const samples: number[] = [];
        for (let i = 0; i < 3; i += 1) {
          const ping = await measureBrowserPingToHost(row.primaryIp);
          if (ping != null) samples.push(ping);
        }
        const responseTimeMs = samples.length
          ? Math.round((samples.reduce((a, b) => a + b, 0) / samples.length) * 10) / 10
          : null;
        items.push({
          ...row,
          responseTimeMs,
          status: responseTimeMs != null ? "Reachable" : "Unreachable",
          reliabilityPercent: samples.length ? Math.round((samples.length / 3) * 100) : 0,
          isCurrent: row.primaryIp === "1.1.1.1",
        });
      }
      return items;
    }
    return this.getBenchmarks();
  }
}

export const dnsService = new DnsService();
