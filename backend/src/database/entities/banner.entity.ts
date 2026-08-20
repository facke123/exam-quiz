import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Banner 实体 - Banner 表
 */
@Entity('banners')
export class Banner {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ length: 100, comment: '标题' })
  title: string;

  @Column({ length: 500, comment: '图片URL' })
  imageUrl: string;

  @Column({ length: 500, nullable: true, comment: '跳转链接' })
  linkUrl: string;

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
