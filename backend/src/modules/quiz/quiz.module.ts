import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { PracticeRecord } from '@/database/entities/practice-record.entity';
import { PracticeAnswer } from '@/database/entities/practice-answer.entity';
import { Question } from '@/database/entities/question.entity';
import { WrongQuestion } from '@/database/entities/wrong-question.entity';
import { Favorite } from '@/database/entities/favorite.entity';
import { Note } from '@/database/entities/note.entity';
import { ReviewQueue } from '@/database/entities/review-queue.entity';
import { Paper } from '@/database/entities/paper.entity';
import { Subject } from '@/database/entities/subject.entity';
import { Chapter } from '@/database/entities/chapter.entity';
import { User } from '@/database/entities/user.entity';

/**
 * 做题模块
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PracticeRecord,
      PracticeAnswer,
      Question,
      WrongQuestion,
      Favorite,
      Note,
      ReviewQueue,
      Paper,
      Subject,
      Chapter,
      User,
    ]),
  ],
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}
