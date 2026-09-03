import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { securityService } from "../services/securityService";
import type { SecurityAuditReport } from "../types";
import { StatusBadge } from "../components/ui/StatusBadge";
import { PageHeader } from "../components/ui/PageHeader";

export const SecurityCenterPage: React.FC = () => {
  const [report, setReport] = useState<SecurityAuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    securityService
      .getAuditReport()
      .then(setReport)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) return <p className="text-sm text-rose-700">{error}</p>;
  if (!report) return <p className="text-sm text-slate-500">Loading observations…</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security"
        description="Observed WLAN cipher and stored findings. Router UPnP, WPS, and admin passwords are never invented."
        actions={
          <>
            <Link to="/security/audit" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white">
              Audit
            </Link>
            <Link to="/wifi" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">
              Wi-Fi
            </Link>
          </>
        }
      />

      {report.note ? <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">{report.note}</p> : null}

      <div className="dashboard-card grid gap-4 p-5 sm:grid-cols-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Network</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{report.networkAudited ?? "—"}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Passed</p>
          <p className="mt-1 font-mono text-sm font-semibold text-slate-900">{report.checksPassed}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Warnings</p>
          <p className="mt-1 font-mono text-sm font-semibold text-slate-900">{report.checksWarning}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Failed</p>
          <p className="mt-1 font-mono text-sm font-semibold text-slate-900">{report.checksFailed}</p>
        </div>
      </div>

      <div className="dashboard-card overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Observations</h3>
        </div>
        <div className="divide-y divide-slate-100 text-xs">
          {report.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 p-4">
              <div>
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="mt-1 text-slate-600">{item.description}</p>
                {item.remediation ? <p className="mt-1 text-slate-500">{item.remediation}</p> : null}
              </div>
              <StatusBadge status={item.status} label={item.status} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
