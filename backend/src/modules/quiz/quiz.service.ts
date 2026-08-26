import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
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
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 创建练习（章节练习/历年真题/模拟考试/每日一练/自主练习/错题重做）
   */
  async createPractice(userId: number, dto: any): Promise<{ recordId: string; record: any }> {
    let questionIds: number[] = [];

    if (dto.questionIds && Array.isArray(dto.questionIds) && dto.questionIds.length > 0) {
      questionIds = dto.questionIds.map((id: any) => Number(id));
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
      questionIds = questions.map((q) => Number(q.id));
    } else if (dto.mode === 'real' || dto.mode === 'mock') {
      if (dto.paperId) {
        const paper = await this.paperRepository.findOne({
          where: { id: dto.paperId },
        });
        if (paper && paper.questionIds) {
          questionIds = paper.questionIds;
        }
      }
      if (questionIds.length === 0) {
        const questions = await this.questionRepository
          .createQueryBuilder('q')
          .where('q.status = :status', { status: 'published' })
          .orderBy('RAND()')
          .take(75)
          .getMany();
        questionIds = questions.map((q) => Number(q.id));
      }
    } else if (dto.mode === 'daily') {
      const questions = await this.questionRepository
        .createQueryBuilder('q')
        .where('q.status = :status', { status: 'published' })
        .orderBy('RAND()')
        .take(dto.count || 5)
        .getMany();
      questionIds = questions.map((q) => Number(q.id));
    } else {
      const questions = await this.questionRepository
        .createQueryBuilder('q')
        .where('q.status = :status', { status: 'published' })
        .orderBy('RAND()')
        .take(dto.count || 20)
        .getMany();
      questionIds = questions.map((q) => Number(q.id));
    }

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
  ): Promise<any> {
    const record = await this.recordRepository.findOne({
      where: { id: recordId, userId },
    });
    if (!record) {
      throw new NotFoundException('做题记录不存在');
    }

    if (answersMap && Object.keys(answersMap).length > 0) {
      await this.saveProgress(recordId, userId, answersMap);
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
    for (const wa of wrongAnswers) {
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
   * 获取收藏列表
   */
  async getFavorites(
    userId: number,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ list: any[]; total: number }> {
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
   * 获取用户笔记列表
   */
  async getNotes(
    userId: number,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ list: any[]; total: number }> {
    const [list, total] = await this.noteRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { updatedAt: 'DESC' },
    });

    const questions = await this.questionRepository.find();
    const qMap = new Map(questions.map((q) => [Number(q.id), q.content]));

    const formatted = list.map((n) => ({
      id: String(n.id),
      questionId: String(n.questionId),
      title: qMap.get(Number(n.questionId)) || '笔记关联题目',
      content: n.content,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }));

    return { list: formatted, total };
  }

  /**
   * 添加/更新笔记
   */
  async saveNote(userId: number, dto: any): Promise<any> {
    const qId = Number(dto.questionId);
    let note = await this.noteRepository.findOne({
      where: { userId, questionId: qId },
    });
    if (note) {
      note.content = dto.content;
    } else {
      note = this.noteRepository.create({
        userId,
        questionId: qId,
        content: dto.content,
      });
    }
    const saved = await this.noteRepository.save(note);
    return { id: String(saved.id) };
  }

  /**
   * 删除笔记
   */
  async deleteNote(userId: number, id: number): Promise<void> {
    await this.noteRepository.delete({ id, userId });
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

  /**
   * 获取每日一练及本周打卡实时状态
   */
  async getDailyStatus(userId: number, subjectId?: number): Promise<{
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
    }>;
    streakDays: number;
  }> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const dayOfWeek = now.getDay(); // 0 是周日，1 是周一 ... 6 是周六
    const weekdayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekdayName = weekdayMap[dayOfWeek];

    const todayDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // 计算本周周一
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(year, now.getMonth(), day + mondayOffset);

    // 查询该用户的所有做题记录
    const records = await this.recordRepository.find({
      where: { userId },
      order: { startedAt: 'DESC' },
    });

    // 统计各日期做题情况
    const dateCountMap = new Map<string, number>();
    for (const r of records) {
      if (r.startedAt) {
        const d = new Date(r.startedAt);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const prev = dateCountMap.get(dStr) || 0;
        dateCountMap.set(dStr, prev + (r.answeredQuestions || r.totalQuestions || 1));
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
      });
    }

    // 今日做题进度
    const todayAnswered = dateCountMap.get(todayDateStr) || 0;
    const isCompleted = todayAnswered >= 20;
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
      },
      weekList,
      streakDays: Math.max(streakDays, todayAnswered > 0 ? 1 : 0),
    };
  }
}
