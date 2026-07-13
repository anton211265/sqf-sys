import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

/**
 * Wraps apps/risk-operation's REST API as the Risk Agent's tool surface
 * (Schema Agent contracts, not yet formalized — these are the prototype's
 * tool implementations). Read-and-recommend only: the agent never calls
 * an endpoint that finalizes a decision (risk-filter-1-status,
 * submit-for-settlement) — those are HRA-only actions from the dashboard.
 */
@Injectable()
export class RiskOperationClientService {
  constructor(private readonly http: HttpService) {}

  async getApplication(applicationId: number) {
    const { data } = await firstValueFrom(
      this.http.get(`/api/applications/${applicationId}`),
    );
    return data;
  }

  async getLatestApplication() {
    const { data } = await firstValueFrom(
      this.http.get(`/api/applications/latest`),
    );
    return data;
  }

  async assignRiskModel(applicationNumber: string, riskModelNumber: string) {
    const { data } = await firstValueFrom(
      this.http.post(
        `/api/risk-application-scoring/${applicationNumber}/assign-risk-model`,
        { riskModelNumber },
      ),
    );
    return data;
  }

  async changeRiskProfile(applicationNumber: string, riskProfileCode: string) {
    const { data } = await firstValueFrom(
      this.http.patch(
        `/api/risk-application-scoring/${applicationNumber}/change-risk-profile`,
        { riskProfileCode },
      ),
    );
    return data;
  }

  async getRiskApplicationScoring(applicationNumber: string) {
    const { data } = await firstValueFrom(
      this.http.get(`/api/risk-application-scoring/${applicationNumber}`),
    );
    return data;
  }

  async getRiskFactorScores(applicationNumber: string) {
    const { data } = await firstValueFrom(
      this.http.get(
        `/api/risk-factor-scoring/${applicationNumber}/risk-factor-scores`,
      ),
    );
    return data;
  }

  async getManualReviewAlerts(applicationNumber: string) {
    const { data } = await firstValueFrom(
      this.http.get(`/api/risk-manual-review-alert/${applicationNumber}`),
    );
    return data;
  }

  async runQuantitativeScoring(applicationNumber: string) {
    const { data } = await firstValueFrom(
      this.http.post(
        `/api/risk-quantitative-profile-scoring/${applicationNumber}`,
        {},
      ),
    );
    return data;
  }

  async generateManualReviewAlerts(applicationNumber: string) {
    const { data } = await firstValueFrom(
      this.http.get(
        `/api/risk-manual-review-alert/${applicationNumber}/generate`,
      ),
    );
    return data;
  }

  async listRiskModels() {
    const { data } = await firstValueFrom(this.http.get(`/api/risk-model`));
    return data;
  }

  async listRiskProfiles() {
    const { data } = await firstValueFrom(this.http.get(`/api/risk-profile`));
    return data;
  }

  async getFinancialCreditReport(organizationId: number) {
    const { data } = await firstValueFrom(
      this.http.get(`/api/financial-credit-report`, {
        params: { organizationId },
      }),
    );
    return data;
  }
}
