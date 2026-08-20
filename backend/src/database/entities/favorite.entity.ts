import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * 收藏实体 - 收藏表
 */
@Entity('favorites')
export class Favorite {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index()
  @Column({ type: 'bigint', comment: '用户ID' })
  userId: number;

  @Index()
  @Column({ type: 'bigint', comment: '题目ID' })
  questionId: number;

  @CreateDateColumn({ comment: '收藏时间' })
  createdAt: Date;
}
