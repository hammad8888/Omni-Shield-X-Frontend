import { shouldMeasureInBrowser } from "../../lib/hostMode";
import { useVisitorTelemetry } from "../../visitorTelemetry";

export function OriginBanner({ surface }: { surface: "wan" | "lan" | "wifi" | "modem" }) {
  const visitor = useVisitorTelemetry();
  const browser = shouldMeasureInBrowser(visitor.capability);

  if (!browser && surface === "wan") return null;

  if (surface === "wan") {
    return (
      <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
        Live WAN metrics are timed from <strong>this browser</strong>, not from the Render API host
        {visitor.capability.hostname ? ` (${visitor.capability.hostname})` : ""}.
        Ping, jitter, and speed now follow your path to the edge.
      </p>
    );
  }

  const copy =
    surface === "wifi"
      ? "SSID, RSSI, channel, and nearby APs need a local Windows OmniShield agent. This hosted site cannot see your radio."
      : surface === "lan"
        ? "ARP / DHCP device inventory needs a local Windows agent on your LAN. The cloud API only sees its own container network."
        : "Gateway, modem admin, and LAN NIC counters need a local agent. The browser can still show your public and WebRTC LAN IP.";

  return (
    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
      {copy} WAN ping and speed on this live site are measured from your browser.
    </p>
  );
}
