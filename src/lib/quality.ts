export function networkQuality(
  pingMs: number | null,
  jitterMs: number | null,
  lossPct: number | null,
  downloadMbps: number | null,
) {
  const factors: Array<Record<string, unknown>> = [];
  let score = 100;
  if (pingMs == null) factors.push({ key: "latency", penalty: null, note: "No latency sample" });
  else {
    const penalty = pingMs <= 20 ? 0 : Math.min(30, (pingMs - 20) / 4);
    score -= penalty;
    factors.push({ key: "latency", valueMs: pingMs, penalty });
  }
  if (jitterMs == null) factors.push({ key: "jitter", penalty: null, note: "No jitter sample" });
  else {
    const penalty = Math.min(20, jitterMs * 2);
    score -= penalty;
    factors.push({ key: "jitter", valueMs: jitterMs, penalty });
  }
  if (lossPct == null) factors.push({ key: "packetLoss", penalty: null, note: "No loss sample" });
  else {
    const penalty = Math.min(40, lossPct * 8);
    score -= penalty;
    factors.push({ key: "packetLoss", valuePct: lossPct, penalty });
  }
  if (downloadMbps == null) factors.push({ key: "download", bonus: null, note: "No download sample" });
  else {
    const bonus = Math.min(10, downloadMbps / 50);
    score += bonus;
    factors.push({ key: "download", valueMbps: downloadMbps, bonus });
  }
  if (pingMs == null && jitterMs == null && lossPct == null && downloadMbps == null) {
    return { score: null as number | null, label: null as string | null, factors };
  }
  const rounded = Math.max(0, Math.min(100, Math.round(score)));
  const label = rounded >= 90 ? "Excellent" : rounded >= 75 ? "Good" : rounded >= 50 ? "Fair" : "Poor";
  return { score: rounded, label, factors };
}
