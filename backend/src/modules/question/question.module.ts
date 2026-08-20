import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { Question } from '@/database/entities/question.entity';
import { KnowledgePoint } from '@/database/entities/knowledge-point.entity';

/**
 * 题库模块
 */
@Module({
  imports: [TypeOrmModule.forFeature([Question, KnowledgePoint])],
  controllers: [QuestionController],
  providers: [QuestionService],
  exports: [QuestionService],
})
export class QuestionModule {}
