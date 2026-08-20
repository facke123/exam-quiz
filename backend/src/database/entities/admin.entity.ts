import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * 管理员实体 - 管理员表
 */
@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index({ unique: true })
  @Column({ length: 50, comment: '用户名' })
  username: string;

  @Column({ length: 100, comment: '密码（bcrypt）' })
  password: string;

  @Column({ length: 50, nullable: true, comment: '真实姓名' })
  realName: string;

  @Column({
    length: 20,
    default: 'admin',
    comment: '角色: super_admin/admin/operator',
  })
  role: string;

  @Column({
    type: 'tinyint',
    default: 1,
    comment: '状态: 0-禁用 1-正常',
  })
  status: number;

  @Column({ type: 'datetime', nullable: true, comment: '最后登录时间' })
  lastLoginAt: Date;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;
}
