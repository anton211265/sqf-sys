import { createHash } from 'crypto';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BankCountryMatchModeEnum,
  CorporateEmailModeEnum,
  FunderConfigSettings,
} from '../models/funder-config-settings.entity';
import { LegalDocumentTemplate } from '../models/legal-document-template.entity';
import { Product } from '../models/product.entity';

/** documentCode of the funder-editable portal disclaimer template. */
export const PORTAL_DISCLAIMER_CODE = 'PORTAL_DISCLAIMER';

@Injectable()
export class PublicOnboardingService {
  constructor(
    @InjectRepository(FunderConfigSettings)
    private readonly settingsRepository: Repository<FunderConfigSettings>,
    @InjectRepository(LegalDocumentTemplate)
    private readonly templateRepository: Repository<LegalDocumentTemplate>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Dev binding (approved annotation Q6): the shared dev DB serves one
   * funder — new applicants bind to DEFAULT_FUNDER_ORG_ID (org 2).
   * Production is a per-funder deployment, so the binding is the
   * deployment itself.
   */
  private funderOrgId(): number {
    return parseInt(
      this.configService.get<string>('DEFAULT_FUNDER_ORG_ID') ?? '2',
      10,
    );
  }

  async getOnboardingConfig() {
    const funderOrganizationId = this.funderOrgId();
    const settings = await this.settingsRepository.findOne({
      where: { funderOrganizationId },
    });
    const disclaimer = await this.templateRepository.findOne({
      where: {
        funderOrganizationId,
        documentCode: PORTAL_DISCLAIMER_CODE,
      },
      order: { id: 'DESC' },
    });
    if (!disclaimer?.templateBody) {
      // Fail closed: without a disclaimer no application can be started.
      throw new ServiceUnavailableException(
        'Onboarding is not configured for this funder (missing disclaimer template)',
      );
    }
    const products = await this.productRepository.find({
      where: {
        funderOrganizationId,
        isActive: true,
        isCustomBespoke: false,
      },
      order: { id: 'ASC' },
    });
    return {
      funderOrganizationId,
      disclaimer: {
        documentCode: PORTAL_DISCLAIMER_CODE,
        body: disclaimer.templateBody,
        // Content hash = the disclaimer "version" recorded on acceptance;
        // any text edit produces a new hash automatically.
        hash: createHash('sha256').update(disclaimer.templateBody).digest('hex'),
      },
      corporateEmailMode:
        settings?.corporateEmailMode ?? CorporateEmailModeEnum.BLOCK,
      bankCountryMatchMode:
        settings?.bankCountryMatchMode ?? BankCountryMatchModeEnum.HARD_BLOCK,
      activeProducts: products.map((p) => ({
        productCode: p.productCode,
        productName: p.productName,
      })),
    };
  }
}
