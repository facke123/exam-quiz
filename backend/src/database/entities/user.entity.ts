import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 用户实体 - 用户表
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index({ unique: true })
  @Column({ length: 50, comment: '用户名' })
  username: string;

  @Index()
  @Column({ length: 100, nullable: true, comment: '邮箱' })
  email: string;

  @Index()
  @Column({ length: 20, nullable: true, comment: '手机号' })
  phone: string;

  @Column({ length: 100, comment: '密码（bcrypt）' })
  password: string;

  @Column({ length: 50, nullable: true, comment: '昵称' })
  nickname: string;

  @Column({ length: 500, nullable: true, comment: '头像URL' })
  avatar: string;

  @Column({
    type: 'tinyint',
    default: 1,
    comment: '状态: 0-禁用 1-正常',
  })
  status: number;

  @Column({
    type: 'tinyint',
    default: 0,
    comment: 'VIP等级: 0-非会员 1-普通会员 2-高级会员',
  })
  vipLevel: number;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: 'VIP到期时间',
  })
  vipExpireAt: Date;

  @Column({ type: 'date', nullable: true, comment: '计划考试日期' })
  examDate: string;

  @Column({
    type: 'bigint',
    nullable: true,
    comment: '当前选择的科目ID',
  })
  currentSubjectId: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
