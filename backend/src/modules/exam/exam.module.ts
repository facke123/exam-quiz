import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { Subject } from '@/database/entities/subject.entity';
import { Chapter } from '@/database/entities/chapter.entity';
import { KnowledgePoint } from '@/database/entities/knowledge-point.entity';
import { Paper } from '@/database/entities/paper.entity';
import { Question } from '@/database/entities/question.entity';

/**
 * 考试管理模块
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subject,
      Chapter,
      KnowledgePoint,
      Paper,
      Question,
    ]),
  ],
  controllers: [ExamController],
  providers: [ExamService],
  exports: [ExamService],
})
export class ExamModule {}
