import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * AI 任务实体 - AI 任务表
 */
@Entity('ai_tasks')
export class AiTask {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index()
  @Column({
    type: 'varchar',
    length: 30,
    comment: '类型: generate_question/generate_analysis/import',
  })
  type: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
    comment: '状态: pending/processing/completed/failed',
  })
  status: string;

  @Column({
    type: 'json',
    nullable: true,
    comment: '参数（JSON）',
  })
  params: Record<string, unknown>;

  @Column({
    type: 'json',
    nullable: true,
    comment: '结果（JSON）',
  })
  result: Record<string, unknown>;

  @Column({ length: 50, nullable: true, comment: '使用的模型' })
  model: string;

  @Column({ type: 'bigint', nullable: true, comment: '使用的Prompt模板ID' })
  promptId: number;

  @Column({ type: 'bigint', nullable: true, comment: '发起管理员ID' })
  adminId: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true, comment: '完成时间' })
  completedAt: Date;
}
