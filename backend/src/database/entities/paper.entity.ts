import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 试卷实体 - 试卷表
 */
@Entity('papers')
export class Paper {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index()
  @Column({ type: 'bigint', comment: '科目ID' })
  subjectId: number;

  @Column({ length: 100, comment: '试卷名称' })
  name: string;

  @Column({ type: 'int', nullable: true, comment: '年份' })
  year: number;

  @Column({
    type: 'varchar',
    length: 20,
    comment: '类型: real/mock/practice',
  })
  type: string;

  @Column({ type: 'int', comment: '考试时长（分钟）' })
  duration: number;

  @Column({ type: 'int', default: 100, comment: '总分' })
  totalScore: number;

  @Column({
    type: 'json',
    nullable: true,
    comment: '题目ID列表（JSON）',
  })
  questionIds: number[];

  @Column({
    type: 'varchar',
    length: 20,
    default: 'published',
    comment: '状态: draft/published/archived',
  })
  status: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
