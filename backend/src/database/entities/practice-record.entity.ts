import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 做题记录实体 - 做题记录表
 */
@Entity('practice_records')
export class PracticeRecord {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index()
  @Column({ type: 'bigint', comment: '用户ID' })
  userId: number;

  @Index()
  @Column({ type: 'bigint', comment: '科目ID' })
  subjectId: number;

  @Column({
    type: 'varchar',
    length: 20,
    comment: '模式: chapter/real/mock/daily/case',
  })
  mode: string;

  @Column({ type: 'bigint', nullable: true, comment: '试卷ID' })
  paperId: number;

  @Column({ type: 'int', default: 0, comment: '题目总数' })
  totalQuestions: number;

  @Column({ type: 'int', default: 0, comment: '已答数量' })
  answeredQuestions: number;

  @Column({ type: 'int', default: 0, comment: '答对数量' })
  correctCount: number;

  @Column({ type: 'int', default: 0, comment: '得分' })
  score: number;

  @Column({ type: 'int', default: 0, comment: '用时（秒）' })
  duration: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'ongoing',
    comment: '状态: ongoing/completed',
  })
  status: string;

  @Column({ type: 'datetime', comment: '开始时间' })
  startedAt: Date;

  @Column({ type: 'datetime', nullable: true, comment: '提交时间' })
  submittedAt: Date;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
