import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 订单实体 - 订单表
 */
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index()
  @Column({ type: 'bigint', comment: '用户ID' })
  userId: number;

  @Column({ type: 'bigint', comment: '套餐ID' })
  planId: number;

  @Index({ unique: true })
  @Column({ length: 50, comment: '订单号' })
  orderNo: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    comment: '金额',
  })
  amount: number;

  @Column({
    type: 'varchar',
    length: 20,
    comment: '支付方式: wechat/alipay',
  })
  payMethod: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
    comment: '支付状态: pending/paid/refunded/refund_failed',
  })
  payStatus: string;

  @Column({ length: 100, nullable: true, comment: '交易号' })
  tradeNo: string;

  @Column({ type: 'datetime', nullable: true, comment: '支付时间' })
  paidAt: Date;

  @Column({ type: 'datetime', nullable: true, comment: '退款时间' })
  refundAt: Date;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
