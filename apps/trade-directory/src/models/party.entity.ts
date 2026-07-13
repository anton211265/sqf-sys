import { CountryCodeEnum } from '@app/common/constants/countries';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

// Reusable record for any party appearing on an invoice (supplier, customer,
// payee, tax representative) — see docs/design/../SCEHMA/ubl-invoice-data-dictionary.md.
// Deliberately NOT the same record as Organization: a party row is an
// immutable snapshot of that party's details as they appeared on a specific
// invoice document, so editing an Organization later never rewrites history.
// organizationId links back to the live SQF org when the party is a known one.
@Entity()
export class Party extends AbstractEntity<Party> {
  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organizationId' })
  organization?: Organization;

  @RelationId((party: Party) => party.organization)
  @Index()
  @Column({ type: 'integer', nullable: true })
  organizationId?: number;

  // Electronic address for message routing, e.g. a Peppol participant ID.
  @Column({ type: 'varchar', nullable: true })
  endpointId?: string;

  @Column({ type: 'varchar', nullable: true })
  endpointSchemeId?: string;

  @Column({ type: 'varchar', nullable: true })
  partyName?: string;

  @Column({ type: 'varchar', nullable: true })
  registrationName?: string;

  @Column({ type: 'varchar', nullable: true })
  companyId?: string;

  @Column({ type: 'varchar', nullable: true })
  companyLegalForm?: string;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  vatNumber?: string;

  @Column({ type: 'varchar', nullable: true })
  taxSchemeId?: string;

  @Column({ type: 'varchar', nullable: true })
  streetName?: string;

  @Column({ type: 'varchar', nullable: true })
  additionalStreetName?: string;

  @Column({ type: 'varchar', nullable: true })
  buildingNumber?: string;

  @Column({ type: 'varchar', nullable: true })
  cityName?: string;

  @Column({ type: 'varchar', nullable: true })
  postalZone?: string;

  @Column({ type: 'varchar', nullable: true })
  countrySubentity?: string;

  @Column({
    type: 'enum',
    enum: CountryCodeEnum,
    enumName: 'CountryCodeEnum',
    nullable: true,
  })
  countryCode?: CountryCodeEnum;

  @Column({ type: 'varchar', nullable: true })
  contactName?: string;

  @Column({ type: 'varchar', nullable: true })
  contactTelephone?: string;

  @Column({ type: 'varchar', nullable: true })
  contactEmail?: string;

  @CreateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
    onUpdate: 'LOCALTIMESTAMP',
  })
  updatedAt: Date;
}
