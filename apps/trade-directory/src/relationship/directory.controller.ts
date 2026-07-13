import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { OrganizationRepository } from '../repositories';

// Directory home listing: every organization with its persona flags, so the
// frontend can render the Client / Supplier / Buyer / Funder badge matrix.
// Intended access (future dynamic RBAC): any internal funder staff role.
@Controller('/api/trade-directory')
@UseGuards(JwtAuthGuard)
export class DirectoryController {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  @Get('organizations')
  async listOrganizations() {
    const organizations = await this.organizationRepository.find({
      order: { organizationName: 'ASC' },
    });

    return organizations.map((organization) => ({
      id: organization.id,
      organizationName: organization.organizationName,
      country: organization.country,
      malaysiaRegion: organization.malaysiaRegion,
      businessRegistrationNumber: organization.businessRegistrationNumber,
      emailAddress: organization.emailAddress,
      contactNumber: organization.contactNumber,
      fullyOnboardedAt: organization.fullyOnboardedAt,
      createdAt: organization.createdAt,
      personas: {
        isClient: organization.clientPersonaId != null,
        isSupplier: organization.supplierPersonaId != null,
        isBuyer: organization.buyerPersonaId != null,
        isFunder: organization.funderPersonaId != null,
      },
    }));
  }
}
