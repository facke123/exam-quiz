import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
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

const fromDbType = (t?: string) => {
  if (!t) return 'single';
  if (t === 'single_choice') return 'single';
  if (t === 'multiple_choice') return 'multiple';
  if (t === 'true_false') return 'judge';
  if (t === 'case_analysis') return 'case';
  if (t === 'subjective') return 'essay';
  return t;
};

const toDbSource = (s?: string) => {
  if (['manual', 'excel', 'word', 'ai'].includes(s as string)) return s;
  return 'manual';
};

/**
 * 题库服务
 */
@Injectable()
export class QuestionService implements OnModuleInit {
  // 模拟导入记录
  private static importRecords: Array<{
    id: number;
    fileName: string;
    subjectName: string;
    type?: string;
    totalCount: number;
    successCount: number;
    failCount: number;
    status: string;
    creator: string;
    createdAt: string;
    errors?: Array<{ row: number; title?: string; error: string }>;
  }> = [
    {
      id: 1,
      fileName: '2025年系统集成真题精选.xlsx',
      subjectName: '系统集成项目管理工程师',
      type: 'excel',
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

  async onModuleInit() {
    const count = await this.questionRepository.count();
    if (count === 0) {
      await this.seedInitialQuestions();
    }
  }

  /**
   * 自动初始化内置精选试题
   */
  private async seedInitialQuestions() {
    const seeds = [
      {
        subjectId: 1,
        chapterId: 1,
        type: 'single_choice',
        difficulty: 2,
        content: '国家信息化体系六要素中，处于核心位置的是哪个要素？',
        options: [
          { key: 'A', label: 'A', content: '信息资源的开发利用' },
          { key: 'B', label: 'B', content: '信息网络' },
          { key: 'C', label: 'C', content: '信息技术应用' },
          { key: 'D', label: 'D', content: '信息化人才' },
        ],
        answer: 'A',
        analysis: '国家信息化体系包括信息资源、信息网络、信息技术应用、信息技术和产业、信息化人才、信息化法规政策和标准规范6个要素。其中，信息资源的开发利用是国家信息化体系的核心。',
        source: 'manual',
        status: 'published',
      },
      {
        subjectId: 1,
        chapterId: 2,
        type: 'single_choice',
        difficulty: 3,
        content: '在项目生命周期的哪个阶段，成本和人员投入水平通常达到最高？',
        options: [
          { key: 'A', label: 'A', content: '启动阶段' },
          { key: 'B', label: 'B', content: '组织与准备阶段' },
          { key: 'C', label: 'C', content: '执行阶段（开展工作）' },
          { key: 'D', label: 'D', content: '结束项目阶段' },
        ],
        answer: 'C',
        analysis: '项目生命周期中，成本和人员投入水平在启动阶段较低，在开展工作（执行阶段）达到最高，在项目收尾时迅速下降。',
        source: 'manual',
        status: 'published',
      },
      {
        subjectId: 1,
        chapterId: 3,
        type: 'multiple_choice',
        difficulty: 4,
        content: '根据PMBOK规范，项目范围管理的主要过程包括以下哪些？',
        options: [
          { key: 'A', label: 'A', content: '规划范围管理' },
          { key: 'B', label: 'B', content: '收集需求与定义范围' },
          { key: 'C', label: 'C', content: '创建WBS' },
          { key: 'D', label: 'D', content: '确认范围与控制范围' },
        ],
        answer: 'ABCD',
        analysis: '项目范围管理包括：规划范围管理、收集需求、定义范围、创建WBS、确认范围和控制范围6个过程。',
        source: 'manual',
        status: 'published',
      },
      {
        subjectId: 1,
        chapterId: 3,
        type: 'true_false',
        difficulty: 2,
        content: '关键路径是项目中时间最长的活动序列，其总时差通常为0。',
        options: [
          { key: 'A', label: 'A', content: '正确' },
          { key: 'B', label: 'B', content: '错误' },
        ],
        answer: 'A',
        analysis: '关键路径是项目网络图中决定项目总工期的最长活动序列，关键路径上活动的总时差通常为零或负数。',
        source: 'manual',
        status: 'published',
      },
      {
        subjectId: 1,
        chapterId: 2,
        type: 'single_choice',
        difficulty: 3,
        content: '制定项目章程过程的主要输出文件是？',
        options: [
          { key: 'A', label: 'A', content: '项目章程' },
          { key: 'B', label: 'B', content: '项目管理计划' },
          { key: 'C', label: 'C', content: '范围基准' },
          { key: 'D', label: 'D', content: '工作说明书(SOW)' },
        ],
        answer: 'A',
        analysis: '制定项目章程是编写一份正式批准项目并授权项目经理在项目活动中动用组织资源的文件。该过程的主要输出为项目章程和假设日志。',
        source: 'manual',
        status: 'published',
      },
      {
        subjectId: 2,
        chapterId: 1,
        type: 'case_analysis',
        difficulty: 5,
        content: '【案例分析】某大型系统集成企业中标智慧医疗云平台建设项目，合同总金额1500万元，工期18个月。在项目实施进行到第6个月时，发生重大需求变更...',
        options: [
          { key: 'A', label: 'A', content: '详见案例答题卡' },
        ],
        answer: '参考要点',
        analysis: '1. 项目经理未严格遵循变更控制流程（CCB评审）；2. 缺乏范围基准变更影响评估；3. 未及时更新进度与成本基准。',
        source: 'manual',
        status: 'published',
      },
      {
        subjectId: 3,
        chapterId: 1,
        type: 'single_choice',
        difficulty: 3,
        content: '在面向对象设计原则中，开闭原则（OCP）指的是什么？',
        options: [
          { key: 'A', label: 'A', content: '软件实体应对扩展开放，对修改关闭' },
          { key: 'B', label: 'B', content: '子类必须能够替换它们的基类' },
          { key: 'C', label: 'C', content: '高层模块不应该依赖低层模块' },
          { key: 'D', label: 'D', content: '一个类应该只有一个引起它变化的原因' },
        ],
        answer: 'A',
        analysis: '开闭原则（Open-Closed Principle, OCP）是面向对象设计的核心原则，指出软件实体（类、模块、函数等）应该对扩展开放，对修改关闭。',
        source: 'manual',
        status: 'published',
      },
      {
        subjectId: 4,
        chapterId: 1,
        type: 'single_choice',
        difficulty: 2,
        content: '在TCP/IP协议簇中，ARP协议的主要作用是？',
        options: [
          { key: 'A', label: 'A', content: '将IP地址解析为MAC硬件地址' },
          { key: 'B', label: 'B', content: '将MAC地址解析为IP地址' },
          { key: 'C', label: 'C', content: '将域名解析为IP地址' },
          { key: 'D', label: 'D', content: '提供端到端的可靠传输' },
        ],
        answer: 'A',
        analysis: 'ARP（Address Resolution Protocol，地址解析协议）用于根据IP地址获取对应的物理MAC硬件地址。',
        source: 'manual',
        status: 'published',
      },
    ];

    for (const s of seeds) {
      const q = this.questionRepository.create(s as any);
      await this.questionRepository.save(q);
    }
  }

  /**
   * 创建题目
   */
  async create(dto: CreateQuestionDto | any): Promise<Question> {
    const question = this.questionRepository.create({
      subjectId: dto.subjectId || 1,
      chapterId: dto.chapterId || 1,
      type: toDbType(dto.type) || 'single_choice',
      difficulty: dto.difficulty || 2,
      content: dto.content || dto.title || '',
      options: dto.options || [],
      answer: dto.answer || 'A',
      analysis: dto.analysis || '',
      aiAnalysis: dto.aiAnalysis || '',
      source: toDbSource(dto.source),
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
    if (dto.type) dto.type = toDbType(dto.type);
    if (dto.source) dto.source = toDbSource(dto.source);
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
      type: fromDbType(question.type),
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
      const dbType = toDbType(type);
      qb.andWhere('(q.type = :type OR q.type = :dbType)', { type, dbType });
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
        type: fromDbType(q.type),
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
    if (type) {
      const dbType = toDbType(type);
      qb.andWhere('(q.type = :type OR q.type = :dbType)', { type, dbType });
    }
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
        subjectName: subjectMap.get(Number(q.subjectId)) || '系统集成项目管理工程师',
        chapterId: Number(q.chapterId),
        chapterName: chapterMap.get(Number(q.chapterId)) || '第1章 信息化与发展',
        type: fromDbType(q.type),
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
    rightAnswer: string;
    analysis: string;
  }> {
    const question = await this.questionRepository.findOne({ where: { id: questionId } });
    if (!question) {
      throw new NotFoundException('题目不存在');
    }

    const formattedAnswer = Array.isArray(answer) ? answer.sort().join('') : String(answer).toUpperCase();
    const rightAnswer = String(question.answer).toUpperCase();
    const correct = formattedAnswer === rightAnswer;

    if (correct) {
      question.correctCount = (question.correctCount || 0) + 1;
    } else {
      question.wrongCount = (question.wrongCount || 0) + 1;
    }
    await this.questionRepository.save(question);

    return {
      correct,
      rightAnswer: question.answer,
      analysis: question.analysis || '',
    };
  }

  /**
   * 获取题目解析
   */
  async getAnalysis(id: number): Promise<{
    id: number;
    answer: string;
    analysis: string;
    aiAnalysis?: string;
  }> {
    const question = await this.questionRepository.findOne({ where: { id } });
    if (!question) {
      throw new NotFoundException('题目不存在');
    }
    return {
      id: Number(question.id),
      answer: question.answer,
      analysis: question.analysis || '',
      aiAnalysis:
        question.analysis ||
        '【AI深度名师解析】本题考察核心考点。解题关键在于准确记忆标准流程与知识点定义。',
    };
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
   * 批量导入题目
   */
  async batchImport(dto: ImportQuestionDto | any): Promise<{
    success: number;
    failed: number;
    errors: { row: number; error: string }[];
  }> {
    const questions = dto.questions || [];
    let success = 0;
    let failed = 0;
    const errors = [];

    const targetSubjectId = Number(dto.subjectId || 1);
    const subject = await this.subjectRepository.findOne({ where: { id: targetSubjectId } });
    const subjectName = subject ? subject.name : (dto.subjectName || '系统集成项目管理工程师');

    // 预先查询该科目下的所有章节，用于章节名称模糊匹配
    const existingChapters = await this.chapterRepository.find({
      where: { subjectId: targetSubjectId },
      order: { sort: 'ASC' },
    });

    let defaultChapterId = existingChapters.length > 0 ? Number(existingChapters[0].id) : 1;
    if (existingChapters.length === 0) {
      // 若该科目尚无章节，自动创建一个基础章节
      const newCh = this.chapterRepository.create({
        subjectId: targetSubjectId,
        name: '第1章 基础知识与考点',
        sort: 1,
        questionCount: 0,
      });
      const savedCh = await this.chapterRepository.save(newCh);
      defaultChapterId = Number(savedCh.id);
      existingChapters.push(savedCh);
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      try {
        const content = q.content || q.title;
        if (!content) throw new Error('题干不能为空');

        // 匹配章节ID
        let chapterId = q.chapterId ? Number(q.chapterId) : defaultChapterId;
        const rawChName = String(q.chapter || q.chapterName || '').trim();
        if (rawChName) {
          const matched = existingChapters.find(
            (c) =>
              c.name.includes(rawChName) ||
              rawChName.includes(c.name) ||
              c.name.replace(/\s+/g, '') === rawChName.replace(/\s+/g, '')
          );
          if (matched) {
            chapterId = Number(matched.id);
          }
        }

        const entity = this.questionRepository.create({
          subjectId: targetSubjectId,
          chapterId,
          type: toDbType(q.type) || 'single_choice',
          difficulty: Number(q.difficulty) || 3,
          content,
          options: q.options || [],
          answer: String(q.answer || 'A').trim().toUpperCase(),
          analysis: q.analysis || '',
          source: toDbSource(dto.type) || 'import',
          status: 'published',
        } as any);
        await this.questionRepository.save(entity as any);
        success++;
      } catch (err: any) {
        failed++;
        errors.push({
          row: i + 1,
          title: String(q.content || q.title || `第 ${i + 1} 题`).slice(0, 100),
          error: err.message || '格式校验不通过',
        });
      }
    }

    QuestionService.importRecords.unshift({
      id: Date.now(),
      fileName: dto.fileName || `批量导入批次_${Date.now()}`,
      subjectName,
      type: dto.type || 'excel',
      totalCount: questions.length,
      successCount: success,
      failCount: failed,
      status: failed === 0 ? 'success' : 'partial',
      creator: '超级管理员',
      createdAt: new Date().toISOString(),
      errors: errors || [],
    });

    return { success, failed, errors };
  }

  /**
   * 题目查重
   */
  async checkDuplicate(content: string, subjectId?: number): Promise<{
    duplicates: any[];
    isDuplicate: boolean;
    matches: any[];
  }> {
    if (!content) {
      return { duplicates: [], isDuplicate: false, matches: [] };
    }
    const qb = this.questionRepository.createQueryBuilder('q');
    if (subjectId) qb.andWhere('q.subjectId = :subjectId', { subjectId });
    qb.andWhere('q.content LIKE :kw', { kw: `%${content.slice(0, 20)}%` });
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
