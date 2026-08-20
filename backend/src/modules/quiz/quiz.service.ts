import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PracticeRecord } from '@/database/entities/practice-record.entity';
import { PracticeAnswer } from '@/database/entities/practice-answer.entity';
import { Question } from '@/database/entities/question.entity';
import { WrongQuestion } from '@/database/entities/wrong-question.entity';
import { Favorite } from '@/database/entities/favorite.entity';
import { Note } from '@/database/entities/note.entity';
import { ReviewQueue } from '@/database/entities/review-queue.entity';
import { Paper } from '@/database/entities/paper.entity';
import {
  CreatePracticeDto,
  SaveAnswerDto,
  FavoriteDto,
  NoteDto,
} from './dto/quiz.dto';

/**
 * 做题服务
 */
@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(PracticeRecord)
    private readonly recordRepository: Repository<PracticeRecord>,
    @InjectRepository(PracticeAnswer)
    private readonly answerRepository: Repository<PracticeAnswer>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(WrongQuestion)
    private readonly wrongQuestionRepository: Repository<WrongQuestion>,
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(ReviewQueue)
    private readonly reviewQueueRepository: Repository<ReviewQueue>,
    @InjectRepository(Paper)
    private readonly paperRepository: Repository<Paper>,
  ) {}

  /**
   * 创建练习（章节练习/历年真题/模拟考试/每日一练/案例分析）
   */
  async createPractice(userId: number, dto: CreatePracticeDto): Promise<PracticeRecord> {
    let questionIds: number[] = [];

    if (dto.mode === 'chapter') {
      // 章节练习：从指定章节随机取题
      const qb = this.questionRepository
        .createQueryBuilder('q')
        .where('q.status = :status', { status: 'published' })
        .andWhere('q.subjectId = :subjectId', { subjectId: dto.subjectId });
      if (dto.chapterIds && dto.chapterIds.length > 0) {
        qb.andWhere('q.chapterId IN (:...chapterIds)', { chapterIds: dto.chapterIds });
      }
      qb.orderBy('RAND()')
        .take(dto.questionCount || 20);
      const questions = await qb.getMany();
      questionIds = questions.map((q) => Number(q.id));
    } else if (dto.mode === 'real' || dto.mode === 'mock') {
      // 历年真题/模拟考试：从试卷获取题目
      const paper = await this.paperRepository.findOne({
        where: { id: dto.paperId },
      });
      if (!paper) {
        throw new NotFoundException('试卷不存在');
      }
      questionIds = paper.questionIds || [];
    } else if (dto.mode === 'daily') {
      // 每日一练：取一道题
      const question = await this.questionRepository
        .createQueryBuilder('q')
        .where('q.status = :status', { status: 'published' })
        .andWhere('q.subjectId = :subjectId', { subjectId: dto.subjectId })
        .orderBy('RAND()')
        .getOne();
      questionIds = question ? [Number(question.id)] : [];
    }

    const record = this.recordRepository.create({
      userId,
      subjectId: dto.subjectId,
      mode: dto.mode,
      paperId: dto.paperId,
      totalQuestions: questionIds.length,
      answeredQuestions: 0,
      correctCount: 0,
      score: 0,
      duration: 0,
      status: 'ongoing',
      startedAt: new Date(),
    });

    const saved = await this.recordRepository.save(record);
    saved['questionIds'] = questionIds;
    return saved;
  }

  /**
   * 保存答案
   */
  async saveAnswer(recordId: number, userId: number, dto: SaveAnswerDto): Promise<PracticeAnswer> {
    const record = await this.recordRepository.findOne({
      where: { id: recordId, userId },
    });
    if (!record) {
      throw new NotFoundException('做题记录不存在');
    }
    if (record.status !== 'ongoing') {
      throw new BadRequestException('该练习已结束');
    }

    const question = await this.questionRepository.findOne({
      where: { id: dto.questionId },
    });
    const isCorrect = question && dto.userAnswer === question.answer ? 1 : 0;

    // 检查是否已有答案，有则更新
    let answer = await this.answerRepository.findOne({
      where: { recordId, questionId: dto.questionId },
    });

    if (answer) {
      Object.assign(answer, {
        userAnswer: dto.userAnswer,
        isCorrect,
        timeCost: dto.timeCost || answer.timeCost,
        marked: dto.marked !== undefined ? dto.marked : answer.marked,
      });
    } else {
      answer = this.answerRepository.create({
        recordId,
        userId,
        questionId: dto.questionId,
        userAnswer: dto.userAnswer,
        isCorrect,
        timeCost: dto.timeCost || 0,
        marked: dto.marked || 0,
      });
      record.answeredQuestions += 1;
      if (isCorrect) {
        record.correctCount += 1;
      }
    }

    await this.answerRepository.save(answer);
    await this.recordRepository.save(record);

    return answer;
  }

  /**
   * 交卷判分
   */
  async submitPractice(
    recordId: number,
    userId: number,
  ): Promise<{
    record: PracticeRecord;
    correctCount: number;
    totalQuestions: number;
    score: number;
  }> {
    const record = await this.recordRepository.findOne({
      where: { id: recordId, userId },
    });
    if (!record) {
      throw new NotFoundException('做题记录不存在');
    }

    const answers = await this.answerRepository.find({
      where: { recordId },
    });

    const correctCount = answers.filter((a) => a.isCorrect === 1).length;
    const score = record.totalQuestions > 0
      ? Math.round((correctCount / record.totalQuestions) * 100)
      : 0;

    record.status = 'completed';
    record.correctCount = correctCount;
    record.score = score;
    record.submittedAt = new Date();
    record.duration = Math.floor(
      (record.submittedAt.getTime() - record.startedAt.getTime()) / 1000,
    );

    await this.recordRepository.save(record);

    // 将错题加入错题本
    const wrongAnswers = answers.filter((a) => a.isCorrect === 0);
    for (const wa of wrongAnswers) {
      const question = await this.questionRepository.findOne({
        where: { id: wa.questionId },
      });
      if (!question) continue;

      let wrongQ = await this.wrongQuestionRepository.findOne({
        where: { userId, questionId: wa.questionId },
      });
      if (wrongQ) {
        wrongQ.wrongCount += 1;
        wrongQ.lastWrongAt = new Date();
        wrongQ.status = 'pending';
      } else {
        wrongQ = this.wrongQuestionRepository.create({
          userId,
          questionId: wa.questionId,
          subjectId: record.subjectId,
          chapterId: question.chapterId,
          wrongCount: 1,
          lastWrongAt: new Date(),
          status: 'pending',
        });
      }
      await this.wrongQuestionRepository.save(wrongQ);
    }

    return { record, correctCount, totalQuestions: record.totalQuestions, score };
  }

  /**
   * 获取错题本
   */
  async getWrongQuestions(
    userId: number,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ list: WrongQuestion[]; total: number }> {
    const [list, total] = await this.wrongQuestionRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { lastWrongAt: 'DESC' },
    });
    return { list, total };
  }

  /**
   * 获取收藏列表
   */
  async getFavorites(
    userId: number,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ list: Favorite[]; total: number }> {
    const [list, total] = await this.favoriteRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });
    return { list, total };
  }

  /**
   * 收藏题目
   */
  async addFavorite(userId: number, dto: FavoriteDto): Promise<Favorite> {
    const exists = await this.favoriteRepository.findOne({
      where: { userId, questionId: dto.questionId },
    });
    if (exists) {
      return exists;
    }
    const favorite = this.favoriteRepository.create({
      userId,
      questionId: dto.questionId,
    });
    return this.favoriteRepository.save(favorite);
  }

  /**
   * 取消收藏
   */
  async removeFavorite(userId: number, questionId: number): Promise<void> {
    await this.favoriteRepository.delete({ userId, questionId });
  }

  /**
   * 添加/更新笔记
   */
  async saveNote(userId: number, dto: NoteDto): Promise<Note> {
    let note = await this.noteRepository.findOne({
      where: { userId, questionId: dto.questionId },
    });
    if (note) {
      note.content = dto.content;
    } else {
      note = this.noteRepository.create({
        userId,
        questionId: dto.questionId,
        content: dto.content,
      });
    }
    return this.noteRepository.save(note);
  }

  /**
   * 获取笔记
   */
  async getNote(userId: number, questionId: number): Promise<Note | null> {
    return this.noteRepository.findOne({
      where: { userId, questionId },
    });
  }

  /**
   * 获取做题记录列表
   */
  async getRecords(
    userId: number,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ list: PracticeRecord[]; total: number }> {
    const [list, total] = await this.recordRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { startedAt: 'DESC' },
    });
    return { list, total };
  }

  /**
   * 获取复习队列（艾宾浩斯）
   */
  async getReviewQueue(userId: number): Promise<ReviewQueue[]> {
    return this.reviewQueueRepository.find({
      where: { userId, status: 'pending' },
      order: { nextReviewAt: 'ASC' },
    });
  }

  /**
   * 更新复习状态
   */
  async updateReviewStatus(
    userId: number,
    questionId: number,
    mastered: boolean,
  ): Promise<void> {
    const item = await this.reviewQueueRepository.findOne({
      where: { userId, questionId },
    });
    if (!item) {
      throw new NotFoundException('复习项不存在');
    }
    if (mastered) {
      item.status = 'completed';
    } else {
      item.step += 1;
      const intervals = [1, 2, 4, 7, 15, 30];
      const nextInterval = intervals[item.step] || 30;
      item.interval = nextInterval;
      item.nextReviewAt = new Date(Date.now() + nextInterval * 24 * 60 * 60 * 1000);
    }
    item.lastReviewedAt = new Date();
    await this.reviewQueueRepository.save(item);
  }
}
