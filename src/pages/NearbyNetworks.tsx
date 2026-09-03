import React from "react";
import { useWiFi } from "../hooks/useWiFi";
import { PageHeader } from "../components/ui/PageHeader";
import { NetworkTable } from "../components/ui/NetworkTable";

export const NearbyNetworksPage: React.FC = () => {
  const { nearbyNetworks, isScanning, rescan, reason } = useWiFi();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nearby networks"
        description="Passive beacon scan from this PC. Credentials of other networks are never shown."
        actions={
          <button
            disabled={isScanning}
            onClick={() => void rescan()}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
          >
            {isScanning ? "Scanning…" : "Rescan"}
          </button>
        }
      />

      {reason ? <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{reason}</p> : null}

      {/* Network Table */}
      <NetworkTable networks={nearbyNetworks} />
    </div>
  );
};
