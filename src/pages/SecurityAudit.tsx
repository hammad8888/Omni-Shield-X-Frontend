import React, { useState } from "react";
import { securityService } from "../services/securityService";
import type { SecurityAuditReport } from "../types";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ProgressRing } from "../components/ui/ProgressRing";

export const SecurityAuditPage: React.FC = () => {
  const [report, setReport] = useState<SecurityAuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const handleStartAudit = async () => {
    setIsAuditing(true);
    const updated = await securityService.runFullAudit();
    setReport(updated);
    setIsAuditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Wi-Fi Security & Protocol Audit
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deep inspection of handshake protocols, authentication methods, cryptographic suites, and client isolation
          </p>
        </div>

        <button
          disabled={isAuditing}
          onClick={handleStartAudit}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl shadow-sm transition-all flex items-center gap-2"
        >
          <span>{isAuditing ? "🔄" : "🛡️"}</span>
          {isAuditing ? "Auditing Network..." : "Start Security Audit"}
        </button>
      </div>

      {/* Audit Scope Confirmation Banner */}
      <div className="dashboard-card p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Audit Target: {report?.networkAudited || "Associated WLAN (if any)"}</h3>
            <p className="text-xs text-slate-500">Observed radio metadata and stored findings only. Modem UPnP/WPS are not invented.</p>
          </div>
          {report && (
            <div className="flex items-center gap-3">
              <ProgressRing progress={report.score ?? 0} size={48} strokeWidth={5} color="#10B981" label={`${report.score ?? "—"}`} />
              <StatusBadge status="passed" label={`Grade ${report.grade}`} size="sm" />
            </div>
          )}
        </div>

        <div className="space-y-3 text-xs">
          {(report?.items ?? []).map((item) => (
            <div key={item.id} className="flex items-start gap-2 text-slate-700">
              <span>{item.status === "passed" ? "✓" : item.status === "failed" ? "✕" : "!"}</span>
              <span>
                <b>{item.title}:</b> {item.description}
              </span>
            </div>
          ))}
          {!report ? <p className="text-slate-500">Run the audit to load observed checks. Nothing is invented while idle.</p> : null}
        </div>
      </div>
    </div>
  );
};
