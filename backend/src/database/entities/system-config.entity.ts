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
  @Column({ name: 'config_key', length: 100, comment: '配置键' })
  key: string;

  @Column({ name: 'config_value', type: 'text', comment: '配置值' })
  value: string;

  @Column({
    name: 'config_type',
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
