import { Injectable } from '@nestjs/common';

export interface ComplianceCheckResult {
  source: 'OFAC_SANCTIONS' | 'ADVERSE_MEDIA' | 'SOCIAL_MEDIA';
  subjectName: string;
  isFlagged: boolean;
  summary: string;
}

/**
 * Stubbed Filter 2 compliance provider. Returns canned results behind the
 * same shape a real OFAC / adverse-media / social-media provider would
 * implement later (per Tony's decision to mock external compliance sources
 * for the local prototype, see AskUserQuestion answer on Filter 2 sources).
 * Flags any subject name containing "SANCTION" or "ADVERSE" — for demo/test
 * data only.
 */
@Injectable()
export class ComplianceStubService {
  async checkOfacSanctions(subjectName: string): Promise<ComplianceCheckResult> {
    const isFlagged = /sanction/i.test(subjectName);
    return {
      source: 'OFAC_SANCTIONS',
      subjectName,
      isFlagged,
      summary: isFlagged
        ? `${subjectName} matched a stubbed OFAC sanctions entry.`
        : `No OFAC sanctions match found for ${subjectName} (stubbed).`,
    };
  }

  async checkAdverseMedia(subjectName: string): Promise<ComplianceCheckResult> {
    const isFlagged = /adverse/i.test(subjectName);
    return {
      source: 'ADVERSE_MEDIA',
      subjectName,
      isFlagged,
      summary: isFlagged
        ? `Stubbed adverse media hit found for ${subjectName}.`
        : `No adverse media found for ${subjectName} (stubbed).`,
    };
  }

  async checkSocialMedia(subjectName: string): Promise<ComplianceCheckResult> {
    return {
      source: 'SOCIAL_MEDIA',
      subjectName,
      isFlagged: false,
      summary: `No social media risk signals found for ${subjectName} (stubbed).`,
    };
  }
}
