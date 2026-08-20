import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 系统配置实体 - 系统配置表
 */
@Entity('system_configs')
export class SystemConfig {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index({ unique: true })
  @Column({ length: 100, comment: '配置键' })
  key: string;

  @Column({ type: 'text', comment: '配置值' })
  value: string;

  @Column({
    length: 30,
    nullable: true,
    comment: '值类型: string/number/boolean/json',
  })
  type: string;

  @Column({ length: 200, nullable: true, comment: '描述' })
  description: string;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
