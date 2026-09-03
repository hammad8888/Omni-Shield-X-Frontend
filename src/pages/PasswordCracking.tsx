import React, { useState } from "react";
import { securityService } from "../services/securityService";
import type { PasswordAssessmentResult } from "../types";
import { StatusBadge } from "../components/ui/StatusBadge";
import { MetricCard } from "../components/ui/MetricCard";

export const PasswordCrackingPage: React.FC = () => {
  const [network, setNetwork] = useState("");
  const [method, setMethod] = useState<"Dictionary Attack" | "Brute Force" | "Hybrid Rules">("Dictionary Attack");
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<PasswordAssessmentResult | null>(null);

  const handleStartAssessment = async () => {
    if (!isAuthorized) {
      alert("You must verify ownership or explicit authorization before running this assessment.");
      return;
    }
    setIsRunning(true);
    setResult(null);
    const res = await securityService.assessPassword({
      networkSsid: network,
      method,
      isAuthorized: true,
    });
    setResult(res);
    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Wi-Fi Password Policy
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            OmniShield does not recover or simulate attacks against Wi-Fi passphrases. Nearby networks are beacon metadata only.
          </p>
        </div>

        <StatusBadge status="warning" label="Ethical Testing Only" size="sm" />
      </div>

      {/* Mandatory Ethical & Authorization Card */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-3.5">
          <span className="text-2xl shrink-0">🛡️</span>
          <div className="space-y-2 text-xs">
            <h3 className="font-bold text-amber-900 text-sm">
              Authorized Network Ownership Policy
            </h3>
            <p className="text-amber-800 leading-relaxed">
              This module evaluates the cryptographic entropy and offline dictionary resilience of <b>your own authorized network password</b>. Omni-Shield-X strictly prohibits unauthorized credential theft, interception, or attacks on neighboring networks.
            </p>
            <label className="flex items-center gap-2 font-bold text-amber-950 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isAuthorized}
                onChange={(e) => setIsAuthorized(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span>I confirm I am the authorized owner / network administrator of this SSID.</span>
            </label>
          </div>
        </div>
      </div>

      {/* Configuration Console */}
      <div className="dashboard-card p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Assessment Parameters</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Authorized Network</label>
            <input
              type="text"
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-bold focus:outline-none"
              placeholder="Associated SSID you own"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Simulation Algorithm</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-none"
            >
              <option value="Dictionary Attack">Dictionary Attack (RockYou Top 1M Corpus)</option>
              <option value="Hybrid Rules">Hybrid Rules (Leet-speak mutations)</option>
              <option value="Brute Force">Brute Force (GPU 14.5 MH/s Simulation)</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            disabled={isRunning || !isAuthorized}
            onClick={handleStartAssessment}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <span>{isRunning ? "🔄" : "⚡"}</span>
            {isRunning ? "Checking policy…" : "Request assessment"}
          </button>
        </div>
      </div>

      {/* Results Presentation */}
      {result && (
        <div className="space-y-6 animate-in zoom-in-95 duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard label="Password Strength" value={result.strengthRating ?? "UNAVAILABLE"} />
            <MetricCard label="Entropy" value={result.entropyBits ?? "—"} unit="bits" />
            <MetricCard label="Time to Crack" value={result.estimatedTimeToCrack ?? "Not run"} />
            <MetricCard label="Keys Evaluated" value={result.testedCombinations ?? "—"} />
          </div>

          <div className="dashboard-card p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Security Recommendations</h3>
            <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="leading-relaxed">
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
