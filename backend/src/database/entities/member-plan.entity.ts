import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 会员套餐实体 - 会员套餐表
 */
@Entity('member_plans')
export class MemberPlan {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ length: 100, comment: '套餐名称' })
  name: string;

  @Column({
    type: 'varchar',
    length: 20,
    comment: '类型: monthly/quarterly/yearly',
  })
  type: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '价格' })
  price: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: '原价',
  })
  originalPrice: number;

  @Column({ type: 'int', comment: '时长（天）' })
  duration: number;

  @Column({
    type: 'json',
    nullable: true,
    comment: '功能特性列表（JSON）',
  })
  features: string[];

  @Column({
    type: 'tinyint',
    default: 1,
    comment: '状态: 0-下架 1-上架',
  })
  status: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
