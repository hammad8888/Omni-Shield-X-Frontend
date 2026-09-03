export function dash(value: unknown, fallback = "—") {
  if (value == null || value === "") return fallback;
  return value as string | number;
}

export function percentToDbm(percent?: number | null): number | null {
  if (percent == null || Number.isNaN(percent)) return null;
  return Math.round(percent / 2 - 100);
}

export function bandFromChannel(channel?: number | null, radio?: string | null, band?: string | null): "2.4 GHz" | "5 GHz" | "6 GHz" | string | null {
  const text = `${band ?? ""} ${radio ?? ""}`.toLowerCase();
  if (text.includes("6")) return "6 GHz";
  if (typeof channel === "number") {
    if (channel >= 1 && channel <= 14) return "2.4 GHz";
    if (channel >= 32) return "5 GHz";
  }
  if (text.includes("2.4")) return "2.4 GHz";
  if (text.includes("5")) return "5 GHz";
  return band ?? null;
}

export function metricStatus(value: number | null, kind: "speed" | "latency" | "loss"): "excellent" | "good" | "fair" | "poor" | "neutral" {
  if (value == null) return "neutral";
  if (kind === "speed") {
    if (value >= 100) return "excellent";
    if (value >= 25) return "good";
    if (value >= 10) return "fair";
    return "poor";
  }
  if (kind === "loss") {
    if (value <= 0.5) return "excellent";
    if (value <= 2) return "good";
    if (value <= 5) return "fair";
    return "poor";
  }
  if (value <= 20) return "excellent";
  if (value <= 50) return "good";
  if (value <= 100) return "fair";
  return "poor";
}
