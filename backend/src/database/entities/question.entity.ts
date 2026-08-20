import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 题目实体 - 题目表
 */
@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index()
  @Column({ type: 'bigint', comment: '科目ID' })
  subjectId: number;

  @Index()
  @Column({ type: 'bigint', nullable: true, comment: '章节ID' })
  chapterId: number;

  @Column({
    type: 'json',
    nullable: true,
    comment: '关联知识点ID列表',
  })
  knowledgePointIds: number[];

  @Column({
    type: 'varchar',
    length: 30,
    comment:
      '题型: single_choice/multiple_choice/true_false/case_analysis/subjective',
  })
  type: string;

  @Column({
    type: 'tinyint',
    default: 3,
    comment: '难度: 1-5',
  })
  difficulty: number;

  @Column({ type: 'text', comment: '题干内容' })
  content: string;

  @Column({
    type: 'json',
    nullable: true,
    comment: '选项列表（JSON）',
  })
  options: Record<string, unknown>[];

  @Column({ type: 'text', nullable: true, comment: '答案' })
  answer: string;

  @Column({ type: 'text', nullable: true, comment: '解析' })
  analysis: string;

  @Column({
    type: 'json',
    nullable: true,
    comment: '标签',
  })
  tags: string[];

  @Column({
    type: 'varchar',
    length: 20,
    default: 'manual',
    comment: '来源: manual/excel/word/ai',
  })
  source: string;

  @Column({
    type: 'float',
    nullable: true,
    comment: 'AI置信度（0-1）',
  })
  aiConfidence: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'draft',
    comment: '状态: draft/pending/published/archived',
  })
  status: string;

  @Column({ type: 'int', default: 0, comment: '答对次数' })
  correctCount: number;

  @Column({ type: 'int', default: 0, comment: '答错次数' })
  wrongCount: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
