import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions, In } from 'typeorm';
import { Question } from '@/database/entities/question.entity';
import { KnowledgePoint } from '@/database/entities/knowledge-point.entity';
import { ErrorReport } from '@/database/entities/error-report.entity';
import { Subject } from '@/database/entities/subject.entity';
import { Chapter } from '@/database/entities/chapter.entity';
import { User } from '@/database/entities/user.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionDto } from './dto/query-question.dto';
import { ImportQuestionDto } from './dto/import-question.dto';

/**
 * 题库服务
 */
@Injectable()
export class QuestionService {
  // 模拟导入记录
  private static importRecords = [
    {
      id: 1,
      fileName: '2025年软件设计师试题.xlsx',
      subjectName: '软件设计师',
      totalCount: 75,
      successCount: 75,
      failCount: 0,
      status: 'success',
      creator: '超级管理员',
      createdAt: new Date().toISOString(),
    },
  ];

  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(KnowledgePoint)
    private readonly knowledgePointRepository: Repository<KnowledgePoint>,
    @InjectRepository(ErrorReport)
    private readonly errorReportRepository: Repository<ErrorReport>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 创建题目
   */
  async create(dto: CreateQuestionDto | any): Promise<Question> {
    const question = this.questionRepository.create({
      subjectId: dto.subjectId || 1,
      chapterId: dto.chapterId || 1,
      type: dto.type || 'single',
      difficulty: dto.difficulty || 2,
      content: dto.content || dto.title || '',
      options: dto.options || [],
      answer: dto.answer || 'A',
      analysis: dto.analysis || '',
      aiAnalysis: dto.aiAnalysis || '',
      source: dto.source || 'manual',
      status: dto.status || 'published',
    } as any);
    return this.questionRepository.save(question as any);
  }

  /**
   * 更新题目
   */
  async update(id: number, dto: UpdateQuestionDto | any): Promise<Question> {
    const question = await this.questionRepository.findOne({ where: { id } });
    if (!question) {
      throw new NotFoundException('题目不存在');
    }
    Object.assign(question, dto);
    if (dto.title && !dto.content) {
      question.content = dto.title;
    }
    return this.questionRepository.save(question);
  }

  /**
   * 删除题目
   */
  async remove(id: number): Promise<void> {
    const result = await this.questionRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('题目不存在');
    }
  }

  /**
   * 批量删除题目
   */
  async batchDelete(ids: number[]): Promise<void> {
    if (ids && ids.length > 0) {
      await this.questionRepository.delete(ids);
    }
  }

  /**
   * 获取题目详情
   */
  async findOne(id: number): Promise<any> {
    const question = await this.questionRepository.findOne({ where: { id } });
    if (!question) {
      throw new NotFoundException('题目不存在');
    }
    const subject = await this.subjectRepository.findOne({ where: { id: question.subjectId } });
    const chapter = await this.chapterRepository.findOne({ where: { id: question.chapterId } });
    return {
      ...question,
      id: Number(question.id),
      title: question.content,
      subjectName: subject ? subject.name : '',
      chapterName: chapter ? chapter.name : '',
    };
  }

  /**
   * 分页查询题目（前台）
   */
  async findList(dto: any): Promise<any> {
    const { page = 1, pageSize = 20, count, subjectId, chapterId, type, mode, keyword } = dto;
    const qb = this.questionRepository.createQueryBuilder('q').where('q.status = :status', { status: 'published' });

    if (subjectId) {
      let subId: number | null = null;
      if (!isNaN(Number(subjectId))) {
        subId = Number(subjectId);
      } else {
        const found = await this.subjectRepository
          .createQueryBuilder('s')
          .where('s.code = :str OR s.name = :str OR s.code LIKE :like OR s.name LIKE :like', {
            str: String(subjectId),
            like: `%${subjectId}%`,
          })
          .getOne();
        if (found) subId = Number(found.id);
      }
      if (subId) {
        qb.andWhere('q.subjectId = :subjectId', { subjectId: subId });
      }
    }
    if (chapterId) {
      qb.andWhere('q.chapterId = :chapterId', { chapterId });
    }
    if (type) {
      qb.andWhere('q.type = :type', { type });
    }
    if (keyword) {
      qb.andWhere('q.content LIKE :kw', { kw: `%${keyword}%` });
    }

    if (mode === 'random') {
      qb.orderBy('RAND()');
    } else {
      qb.orderBy('q.id', 'ASC');
    }

    const takeCount = count ? Number(count) : Number(pageSize);
    qb.skip((page - 1) * takeCount).take(takeCount);

    const [list, total] = await qb.getManyAndCount();

    const formatted = list.map((q) => {
      let options = q.options;
      if (typeof options === 'string') {
        try {
          options = JSON.parse(options);
        } catch {
          options = [];
        }
      }
      const formattedOptions = Array.isArray(options)
        ? options.map((opt: any, idx: number) => {
            if (typeof opt === 'string') {
              const label = String.fromCharCode(65 + idx);
              return { key: label, label, content: opt };
            }
            return {
              key: opt.key || opt.label || String.fromCharCode(65 + idx),
              label: opt.label || opt.key || String.fromCharCode(65 + idx),
              content: opt.content || '',
            };
          })
        : [];

      return {
        id: String(q.id),
        type: q.type,
        title: q.content,
        options: formattedOptions,
        analysis: q.analysis || '',
        answer: q.answer,
        knowledgePoint: '软件工程基础',
        difficulty: q.difficulty || 2,
        score: 1,
        hasFormula: q.content.includes('$') || q.content.includes('\\'),
        isFavorited: false,
      };
    });

    return formatted;
  }

  /**
   * 分页查询题目（后台）
   */
  async findAdminList(dto: any): Promise<{
    list: any[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { page = 1, pageSize = 10, keyword, subjectId, chapterId, type, difficulty, status, source } = dto;
    const qb = this.questionRepository.createQueryBuilder('q');

    if (subjectId) qb.andWhere('q.subjectId = :subjectId', { subjectId });
    if (chapterId) qb.andWhere('q.chapterId = :chapterId', { chapterId });
    if (type) qb.andWhere('q.type = :type', { type });
    if (difficulty) qb.andWhere('q.difficulty = :difficulty', { difficulty });
    if (status) qb.andWhere('q.status = :status', { status });
    if (source) qb.andWhere('q.source = :source', { source });
    if (keyword) qb.andWhere('q.content LIKE :kw', { kw: `%${keyword}%` });

    qb.skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('q.createdAt', 'DESC');

    const [list, total] = await qb.getManyAndCount();

    const subjects = await this.subjectRepository.find();
    const chapters = await this.chapterRepository.find();
    const subjectMap = new Map(subjects.map((s) => [Number(s.id), s.name]));
    const chapterMap = new Map(chapters.map((c) => [Number(c.id), c.name]));

    const diffMap: Record<number, string> = { 1: 'easy', 2: 'medium', 3: 'hard', 4: 'hard', 5: 'hard' };

    const formattedList = list.map((q) => {
      let options = q.options;
      if (typeof options === 'string') {
        try {
          options = JSON.parse(options);
        } catch {
          options = [];
        }
      }
      return {
        id: Number(q.id),
        subjectId: Number(q.subjectId),
        subjectName: subjectMap.get(Number(q.subjectId)) || '软考科目',
        chapterId: Number(q.chapterId),
        chapterName: chapterMap.get(Number(q.chapterId)) || '基础章节',
        type: q.type,
        difficulty: typeof q.difficulty === 'number' ? diffMap[q.difficulty] || 'medium' : q.difficulty,
        title: q.content,
        content: q.content,
        options: options || [],
        answer: q.answer,
        analysis: q.analysis || '',
        correctRate: 75,
        source: q.source || 'manual',
        status: q.status || 'published',
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      };
    });

    return { list: formattedList, total, page, pageSize };
  }

  /**
   * 提交单题答案
   */
  async submitAnswer(questionId: number, answer: string | string[]): Promise<{
    correct: boolean;
    correctAnswer: string | string[];
  }> {
    const question = await this.questionRepository.findOne({ where: { id: questionId } });
    if (!question) {
      throw new NotFoundException('题目不存在');
    }
    const userAns = Array.isArray(answer) ? answer.sort().join('') : String(answer).trim();
    const correctAns = question.answer.trim();
    const isCorrect = userAns.toUpperCase() === correctAns.toUpperCase();
    return {
      correct: isCorrect,
      correctAnswer: question.answer,
    };
  }

  /**
   * 获取解析
   */
  async getAnalysis(id: number): Promise<any> {
    const question = await this.findOne(id);
    return {
      question,
      correctAnswer: question.answer,
      analysis: question.analysis || '暂无详细解析',
      aiAnalysis: question.aiAnalysis || 'AI 解析：本题考察核心考点，请结合软考大纲重点理解。',
      knowledgePoints: ['软件工程基础', '系统设计'],
      myAnswer: question.answer,
    };
  }

  /**
   * 批量导入题目
   */
  async batchImport(dto: ImportQuestionDto | any): Promise<{
    success: number;
    failed: number;
  }> {
    let success = 0;
    let failed = 0;
    const questions = dto.questions || [];
    for (const item of questions) {
      try {
        const question = this.questionRepository.create({
          subjectId: item.subjectId || 1,
          chapterId: item.chapterId || 1,
          type: item.type || 'single',
          difficulty: item.difficulty || 2,
          content: item.content || item.title || '',
          options: item.options || [],
          answer: item.answer || 'A',
          analysis: item.analysis || '',
          source: dto.source || 'import',
          status: 'draft',
        } as any);
        await this.questionRepository.save(question as any);
        success++;
      } catch (_error) {
        failed++;
      }
    }
    if (questions.length > 0) {
      QuestionService.importRecords.unshift({
        id: Date.now(),
        fileName: '批量导入试题.xlsx',
        subjectName: '软件设计师',
        totalCount: questions.length,
        successCount: success,
        failCount: failed,
        status: failed === 0 ? 'success' : 'partial',
        creator: '超级管理员',
        createdAt: new Date().toISOString(),
      });
    }
    return { success, failed };
  }

  /**
   * 批量更新题目状态
   */
  async batchUpdateStatus(ids: number[], status: string): Promise<void> {
    if (ids && ids.length > 0) {
      await this.questionRepository.update(ids, { status });
    }
  }

  /**
   * 题目查重
   */
  async checkDuplicate(content: string, subjectId?: number): Promise<{
    duplicates: Question[];
    isDuplicate: boolean;
    matches: Question[];
  }> {
    const qb = this.questionRepository.createQueryBuilder('q');
    if (subjectId) qb.andWhere('q.subjectId = :subjectId', { subjectId });
    qb.andWhere('q.content LIKE :kw', { kw: `%${content.slice(0, 30)}%` });
    const matches = await qb.take(5).getMany();

    return {
      duplicates: matches,
      isDuplicate: matches.length > 0,
      matches,
    };
  }

  /**
   * 获取导入记录
   */
  async getImportRecords(page: number = 1, pageSize: number = 10): Promise<any> {
    return {
      list: QuestionService.importRecords,
      total: QuestionService.importRecords.length,
    };
  }

  // ==================== 纠错反馈 ====================

  /**
   * 提交纠错反馈
   */
  async createErrorReport(
    userId: number,
    dto: { questionId?: number; type?: string; content?: string; description?: string },
  ): Promise<ErrorReport> {
    const report = this.errorReportRepository.create({
      userId,
      questionId: dto.questionId || 1,
      type: dto.type || 'content',
      description: dto.content || dto.description || '',
      status: 'pending',
    });
    return this.errorReportRepository.save(report);
  }

  /**
   * 获取纠错列表（后台）
   */
  async getErrorReportList(
    page: number = 1,
    pageSize: number = 10,
    status?: string,
    keyword?: string,
  ): Promise<{ list: any[]; total: number }> {
    const qb = this.errorReportRepository.createQueryBuilder('er');
    if (status) qb.andWhere('er.status = :status', { status });

    qb.skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('er.createdAt', 'DESC');

    const [list, total] = await qb.getManyAndCount();

    const questions = await this.questionRepository.find();
    const qMap = new Map(questions.map((q) => [Number(q.id), q.content]));
    const users = await this.userRepository.find();
    const uMap = new Map(users.map((u) => [Number(u.id), u.username]));

    const formatted = list.map((r) => ({
      id: Number(r.id),
      questionId: Number(r.questionId),
      questionTitle: qMap.get(Number(r.questionId)) || '题目详情',
      userId: Number(r.userId),
      username: uMap.get(Number(r.userId)) || `用户_${r.userId}`,
      content: r.description,
      description: r.description,
      status: r.status,
      reply: r.adminReply || '',
      createdAt: r.createdAt,
    }));

    return { list: formatted, total };
  }

  /**
   * 处理纠错反馈（后台）
   */
  async handleErrorReport(
    id: number,
    data: { status: string; reply?: string },
  ): Promise<void> {
    const report = await this.errorReportRepository.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException('纠错记录不存在');
    }
    report.status = data.status;
    if (data.reply) report.adminReply = data.reply;
    await this.errorReportRepository.save(report);
  }
}
