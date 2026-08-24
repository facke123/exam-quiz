import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 艾宾浩斯复习队列实体 - 复习队列表
 */
@Entity('review_queue')
export class ReviewQueue {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index()
  @Column({ type: 'bigint', comment: '用户ID' })
  userId: number;

  @Index()
  @Column({ type: 'bigint', comment: '题目ID' })
  questionId: number;

  @Column({
    name: 'interval_days',
    type: 'int',
    default: 1,
    comment: '复习间隔（天）: 1/2/4/7/15/30',
  })
  interval: number;

  @Column({ type: 'int', default: 0, comment: '当前步骤' })
  step: number;

  @Column({ type: 'datetime', comment: '下次复习时间' })
  nextReviewAt: Date;

  @Column({ type: 'datetime', nullable: true, comment: '上次复习时间' })
  lastReviewedAt: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
    comment: '状态: pending/completed',
  })
  status: string;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
