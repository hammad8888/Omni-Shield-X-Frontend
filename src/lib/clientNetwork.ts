export type ClientNetworkInfo = {
  effectiveType?: string | null;
  downlinkMbps?: number | null;
  rttMs?: number | null;
  type?: string | null;
  online: boolean;
  publicIp?: string | null;
  localIp?: string | null;
  location?: string | null;
  isp?: string | null;
  colo?: string | null;
};

/**
 * Probes the local browser WebRTC subsystem to discover the client private LAN IP without special permissions.
 */
export async function getClientLocalIp(): Promise<string | null> {
  if (typeof window === "undefined" || typeof RTCPeerConnection === "undefined") return null;
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      let resolved = false;
      pc.createDataChannel("");
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => {
          if (!resolved) {
            resolved = true;
            resolve(null);
          }
        });

      pc.onicecandidate = (ice) => {
        if (!ice || !ice.candidate || !ice.candidate.candidate) {
          if (!resolved) {
            resolved = true;
            resolve(null);
            pc.close();
          }
          return;
        }
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
        const match = ipRegex.exec(ice.candidate.candidate);
        if (match && match[1] && !match[1].startsWith("0.0.0") && !match[1].startsWith("127.")) {
          resolved = true;
          resolve(match[1]);
          pc.close();
        }
      };

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          try {
            pc.close();
          } catch {
            /* ignore */
          }
          resolve(null);
        }
      }, 1200);
    } catch {
      resolve(null);
    }
  });
}

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
  let isp: string | null = null;
  let colo: string | null = null;

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
        if (k === "colo") colo = v?.trim() ?? null;
      }
      if (colo) {
        isp = `Cloudflare Edge POP (${colo})`;
      }
    }
  } catch {
    /* fallback to ipify if cloudflare trace was blocked */
    try {
      const ipRes = await fetch("https://api.ipify.org?format=json", {
        signal: AbortSignal.timeout(2500),
      });
      if (ipRes.ok) {
        const data = (await ipRes.json()) as { ip?: string };
        if (data.ip) publicIp = data.ip;
      }
    } catch {
      /* ignore network failure */
    }
  }

  const localIp = await getClientLocalIp().catch(() => null);

  return {
    effectiveType: conn?.effectiveType ?? null,
    downlinkMbps: typeof conn?.downlink === "number" && Number.isFinite(conn.downlink) ? conn.downlink : null,
    rttMs: typeof conn?.rtt === "number" && Number.isFinite(conn.rtt) ? conn.rtt : null,
    type: conn?.type ?? null,
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
    publicIp,
    localIp,
    location,
    isp,
    colo,
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

export async function measureClientLatency(samplesCount = 4): Promise<{ pingMs: number | null; jitterMs: number | null }> {
  const samples: number[] = [];
  for (let i = 0; i < samplesCount; i += 1) {
    const p = await measureBrowserPing();
    if (p != null) samples.push(p);
  }
  if (!samples.length) return { pingMs: null, jitterMs: null };

  const pingMs = Math.round((samples.reduce((a, b) => a + b, 0) / samples.length) * 10) / 10;
  let jitterMs: number | null = null;
  if (samples.length > 1) {
    let diffSum = 0;
    for (let i = 1; i < samples.length; i += 1) {
      diffSum += Math.abs(samples[i] - samples[i - 1]);
    }
    jitterMs = Math.round((diffSum / (samples.length - 1)) * 10) / 10;
  }

  return { pingMs, jitterMs };
}
