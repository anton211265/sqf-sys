import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RiskAgentRecommendation,
  RiskAgentDecisionEnum,
  RiskAgentFilterStageEnum,
} from '../models/risk-agent-recommendation.entity';
import {
  OrganizationKycRecommendation,
  OrganizationKycOutcomeEnum,
  OrganizationKycSourceEnum,
} from '../models/organization-kyc-recommendation.entity';
import { RiskOperationClientService } from '../tools/risk-operation-client.service';
import { ComplianceStubService } from '../tools/compliance-stub.service';
import {
  RISK_AGENT_TOOLS,
  ORGANIZATION_KYC_TOOLS,
} from '../tools/agent-tool-definitions';
import {
  RISK_AGENT_SYSTEM_PROMPT,
  RISK_AGENT_ORG_KYC_SYSTEM_PROMPT,
} from './risk-agent.system-prompt';

export interface RecommendationOutcome {
  decision: RiskAgentDecisionEnum;
  confidence: number;
  reasoning: string[];
  escalate: boolean;
}

export interface OrganizationKycOutcome {
  outcome: OrganizationKycOutcomeEnum;
  confidence: number;
  reasoning: string[];
  escalate: boolean;
}

@Injectable()
export class RiskAgentService {
  private readonly logger = new Logger(RiskAgentService.name);
  private readonly anthropic: Anthropic;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly riskOperationClient: RiskOperationClientService,
    private readonly complianceStub: ComplianceStubService,
    @InjectRepository(RiskAgentRecommendation)
    private readonly recommendationRepository: Repository<RiskAgentRecommendation>,
    @InjectRepository(OrganizationKycRecommendation)
    private readonly organizationKycRecommendationRepository: Repository<OrganizationKycRecommendation>,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.getOrThrow('ANTHROPIC_API_KEY'),
    });
    this.model = this.configService.getOrThrow('ANTHROPIC_MODEL');
  }

  /**
   * Runs a tool-use conversation for a given task (e.g. "select a screening
   * filter" or "evaluate Filter 1"). Tool calls are executed against
   * risk-operation/compliance-stub as they come in; if the model calls
   * propose_recommendation it's persisted and returned. expectRecommendation
   * controls whether a missing recommendation is logged as a harness failure
   * — filter-selection tasks don't end in a recommendation, evaluation tasks
   * do.
   */
  async runTask(params: {
    applicationId: number;
    applicationNumber: string;
    userMessage: string;
    expectRecommendation?: boolean;
  }): Promise<RecommendationOutcome | null> {
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: params.userMessage },
    ];

    let outcome: RecommendationOutcome | null = null;

    for (let turn = 0; turn < 8 && !outcome; turn++) {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2048,
        system: RISK_AGENT_SYSTEM_PROMPT,
        tools: RISK_AGENT_TOOLS,
        messages,
      });

      messages.push({ role: 'assistant', content: response.content });

      if (response.stop_reason !== 'tool_use') {
        break;
      }

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;

        if (block.name === 'propose_recommendation') {
          const input = block.input as {
            filterStage: RiskAgentFilterStageEnum;
            decision: RiskAgentDecisionEnum;
            confidence: number;
            reasoning: string[];
            escalate: boolean;
          };
          await this.recommendationRepository.save(
            new RiskAgentRecommendation({
              applicationId: params.applicationId,
              applicationNumber: params.applicationNumber,
              filterStage: input.filterStage,
              decision: input.decision,
              confidence: input.confidence,
              reasoning: input.reasoning,
              escalate: input.escalate,
            }),
          );
          outcome = {
            decision: input.decision,
            confidence: input.confidence,
            reasoning: input.reasoning,
            escalate: input.escalate,
          };
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: 'Recommendation recorded for HRA review.',
          });
          continue;
        }

        try {
          const result = await this.executeTool(block.name, block.input);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        } catch (error) {
          this.logger.warn(`Tool ${block.name} failed: ${error}`);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify({ error: String(error) }),
            is_error: true,
          });
        }
      }

      if (toolResults.length > 0) {
        messages.push({ role: 'user', content: toolResults });
      }
    }

    if (!outcome && params.expectRecommendation) {
      this.logger.error(
        `Risk Agent did not conclude with propose_recommendation for application ${params.applicationNumber} — escalate to HRA manually.`,
      );
    }

    return outcome;
  }

  /**
   * KYC-intake task for a bare, auto-created Organization (see
   * organization-kyc/organization-kyc.service.ts). Deliberately a separate
   * method from runTask rather than a generalized/parameterized version of
   * it — duplicates the turn-loop shape, but carries zero risk of regressing
   * the working, tested application-review pipeline. Uses its own curated
   * tool list (ORGANIZATION_KYC_TOOLS) and system prompt
   * (RISK_AGENT_ORG_KYC_SYSTEM_PROMPT); falls through to the same
   * executeTool for check_compliance/get_financial_credit_report, which are
   * already organization-scoped and need no changes.
   */
  async runOrganizationKycTask(params: {
    organizationId: number;
    organizationName: string;
    businessRegistrationNumber: string | null;
    country: string;
    source: OrganizationKycSourceEnum;
    funderPersonaId: number;
    userMessage: string;
  }): Promise<OrganizationKycOutcome | null> {
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: params.userMessage },
    ];

    let outcome: OrganizationKycOutcome | null = null;

    for (let turn = 0; turn < 8 && !outcome; turn++) {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2048,
        system: RISK_AGENT_ORG_KYC_SYSTEM_PROMPT,
        tools: ORGANIZATION_KYC_TOOLS,
        messages,
      });

      messages.push({ role: 'assistant', content: response.content });

      if (response.stop_reason !== 'tool_use') {
        break;
      }

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;

        if (block.name === 'propose_organization_kyc_outcome') {
          const input = block.input as {
            outcome: OrganizationKycOutcomeEnum;
            confidence: number;
            reasoning: string[];
            escalate: boolean;
          };
          await this.organizationKycRecommendationRepository.save(
            new OrganizationKycRecommendation({
              organizationId: params.organizationId,
              organizationName: params.organizationName,
              businessRegistrationNumber: params.businessRegistrationNumber,
              country: params.country,
              source: params.source,
              funderPersonaId: params.funderPersonaId,
              outcome: input.outcome,
              confidence: input.confidence,
              reasoning: input.reasoning,
              escalate: input.escalate,
            }),
          );
          outcome = {
            outcome: input.outcome,
            confidence: input.confidence,
            reasoning: input.reasoning,
            escalate: input.escalate,
          };
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: 'KYC recommendation recorded for HRA review.',
          });
          continue;
        }

        try {
          const result = await this.executeTool(block.name, block.input);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        } catch (error) {
          this.logger.warn(`Tool ${block.name} failed: ${error}`);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify({ error: String(error) }),
            is_error: true,
          });
        }
      }

      if (toolResults.length > 0) {
        messages.push({ role: 'user', content: toolResults });
      }
    }

    if (!outcome) {
      this.logger.error(
        `Risk Agent did not conclude with propose_organization_kyc_outcome for organizationId=${params.organizationId} — escalate to HRA manually.`,
      );
    }

    return outcome;
  }

  private async executeTool(name: string, input: any): Promise<unknown> {
    switch (name) {
      case 'get_application':
        return this.riskOperationClient.getApplication(input.applicationId);
      case 'list_risk_models':
        return this.riskOperationClient.listRiskModels();
      case 'list_risk_profiles':
        return this.riskOperationClient.listRiskProfiles();
      case 'assign_risk_model':
        return this.riskOperationClient.assignRiskModel(
          input.applicationNumber,
          input.riskModelNumber,
        );
      case 'change_risk_profile':
        return this.riskOperationClient.changeRiskProfile(
          input.applicationNumber,
          input.riskProfileCode,
        );
      case 'get_risk_application_scoring':
        return this.riskOperationClient.getRiskApplicationScoring(
          input.applicationNumber,
        );
      case 'get_manual_review_alerts':
        return this.riskOperationClient.getManualReviewAlerts(
          input.applicationNumber,
        );
      case 'run_quantitative_scoring':
        return this.riskOperationClient.runQuantitativeScoring(
          input.applicationNumber,
        );
      case 'generate_manual_review_alerts':
        return this.riskOperationClient.generateManualReviewAlerts(
          input.applicationNumber,
        );
      case 'get_financial_credit_report':
        return this.riskOperationClient.getFinancialCreditReport(
          input.organizationId,
        );
      case 'check_compliance': {
        const checks: string[] = input.checks ?? [];
        const results = [];
        if (checks.includes('OFAC_SANCTIONS')) {
          results.push(await this.complianceStub.checkOfacSanctions(input.subjectName));
        }
        if (checks.includes('ADVERSE_MEDIA')) {
          results.push(await this.complianceStub.checkAdverseMedia(input.subjectName));
        }
        if (checks.includes('SOCIAL_MEDIA')) {
          results.push(await this.complianceStub.checkSocialMedia(input.subjectName));
        }
        return results;
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}
