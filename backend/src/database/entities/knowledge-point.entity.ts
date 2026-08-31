import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 知识点实体 - 知识点表（支持 AI 考点提炼与重点分析）
 */
@Entity('knowledge_points')
export class KnowledgePoint {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index()
  @Column({ type: 'bigint', nullable: true, comment: '科目ID' })
  subjectId: number;

  @Index()
  @Column({ type: 'bigint', comment: '章节ID' })
  chapterId: number;

  @Column({ length: 200, comment: '知识点名称' })
  name: string;

  @Column({ length: 100, nullable: true, comment: '考点分类标签 (如: 项目风险管理)' })
  categoryTag: string;

  @Column({ length: 200, nullable: true, comment: '教材出处/章节 (如: 《教程》第12章 项目风险管理)' })
  sourceBook: string;

  @Column({ length: 50, default: 'high', nullable: true, comment: '考点级别: 必考/高频/常考/重点' })
  importance: string;

  @Column({ type: 'longtext', nullable: true, comment: '教材考点提炼与逻辑框架 (富文本/Markdown)' })
  coreAnalysis: string;

  @Column({ type: 'text', nullable: true, comment: '记忆口诀与冲刺速记技巧' })
  memoryTips: string;

  @Column({ type: 'text', nullable: true, comment: '基础描述' })
  description: string;

  @Column({ type: 'json', nullable: true, comment: '标签列表' })
  tags: string[];

  @Column({ type: 'int', default: 0, comment: '配套试题数量' })
  questionCount: number;

  @Column({ type: 'int', default: 0, comment: '排序' })
  sort: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}

