import { measureClientLatency, probeClientNetwork } from "./clientNetwork";
import { networkQuality } from "./quality";

export type BrowserSpeedProgress = {
  phase: string;
  currentMbps: number;
  downloadMbps: number | null;
  uploadMbps: number | null;
  pingMs: number | null;
  jitterMs: number | null;
  packetLossPct: number | null;
  bytes: number;
  totalBytes: number;
  downloadSamples: number[];
  uploadSamples: number[];
};

export type BrowserSpeedResult = BrowserSpeedProgress & {
  freshness: "LIVE" | "UNAVAILABLE";
  source: "browser-http-speedtest";
  server: string;
  isp: string | null;
  publicIp: string | null;
  localIp: string | null;
  locationHint: string | null;
  qualityScore: number | null;
  qualityLabel: string | null;
  connectionType: "multi" | "single";
  methodology: string;
  note: string;
  reason: string | null;
  durationMs: number;
};

const DOWNLOAD_URL = "https://speed.cloudflare.com/__down";
const UPLOAD_URL = "https://speed.cloudflare.com/__up";
const SAMPLE_MS = 80;
const DOWNLOAD_BYTES_SINGLE = 12_000_000;
const DOWNLOAD_BYTES_MULTI = 8_000_000;
const UPLOAD_BYTES = 3_000_000;
const UPLOAD_CHUNK = 256 * 1024;

function idle(): BrowserSpeedProgress {
  return {
    phase: "idle",
    currentMbps: 0,
    downloadMbps: null,
    uploadMbps: null,
    pingMs: null,
    jitterMs: null,
    packetLossPct: null,
    bytes: 0,
    totalBytes: 0,
    downloadSamples: [],
    uploadSamples: [],
  };
}

function record(samples: number[], mbps: number) {
  return [...samples, Math.max(0, Math.round(mbps * 100) / 100)].slice(-60);
}

async function streamOneDownload(bytes: number, onTick: (got: number, mbps: number) => void): Promise<number> {
  const res = await fetch(`${DOWNLOAD_URL}?bytes=${bytes}&_t=${Date.now()}`, { cache: "no-store", signal: AbortSignal.timeout(45000) });
  if (!res.ok || !res.body) throw new Error(`Download HTTP ${res.status}`);
  const reader = res.body.getReader();
  let got = 0;
  const t0 = performance.now();
  let lastEmit = t0;
  let windowT = t0;
  let windowGot = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    got += value.byteLength;
    windowGot += value.byteLength;
    const now = performance.now();
    if (now - lastEmit < SAMPLE_MS) continue;
    const dt = (now - windowT) / 1000;
    const elapsed = (now - t0) / 1000;
    if (dt > 0 && windowGot > 0) {
      const instant = (windowGot * 8) / dt / 1_000_000;
      const cumulative = elapsed > 0 ? (got * 8) / elapsed / 1_000_000 : instant;
      onTick(got, elapsed > 0.4 ? instant * 0.7 + cumulative * 0.3 : cumulative);
    }
    windowT = now;
    windowGot = 0;
    lastEmit = now;
  }
  const elapsed = (performance.now() - t0) / 1000;
  if (elapsed <= 0 || got <= 0) throw new Error("Empty download");
  return (got * 8) / elapsed / 1_000_000;
}

async function streamUpload(onTick: (sent: number, mbps: number) => void): Promise<number> {
  const chunk = new Uint8Array(UPLOAD_CHUNK);
  for (let i = 0; i < chunk.length; i += 1) chunk[i] = (i % 251) + 1;
  let sent = 0;
  const t0 = performance.now();
  let windowT = t0;
  while (sent < UPLOAD_BYTES) {
    const n = Math.min(UPLOAD_CHUNK, UPLOAD_BYTES - sent);
    const body = n === UPLOAD_CHUNK ? chunk : chunk.subarray(0, n);
    const res = await fetch(UPLOAD_URL, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/octet-stream" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`Upload HTTP ${res.status}`);
    sent += n;
    const now = performance.now();
    const dt = (now - windowT) / 1000;
    const elapsed = (now - t0) / 1000;
    if (dt > 0) {
      const instant = (n * 8) / dt / 1_000_000;
      const cumulative = elapsed > 0 ? (sent * 8) / elapsed / 1_000_000 : instant;
      onTick(sent, elapsed > 0.3 ? instant * 0.7 + cumulative * 0.3 : cumulative);
    }
    windowT = now;
  }
  const elapsed = (performance.now() - t0) / 1000;
  if (elapsed <= 0 || sent <= 0) throw new Error("Empty upload");
  return (sent * 8) / elapsed / 1_000_000;
}

export async function runBrowserSpeedTest(opts: {
  connectionType?: "multi" | "single";
  serverName?: string;
  onProgress?: (progress: BrowserSpeedProgress) => void;
}): Promise<BrowserSpeedResult> {
  const connectionType = opts.connectionType === "single" ? "single" : "multi";
  const started = Date.now();
  let progress = idle();
  const emit = (patch: Partial<BrowserSpeedProgress>) => {
    progress = { ...progress, ...patch };
    opts.onProgress?.({ ...progress, downloadSamples: [...progress.downloadSamples], uploadSamples: [...progress.uploadSamples] });
  };

  emit({ phase: "testing_latency" });
  const latency = await measureClientLatency(5);
  emit({
    pingMs: latency.pingMs,
    jitterMs: latency.jitterMs,
    packetLossPct: latency.pingMs == null ? 100 : 0,
  });

  const identity = await probeClientNetwork().catch(() => null);
  const streams = connectionType === "single" ? 1 : 4;
  const perStream = connectionType === "single" ? DOWNLOAD_BYTES_SINGLE : DOWNLOAD_BYTES_MULTI;
  emit({ phase: "testing_download", totalBytes: perStream * streams, bytes: 0 });

  let downloadMbps: number | null = null;
  const gotPerStream = new Array(streams).fill(0);
  try {
    const results = await Promise.all(
      Array.from({ length: streams }, (_, idx) =>
        streamOneDownload(perStream, (got, mbps) => {
          gotPerStream[idx] = got;
          const totalGot = gotPerStream.reduce((a, b) => a + b, 0);
          emit({
            phase: "testing_download",
            bytes: totalGot,
            totalBytes: perStream * streams,
            currentMbps: mbps * streams,
            downloadSamples: record(progress.downloadSamples, mbps * streams),
          });
        }),
      ),
    );
    downloadMbps = Math.round(results.reduce((a, b) => a + b, 0) * 100) / 100;
    emit({ downloadMbps, currentMbps: downloadMbps, downloadSamples: record(progress.downloadSamples, downloadMbps) });
  } catch {
    /* keep null */
  }

  let uploadMbps: number | null = null;
  emit({ phase: "testing_upload", bytes: 0, totalBytes: UPLOAD_BYTES });
  try {
    uploadMbps = Math.round((await streamUpload((sent, mbps) => {
      emit({
        phase: "testing_upload",
        bytes: sent,
        totalBytes: UPLOAD_BYTES,
        currentMbps: mbps,
        uploadSamples: record(progress.uploadSamples, mbps),
      });
    })) * 100) / 100;
    emit({ uploadMbps, currentMbps: uploadMbps, uploadSamples: record(progress.uploadSamples, uploadMbps) });
  } catch {
    /* keep null */
  }

  const quality = networkQuality(latency.pingMs, latency.jitterMs, latency.pingMs == null ? 100 : 0, downloadMbps);
  const liveAny = downloadMbps != null || uploadMbps != null || latency.pingMs != null;
  emit({ phase: liveAny ? "completed" : "error" });

  return {
    ...progress,
    freshness: liveAny ? "LIVE" : "UNAVAILABLE",
    source: "browser-http-speedtest",
    server: opts.serverName ?? "Cloudflare Global Anycast",
    isp: identity?.isp ?? (identity?.colo ? `Cloudflare Edge POP (${identity.colo})` : null),
    publicIp: identity?.publicIp ?? null,
    localIp: identity?.localIp ?? null,
    locationHint: identity?.location ?? null,
    qualityScore: quality.score,
    qualityLabel: quality.label,
    connectionType,
    methodology: `Browser ${connectionType}-stream HTTP GET against Cloudflare __down plus POST to __up, timed from this visitor device.`,
    note: "Measured live from this browser, not from the remote Render host.",
    reason: liveAny ? null : "Browser could not reach Cloudflare speed endpoints",
    durationMs: Date.now() - started,
  };
}
