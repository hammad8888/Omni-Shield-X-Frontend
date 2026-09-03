import type { DnsBenchmarkResult } from "../types";
import { api } from "../api";

class DnsService {
  async getBenchmarks(): Promise<DnsBenchmarkResult[]> {
    const res = await api<{ items?: DnsBenchmarkResult[] }>("/api/dns/benchmark");
    return res.items ?? [];
  }

  async runBenchmark(): Promise<DnsBenchmarkResult[]> {
    return this.getBenchmarks();
  }
}

export const dnsService = new DnsService();
