import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 章节实体 - 章节表
 */
@Entity('chapters')
export class Chapter {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index()
  @Column({ type: 'bigint', comment: '科目ID' })
  subjectId: number;

  @Column({ type: 'bigint', nullable: true, comment: '父章节ID（树形结构）' })
  parentId: number;

  @Column({ length: 100, comment: '章节名称' })
  name: string;

  @Column({ type: 'int', default: 0, comment: '排序' })
  sort: number;

  @Column({ type: 'int', default: 0, comment: '题目数量' })
  questionCount: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
