import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * AI Prompt 模板实体 - AI Prompt 模板表
 */
@Entity('ai_prompts')
export class AiPrompt {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ length: 100, comment: '模板名称' })
  name: string;

  @Column({
    length: 30,
    comment: '类型: generate_question/generate_analysis/import',
  })
  type: string;

  @Column({ type: 'text', comment: 'Prompt 内容' })
  content: string;

  @Column({
    type: 'json',
    nullable: true,
    comment: '变量列表（JSON）',
  })
  variables: any;

  @Column({
    type: 'varchar',
    length: 20,
    default: '1',
    comment: '状态',
  })
  status: any;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}

