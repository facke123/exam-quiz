import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 纠错反馈实体 - 纠错反馈表
 */
@Entity('error_reports')
export class ErrorReport {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index()
  @Column({ type: 'bigint', comment: '用户ID' })
  userId: number;

  @Index()
  @Column({ type: 'bigint', comment: '题目ID' })
  questionId: number;

  @Column({
    length: 50,
    comment: '纠错类型: content/answer/analysis/options/other',
  })
  type: string;

  @Column({ type: 'text', comment: '问题描述' })
  description: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
    comment: '状态: pending/resolved/rejected',
  })
  status: string;

  @Column({ type: 'text', nullable: true, comment: '管理员回复' })
  adminReply: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
