import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { User } from '@/database/entities/user.entity';
import { Question } from '@/database/entities/question.entity';
import { PracticeRecord } from '@/database/entities/practice-record.entity';
import { PracticeAnswer } from '@/database/entities/practice-answer.entity';
import { Order } from '@/database/entities/order.entity';

/**
 * 统计模块
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Question,
      PracticeRecord,
      PracticeAnswer,
      Order,
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
