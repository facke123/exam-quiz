import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * 操作日志实体 - 操作日志表
 */
@Entity('operation_logs')
export class OperationLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index()
  @Column({ type: 'bigint', comment: '管理员ID' })
  adminId: number;

  @Column({ length: 50, comment: '管理员姓名' })
  adminName: string;

  @Column({ length: 50, comment: '操作动作' })
  action: string;

  @Column({ length: 50, comment: '操作模块' })
  module: string;

  @Column({ length: 100, nullable: true, comment: '操作对象' })
  target: string;

  @Column({ length: 50, nullable: true, comment: 'IP地址' })
  ip: string;

  @Column({ type: 'text', nullable: true, comment: '详情' })
  detail: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;
}
