import type { SecurityAuditReport, PasswordAssessmentConfig, PasswordAssessmentResult } from "../types";
import { api } from "../api";

class SecurityService {
  async getAuditReport(): Promise<SecurityAuditReport> {
    return api<SecurityAuditReport>("/api/security/report");
  }

  async runFullAudit(): Promise<SecurityAuditReport> {
    return this.getAuditReport();
  }

  async assessPassword(config: PasswordAssessmentConfig): Promise<PasswordAssessmentResult> {
    return api<PasswordAssessmentResult>("/api/security/password-assessment", {
      method: "POST",
      body: JSON.stringify({
        networkSsid: config.networkSsid,
        method: config.method,
        isAuthorized: config.isAuthorized,
      }),
      allowStatuses: [409],
    });
  }
}

export const securityService = new SecurityService();
