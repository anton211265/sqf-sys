import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

export enum CalendarDayTypeEnum {
  HOLIDAY = 'HOLIDAY',
  HALF_DAY = 'HALF_DAY',
  SHUTDOWN = 'SHUTDOWN',
}

/**
 * Global Clearing Calendar Engine: multi-jurisdictional holiday registry +
 * cut-off/exception days. Regions map to where Buyers/Clients are legally
 * located; date math elsewhere (maturity/settlement) reads these rows plus
 * the roll-over rule in funder_config_settings.
 */
@Entity('calendar_day')
@Unique('UQ_calendar_funder_region_date', [
  'funderOrganizationId',
  'region',
  'dayDate',
])
export class CalendarDay {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  funderOrganizationId: number;

  @Column({ type: 'varchar', length: 30 })
  region: string;

  @Column({ type: 'date' })
  dayDate: string;

  @Column({ type: 'varchar', default: CalendarDayTypeEnum.HOLIDAY })
  dayType: CalendarDayTypeEnum;

  @Column({ type: 'varchar', length: 150, nullable: true })
  description: string | null;

  /** HH:MM local cut-off, only meaningful for HALF_DAY rows. */
  @Column({ type: 'varchar', length: 5, nullable: true })
  cutoffTime: string | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  createdAt: Date;
}
