import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiTask } from '@/database/entities/ai-task.entity';
import { AiPrompt } from '@/database/entities/ai-prompt.entity';
import { Question } from '@/database/entities/question.entity';
import { Subject } from '@/database/entities/subject.entity';
import { Chapter } from '@/database/entities/chapter.entity';
import { KnowledgePoint } from '@/database/entities/knowledge-point.entity';
import { SystemConfig } from '@/database/entities/system-config.entity';

/**
 * AI 模块
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiTask,
      AiPrompt,
      Question,
      Subject,
      Chapter,
      KnowledgePoint,
      SystemConfig,
    ]),
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
