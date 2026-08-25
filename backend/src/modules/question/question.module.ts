import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { Question } from '@/database/entities/question.entity';
import { KnowledgePoint } from '@/database/entities/knowledge-point.entity';
import { ErrorReport } from '@/database/entities/error-report.entity';
import { Subject } from '@/database/entities/subject.entity';
import { Chapter } from '@/database/entities/chapter.entity';
import { User } from '@/database/entities/user.entity';
import { WrongQuestion } from '@/database/entities/wrong-question.entity';

/**
 * 题库模块
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Question,
      KnowledgePoint,
      ErrorReport,
      Subject,
      Chapter,
      User,
      WrongQuestion,
    ]),
  ],
  controllers: [QuestionController],
  providers: [QuestionService],
  exports: [QuestionService],
})
export class QuestionModule {}
