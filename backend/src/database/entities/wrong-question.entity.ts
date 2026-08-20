import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 错题本实体 - 错题本表
 */
@Entity('wrong_questions')
export class WrongQuestion {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index()
  @Column({ type: 'bigint', comment: '用户ID' })
  userId: number;

  @Index()
  @Column({ type: 'bigint', comment: '题目ID' })
  questionId: number;

  @Index()
  @Column({ type: 'bigint', comment: '科目ID' })
  subjectId: number;

  @Column({ type: 'bigint', nullable: true, comment: '章节ID' })
  chapterId: number;

  @Column({ type: 'int', default: 1, comment: '答错次数' })
  wrongCount: number;

  @Column({ type: 'datetime', nullable: true, comment: '最后答错时间' })
  lastWrongAt: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
    comment: '状态: pending/reviewing/mastered',
  })
  status: string;

  @CreateDateColumn({ comment: '加入时间' })
  addedAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
