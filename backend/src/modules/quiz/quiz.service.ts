import { Injectable, NotFoundException, BadRequestException, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
import {
  CreatePracticeDto,
  SaveAnswerDto,
  FavoriteDto,
  NoteDto,
} from './dto/quiz.dto';

const fromDbType = (t?: string) => {
  if (!t) return 'single';
  if (t === 'single_choice') return 'single';
  if (t === 'multiple_choice') return 'multiple';
  if (t === 'true_false') return 'judge';
  if (t === 'case_analysis') return 'case';
  if (t === 'subjective') return 'essay';
  return t;
};

const toDbType = (t?: string) => {
  if (!t) return 'single_choice';
  const str = String(t).toLowerCase();
  if (str === 'single' || str === 'single_choice' || str === '单选' || str === '单选题') return 'single_choice';
  if (str === 'multiple' || str === 'multiple_choice' || str === '多选' || str === '多选题') return 'multiple_choice';
  if (str === 'judge' || str === 'true_false' || str === '判断' || str === '判断题') return 'true_false';
  if (str === 'case' || str === 'case_analysis' || str === '案例' || str === '案例分析' || str === '案例题') return 'case_analysis';
  if (str === 'essay' || str === 'subjective' || str === '问答' || str === '问答题' || str === '简答' || str === '论述') return 'subjective';
  return 'single_choice';
};

/**
 * 做题服务
 */
@Injectable()
export class QuizService implements OnModuleInit {
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
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 服务初始化：清理历史重复复习数据并尝试创建唯一键
   */
  async onModuleInit() {
    try {
      // 启动时清理 review_queue 历史重复题目记录，每对 (user_id, question_id) 仅保留最新的一条
      await this.reviewQueueRepository.query(
        `DELETE rq1 FROM review_queue rq1
         INNER JOIN review_queue rq2
         ON rq1.user_id = rq2.user_id AND rq1.question_id = rq2.question_id AND rq1.id < rq2.id`
      );
      // 尝试创建唯一键约束（若已有则忽略）
      await this.reviewQueueRepository.query(
        `ALTER TABLE review_queue ADD UNIQUE INDEX uq_user_question (user_id, question_id)`
      ).catch(() => {});
    } catch {
      // 容错处理
    }
  }

  /**
   * 清理指定用户的 review_queue 重复记录，确保 (userId, questionId) 严格唯一
   */
  async cleanupDuplicateReviewQueue(userId: number): Promise<void> {
    try {
      await this.reviewQueueRepository.query(
        `DELETE rq1 FROM review_queue rq1
         INNER JOIN review_queue rq2
         ON rq1.user_id = rq2.user_id AND rq1.question_id = rq2.question_id AND rq1.id < rq2.id
         WHERE rq1.user_id = ?`,
        [userId],
      );
    } catch {
      // 容错处理
    }
  }

  /**
   * 创建练习（章节练习/历年真题/模拟考试/每日一练/自主练习/错题重做）
   */
  async createPractice(userId: number, dto: any): Promise<{ recordId: string; record: any }> {
    let questionIds: number[] = [];

    if (dto.questionIds && Array.isArray(dto.questionIds) && dto.questionIds.length > 0) {
      questionIds = Array.from(new Set(dto.questionIds.map((id: any) => Number(id)).filter(Boolean)));
    } else if (dto.mode === 'chapter') {
      const qb = this.questionRepository
        .createQueryBuilder('q')
        .where('q.status = :status', { status: 'published' });
      if (dto.subjectId) {
        qb.andWhere('q.subjectId = :subjectId', { subjectId: dto.subjectId });
      }
      if (dto.chapterId) {
        qb.andWhere('q.chapterId = :chapterId', { chapterId: dto.chapterId });
      }
      if (dto.chapterIds && dto.chapterIds.length > 0) {
        qb.andWhere('q.chapterId IN (:...chapterIds)', { chapterIds: dto.chapterIds });
      }
      qb.orderBy('q.id', 'ASC').take(dto.count || dto.questionCount || 20);
      const questions = await qb.getMany();
      questionIds = Array.from(new Set(questions.map((q) => Number(q.id))));
    } else if (dto.mode === 'real' || dto.mode === 'mock') {
      if (dto.paperId) {
        const paper = await this.paperRepository.findOne({
          where: { id: dto.paperId },
        });
        if (paper && paper.questionIds) {
          questionIds = Array.from(new Set((paper.questionIds as any[]).map((id: any) => Number(id))));
        }
      }
      if (questionIds.length === 0) {
        const questions = await this.questionRepository
          .createQueryBuilder('q')
          .where('q.status = :status', { status: 'published' })
          .orderBy('RAND()')
          .take(75)
          .getMany();
        questionIds = Array.from(new Set(questions.map((q) => Number(q.id))));
      }
    } else if (dto.mode === 'daily') {
      const questions = await this.questionRepository
        .createQueryBuilder('q')
        .where('q.status = :status', { status: 'published' })
        .orderBy('RAND()')
        .take(dto.count || 5)
        .getMany();
      questionIds = Array.from(new Set(questions.map((q) => Number(q.id))));
    } else if (dto.mode === 'knowledge' || dto.knowledgePointId) {
      const qb = this.questionRepository
        .createQueryBuilder('q')
        .where('q.status = :status', { status: 'published' });
      if (dto.subjectId) {
        qb.andWhere('q.subjectId = :subjectId', { subjectId: dto.subjectId });
      }
      if (dto.knowledgePointId) {
        qb.andWhere('(q.knowledgePointIds LIKE :kpId OR q.chapterId = :chId OR q.tags LIKE :kpTag)', {
          kpId: `%"${dto.knowledgePointId}"%`,
          chId: dto.chapterId || 0,
          kpTag: `%${dto.knowledgePointName || ''}%`,
        });
      } else if (dto.chapterId) {
        qb.andWhere('q.chapterId = :chapterId', { chapterId: dto.chapterId });
      }
      qb.orderBy('q.id', 'ASC').take(dto.count || dto.questionCount || 20);
      let questions = await qb.getMany();
      if (questions.length === 0 && dto.chapterId) {
        questions = await this.questionRepository.find({
          where: { chapterId: dto.chapterId, status: 'published' },
          take: dto.count || 20,
        });
      }
      if (questions.length === 0) {
        questions = await this.questionRepository.find({
          where: { status: 'published' },
          take: dto.count || 10,
        });
      }
      questionIds = Array.from(new Set(questions.map((q) => Number(q.id))));
    } else if (dto.mode === 'favorite') {
      const favorites = await this.favoriteRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      questionIds = Array.from(new Set(favorites.map((f) => Number(f.questionId))));
    } else if (dto.mode === 'review') {
      await this.cleanupDuplicateReviewQueue(userId);
      const now = new Date();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const qb = this.reviewQueueRepository
        .createQueryBuilder('rq')
        .innerJoin(Question, 'q', 'q.id = rq.questionId')
        .where('rq.userId = :userId', { userId })
        .andWhere('rq.status = :status', { status: 'pending' });

      if (dto.subjectId) {
        qb.andWhere('(q.subjectId = :subjectId OR q.subjectId IS NULL OR q.subjectId = 0)', {
          subjectId: Number(dto.subjectId),
        });
      }

      let reviewItems = await qb
        .andWhere('rq.nextReviewAt <= :todayEnd', { todayEnd })
        .orderBy('rq.nextReviewAt', 'ASC')
        .take((dto.count || 20) * 2)
        .getMany();

      if (reviewItems.length === 0) {
        const fallbackQb = this.reviewQueueRepository
          .createQueryBuilder('rq')
          .innerJoin(Question, 'q', 'q.id = rq.questionId')
          .where('rq.userId = :userId', { userId })
          .andWhere('rq.status = :status', { status: 'pending' });
        if (dto.subjectId) {
          fallbackQb.andWhere('(q.subjectId = :subjectId OR q.subjectId IS NULL OR q.subjectId = 0)', {
            subjectId: Number(dto.subjectId),
          });
        }
        reviewItems = await fallbackQb
          .orderBy('rq.nextReviewAt', 'ASC')
          .take((dto.count || 20) * 2)
          .getMany();
      }

      if (reviewItems.length === 0) {
        await this.syncWrongToReview(userId, dto.subjectId ? Number(dto.subjectId) : undefined);
        const retryQb = this.reviewQueueRepository
          .createQueryBuilder('rq')
          .innerJoin(Question, 'q', 'q.id = rq.questionId')
          .where('rq.userId = :userId', { userId })
          .andWhere('rq.status = :status', { status: 'pending' });
        if (dto.subjectId) {
          retryQb.andWhere('(q.subjectId = :subjectId OR q.subjectId IS NULL OR q.subjectId = 0)', {
            subjectId: Number(dto.subjectId),
          });
        }
        reviewItems = await retryQb.take((dto.count || 20) * 2).getMany();
      }

      // 严格去重题目ID并截取目标数量
      questionIds = Array.from(new Set(reviewItems.map((r) => Number(r.questionId)).filter(Boolean)))
        .slice(0, dto.count || 20);

      if (questionIds.length === 0) {
        const qQb = this.questionRepository
          .createQueryBuilder('q')
          .where('q.status = :status', { status: 'published' });
        if (dto.subjectId) {
          qQb.andWhere('q.subjectId = :subjectId', { subjectId: Number(dto.subjectId) });
        }
        const questions = await qQb.take(dto.count || 10).getMany();
        questionIds = Array.from(new Set(questions.map((q) => Number(q.id))));
      }
    } else {
      const questions = await this.questionRepository
        .createQueryBuilder('q')
        .where('q.status = :status', { status: 'published' })
        .orderBy('RAND()')
        .take(dto.count || 20)
        .getMany();
      questionIds = Array.from(new Set(questions.map((q) => Number(q.id))));
    }

    // 最终全局防重
    questionIds = Array.from(new Set(questionIds.filter(Boolean)));

    const record = this.recordRepository.create({
      userId,
      subjectId: dto.subjectId || 1,
      mode: dto.mode || 'practice',
      paperId: dto.paperId || null,
      totalQuestions: questionIds.length,
      answeredQuestions: 0,
      correctCount: 0,
      score: 0,
      duration: 0,
      status: 'ongoing',
      startedAt: new Date(),
    });

    const saved = await this.recordRepository.save(record);

    return {
      recordId: String(saved.id),
      record: {
        ...saved,
        id: String(saved.id),
        questionIds,
      },
    };
  }

  /**
   * 保存做题进度
   */
  async saveProgress(recordId: number, userId: number, answersMap: Record<string, any>): Promise<void> {
    const record = await this.recordRepository.findOne({
      where: { id: recordId, userId },
    });
    if (!record) {
      throw new NotFoundException('做题记录不存在');
    }

    let answeredCount = 0;
    for (const [qIdStr, userAns] of Object.entries(answersMap)) {
      const qId = Number(qIdStr);
      if (!userAns) continue;
      answeredCount++;

      const question = await this.questionRepository.findOne({ where: { id: qId } });
      const ansString = Array.isArray(userAns) ? userAns.sort().join('') : String(userAns);
      const isCorrect = question && ansString.toUpperCase() === question.answer.toUpperCase() ? 1 : 0;

      let answer = await this.answerRepository.findOne({
        where: { recordId, questionId: qId },
      });

      if (answer) {
        answer.userAnswer = ansString;
        answer.isCorrect = isCorrect;
        await this.answerRepository.save(answer);
      } else {
        answer = this.answerRepository.create({
          recordId,
          userId,
          questionId: qId,
          userAnswer: ansString,
          isCorrect,
          timeCost: 0,
          marked: 0,
        });
        await this.answerRepository.save(answer);
      }
    }

    record.answeredQuestions = answeredCount;
    await this.recordRepository.save(record);
  }

  /**
   * 单题保存答案（兼容旧版接口）
   */
  async saveAnswer(recordId: number, userId: number, dto: SaveAnswerDto): Promise<PracticeAnswer> {
    const record = await this.recordRepository.findOne({
      where: { id: recordId, userId },
    });
    if (!record) {
      throw new NotFoundException('做题记录不存在');
    }

    const question = await this.questionRepository.findOne({
      where: { id: dto.questionId },
    });
    const isCorrect = question && dto.userAnswer.toUpperCase() === question.answer.toUpperCase() ? 1 : 0;

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
    }

    await this.answerRepository.save(answer);
    await this.recordRepository.save(record);
    return answer;
  }

  /**
   * 交卷判分并生成报告
   */
  async submitPractice(
    recordId: number,
    userId: number,
    answersMap?: Record<string, any>,
    dto?: any,
  ): Promise<any> {
    let record = recordId ? await this.recordRepository.findOne({
      where: { id: recordId, userId },
    }) : null;

    const answersObj = answersMap || dto?.answers || {};
    const questionIdsList: number[] = Array.isArray(dto?.questionIds)
      ? dto.questionIds.map((id: any) => Number(id))
      : (dto?.questions ? dto.questions.map((q: any) => Number(q.id)) : []);

    const totalQCount = dto?.total || dto?.totalCount || dto?.questionCount || questionIdsList.length || Object.keys(answersObj).length || 20;

    if (!record) {
      record = this.recordRepository.create({
        userId,
        subjectId: dto?.subjectId ? Number(dto.subjectId) : 1,
        mode: dto?.mode || 'practice',
        paperId: dto?.paperId ? Number(dto.paperId) : null,
        totalQuestions: totalQCount,
        answeredQuestions: Object.keys(answersObj).length,
        correctCount: 0,
        score: 0,
        duration: dto?.duration || 120,
        status: 'ongoing',
        startedAt: new Date(Date.now() - (dto?.duration ? dto.duration * 1000 : 120000)),
      });
      record = await this.recordRepository.save(record);
      recordId = Number(record.id);
    }

    if (answersObj && Object.keys(answersObj).length > 0) {
      await this.saveProgress(recordId, userId, answersObj);
    }

    const answers = await this.answerRepository.find({
      where: { recordId },
    });

    const user = await this.userRepository.findOne({ where: { id: userId } });
    const isVip = !!(user && user.vipLevel > 0 && user.vipExpireAt && new Date(user.vipExpireAt).getTime() > Date.now());

    let correctCount = 0;
    const details: any[] = [];
    const wrongAnswers: PracticeAnswer[] = [];

    for (const a of answers) {
      const question = await this.questionRepository.findOne({ where: { id: a.questionId } });
      const isCorrect = question && a.userAnswer.toUpperCase() === question.answer.toUpperCase();
      if (isCorrect) {
        correctCount++;
        a.isCorrect = 1;
      } else {
        a.isCorrect = 0;
        wrongAnswers.push(a);
      }
      await this.answerRepository.save(a);

      details.push({
        questionId: String(a.questionId),
        correct: !!isCorrect,
        myAnswer: a.userAnswer,
        correctAnswer: question ? question.answer : '',
      });
    }

    const total = record.totalQuestions > 0 ? record.totalQuestions : answers.length;
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const now = new Date();
    const duration = record.startedAt ? Math.floor((now.getTime() - new Date(record.startedAt).getTime()) / 1000) : 120;

    record.status = 'completed';
    record.correctCount = correctCount;
    record.score = score;
    record.duration = duration;
    record.submittedAt = now;
    await this.recordRepository.save(record);

    // 错题自动入库（免费用户限制100题）
    const existingWrongCount = await this.wrongQuestionRepository.count({ where: { userId } });
    const uniqueWrongAnswers = Array.from(
      new Map(wrongAnswers.map((wa) => [Number(wa.questionId), wa])).values()
    );
    for (const wa of uniqueWrongAnswers) {
      if (!isVip && existingWrongCount >= 100) {
        break; // 免费用户达到100题限制不再自动加入新错题
      }
      const question = await this.questionRepository.findOne({ where: { id: wa.questionId } });
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
          subjectId: record.subjectId || question.subjectId,
          chapterId: question.chapterId,
          wrongCount: 1,
          lastWrongAt: new Date(),
          status: 'pending',
        });
      }
      await this.wrongQuestionRepository.save(wrongQ);

      // 同步进入艾宾浩斯复习队列（若未入队或已重错，清理历史多余记录）
      try {
        const rItems = await this.reviewQueueRepository.find({
          where: { userId, questionId: wa.questionId },
        });
        let rItem: ReviewQueue;
        if (rItems.length > 1) {
          const [keep, ...duplicates] = rItems;
          await this.reviewQueueRepository.remove(duplicates);
          rItem = keep;
        } else if (rItems.length === 1) {
          rItem = rItems[0];
        } else {
          rItem = this.reviewQueueRepository.create({
            userId,
            questionId: wa.questionId,
            interval: 1,
            step: 0,
            nextReviewAt: new Date(Date.now() + 24 * 3600 * 1000),
            status: 'pending',
          });
        }
        rItem.step = 0;
        rItem.interval = 1;
        rItem.nextReviewAt = new Date(Date.now() + 24 * 3600 * 1000);
        rItem.status = 'pending';
        await this.reviewQueueRepository.save(rItem);
      } catch {
        // ignore
      }
    }

    // 若当前为艾宾浩斯复习模式，推进或重置各题复习周期（严格单题去重推进）
    if (record.mode === 'review') {
      const INTERVALS = [1, 2, 4, 7, 15, 30];
      const uniqueAnswers = Array.from(
        new Map(answers.map((a) => [Number(a.questionId), a])).values()
      );
      for (const a of uniqueAnswers) {
        try {
          const rItems = await this.reviewQueueRepository.find({
            where: { userId, questionId: a.questionId },
          });
          if (rItems.length > 0) {
            let rItem = rItems[0];
            if (rItems.length > 1) {
              const [keep, ...duplicates] = rItems;
              await this.reviewQueueRepository.remove(duplicates);
              rItem = keep;
            }
            rItem.lastReviewedAt = new Date();
            if (a.isCorrect === 1) {
              rItem.step = (rItem.step || 0) + 1;
              if (rItem.step >= 5) {
                rItem.status = 'completed';
                rItem.interval = 30;
                rItem.nextReviewAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
              } else {
                rItem.interval = INTERVALS[rItem.step] || 1;
                rItem.nextReviewAt = new Date(Date.now() + rItem.interval * 24 * 3600 * 1000);
                rItem.status = 'pending';
              }
            } else {
              rItem.step = 0;
              rItem.interval = 1;
              rItem.nextReviewAt = new Date(Date.now() + 24 * 3600 * 1000);
              rItem.status = 'pending';
            }
            await this.reviewQueueRepository.save(rItem);
          }
        } catch {
          // ignore
        }
      }
    }

    return {
      recordId: String(record.id),
      score,
      total,
      correct: correctCount,
      duration,
      details,
    };
  }

  /**
   * 获取做题报告详情
   */
  async getReport(recordId: number, userId: number): Promise<any> {
    const record = await this.recordRepository.findOne({
      where: { id: recordId },
    });
    if (!record) {
      throw new NotFoundException('做题记录不存在');
    }

    const answers = await this.answerRepository.find({
      where: { recordId },
    });

    const wrongQuestions: any[] = [];
    const typeCountMap: Record<string, { total: number; correct: number }> = {
      single: { total: 0, correct: 0 },
      multiple: { total: 0, correct: 0 },
      judge: { total: 0, correct: 0 },
      case: { total: 0, correct: 0 },
      subjective: { total: 0, correct: 0 },
    };

    for (const a of answers) {
      const q = await this.questionRepository.findOne({ where: { id: a.questionId } });
      if (q) {
        const typeKey = q.type || 'single';
        if (!typeCountMap[typeKey]) {
          typeCountMap[typeKey] = { total: 0, correct: 0 };
        }
        typeCountMap[typeKey].total += 1;
        if (a.isCorrect === 1) {
          typeCountMap[typeKey].correct += 1;
        } else {
          wrongQuestions.push({
            questionId: String(q.id),
            title: q.content,
            myAnswer: a.userAnswer,
            correctAnswer: q.answer,
            analysis: q.analysis || '暂无解析',
          });
        }
      }
    }

    const typeStats = Object.entries(typeCountMap)
      .filter(([_, data]) => data.total > 0)
      .map(([type, data]) => ({
        type,
        total: data.total,
        correct: data.correct,
      }));

    const total = record.totalQuestions || answers.length;
    const correctRate = total > 0 ? Math.round((record.correctCount / total) * 100) : 0;

    return {
      recordId: String(record.id),
      score: record.score || 0,
      total,
      correct: record.correctCount || 0,
      duration: record.duration || 0,
      correctRate,
      typeStats,
      wrongQuestions,
    };
  }

  /**
   * 记录单题错题
   */
  async recordWrongQuestion(
    userId: number,
    dto: { questionId: number | string; subjectId?: number | string; chapterId?: number | string; userAnswer?: string },
  ): Promise<WrongQuestion> {
    const qId = Number(dto.questionId);
    if (!qId) throw new BadRequestException('题目ID不能为空');

    const question = await this.questionRepository.findOne({ where: { id: qId } });
    const subId = Number(dto.subjectId) || (question ? Number(question.subjectId) : 1);
    const chapId = Number(dto.chapterId) || (question ? Number(question.chapterId) : 1);

    let wrongQ = await this.wrongQuestionRepository.findOne({
      where: { userId, questionId: qId },
    });

    if (wrongQ) {
      wrongQ.wrongCount = (wrongQ.wrongCount || 1) + 1;
      wrongQ.lastWrongAt = new Date();
      wrongQ.status = 'pending';
      if (subId) wrongQ.subjectId = subId;
      if (chapId) wrongQ.chapterId = chapId;
    } else {
      wrongQ = this.wrongQuestionRepository.create({
        userId,
        questionId: qId,
        subjectId: subId,
        chapterId: chapId,
        wrongCount: 1,
        lastWrongAt: new Date(),
        status: 'pending',
      });
    }

    return this.wrongQuestionRepository.save(wrongQ);
  }

  /**
   * 获取错题本
   */
  async getWrongQuestions(
    userId: number,
    query: any,
  ): Promise<{ list: any[]; total: number }> {
    const { page = 1, pageSize = 50, subjectId, chapterId, type } = query;
    const qb = this.wrongQuestionRepository
      .createQueryBuilder('wq')
      .where('wq.userId = :userId', { userId });

    if (subjectId) {
      qb.andWhere('(wq.subjectId = :subjectId OR wq.subjectId IS NULL OR wq.subjectId = 0)', { subjectId: Number(subjectId) });
    }
    if (chapterId) {
      qb.andWhere('wq.chapterId = :chapterId', { chapterId: Number(chapterId) });
    }

    qb.skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('wq.lastWrongAt', 'DESC');

    const [list, total] = await qb.getManyAndCount();

    const questions = await this.questionRepository.find();
    const qMap = new Map(questions.map((q) => [Number(q.id), q]));
    const chapters = await this.chapterRepository.find();
    const cMap = new Map(chapters.map((c) => [Number(c.id), c.name]));
    const subjects = await this.subjectRepository.find();
    const sMap = new Map(subjects.map((s) => [Number(s.id), s.name]));

    const typeTextMap: Record<string, string> = {
      single: '单选题',
      multiple: '多选题',
      judge: '判断题',
      case: '案例分析',
      subjective: '主观题',
    };

    const formatted = list.map((item) => {
      const q = qMap.get(Number(item.questionId));
      const qType = q ? fromDbType(q.type) : 'single';
      let options = q ? q.options : [];
      if (typeof options === 'string') {
        try {
          options = JSON.parse(options);
        } catch {
          options = [];
        }
      }
      return {
        id: String(item.id),
        questionId: String(item.questionId),
        type: qType,
        typeText: typeTextMap[qType] || '单选题',
        title: q ? q.content : '题目详情',
        content: q ? q.content : '',
        options: Array.isArray(options) ? options : [],
        answer: q ? q.answer : 'A',
        correctAnswer: q ? q.answer : 'A',
        analysis: q ? (q.analysis || '详见官方解析与考点分析。') : '详见官方解析',
        subjectName: sMap.get(Number(item.subjectId || (q ? q.subjectId : 1))) || '系统集成项目管理工程师',
        chapterName: cMap.get(Number(item.chapterId || (q ? q.chapterId : 1))) || '核心考点章节',
        wrongCount: item.wrongCount || 1,
        lastWrongAt: item.lastWrongAt,
        status: item.status || 'pending',
      };
    });

    return { list: formatted, total };
  }

  /**
   * 移除错题
   */
  async removeWrongQuestions(userId: number, questionIds: any[]): Promise<void> {
    const numIds = (Array.isArray(questionIds) ? questionIds : [questionIds]).map((id) => Number(id)).filter(Boolean);
    if (numIds.length > 0) {
      await this.wrongQuestionRepository
        .createQueryBuilder()
        .delete()
        .where('userId = :userId', { userId })
        .andWhere('(questionId IN (:...ids) OR id IN (:...ids))', { ids: numIds })
        .execute();
    }
  }

  /**
   * 错题重做
   */
  async redoWrongQuestions(userId: number, questionIds: any[]): Promise<{ recordId: string }> {
    const numIds = (Array.isArray(questionIds) ? questionIds : [questionIds]).map((id) => Number(id)).filter(Boolean);
    const result = await this.createPractice(userId, {
      mode: 'wrong',
      questionIds: numIds,
    });
    return { recordId: result.recordId };
  }

  /**
   * 获取收藏列表（包含题目详细信息）
   */
  async getFavorites(
    userId: number,
    query: any = {},
  ): Promise<{ list: any[]; total: number }> {
    const { page = 1, pageSize = 50, subjectId, chapterId, type } = query;
    const qb = this.favoriteRepository
      .createQueryBuilder('f')
      .where('f.userId = :userId', { userId });

    qb.skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('f.createdAt', 'DESC');

    const [favorites, total] = await qb.getManyAndCount();

    if (favorites.length === 0) {
      return { list: [], total: 0 };
    }

    const qIds = favorites.map((f) => Number(f.questionId)).filter(Boolean);
    const questions = qIds.length > 0 ? await this.questionRepository.find({ where: { id: In(qIds) } }) : [];
    const qMap = new Map(questions.map((q) => [Number(q.id), q]));

    const chapters = await this.chapterRepository.find();
    const cMap = new Map(chapters.map((c) => [Number(c.id), c.name]));
    const subjects = await this.subjectRepository.find();
    const sMap = new Map(subjects.map((s) => [Number(s.id), s.name]));

    const typeTextMap: Record<string, string> = {
      single: '单选题',
      multiple: '多选题',
      judge: '判断题',
      case: '案例分析',
      subjective: '主观题',
    };

    let formatted = favorites.map((item) => {
      const q = qMap.get(Number(item.questionId));
      const qType = q ? fromDbType(q.type) : 'single';
      let options = q ? q.options : [];
      if (typeof options === 'string') {
        try {
          options = JSON.parse(options);
        } catch {
          options = [];
        }
      }
      return {
        id: String(item.id),
        questionId: String(item.questionId),
        type: qType,
        typeText: typeTextMap[qType] || '单选题',
        title: q ? q.content : '题目详情',
        content: q ? q.content : '',
        options: Array.isArray(options) ? options : [],
        answer: q ? q.answer : 'A',
        correctAnswer: q ? q.answer : 'A',
        analysis: q ? (q.analysis || '详见官方解析与考点分析。') : '详见官方解析',
        subjectId: q ? Number(q.subjectId) : 1,
        chapterId: q ? Number(q.chapterId) : 1,
        subjectName: sMap.get(Number(q ? q.subjectId : 1)) || '系统集成项目管理工程师',
        chapterName: cMap.get(Number(q ? q.chapterId : 1)) || '核心考点章节',
        createdAt: item.createdAt,
      };
    });

    if (subjectId) {
      formatted = formatted.filter((item) => String(item.subjectId) === String(subjectId));
    }
    if (chapterId) {
      formatted = formatted.filter((item) => String(item.chapterId) === String(chapterId));
    }
    if (type && type !== 'all') {
      formatted = formatted.filter((item) => item.type === type || item.typeText?.includes(type));
    }

    return { list: formatted, total };
  }

  /**
   * 获取用户收藏的所有题目ID列表
   */
  async getFavoriteIds(userId: number): Promise<string[]> {
    const list = await this.favoriteRepository.find({
      where: { userId },
      select: ['questionId'],
    });
    return list.map((f) => String(f.questionId));
  }

  /**
   * 收藏题目
   */
  async addFavorite(userId: number, dto: any): Promise<Favorite> {
    const qId = Number(dto.questionId);
    if (!qId) {
      throw new BadRequestException('题目ID不能为空');
    }
    const exists = await this.favoriteRepository.findOne({
      where: { userId, questionId: qId },
    });
    if (exists) {
      return exists;
    }
    const favorite = this.favoriteRepository.create({
      userId,
      questionId: qId,
    });
    return this.favoriteRepository.save(favorite);
  }

  /**
   * 取消收藏
   */
  async removeFavorite(userId: number, questionId: number): Promise<void> {
    await this.favoriteRepository
      .createQueryBuilder()
      .delete()
      .where('userId = :userId', { userId })
      .andWhere('(questionId = :id OR id = :id)', { id: questionId })
      .execute();
  }

  /**
   * 获取用户笔记列表
   */
  async getNotes(
    userId: number,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<{ list: any[]; total: number }> {
    const [list, total] = await this.noteRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { updatedAt: 'DESC' },
    });

    if (list.length === 0) {
      return { list: [], total: 0 };
    }

    const qIds = list.map((n) => Number(n.questionId)).filter(Boolean);
    const questions = qIds.length > 0 ? await this.questionRepository.find({ where: { id: In(qIds) } }) : [];
    const qMap = new Map(questions.map((q) => [Number(q.id), q]));

    const chapters = await this.chapterRepository.find();
    const cMap = new Map(chapters.map((c) => [Number(c.id), c.name]));
    const subjects = await this.subjectRepository.find();
    const sMap = new Map(subjects.map((s) => [Number(s.id), s.name]));

    const formatted = list.map((n) => {
      const q = qMap.get(Number(n.questionId));
      let options = q ? q.options : [];
      if (typeof options === 'string') {
        try {
          options = JSON.parse(options);
        } catch {
          options = [];
        }
      }
      return {
        id: String(n.id),
        questionId: String(n.questionId),
        title: q ? q.content : '笔记关联题目',
        content: n.content,
        options: Array.isArray(options) ? options : [],
        answer: q ? q.answer : '',
        analysis: q ? q.analysis : '',
        subjectId: q ? Number(q.subjectId) : 1,
        chapterId: q ? Number(q.chapterId) : 1,
        subjectName: sMap.get(Number(q ? q.subjectId : 1)) || '系统集成项目管理工程师',
        chapterName: cMap.get(Number(q ? q.chapterId : 1)) || '核心考点章节',
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      };
    });

    return { list: formatted, total };
  }

  /**
   * 添加/更新笔记
   */
  async saveNote(userId: number, dto: any): Promise<any> {
    const qId = Number(dto.questionId);
    if (!qId) {
      throw new BadRequestException('题目ID不能为空');
    }
    const content = (dto.content || '').trim();
    let note = await this.noteRepository.findOne({
      where: { userId, questionId: qId },
    });

    if (!content) {
      if (note) {
        await this.noteRepository.delete({ id: note.id });
      }
      return { id: note ? String(note.id) : '', questionId: String(qId), content: '', message: '笔记已清空' };
    }

    if (note) {
      note.content = content;
    } else {
      note = this.noteRepository.create({
        userId,
        questionId: qId,
        content,
      });
    }
    const saved = await this.noteRepository.save(note);
    return { id: String(saved.id), questionId: String(saved.questionId), content: saved.content };
  }

  /**
   * 删除笔记
   */
  async deleteNote(userId: number, id: number): Promise<void> {
    await this.noteRepository
      .createQueryBuilder()
      .delete()
      .where('userId = :userId', { userId })
      .andWhere('(id = :id OR questionId = :id)', { id })
      .execute();
  }

  /**
   * 获取笔记
   */
  async getNote(userId: number, questionId: number): Promise<any> {
    const note = await this.noteRepository.findOne({
      where: { userId, questionId },
    });
    return note
      ? {
          id: String(note.id),
          questionId: String(note.questionId),
          content: note.content,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        }
      : null;
  }

  /**
   * 获取做题记录列表
   */
  async getRecords(
    userId: number,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ list: any[]; total: number }> {
    const [list, total] = await this.recordRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { startedAt: 'DESC' },
    });

    const subjects = await this.subjectRepository.find();
    const sMap = new Map(subjects.map((s) => [Number(s.id), s.name]));

    const formatted = list.map((r) => {
      const totalQ = r.totalQuestions || 1;
      return {
        id: String(r.id),
        mode: r.mode,
        subjectName: sMap.get(Number(r.subjectId)) || '软件设计师',
        score: r.score || 0,
        total: r.totalQuestions || 0,
        correctRate: totalQ > 0 ? Math.round((r.correctCount / totalQ) * 100) : 0,
        duration: r.duration || 0,
        createdAt: r.startedAt,
      };
    });

    return { list: formatted, total };
  }

  /**
   * 获取每日一练及本周打卡状态与趣味成长体系
   */
  async getDailyStatus(
    userId: number,
    subjectId?: number,
  ): Promise<{
    today: {
      date: string;
      day: number;
      month: number;
      year: number;
      weekday: number;
      weekdayName: string;
      totalCount: number;
      completedCount: number;
      isCompleted: boolean;
      progress: number;
      todayScore?: number;
      todayCorrect?: number;
      todayRecordId?: number;
    };
    weekList: Array<{
      date: string;
      day: number;
      month: number;
      label: string;
      isToday: boolean;
      isPast: boolean;
      isFuture: boolean;
      done: boolean;
      count: number;
      score?: number;
    }>;
    streakDays: number;
    totalCheckinDays: number;
    milestones: Array<{
      days: number;
      title: string;
      reached: boolean;
      icon: string;
    }>;
    todayTopics: Array<{
      id: number;
      name: string;
    }>;
  }> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const dayOfWeek = now.getDay(); // 0 是周日，1 是周一 ... 6 是周六
    const weekdayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekdayName = weekdayMap[dayOfWeek];

    const todayDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // 计算本周周一 (周一为第0天，周日为第6天)
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(year, now.getMonth(), day + mondayOffset);

    // 查询该用户的所有做题记录
    const records = await this.recordRepository.find({
      where: { userId },
      order: { startedAt: 'DESC', createdAt: 'DESC' },
    });

    // 统计各日期做题情况及当日最好成绩
    const dateCountMap = new Map<string, number>();
    const dateScoreMap = new Map<string, number>();
    const dateRecordMap = new Map<string, any>();

    for (const r of records) {
      const recDate = r.startedAt || r.createdAt;
      if (recDate) {
        const d = new Date(recDate);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const prevCount = dateCountMap.get(dStr) || 0;
        dateCountMap.set(dStr, prevCount + (r.answeredQuestions || r.totalQuestions || 1));
        if (r.score !== undefined && (!dateScoreMap.has(dStr) || (r.score || 0) > (dateScoreMap.get(dStr) || 0))) {
          dateScoreMap.set(dStr, r.score);
        }
        if (!dateRecordMap.has(dStr)) {
          dateRecordMap.set(dStr, r);
        }
      }
    }

    const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const weekList: Array<{
      date: string;
      day: number;
      month: number;
      label: string;
      isToday: boolean;
      isPast: boolean;
      isFuture: boolean;
      done: boolean;
      count: number;
      score?: number;
    }> = [];

    const todayZero = new Date(year, now.getMonth(), day).getTime();

    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const tYear = targetDate.getFullYear();
      const tMonth = targetDate.getMonth() + 1;
      const tDay = targetDate.getDate();
      const tDateStr = `${tYear}-${String(tMonth).padStart(2, '0')}-${String(tDay).padStart(2, '0')}`;
      const targetZero = new Date(tYear, targetDate.getMonth(), tDay).getTime();

      const isToday = tDateStr === todayDateStr;
      const isPast = targetZero < todayZero;
      const isFuture = targetZero > todayZero;

      const count = dateCountMap.get(tDateStr) || 0;
      const done = count > 0;
      const score = dateScoreMap.get(tDateStr);

      weekList.push({
        date: tDateStr,
        day: tDay,
        month: tMonth,
        label: weekLabels[i],
        isToday,
        isPast,
        isFuture,
        done,
        count,
        score,
      });
    }

    // 今日做题进度
    const todayAnswered = dateCountMap.get(todayDateStr) || 0;
    const todayRecord = dateRecordMap.get(todayDateStr);
    const isCompleted = todayAnswered > 0 || Boolean(todayRecord);
    const progress = Math.min(100, Math.round((todayAnswered / 20) * 100));

    // 计算连续打卡天数
    let streakDays = 0;
    let checkDate = new Date(year, now.getMonth(), day);
    if (!dateCountMap.has(todayDateStr)) {
      checkDate = new Date(year, now.getMonth(), day - 1);
    }
    while (true) {
      const cStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if ((dateCountMap.get(cStr) || 0) > 0) {
        streakDays++;
        checkDate = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const totalCheckinDays = dateCountMap.size;
    const finalStreak = Math.max(streakDays, todayAnswered > 0 ? 1 : 0);

    // 成就勋章里程碑
    const milestones = [
      { days: 3, title: '初露锋芒', reached: finalStreak >= 3 || totalCheckinDays >= 3, icon: '🌱' },
      { days: 7, title: '七日连胜', reached: finalStreak >= 7 || totalCheckinDays >= 7, icon: '🔥' },
      { days: 14, title: '备考先锋', reached: finalStreak >= 14 || totalCheckinDays >= 14, icon: '⚡' },
      { days: 21, title: '习惯养成', reached: finalStreak >= 21 || totalCheckinDays >= 21, icon: '🏅' },
      { days: 30, title: '考霸传说', reached: finalStreak >= 30 || totalCheckinDays >= 30, icon: '👑' },
    ];

    // 今日精选考点
    const chapters = await this.chapterRepository.find({
      where: subjectId ? { subjectId: Number(subjectId) } : {},
      take: 4,
      order: { sort: 'ASC' },
    });
    const todayTopics = chapters.map((c) => ({ id: Number(c.id), name: c.name }));

    return {
      today: {
        date: todayDateStr,
        day,
        month,
        year,
        weekday: dayOfWeek,
        weekdayName,
        totalCount: 20,
        completedCount: todayAnswered,
        isCompleted,
        progress,
        todayScore: todayRecord?.score,
        todayCorrect: todayRecord?.correctCount,
        todayRecordId: todayRecord?.id ? Number(todayRecord.id) : undefined,
      },
      weekList,
      streakDays: finalStreak,
      totalCheckinDays,
      milestones,
      todayTopics,
    };
  }

  // ==================== 艾宾浩斯复习系统 ====================

  /**
   * 获取艾宾浩斯复习总览及各阶段统计
   */
  async getReviewOverview(
    userId: number,
    subjectId?: number,
  ): Promise<{
    totalDue: number;
    urgentCount: number;
    todayCount: number;
    tomorrowCount: number;
    futureCount: number;
    completedCount: number;
    totalQueue: number;
    averageRound: string;
    consolidationRate: number;
    stageDistribution: Record<string, number>;
  }> {
    // 自动清理可能存在的历史重复记录
    await this.cleanupDuplicateReviewQueue(userId);

    // 若用户复习队列为空，自动从错题本与高频题中导入
    const totalCount = await this.reviewQueueRepository.count({ where: { userId } });
    if (totalCount === 0) {
      await this.syncWrongToReview(userId, subjectId);
    }

    const qb = this.reviewQueueRepository
      .createQueryBuilder('rq')
      .innerJoin(Question, 'q', 'q.id = rq.questionId')
      .where('rq.userId = :userId', { userId });

    if (subjectId) {
      qb.andWhere('(q.subjectId = :subjectId OR q.subjectId IS NULL OR q.subjectId = 0)', {
        subjectId: Number(subjectId),
      });
    }

    const rawItems = await qb.orderBy('rq.nextReviewAt', 'ASC').getMany();

    // 内存严格按 questionId 去重保底（同一题目仅取一条）
    const itemMap = new Map<number, ReviewQueue>();
    for (const item of rawItems) {
      const qId = Number(item.questionId);
      if (!itemMap.has(qId)) {
        itemMap.set(qId, item);
      }
    }
    const items = Array.from(itemMap.values());

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999).getTime();

    let urgentCount = 0;
    let todayCount = 0;
    let tomorrowCount = 0;
    let futureCount = 0;
    let completedCount = 0;
    let totalRounds = 0;

    const stageDistribution: Record<string, number> = {
      step0: 0,
      step1: 0,
      step2: 0,
      step3: 0,
      step4: 0,
      completed: 0,
    };

    for (const item of items) {
      const stepKey = `step${Math.min(4, item.step || 0)}`;
      if (item.status === 'completed' || (item.step || 0) >= 5) {
        completedCount++;
        stageDistribution.completed++;
        totalRounds += 5;
      } else {
        totalRounds += ((item.step || 0) + 1);
        stageDistribution[stepKey] = (stageDistribution[stepKey] || 0) + 1;
        const reviewTime = item.nextReviewAt ? new Date(item.nextReviewAt).getTime() : now.getTime();

        if (reviewTime < todayStart) {
          urgentCount++;
        } else if (reviewTime <= todayEnd) {
          todayCount++;
        } else if (reviewTime <= tomorrowEnd) {
          tomorrowCount++;
        } else {
          futureCount++;
        }
      }
    }

    const totalQueue = items.length;
    const totalDue = urgentCount + todayCount;
    const avgRoundNum = totalQueue > 0 ? (totalRounds / totalQueue).toFixed(1) : '1.0';
    const consolidationRate = totalQueue > 0 ? Math.round((completedCount / totalQueue) * 100) : 0;

    return {
      totalDue,
      urgentCount,
      todayCount,
      tomorrowCount,
      futureCount,
      completedCount,
      totalQueue,
      averageRound: avgRoundNum,
      consolidationRate,
      stageDistribution,
    };
  }

  /**
   * 获取艾宾浩斯待复习题目列表
   */
  async getReviewQuestions(
    userId: number,
    query: any = {},
  ): Promise<{
    list: any[];
    total: number;
    page: number;
    pageSize: number;
    overview: any;
  }> {
    const { page = 1, pageSize = 20, stage = 'due', subjectId, questionIds } = query;

    // 清理历史可能残留的重复数据
    await this.cleanupDuplicateReviewQueue(userId);

    const overview = await this.getReviewOverview(userId, subjectId ? Number(subjectId) : undefined);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);

    const qb = this.reviewQueueRepository
      .createQueryBuilder('rq')
      .innerJoin(Question, 'q', 'q.id = rq.questionId')
      .where('rq.userId = :userId', { userId });

    if (subjectId) {
      qb.andWhere('(q.subjectId = :subjectId OR q.subjectId IS NULL OR q.subjectId = 0)', {
        subjectId: Number(subjectId),
      });
    }

    if (questionIds) {
      const qIdList = String(questionIds)
        .split(',')
        .map((id) => Number(id.trim()))
        .filter(Boolean);
      if (qIdList.length > 0) {
        qb.andWhere('rq.questionId IN (:...qIdList)', { qIdList });
      }
    } else {
      if (stage === 'due') {
        qb.andWhere('rq.status = :status', { status: 'pending' })
          .andWhere('rq.nextReviewAt <= :todayEnd', { todayEnd: todayEnd.toISOString() });
      } else if (stage === 'urgent') {
        qb.andWhere('rq.status = :status', { status: 'pending' })
          .andWhere('rq.nextReviewAt < :todayStart', { todayStart: todayStart.toISOString() });
      } else if (stage === 'today') {
        qb.andWhere('rq.status = :status', { status: 'pending' })
          .andWhere('rq.nextReviewAt >= :todayStart', { todayStart: todayStart.toISOString() })
          .andWhere('rq.nextReviewAt <= :todayEnd', { todayEnd: todayEnd.toISOString() });
      } else if (stage === 'tomorrow') {
        qb.andWhere('rq.status = :status', { status: 'pending' })
          .andWhere('rq.nextReviewAt > :todayEnd', { todayEnd: todayEnd.toISOString() })
          .andWhere('rq.nextReviewAt <= :tomorrowEnd', { tomorrowEnd: tomorrowEnd.toISOString() });
      } else if (stage === 'completed') {
        qb.andWhere('(rq.status = :cStatus OR rq.step >= 5)', { cStatus: 'completed' });
      }
    }

    qb.skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('rq.nextReviewAt', 'ASC');

    let [items, rawTotal] = await qb.getManyAndCount();

    if (items.length === 0 && questionIds) {
      const qIdList = String(questionIds)
        .split(',')
        .map((id) => Number(id.trim()))
        .filter(Boolean);
      if (qIdList.length > 0) {
        const directQuestions = await this.questionRepository.find({ where: { id: In(qIdList) } });
        for (const dq of directQuestions) {
          let rItem = await this.reviewQueueRepository.findOne({ where: { userId, questionId: Number(dq.id) } });
          if (!rItem) {
            rItem = this.reviewQueueRepository.create({
              userId,
              questionId: Number(dq.id),
              interval: 1,
              step: 0,
              nextReviewAt: new Date(),
              status: 'pending',
            });
            await this.reviewQueueRepository.save(rItem);
          }
        }
        return this.getReviewQuestions(userId, query);
      }
    }

    if (items.length === 0) {
      return { list: [], total: 0, page: Number(page), pageSize: Number(pageSize), overview };
    }

    // 内存严格按 questionId 去重
    const distinctItemMap = new Map<number, ReviewQueue>();
    for (const it of items) {
      const qId = Number(it.questionId);
      if (!distinctItemMap.has(qId)) {
        distinctItemMap.set(qId, it);
      }
    }
    const uniqueItems = Array.from(distinctItemMap.values());

    const qIds = uniqueItems.map((i) => Number(i.questionId)).filter(Boolean);
    const questions = qIds.length > 0 ? await this.questionRepository.find({ where: { id: In(qIds) } }) : [];
    const qMap = new Map(questions.map((q) => [Number(q.id), q]));

    const chapters = await this.chapterRepository.find();
    const cMap = new Map(chapters.map((c) => [Number(c.id), c.name]));
    const subjects = await this.subjectRepository.find();
    const sMap = new Map(subjects.map((s) => [Number(s.id), s.name]));

    const stageNames = [
      { text: '阶段1: 第1天记忆', icon: '🌱' },
      { text: '阶段2: 第2天巩固', icon: '🌿' },
      { text: '阶段3: 第4天强化', icon: '🌳' },
      { text: '阶段4: 第7天深化', icon: '🌲' },
      { text: '阶段5: 第15天抗遗忘', icon: '👑' },
      { text: '长效固化完成', icon: '✨' },
    ];

    const typeTextMap: Record<string, string> = {
      single: '单选题',
      multiple: '多选题',
      judge: '判断题',
      case: '案例分析',
      subjective: '主观题',
    };

    const formatted = uniqueItems.map((item) => {
      const q = qMap.get(Number(item.questionId));
      const qType = q ? fromDbType(q.type) : 'single';
      let options = q ? q.options : [];
      if (typeof options === 'string') {
        try {
          options = JSON.parse(options);
        } catch {
          options = [];
        }
      }

      const step = Math.min(5, Math.max(0, item.step || 0));
      const isCompleted = item.status === 'completed' || step >= 5;
      const stageInfo = stageNames[isCompleted ? 5 : step] || stageNames[0];

      // 计算逾期或剩余天数
      const reviewTime = item.nextReviewAt ? new Date(item.nextReviewAt).getTime() : now.getTime();
      let dueStatus = 'today';
      let dueText = '今日待复习';

      if (isCompleted) {
        dueStatus = 'completed';
        dueText = '已长效掌握';
      } else if (reviewTime < todayStart.getTime()) {
        dueStatus = 'urgent';
        const overdueDays = Math.max(1, Math.ceil((todayStart.getTime() - reviewTime) / (24 * 3600 * 1000)));
        dueText = `已逾期 ${overdueDays} 天`;
      } else if (reviewTime <= todayEnd.getTime()) {
        dueStatus = 'today';
        dueText = '今日内复习';
      } else if (reviewTime <= tomorrowEnd.getTime()) {
        dueStatus = 'tomorrow';
        dueText = '明日任务';
      } else {
        dueStatus = 'future';
        const daysLeft = Math.ceil((reviewTime - todayEnd.getTime()) / (24 * 3600 * 1000));
        dueText = `${daysLeft}天后复习`;
      }

      return {
        id: String(item.id),
        questionId: String(item.questionId),
        step,
        interval: item.interval || 1,
        status: item.status,
        stageText: stageInfo.text,
        stageIcon: stageInfo.icon,
        dueStatus,
        dueText,
        nextReviewAt: item.nextReviewAt,
        lastReviewedAt: item.lastReviewedAt,
        type: qType,
        typeText: typeTextMap[qType] || '单选题',
        title: q ? q.content : '题目详情',
        content: q ? q.content : '',
        options: Array.isArray(options) ? options : [],
        answer: q ? q.answer : 'A',
        correctAnswer: q ? q.answer : 'A',
        analysis: q ? (q.analysis || '详见官方解析与考点分析。') : '详见官方解析',
        subjectName: sMap.get(Number(q ? q.subjectId : 1)) || '系统集成项目管理工程师',
        chapterName: cMap.get(Number(q ? q.chapterId : 1)) || '核心考点章节',
      };
    });

    // 最终列表严格防重保底
    const seenQuestionIds = new Set<string>();
    const distinctFormatted = formatted.filter((item) => {
      if (seenQuestionIds.has(item.questionId)) return false;
      seenQuestionIds.add(item.questionId);
      return true;
    });

    // 计算准确的去重后总数
    let accurateTotal = rawTotal;
    if (stage === 'due') accurateTotal = overview.totalDue;
    else if (stage === 'urgent') accurateTotal = overview.urgentCount;
    else if (stage === 'today') accurateTotal = overview.todayCount;
    else if (stage === 'tomorrow') accurateTotal = overview.tomorrowCount;
    else if (stage === 'completed') accurateTotal = overview.completedCount;
    else if (stage === 'all') accurateTotal = overview.totalQueue;

    return { list: distinctFormatted, total: accurateTotal, page: Number(page), pageSize: Number(pageSize), overview };
  }

  /**
   * 从错题本同步题目到艾宾浩斯复习队列
   */
  async syncWrongToReview(
    userId: number,
    subjectId?: number,
  ): Promise<{ syncedCount: number; totalCount: number }> {
    await this.cleanupDuplicateReviewQueue(userId);

    const wrongList = await this.wrongQuestionRepository.find({
      where: { userId },
      order: { lastWrongAt: 'DESC' },
    });

    // 提取不重复的错题ID
    const uniqueWrongQIds = Array.from(new Set(wrongList.map((w) => Number(w.questionId)).filter(Boolean)));

    let syncedCount = 0;
    for (const qId of uniqueWrongQIds) {
      const exists = await this.reviewQueueRepository.findOne({
        where: { userId, questionId: qId },
      });
      if (!exists) {
        const item = this.reviewQueueRepository.create({
          userId,
          questionId: qId,
          interval: 1,
          step: 0,
          nextReviewAt: new Date(),
          status: 'pending',
        });
        await this.reviewQueueRepository.save(item);
        syncedCount++;
      }
    }

    // 若错题本为空或复习队列仍为空，抓取 15 道精选已发布试题初始化复习库
    const currentCount = await this.reviewQueueRepository.count({ where: { userId } });
    if (currentCount === 0) {
      const qb = this.questionRepository
        .createQueryBuilder('q')
        .where('q.status = :status', { status: 'published' });
      if (subjectId) qb.andWhere('q.subjectId = :subjectId', { subjectId: Number(subjectId) });
      const questions = await qb.take(15).getMany();

      const uniqueInitQIds = Array.from(new Set(questions.map((q) => Number(q.id)).filter(Boolean)));
      for (const qId of uniqueInitQIds) {
        const exists = await this.reviewQueueRepository.findOne({
          where: { userId, questionId: qId },
        });
        if (!exists) {
          const item = this.reviewQueueRepository.create({
            userId,
            questionId: qId,
            interval: 1,
            step: 0,
            nextReviewAt: new Date(),
            status: 'pending',
          });
          await this.reviewQueueRepository.save(item);
          syncedCount++;
        }
      }
    }

    await this.cleanupDuplicateReviewQueue(userId);
    const totalCount = await this.reviewQueueRepository.count({ where: { userId } });
    return { syncedCount, totalCount };
  }

  /**
   * 推进单题艾宾浩斯阶段（记住了/自测正确）
   */
  async advanceReviewItem(userId: number, questionId: number): Promise<any> {
    const INTERVALS = [1, 2, 4, 7, 15, 30];
    const items = await this.reviewQueueRepository.find({
      where: { userId, questionId },
    });
    let item: ReviewQueue;
    if (items.length > 1) {
      const [keep, ...duplicates] = items;
      await this.reviewQueueRepository.remove(duplicates);
      item = keep;
    } else if (items.length === 1) {
      item = items[0];
    } else {
      item = this.reviewQueueRepository.create({
        userId,
        questionId,
        interval: 2,
        step: 1,
        nextReviewAt: new Date(Date.now() + 2 * 24 * 3600 * 1000),
        status: 'pending',
        lastReviewedAt: new Date(),
      });
      await this.reviewQueueRepository.save(item);
      return { message: '复习成功，已进入第2阶段', item };
    }

    item.lastReviewedAt = new Date();
    item.step = (item.step || 0) + 1;
    if (item.step >= 5) {
      item.status = 'completed';
      item.interval = 30;
      item.nextReviewAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    } else {
      item.interval = INTERVALS[item.step] || 1;
      item.nextReviewAt = new Date(Date.now() + item.interval * 24 * 3600 * 1000);
      item.status = 'pending';
    }
    await this.reviewQueueRepository.save(item);
    return {
      message: item.status === 'completed' ? '恭喜！已完成全周期，长效掌握！' : `复习成功，已进入第${item.step + 1}阶段（${item.interval}天后复习）`,
      item,
    };
  }

  /**
   * 标记复习题目状态（如掌握或重置）
   */
  async updateReviewStatus(
    userId: number,
    questionId: number,
    mastered: boolean,
  ): Promise<void> {
    const items = await this.reviewQueueRepository.find({
      where: { userId, questionId },
    });
    let item: ReviewQueue;
    if (items.length > 1) {
      const [keep, ...duplicates] = items;
      await this.reviewQueueRepository.remove(duplicates);
      item = keep;
    } else if (items.length === 1) {
      item = items[0];
    } else {
      item = this.reviewQueueRepository.create({
        userId,
        questionId,
        interval: mastered ? 30 : 1,
        step: mastered ? 5 : 0,
        nextReviewAt: mastered ? new Date(Date.now() + 30 * 24 * 3600 * 1000) : new Date(Date.now() + 24 * 3600 * 1000),
        status: mastered ? 'completed' : 'pending',
        lastReviewedAt: new Date(),
      });
      await this.reviewQueueRepository.save(item);
      return;
    }

    if (mastered) {
      item.status = 'completed';
      item.step = 5;
      item.interval = 30;
      item.nextReviewAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
      item.lastReviewedAt = new Date();
    } else {
      item.status = 'pending';
      item.step = 0;
      item.interval = 1;
      item.nextReviewAt = new Date(Date.now() + 24 * 3600 * 1000);
      item.lastReviewedAt = new Date();
    }
    await this.reviewQueueRepository.save(item);
  }

  /**
   * 移除复习队列中的某题
   */
  async removeReviewItem(userId: number, questionId: number): Promise<void> {
    await this.reviewQueueRepository.delete({ userId, questionId });
  }

  /**
   * 旧版兼容：获取复习队列
   */
  async getReviewQueue(userId: number): Promise<any> {
    return this.getReviewQuestions(userId, { stage: 'due', pageSize: 50 });
  }
}
