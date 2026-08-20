import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * 做题答题实体 - 做题答题表
 */
@Entity('practice_answers')
export class PracticeAnswer {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index()
  @Column({ type: 'bigint', comment: '做题记录ID' })
  recordId: number;

  @Index()
  @Column({ type: 'bigint', comment: '用户ID' })
  userId: number;

  @Index()
  @Column({ type: 'bigint', comment: '题目ID' })
  questionId: number;

  @Column({ type: 'text', nullable: true, comment: '用户答案' })
  userAnswer: string;

  @Column({
    type: 'tinyint',
    default: 0,
    comment: '是否正确: 0-错误 1-正确',
  })
  isCorrect: number;

  @Column({ type: 'int', default: 0, comment: '耗时（秒）' })
  timeCost: number;

  @Column({
    type: 'tinyint',
    default: 0,
    comment: '是否标记: 0-否 1-是',
  })
  marked: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;
}
