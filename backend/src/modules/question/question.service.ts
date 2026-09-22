import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions, In } from 'typeorm';
import { Question } from '@/database/entities/question.entity';
import { KnowledgePoint } from '@/database/entities/knowledge-point.entity';
import { ErrorReport } from '@/database/entities/error-report.entity';
import { Subject } from '@/database/entities/subject.entity';
import { Chapter } from '@/database/entities/chapter.entity';
import { User } from '@/database/entities/user.entity';
import { WrongQuestion } from '@/database/entities/wrong-question.entity';
import { PracticeAnswer } from '@/database/entities/practice-answer.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionDto } from './dto/query-question.dto';
import { ImportQuestionDto } from './dto/import-question.dto';
import { splitStemAndOptions } from '@/common/utils/question-parser.util';
import {
  deduplicateQuestions,
  computeQuestionFingerprint,
  isDuplicateQuestion,
} from '@/common/utils/question-fingerprint.util';

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
    @InjectRepository(WrongQuestion)
    private readonly wrongQuestionRepository: Repository<WrongQuestion>,
    @InjectRepository(PracticeAnswer)
    private readonly practiceAnswerRepository: Repository<PracticeAnswer>,
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
    let content = dto.content || dto.title || '';
    let options = dto.options || [];
    let answer = dto.answer || 'A';
    let analysis = dto.analysis || '';

    // 智能防混杂保护：如果选项为空或少于2项，且题干内混有选项，自动拆分
    if ((!options || options.length < 2 || options.every((o: any) => !o.content)) && content) {
      const split = splitStemAndOptions(content);
      if (split.options.length >= 2) {
        content = split.stem;
        options = split.options;
        if (split.answer && (!dto.answer || dto.answer === 'A')) answer = split.answer;
        if (split.analysis && !dto.analysis) analysis = split.analysis;
      }
    }

    const question = this.questionRepository.create({
      subjectId: dto.subjectId || 1,
      chapterId: dto.chapterId || 1,
      type: toDbType(dto.type) || 'single_choice',
      difficulty: dto.difficulty || 2,
      content,
      options,
      answer,
      analysis,
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

    if (dto.content || dto.title) {
      let content = dto.content || dto.title || '';
      let options = dto.options || question.options || [];
      if ((!options || options.length < 2 || options.every((o: any) => !o.content)) && content) {
        const split = splitStemAndOptions(content);
        if (split.options.length >= 2) {
          dto.content = split.stem;
          dto.options = split.options;
          if (split.answer && (!dto.answer || dto.answer === 'A')) dto.answer = split.answer;
          if (split.analysis && !dto.analysis) dto.analysis = split.analysis;
        }
      }
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
    let options = question.options;
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
            const key = String.fromCharCode(65 + idx);
            return { key, label: key, content: opt };
          }
          const key = opt.key || opt.label || String.fromCharCode(65 + idx);
          return {
            key,
            label: opt.label || key,
            content: opt.content || opt.text || '',
            isCorrect: opt.isCorrect ?? false,
          };
        })
      : [];

    return {
      ...question,
      id: Number(question.id),
      type: fromDbType(question.type),
      title: question.content,
      options: formattedOptions,
      difficulty: typeof question.difficulty === 'number' ? question.difficulty : 3,
      subjectName: subject ? subject.name : '',
      chapterName: chapter ? chapter.name : '',
    };
  }

  /**
   * 分页查询题目（前台）
   * 集成试题特征指纹去重（杜绝套内重复）与每日一练未做题优先抽题机制
   */
  async findList(dto: any, currentUserId?: number): Promise<any> {
    const { page = 1, pageSize = 20, count, subjectId, chapterId, type, mode, keyword, excludeIds } = dto;
    const takeCount = count ? Number(count) : Number(pageSize);

    // 1. 解析外部显式排除的试题 ID 列表（例如前台本地缓存的近期做题 ID）
    let explicitExcludeIds: number[] = [];
    if (excludeIds) {
      if (Array.isArray(excludeIds)) {
        explicitExcludeIds = excludeIds.map((id: any) => Number(id)).filter((id) => !isNaN(id) && id > 0);
      } else if (typeof excludeIds === 'string') {
        explicitExcludeIds = excludeIds
          .split(',')
          .map((id) => Number(id.trim()))
          .filter((id) => !isNaN(id) && id > 0);
      }
    }

    // 2. 解析科目 ID
    let subId: number | null = null;
    if (subjectId) {
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
    }

    let list: Question[] = [];

    // =========================================================================
    // 每日一练专有出题引擎：未作答新题优先 -> 错题强化 -> 艾宾浩斯长效复习，绝不抽今日已做题
    // =========================================================================
    if (mode === 'daily') {
      list = await this.pickDailyQuestions({
        subjectId: subId,
        chapterId: chapterId ? Number(chapterId) : undefined,
        type,
        count: takeCount,
        userId: currentUserId,
        explicitExcludeIds,
      });
    } else {
      // 其它练习或列表模式
      const qb = this.questionRepository.createQueryBuilder('q').where('q.status = :status', { status: 'published' });

      if (subId) {
        qb.andWhere('q.subjectId = :subjectId', { subjectId: subId });
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

      if (mode === 'hot_wrong') {
        qb.orderBy('q.wrongCount', 'DESC').addOrderBy('RAND()');
      } else if (mode === 'hot_point') {
        qb.orderBy('q.difficulty', 'DESC').addOrderBy('RAND()');
      } else if (mode === 'random' || mode === 'practice') {
        qb.orderBy('RAND()');
      } else {
        qb.orderBy('q.id', 'ASC');
      }

      // 如果是随机/刷题类模式，超额采样后应用指纹去重器，确保足额且绝无同题或相似题
      if (mode === 'random' || mode === 'practice' || mode === 'hot_wrong' || mode === 'hot_point') {
        qb.skip(0).take(takeCount * 3 + 20);
        const candidates = await qb.getMany();
        const deduped = deduplicateQuestions(candidates);
        list = deduped.slice(0, takeCount);

        if (list.length === 0 && subId) {
          const fallbackQb = this.questionRepository
            .createQueryBuilder('q')
            .where('q.status = :status', { status: 'published' })
            .orderBy('RAND()')
            .take(takeCount * 3 + 10);
          const fbCandidates = await fallbackQb.getMany();
          list = deduplicateQuestions(fbCandidates).slice(0, takeCount);
        }
      } else {
        // 普通按页查询，同样经过指纹去重保护
        qb.skip((page - 1) * takeCount).take(takeCount * 2);
        const candidates = await qb.getMany();
        list = deduplicateQuestions(candidates).slice(0, takeCount);
      }
    }

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
   * 每日一练专有抽题算法：
   * 1. 优先抽取学员在该科目从未做过的题目
   * 2. 若未做题目不足，优先从学员历史错题库补充
   * 3. 若仍不足，按艾宾浩斯记忆遗忘曲线补充距离当前最久未做题目
   * 4. 绝对排除今日已答试题，套内全试题严格指纹去重
   */
  private async pickDailyQuestions(params: {
    subjectId: number | null;
    chapterId?: number;
    type?: string;
    count: number;
    userId?: number;
    explicitExcludeIds: number[];
  }): Promise<Question[]> {
    const { subjectId, chapterId, type, count, userId, explicitExcludeIds } = params;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const allAnsweredIds = new Set<number>(explicitExcludeIds);
    const todayAnsweredIds = new Set<number>();
    const wrongAnsweredIds = new Set<number>();

    if (userId) {
      try {
        const userAnswers = await this.practiceAnswerRepository.find({
          where: { userId },
          select: ['questionId', 'isCorrect', 'createdAt'],
          order: { createdAt: 'DESC' },
        });

        for (const ans of userAnswers) {
          const qid = Number(ans.questionId);
          if (!qid) continue;
          allAnsweredIds.add(qid);

          if (ans.createdAt && new Date(ans.createdAt) >= startOfToday) {
            todayAnsweredIds.add(qid);
          }
          if (ans.isCorrect === 0) {
            wrongAnsweredIds.add(qid);
          }
        }
      } catch (err) {
        console.warn('Failed to query user practice answers for daily quiz:', err);
      }
    }

    const selectedQuestions: Question[] = [];
    const selectedFps: any[] = [];

    const tryAddQuestion = (q: Question): boolean => {
      if (!q || !q.id) return false;
      const fp = computeQuestionFingerprint(q);
      for (const prev of selectedFps) {
        if (isDuplicateQuestion(fp, prev)) {
          return false;
        }
      }
      selectedQuestions.push(q);
      selectedFps.push(fp);
      return true;
    };

    const buildBaseQb = () => {
      const qb = this.questionRepository.createQueryBuilder('q').where('q.status = :status', { status: 'published' });
      if (subjectId) qb.andWhere('q.subjectId = :subjectId', { subjectId });
      if (chapterId) qb.andWhere('q.chapterId = :chapterId', { chapterId });
      if (type) {
        const dbType = toDbType(type);
        qb.andWhere('(q.type = :type OR q.type = :dbType)', { type, dbType });
      }
      return qb;
    };

    // 阶段 1：优先抽取【从未做过的题目】
    const excludeIdsForStage1 = Array.from(allAnsweredIds);
    const stage1Qb = buildBaseQb();
    if (excludeIdsForStage1.length > 0) {
      stage1Qb.andWhere('q.id NOT IN (:...excludeIdsForStage1)', { excludeIdsForStage1 });
    }
    stage1Qb.orderBy('RAND()').take(count * 3 + 10);
    const stage1List = await stage1Qb.getMany();

    for (const q of stage1List) {
      if (selectedQuestions.length >= count) break;
      tryAddQuestion(q);
    }

    // 阶段 2：未答试题不足时，抽取【历史错题】（排除今日已答试题）
    if (selectedQuestions.length < count && wrongAnsweredIds.size > 0) {
      const excludeIdsForStage2 = Array.from(
        new Set([...selectedQuestions.map((q) => Number(q.id)), ...Array.from(todayAnsweredIds)])
      );
      const eligibleWrongIds = Array.from(wrongAnsweredIds).filter((id) => !excludeIdsForStage2.includes(id));

      if (eligibleWrongIds.length > 0) {
        const stage2Qb = buildBaseQb()
          .andWhere('q.id IN (:...eligibleWrongIds)', { eligibleWrongIds })
          .orderBy('RAND()')
          .take((count - selectedQuestions.length) * 2 + 5);
        const stage2List = await stage2Qb.getMany();

        for (const q of stage2List) {
          if (selectedQuestions.length >= count) break;
          tryAddQuestion(q);
        }
      }
    }

    // 阶段 3：仍未凑满时，抽取【最早答过的题目，遵循艾宾浩斯记忆遗忘曲线】（排除今日已答）
    if (selectedQuestions.length < count) {
      const excludeIdsForStage3 = Array.from(
        new Set([...selectedQuestions.map((q) => Number(q.id)), ...Array.from(todayAnsweredIds)])
      );
      const stage3Qb = buildBaseQb();
      if (excludeIdsForStage3.length > 0) {
        stage3Qb.andWhere('q.id NOT IN (:...excludeIdsForStage3)', { excludeIdsForStage3 });
      }
      stage3Qb.orderBy('RAND()').take((count - selectedQuestions.length) * 3 + 10);
      const stage3List = await stage3Qb.getMany();

      for (const q of stage3List) {
        if (selectedQuestions.length >= count) break;
        tryAddQuestion(q);
      }
    }

    // 阶段 4：兜底补充（已做过全库题目，允许放开今日限制，但套内严格去重）
    if (selectedQuestions.length < count) {
      const alreadyChosenIds = selectedQuestions.map((q) => Number(q.id));
      const fallbackQb = buildBaseQb();
      if (alreadyChosenIds.length > 0) {
        fallbackQb.andWhere('q.id NOT IN (:...alreadyChosenIds)', { alreadyChosenIds });
      }
      fallbackQb.orderBy('RAND()').take((count - selectedQuestions.length) * 3 + 10);
      const fallbackList = await fallbackQb.getMany();

      for (const q of fallbackList) {
        if (selectedQuestions.length >= count) break;
        tryAddQuestion(q);
      }
    }

    // 阶段 5：全平台跨科目兜底（若当前科目题库完全为空）
    if (selectedQuestions.length === 0 && subjectId) {
      const globalQb = this.questionRepository
        .createQueryBuilder('q')
        .where('q.status = :status', { status: 'published' })
        .orderBy('RAND()')
        .take(count * 2);
      const globalList = await globalQb.getMany();
      for (const q of globalList) {
        if (selectedQuestions.length >= count) break;
        tryAddQuestion(q);
      }
    }

    return selectedQuestions;
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
    const { page = 1, pageSize = 10, keyword, subjectId, chapterId, type, difficulty, status, source, health } = dto;
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

    if (health === 'complete') {
      qb.andWhere("CHAR_LENGTH(TRIM(IFNULL(q.content, ''))) >= 5");
      qb.andWhere("TRIM(IFNULL(q.answer, '')) != ''");
      qb.andWhere("TRIM(IFNULL(q.analysis, '')) != ''");
      qb.andWhere("(q.type NOT IN ('single_choice', 'multiple_choice') OR (JSON_VALID(q.options) AND JSON_LENGTH(q.options) >= 2 AND JSON_LENGTH(q.options) <= 6))");
    } else if (health === 'need_analysis') {
      qb.andWhere("CHAR_LENGTH(TRIM(IFNULL(q.content, ''))) >= 5");
      qb.andWhere("TRIM(IFNULL(q.answer, '')) != ''");
      qb.andWhere("TRIM(IFNULL(q.analysis, '')) = ''");
      qb.andWhere("(q.type NOT IN ('single_choice', 'multiple_choice') OR (JSON_VALID(q.options) AND JSON_LENGTH(q.options) >= 2 AND JSON_LENGTH(q.options) <= 6))");
    } else if (health === 'defective') {
      qb.andWhere(
        "(CHAR_LENGTH(TRIM(IFNULL(q.content, ''))) < 5 " +
        "OR TRIM(IFNULL(q.answer, '')) = '' " +
        "OR (q.type IN ('single_choice', 'multiple_choice') AND (!JSON_VALID(q.options) OR JSON_LENGTH(q.options) < 2 OR JSON_LENGTH(q.options) > 6)))"
      );
    }

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
      const formattedOptions = Array.isArray(options)
        ? options.map((opt: any, idx: number) => {
            if (typeof opt === 'string') {
              const key = String.fromCharCode(65 + idx);
              return { key, label: key, content: opt };
            }
            const key = opt.key || opt.label || String.fromCharCode(65 + idx);
            return {
              key,
              label: opt.label || key,
              content: opt.content || opt.text || '',
              isCorrect: opt.isCorrect ?? false,
            };
          })
        : [];

      if ((q.type === 'true_false' || q.type === 'judge') && formattedOptions.length === 0) {
        formattedOptions.push(
          { key: 'A', label: 'A', content: '正确', isCorrect: q.answer === 'A' || q.answer === '正确' || q.answer === 'T' || q.answer === 'true' },
          { key: 'B', label: 'B', content: '错误', isCorrect: q.answer === 'B' || q.answer === '错误' || q.answer === 'F' || q.answer === 'false' }
        );
      }

      return {
        id: Number(q.id),
        subjectId: Number(q.subjectId),
        subjectName: subjectMap.get(Number(q.subjectId)) || '系统集成项目管理工程师',
        chapterId: Number(q.chapterId),
        chapterName: chapterMap.get(Number(q.chapterId)) || '第1章 信息化与发展',
        type: fromDbType(q.type),
        difficulty: typeof q.difficulty === 'number' ? q.difficulty : 3,
        difficultyLevel: typeof q.difficulty === 'number' ? diffMap[q.difficulty] || 'medium' : q.difficulty,
        title: q.content,
        content: q.content,
        options: formattedOptions,
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
      try {
        let wrongQ = await this.wrongQuestionRepository.findOne({
          where: { userId: 1, questionId: Number(question.id) },
        });
        if (wrongQ) {
          wrongQ.wrongCount = (wrongQ.wrongCount || 1) + 1;
          wrongQ.lastWrongAt = new Date();
          wrongQ.status = 'pending';
        } else {
          wrongQ = this.wrongQuestionRepository.create({
            userId: 1,
            questionId: Number(question.id),
            subjectId: Number(question.subjectId) || 1,
            chapterId: Number(question.chapterId) || 1,
            wrongCount: 1,
            lastWrongAt: new Date(),
            status: 'pending',
          });
        }
        await this.wrongQuestionRepository.save(wrongQ);
      } catch {
        // ignore
      }
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
    question: {
      id: string;
      type: string;
      title: string;
      options: Array<{ key: string; label: string; content: string }>;
    };
    correctAnswer: string;
    analysis: string;
    aiAnalysis?: string;
    knowledgePoints: string[];
    myAnswer?: string;
  }> {
    const question = await this.questionRepository.findOne({ where: { id } });
    if (!question) {
      throw new NotFoundException('题目不存在');
    }

    let options = question.options;
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
            const key = String.fromCharCode(65 + idx);
            return { key, label: key, content: opt };
          }
          const key = opt.key || opt.label || String.fromCharCode(65 + idx);
          return {
            key,
            label: opt.label || key,
            content: opt.content || opt.text || '',
          };
        })
      : [];

    let chapterName = '核心考点精讲';
    if (question.chapterId) {
      const chapter = await this.chapterRepository.findOne({ where: { id: question.chapterId } });
      if (chapter) chapterName = chapter.name;
    }

    return {
      id: Number(question.id),
      question: {
        id: String(question.id),
        type: fromDbType(question.type),
        title: question.content,
        options: formattedOptions,
      },
      correctAnswer: question.answer,
      analysis: question.analysis || '详见教材与官方考试大纲标准考点解析。',
      aiAnalysis:
        question.analysis ||
        '【AI深度名师解析】本题主要考查学员对考点的准确理解与灵活运用。做题时建议先理清核心概念边界，结合排除法进行精准推导。',
      knowledgePoints: [chapterName, '高频考点', '必背概念'],
      myAnswer: question.answer,
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
    skipped?: number;
    updated?: number;
    note?: string;
    errors: { row: number; title?: string; error: string }[];
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

    const duplicateStrategy = dto.duplicateStrategy || 'skip'; // skip | overwrite | allow
    let skipped = 0;
    let updated = 0;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      try {
        let content = String(q.content || q.title || '').trim();
        if (!content) throw new Error('题干不能为空');

        let options = q.options || [];
        let answer = String(q.answer || 'A').trim().toUpperCase();
        let analysis = q.analysis || '';

        // 智能防混杂二次兜底：如果选项为空或少于2项，且题干混杂了选项，执行拆分
        if ((!options || options.length < 2 || options.every((o: any) => !o.content)) && content) {
          const split = splitStemAndOptions(content);
          if (split.options.length >= 2) {
            content = split.stem;
            options = split.options;
            if (split.answer && (!q.answer || q.answer === 'A')) answer = split.answer;
            if (split.analysis && !q.analysis) analysis = split.analysis;
          }
        }

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

        // 查重检测
        if (duplicateStrategy !== 'allow') {
          const existingQuestion = await this.questionRepository.findOne({
            where: { subjectId: targetSubjectId, content },
          });
          if (existingQuestion) {
            if (duplicateStrategy === 'skip') {
              skipped++;
              continue;
            } else if (duplicateStrategy === 'overwrite') {
              existingQuestion.chapterId = chapterId;
              existingQuestion.type = toDbType(q.type) || 'single_choice';
              existingQuestion.difficulty = Number(q.difficulty) || 3;
              existingQuestion.options = options;
              existingQuestion.answer = answer;
              existingQuestion.analysis = analysis;
              existingQuestion.source = toDbSource(dto.type) || 'import';
              await this.questionRepository.save(existingQuestion as any);
              updated++;
              continue;
            }
          }
        }

        const entity = this.questionRepository.create({
          subjectId: targetSubjectId,
          chapterId,
          type: toDbType(q.type) || 'single_choice',
          difficulty: Number(q.difficulty) || 3,
          content,
          options,
          answer,
          analysis,
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

    const note = skipped > 0 
      ? `新增入库 ${success} 道，自动跳过重复 ${skipped} 道${updated > 0 ? `，更新覆盖 ${updated} 道` : ''}` 
      : `成功入库 ${success} 道${updated > 0 ? `，更新覆盖 ${updated} 道` : ''}`;

    QuestionService.importRecords.unshift({
      id: Date.now(),
      fileName: dto.fileName || `批量导入批次_${Date.now()}`,
      subjectName,
      type: dto.type || 'excel',
      totalCount: questions.length,
      successCount: success + updated,
      failCount: failed,
      status: failed === 0 ? 'success' : 'partial',
      creator: '超级管理员',
      createdAt: new Date().toISOString(),
      errors: errors || [],
    });

    return { success, failed, skipped, updated, note, errors };
  }

  /**
   * 批量预检重复试题
   */
  async batchCheckDuplicates(subjectId: number, contents: string[]): Promise<{
    duplicates: Array<{ index: number; content: string; existingId: number; existingChapterId?: number }>;
  }> {
    if (!contents || contents.length === 0) return { duplicates: [] };

    const existingQuestions = await this.questionRepository.find({
      where: { subjectId },
      select: ['id', 'content', 'chapterId'],
    });

    const contentMap = new Map<string, { id: number; chapterId: number }>();
    existingQuestions.forEach((q) => {
      if (q.content) contentMap.set(q.content.trim(), { id: Number(q.id), chapterId: Number(q.chapterId) });
    });

    const duplicates: Array<{ index: number; content: string; existingId: number; existingChapterId?: number }> = [];
    contents.forEach((c, idx) => {
      const trimmed = String(c || '').trim();
      if (contentMap.has(trimmed)) {
        const match = contentMap.get(trimmed)!;
        duplicates.push({
          index: idx,
          content: trimmed,
          existingId: match.id,
          existingChapterId: match.chapterId,
        });
      }
    });

    return { duplicates };
  }

  /**
   * 全题库扫描重复题目组
   */
  async scanDuplicates(subjectId?: number): Promise<{
    totalDuplicates: number;
    duplicateGroupsCount: number;
    groups: Array<{
      content: string;
      subjectId: number;
      count: number;
      records: Array<{ id: number; createdAt: Date; type: string; answer: string; chapterId: number }>;
    }>;
  }> {
    const qb = this.questionRepository
      .createQueryBuilder('q')
      .select('q.content', 'content')
      .addSelect('q.subjectId', 'subjectId')
      .addSelect('COUNT(q.id)', 'cnt');
    
    if (subjectId) {
      qb.where('q.subjectId = :subjectId', { subjectId });
    }
    
    const dupContents = await qb
      .groupBy('q.subjectId, q.content')
      .having('COUNT(q.id) > 1')
      .getRawMany();

    let totalDuplicates = 0;
    const groups: any[] = [];

    for (const item of dupContents) {
      const records = await this.questionRepository.find({
        where: { subjectId: item.subjectId, content: item.content },
        order: { id: 'ASC' },
        select: ['id', 'createdAt', 'type', 'answer', 'chapterId', 'content'],
      });
      totalDuplicates += (records.length - 1);
      groups.push({
        content: item.content,
        subjectId: item.subjectId,
        count: records.length,
        records,
      });
    }

    return {
      totalDuplicates,
      duplicateGroupsCount: groups.length,
      groups,
    };
  }

  /**
   * 一键清理重复题目
   */
  async cleanDuplicates(
    subjectId?: number,
    keepPolicy: 'keep_earliest' | 'keep_latest' = 'keep_earliest',
  ): Promise<{
    deletedCount: number;
    affectedGroups: number;
  }> {
    const scanRes = await this.scanDuplicates(subjectId);
    const idsToDelete: number[] = [];

    for (const grp of scanRes.groups) {
      if (grp.records.length > 1) {
        if (keepPolicy === 'keep_earliest') {
          const toDel = grp.records.slice(1).map((r) => Number(r.id));
          idsToDelete.push(...toDel);
        } else {
          const toDel = grp.records.slice(0, grp.records.length - 1).map((r) => Number(r.id));
          idsToDelete.push(...toDel);
        }
      }
    }

    if (idsToDelete.length > 0) {
      await this.questionRepository.delete(idsToDelete);
    }

    return {
      deletedCount: idsToDelete.length,
      affectedGroups: scanRes.duplicateGroupsCount,
    };
  }

  /**
   * 题目查重（单题）
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
    dto: {
      questionId?: number | string;
      type?: string;
      errorType?: string;
      content?: string;
      description?: string;
      contact?: string;
    },
  ): Promise<ErrorReport> {
    const qId = Number(dto.questionId) || 1;
    const type = dto.type || dto.errorType || 'content';
    let description = (dto.description || dto.content || '').trim();
    if (dto.contact && dto.contact.trim()) {
      description = `[联系方式: ${dto.contact.trim()}]\n${description}`;
    }
    const report = this.errorReportRepository.create({
      userId: Number(userId) || 1,
      questionId: qId,
      type,
      description,
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
    type?: string,
  ): Promise<{ list: any[]; total: number; page: number; pageSize: number }> {
    const qb = this.errorReportRepository.createQueryBuilder('er');
    if (status && status !== 'all') {
      qb.andWhere('er.status = :status', { status });
    }
    if (type && type !== 'all') {
      qb.andWhere('er.type = :type', { type });
    }
    if (keyword && keyword.trim()) {
      qb.andWhere('(er.description LIKE :kw OR er.adminReply LIKE :kw)', { kw: `%${keyword.trim()}%` });
    }

    qb.skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('er.createdAt', 'DESC');

    const [list, total] = await qb.getManyAndCount();

    const questionIds = Array.from(new Set(list.map((r) => Number(r.questionId)).filter(Boolean)));
    const userIds = Array.from(new Set(list.map((r) => Number(r.userId)).filter(Boolean)));

    const questions = questionIds.length > 0
      ? await this.questionRepository.find({ where: { id: In(questionIds) } })
      : [];
    const users = userIds.length > 0
      ? await this.userRepository.find({ where: { id: In(userIds) } })
      : [];

    const qMap = new Map(questions.map((q) => [Number(q.id), q]));
    const uMap = new Map(users.map((u) => [Number(u.id), u]));

    const typeMap: Record<string, string> = {
      answer: '参考答案错误',
      analysis: '解析有误/不完整',
      content: '题目错字/排版有误',
      typo: '题目错字/排版有误',
      options: '选项缺失/重复',
      image_formula: '图片/公式显示异常',
      other: '其他问题',
    };

    const formatted = list.map((r) => {
      const q = qMap.get(Number(r.questionId));
      const u = uMap.get(Number(r.userId));
      return {
        id: Number(r.id),
        questionId: Number(r.questionId),
        questionTitle: q?.content || `试题 #${r.questionId}`,
        userId: Number(r.userId),
        username: u?.username || u?.nickname || `学员_${r.userId}`,
        type: r.type,
        errorType: r.type,
        errorTypeText: typeMap[r.type] || r.type || '试题疑问',
        content: r.description,
        description: r.description,
        status: r.status || 'pending',
        adminReply: r.adminReply || '',
        reply: r.adminReply || '',
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    return { list: formatted, total, page, pageSize };
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

  /**
   * 删除纠错反馈（后台）
   */
  async deleteErrorReport(id: number): Promise<void> {
    await this.errorReportRepository.delete(id);
  }

  /**
   * 全库扫描并一键智能分离题干与选项
   */
  async autoSplitAllQuestions(subjectId?: number): Promise<{
    totalScanned: number;
    fixedCount: number;
    message: string;
  }> {
    const qb = this.questionRepository.createQueryBuilder('q');
    if (subjectId) {
      qb.where('q.subjectId = :subjectId', { subjectId });
    }
    const questions = await qb.getMany();
    let fixedCount = 0;

    for (const q of questions) {
      const rawContent = q.content || '';
      let opts = q.options as any;
      if (typeof opts === 'string') {
        try {
          opts = JSON.parse(opts);
        } catch {
          opts = [];
        }
      }
      const hasEmptyOpts =
        !opts ||
        !Array.isArray(opts) ||
        opts.length < 2 ||
        opts.every((o: any) => !(o.content || o.text || '').trim());

      // 如果选项为空，或者题干内明显含有 · A. 或 A. 等选项特征
      if (
        hasEmptyOpts ||
        /[·•●◆■※\-*+、\u00b7\u2022\s]+[A-Da-d][\.、．:：\s]/.test(rawContent) ||
        /^[·•●◆■※\-*+、\u00b7\u2022\s]*[A-Da-d][\.、．:：\s]/m.test(rawContent)
      ) {
        const split = splitStemAndOptions(rawContent);
        if (split.options.length >= 2) {
          q.content = split.stem;
          q.options = split.options;
          if (split.answer && (!q.answer || q.answer === 'A')) {
            q.answer = split.answer;
          }
          if (split.analysis && (!q.analysis || q.analysis.length < 5)) {
            q.analysis = split.analysis;
          }
          await this.questionRepository.save(q);
          fixedCount++;
        }
      }
    }

    return {
      totalScanned: questions.length,
      fixedCount,
      message: `成功扫描 ${questions.length} 道试题，已自动分离并修复 ${fixedCount} 道题目的题干与 ABCD 选项！`,
    };
  }
}
