import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 知识点实体 - 知识点表
 */
@Entity('knowledge_points')
export class KnowledgePoint {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index()
  @Column({ type: 'bigint', comment: '章节ID' })
  chapterId: number;

  @Column({ length: 100, comment: '知识点名称' })
  name: string;

  @Column({ type: 'text', nullable: true, comment: '描述' })
  description: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
