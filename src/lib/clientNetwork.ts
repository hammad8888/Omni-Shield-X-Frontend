export type ClientNetworkInfo = {
  effectiveType?: string | null;
  downlinkMbps?: number | null;
  rttMs?: number | null;
  type?: string | null;
  online: boolean;
  publicIp?: string | null;
  location?: string | null;
};

export async function probeClientNetwork(): Promise<ClientNetworkInfo> {
  const navConn = typeof navigator !== "undefined"
    ? (navigator as unknown as {
        connection?: { effectiveType?: string; downlink?: number; rtt?: number; type?: string };
        mozConnection?: { effectiveType?: string; downlink?: number; rtt?: number; type?: string };
        webkitConnection?: { effectiveType?: string; downlink?: number; rtt?: number; type?: string };
      })
    : {};
  const conn = navConn.connection || navConn.mozConnection || navConn.webkitConnection;

  let publicIp: string | null = null;
  let location: string | null = null;

  try {
    const res = await fetch("https://speed.cloudflare.com/cdn-cgi/trace", {
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (res.ok) {
      const text = await res.text();
      for (const line of text.split("\n")) {
        const [k, v] = line.split("=");
        if (k === "ip") publicIp = v?.trim() ?? null;
        if (k === "loc") location = v?.trim() ?? null;
      }
    }
  } catch {
    /* ignore network failure */
  }

  return {
    effectiveType: conn?.effectiveType ?? null,
    downlinkMbps: typeof conn?.downlink === "number" && Number.isFinite(conn.downlink) ? conn.downlink : null,
    rttMs: typeof conn?.rtt === "number" && Number.isFinite(conn.rtt) ? conn.rtt : null,
    type: conn?.type ?? null,
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
    publicIp,
    location,
  };
}

export async function measureBrowserPing(url = "https://1.1.1.1/cdn-cgi/trace"): Promise<number | null> {
  try {
    const start = performance.now();
    await fetch(`${url}?_t=${Date.now()}`, { mode: "no-cors", cache: "no-store", signal: AbortSignal.timeout(2000) });
    const elapsed = Math.round((performance.now() - start) * 10) / 10;
    return elapsed > 0 ? elapsed : null;
  } catch {
    return null;
  }
}
