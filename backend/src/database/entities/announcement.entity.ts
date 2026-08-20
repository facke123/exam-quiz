import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 公告实体 - 公告表
 */
@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ length: 200, comment: '标题' })
  title: string;

  @Column({ type: 'text', comment: '内容' })
  content: string;

  @Index()
  @Column({
    length: 30,
    comment: '类型: system/activity/maintenance',
  })
  type: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'draft',
    comment: '状态: draft/published/archived',
  })
  status: string;

  @Column({ type: 'datetime', nullable: true, comment: '发布时间' })
  publishAt: Date;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
