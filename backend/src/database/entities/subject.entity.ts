import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 考试科目实体 - 考试科目表
 */
@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ length: 100, comment: '科目名称' })
  name: string;

  @Index({ unique: true })
  @Column({ length: 50, comment: '科目代码' })
  code: string;

  @Column({ type: 'text', nullable: true, comment: '描述' })
  description: string;

  @Column({ length: 500, nullable: true, comment: '图标URL' })
  icon: string;

  @Column({ type: 'int', default: 0, comment: '排序' })
  sort: number;

  @Column({
    type: 'tinyint',
    default: 1,
    comment: '状态: 0-禁用 1-正常',
  })
  status: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
