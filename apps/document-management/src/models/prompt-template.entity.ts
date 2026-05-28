import { LLMProvider } from '@app/common/apps/common/enums/llm.enum';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import { Column, CreateDateColumn, Entity, UpdateDateColumn } from 'typeorm';

export interface PromptField {
  format: string;
  keyToExtract: string;
  description: string;
}

@Entity()
export class PromptTemplate extends AbstractEntity<PromptTemplate> {
  @Column({ unique: true })
  templateId: string;

  @Column()
  orgId: string;

  @Column()
  name: string;

  @Column({ type: 'json' })
  prompt: PromptField[];

  @Column({ type: 'enum', enum: LLMProvider })
  llmProvider: LLMProvider;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
