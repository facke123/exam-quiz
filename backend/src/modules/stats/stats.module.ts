import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { User } from '@/database/entities/user.entity';
import { Question } from '@/database/entities/question.entity';
import { PracticeRecord } from '@/database/entities/practice-record.entity';
import { PracticeAnswer } from '@/database/entities/practice-answer.entity';
import { Order } from '@/database/entities/order.entity';
import { WrongQuestion } from '@/database/entities/wrong-question.entity';
import { Favorite } from '@/database/entities/favorite.entity';
import { Chapter } from '@/database/entities/chapter.entity';
import { Subject } from '@/database/entities/subject.entity';
import { ErrorReport } from '@/database/entities/error-report.entity';
import { Paper } from '@/database/entities/paper.entity';
import { AiTask } from '@/database/entities/ai-task.entity';
import { KnowledgePoint } from '@/database/entities/knowledge-point.entity';
import { MemberPlan } from '@/database/entities/member-plan.entity';

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
      WrongQuestion,
      Favorite,
      Chapter,
      Subject,
      ErrorReport,
      Paper,
      AiTask,
      KnowledgePoint,
      MemberPlan,
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}

