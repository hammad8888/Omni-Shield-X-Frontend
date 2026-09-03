import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "./api";

/** ISP-style decimal units. 1 Mbps = 1000 kbps = 1_000_000 bps. 1 MB/s = 8 Mbps. */
export type SpeedUnit = "auto" | "bps" | "kbps" | "Mbps" | "Gbps" | "B/s" | "kB/s" | "MB/s";

export const SPEED_UNIT_OPTIONS: { value: SpeedUnit; label: string; hint: string }[] = [
  { value: "auto", label: "Auto (kbps / Mbps / Gbps)", hint: "Picks the readable bit unit from the measured Mbps sample" },
  { value: "bps", label: "bps — bits per second", hint: "Raw bits. 1 Mbps = 1,000,000 bps" },
  { value: "kbps", label: "kbps — kilobits/s", hint: "1 Mbps = 1,000 kbps (not kilobytes)" },
  { value: "Mbps", label: "Mbps — megabits/s", hint: "ISP and speed-test default (not MB/s)" },
  { value: "Gbps", label: "Gbps — gigabits/s", hint: "1 Gbps = 1,000 Mbps" },
  { value: "B/s", label: "B/s — bytes per second", hint: "Divide bits by 8" },
  { value: "kB/s", label: "kB/s — kilobytes/s", hint: "1 kB/s = 8 kbps. File-copy style" },
  { value: "MB/s", label: "MB/s — megabytes/s", hint: "1 MB/s = 8 Mbps. Not the same as Mbps" },
];

type PrefsState = {
  speedUnit: SpeedUnit;
  pollIntervalMs: number;
  setSpeedUnit: (unit: SpeedUnit) => Promise<void>;
  setPollIntervalMs: (ms: number) => Promise<void>;
};

const Ctx = createContext<PrefsState | null>(null);
const LOCAL_UNIT = "omnishield.speedUnit";
const LOCAL_POLL = "omnishield.pollMs";

const ALLOWED: SpeedUnit[] = SPEED_UNIT_OPTIONS.map((row) => row.value);

function asUnit(value: unknown): SpeedUnit {
  const raw = String(value ?? "");
  const aliases: Record<string, SpeedUnit> = {
    kb: "kbps",
    Kbps: "kbps",
    KB: "kB/s",
    "KB/s": "kB/s",
    KBps: "kB/s",
    MBps: "MB/s",
    mbps: "Mbps",
    MBPS: "Mbps",
    gbps: "Gbps",
  };
  if (aliases[raw]) return aliases[raw];
  return ALLOWED.includes(raw as SpeedUnit) ? (raw as SpeedUnit) : "Mbps";
}

export function resolveSpeedUnit(mbps: number, unit: SpeedUnit): Exclude<SpeedUnit, "auto"> {
  if (unit !== "auto") return unit;
  if (mbps < 1) return "kbps";
  if (mbps < 1000) return "Mbps";
  return "Gbps";
}

export function convertFromMbps(mbps: number, unit: Exclude<SpeedUnit, "auto">): number {
  switch (unit) {
    case "bps":
      return mbps * 1_000_000;
    case "kbps":
      return mbps * 1_000;
    case "Mbps":
      return mbps;
    case "Gbps":
      return mbps / 1_000;
    case "B/s":
      return (mbps * 1_000_000) / 8;
    case "kB/s":
      return (mbps * 1_000) / 8;
    case "MB/s":
      return mbps / 8;
    default:
      return mbps;
  }
}

export function formatSpeed(mbps: number | null | undefined, unit: SpeedUnit, digits = 2): string {
  if (mbps == null || !Number.isFinite(mbps)) return "—";
  const resolved = resolveSpeedUnit(mbps, unit);
  const value = convertFromMbps(mbps, resolved);
  const rounded = resolved === "bps" || resolved === "B/s" ? Math.round(value) : Number(value.toFixed(Math.abs(value) >= 100 ? 1 : digits));
  return `${rounded} ${resolved}`;
}

export function speedParts(mbps: number | null | undefined, unit: SpeedUnit, digits = 2): { value: string; unit: string } {
  if (mbps == null || !Number.isFinite(mbps)) return { value: "—", unit: unit === "auto" ? "Mbps" : unit };
  const resolved = resolveSpeedUnit(mbps, unit);
  const value = convertFromMbps(mbps, resolved);
  const rounded = resolved === "bps" || resolved === "B/s" ? Math.round(value) : Number(value.toFixed(Math.abs(value) >= 100 ? 1 : digits));
  return { value: String(rounded), unit: resolved };
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes)) return "—";
  if (bytes < 1000) return `${Math.round(bytes)} B`;
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(1)} kB`;
  if (bytes < 1_000_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [speedUnit, setUnit] = useState<SpeedUnit>(() => asUnit(localStorage.getItem(LOCAL_UNIT)));
  const [pollIntervalMs, setPoll] = useState(() => {
    const n = Number(localStorage.getItem(LOCAL_POLL));
    return [1000, 2000, 3000, 5000, 10000].includes(n) ? n : 1000;
  });

  useEffect(() => {
    api<{ items: Array<{ key: string; value: unknown }> }>("/api/settings")
      .then((data) => {
        const unit = data.items.find((row) => row.key === "display.speedUnit")?.value;
        const poll = data.items.find((row) => row.key === "display.pollIntervalMs")?.value;
        if (unit != null) {
          const next = asUnit(unit);
          setUnit(next);
          localStorage.setItem(LOCAL_UNIT, next);
        }
        if (typeof poll === "number" && [1000, 2000, 3000, 5000, 10000].includes(poll)) {
          setPoll(poll);
          localStorage.setItem(LOCAL_POLL, String(poll));
        }
      })
      .catch(() => undefined);
  }, []);

  const setSpeedUnit = useCallback(async (unit: SpeedUnit) => {
    setUnit(unit);
    localStorage.setItem(LOCAL_UNIT, unit);
    await api(`/api/settings/${encodeURIComponent("display.speedUnit")}`, {
      method: "PATCH",
      body: JSON.stringify({ value: unit }),
    }).catch(() => undefined);
  }, []);

  const setPollIntervalMs = useCallback(async (ms: number) => {
    setPoll(ms);
    localStorage.setItem(LOCAL_POLL, String(ms));
    await api(`/api/settings/${encodeURIComponent("display.pollIntervalMs")}`, {
      method: "PATCH",
      body: JSON.stringify({ value: ms }),
    }).catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({ speedUnit, pollIntervalMs, setSpeedUnit, setPollIntervalMs }),
    [speedUnit, pollIntervalMs, setSpeedUnit, setPollIntervalMs],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrefs() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePrefs must be used within PrefsProvider");
  return ctx;
}
