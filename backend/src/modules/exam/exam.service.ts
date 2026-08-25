import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from '@/database/entities/subject.entity';
import { Chapter } from '@/database/entities/chapter.entity';
import { KnowledgePoint } from '@/database/entities/knowledge-point.entity';
import { Paper } from '@/database/entities/paper.entity';
import { Question } from '@/database/entities/question.entity';
import {
  CreateSubjectDto,
  CreateChapterDto,
  CreateKnowledgePointDto,
  CreatePaperDto,
  GeneratePaperDto,
} from './dto/exam.dto';

/**
 * 考试管理服务
 */
@Injectable()
export class ExamService implements OnModuleInit {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(KnowledgePoint)
    private readonly knowledgePointRepository: Repository<KnowledgePoint>,
    @InjectRepository(Paper)
    private readonly paperRepository: Repository<Paper>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  async onModuleInit() {
    await this.seedInitialExamData();
  }

  /**
   * 自动初始化科目、章节及试卷体系
   */
  private async seedInitialExamData() {
    const subCount = await this.subjectRepository.count();
    if (subCount === 0) {
      const initialSubjects = [
        {
          name: '系统集成项目管理工程师',
          code: 'ruankao_soft',
          icon: 'FolderOpened',
          description: '全国计算机技术与软件专业技术资格（水平）考试 - 中级资格',
          sort: 1,
          status: 1,
        },
        {
          name: '信息系统项目管理师',
          code: 'ruankao_high',
          icon: 'DocumentChecked',
          description: '全国计算机技术与软件专业技术资格（水平）考试 - 高级资格',
          sort: 2,
          status: 1,
        },
        {
          name: '软件设计师',
          code: 'ruankao_designer',
          icon: 'Notebook',
          description: '计算机软件与工程设计专业技能水平认证 - 中级资格',
          sort: 3,
          status: 1,
        },
        {
          name: '网络工程师',
          code: 'ruankao_network',
          icon: 'Connection',
          description: '计算机网络系统架构设计与运维管理 - 中级资格',
          sort: 4,
          status: 1,
        },
      ];

      for (const s of initialSubjects) {
        const item = this.subjectRepository.create(s);
        await this.subjectRepository.save(item);
      }
    }

    const chCount = await this.chapterRepository.count();
    if (chCount === 0) {
      const initialChapters = [
        { subjectId: 1, name: '第1章 信息化知识与发展', sort: 1 },
        { subjectId: 1, name: '第2章 信息系统集成及服务管理', sort: 2 },
        { subjectId: 1, name: '第3章 信息系统集成专业技术知识', sort: 3 },
        { subjectId: 1, name: '第4章 项目管理一般知识与生命周期', sort: 4 },
        { subjectId: 1, name: '第5章 项目立项管理与招投标', sort: 5 },
        { subjectId: 1, name: '第6章 项目整体管理', sort: 6 },
        { subjectId: 1, name: '第7章 项目范围管理', sort: 7 },
        { subjectId: 1, name: '第8章 项目进度管理', sort: 8 },
        { subjectId: 1, name: '第9章 项目成本管理', sort: 9 },
        { subjectId: 1, name: '第10章 项目质量管理', sort: 10 },
        { subjectId: 2, name: '第1章 信息化战略与企业架构', sort: 1 },
        { subjectId: 2, name: '第2章 项目集与项目组合管理', sort: 2 },
        { subjectId: 2, name: '第3章 高级项目范围与进度管控', sort: 3 },
        { subjectId: 3, name: '第1章 计算机系统基础与体系结构', sort: 1 },
        { subjectId: 3, name: '第2章 面向对象设计与设计模式', sort: 2 },
        { subjectId: 3, name: '第3章 数据库设计与SQL编程', sort: 3 },
        { subjectId: 4, name: '第1章 计算机网络体系结构与协议', sort: 1 },
        { subjectId: 4, name: '第2章 交换机与路由配置技术', sort: 2 },
      ];

      for (const c of initialChapters) {
        const chapter = this.chapterRepository.create({
          subjectId: c.subjectId,
          name: c.name,
          sort: c.sort,
          questionCount: 0,
        });
        await this.chapterRepository.save(chapter);
      }
    }

    const paperCount = await this.paperRepository.count();
    if (paperCount === 0) {
      const initialPapers = [
        {
          subjectId: 1,
          name: '2024年下半年系统集成项目管理工程师真题（上午综合知识）',
          year: 2024,
          type: 'real',
          duration: 150,
          totalScore: 75,
          status: 'published',
        },
        {
          subjectId: 1,
          name: '2024年上半年系统集成项目管理工程师真题（上午综合知识）',
          year: 2024,
          type: 'real',
          duration: 150,
          totalScore: 75,
          status: 'published',
        },
        {
          subjectId: 1,
          name: '2025年考前密押冲刺模拟试卷（一）',
          year: 2025,
          type: 'mock',
          duration: 150,
          totalScore: 75,
          status: 'published',
        },
        {
          subjectId: 2,
          name: '2024年信息系统项目管理师真题试卷',
          year: 2024,
          type: 'real',
          duration: 150,
          totalScore: 75,
          status: 'published',
        },
      ];

      const questions = await this.questionRepository.find({ select: ['id'] });
      const qIds = questions.map((q) => Number(q.id));

      for (const p of initialPapers) {
        const entity = this.paperRepository.create({
          subjectId: p.subjectId,
          name: p.name,
          year: p.year,
          type: p.type as any,
          duration: p.duration,
          totalScore: p.totalScore,
          questionIds: qIds,
          status: 1,
        });
        await this.paperRepository.save(entity);
      }
    }
  }

  // ==================== 科目管理 ====================

  /**
   * 获取科目列表（含题目数）
   */
  async getSubjects(): Promise<any[]> {
    const subjects = await this.subjectRepository.find({
      order: { sort: 'ASC', createdAt: 'ASC' },
    });

    const result = [];
    for (const sub of subjects) {
      const qCount = await this.questionRepository.count({
        where: { subjectId: Number(sub.id), status: 'published' },
      });
      result.push({
        id: Number(sub.id),
        name: sub.name,
        code: sub.code,
        icon: sub.icon,
        description: sub.description,
        sort: sub.sort,
        status: sub.status === 1 ? 'enabled' : 'disabled',
        questionCount: qCount,
        createdAt: sub.createdAt,
      });
    }
    return result;
  }

  /**
   * 获取科目详情
   */
  async getSubject(id: number): Promise<Subject> {
    const subject = await this.subjectRepository.findOne({ where: { id } });
    if (!subject) {
      throw new NotFoundException('科目不存在');
    }
    return subject;
  }

  /**
   * 创建科目
   */
  async createSubject(dto: CreateSubjectDto | any): Promise<Subject> {
    const subject = this.subjectRepository.create({
      name: dto.name,
      code: dto.code || dto.name.toLowerCase(),
      description: dto.description || '',
      icon: dto.icon || '',
      sort: dto.sort || 0,
      status: dto.status === 'disabled' || dto.status === 0 ? 0 : 1,
    });
    return this.subjectRepository.save(subject);
  }

  /**
   * 更新科目
   */
  async updateSubject(id: number, dto: Partial<CreateSubjectDto> | any): Promise<Subject> {
    const subject = await this.getSubject(id);
    if (dto.name !== undefined) subject.name = dto.name;
    if (dto.code !== undefined) subject.code = dto.code;
    if (dto.description !== undefined) subject.description = dto.description;
    if (dto.icon !== undefined) subject.icon = dto.icon;
    if (dto.sort !== undefined) subject.sort = dto.sort;
    if (dto.status !== undefined) subject.status = dto.status === 'disabled' || dto.status === 0 ? 0 : 1;
    return this.subjectRepository.save(subject);
  }

  /**
   * 删除科目
   */
  async deleteSubject(id: number): Promise<void> {
    const result = await this.subjectRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('科目不存在');
    }
  }

  /**
   * 解析 subjectId 或 code/name 为数值 id
   */
  async resolveSubjectId(subjectIdOrCode?: number | string): Promise<number> {
    if (!subjectIdOrCode) {
      const first = await this.subjectRepository.findOne({ order: { sort: 'ASC', id: 'ASC' } });
      return first ? Number(first.id) : 1;
    }

    if (typeof subjectIdOrCode === 'number' && !isNaN(subjectIdOrCode)) {
      return subjectIdOrCode;
    }

    const str = String(subjectIdOrCode).trim();
    if (!isNaN(Number(str)) && Number(str) > 0) {
      return Number(str);
    }

    const found = await this.subjectRepository
      .createQueryBuilder('s')
      .where('s.code = :str OR s.name = :str OR s.code LIKE :like OR s.name LIKE :like', {
        str,
        like: `%${str}%`,
      })
      .getOne();

    if (found) {
      return Number(found.id);
    }

    return 1;
  }

  // ==================== 章节管理 ====================

  /**
   * 别名方法：兼容 exam.controller.ts getChapters
   */
  async getChapters(subjectId?: number | string): Promise<any[]> {
    return this.getChapterTree(subjectId);
  }

  /**
   * 获取章节树（含题目数和知识点）
   */
  async getChapterTree(subjectId?: number | string): Promise<any[]> {
    const resolvedSubjectId = await this.resolveSubjectId(subjectId);

    const chapters = await this.chapterRepository.find({
      where: { subjectId: resolvedSubjectId },
      order: { sort: 'ASC', id: 'ASC' },
    });

    const knowledgePoints = await this.knowledgePointRepository.find();

    const chapterMap = new Map<number, any>();
    for (const c of chapters) {
      const qCount = await this.questionRepository.count({
        where: { chapterId: Number(c.id), status: 'published' },
      });
      chapterMap.set(Number(c.id), {
        id: Number(c.id),
        subjectId: Number(c.subjectId),
        parentId: c.parentId ? Number(c.parentId) : null,
        name: c.name,
        sort: c.sort,
        questionCount: qCount,
        progress: 0,
        knowledgePoints: knowledgePoints
          .filter((kp) => Number(kp.chapterId) === Number(c.id))
          .map((kp) => ({
            id: Number(kp.id),
            chapterId: Number(kp.chapterId),
            name: kp.name,
          })),
        children: [],
      });
    }

    // 组装树形结构
    const tree: any[] = [];
    for (const item of chapterMap.values()) {
      if (item.parentId && chapterMap.has(item.parentId)) {
        const parent = chapterMap.get(item.parentId);
        parent.children.push(item);
      } else {
        tree.push(item);
      }
    }

    return tree;
  }

  /**
   * 创建章节
   */
  async createChapter(dto: CreateChapterDto | any): Promise<Chapter> {
    const chapter = this.chapterRepository.create({
      subjectId: dto.subjectId,
      parentId: dto.parentId || null,
      name: dto.name,
      sort: dto.sort || 0,
      questionCount: 0,
    });
    return this.chapterRepository.save(chapter);
  }

  /**
   * 更新章节
   */
  async updateChapter(id: number, dto: Partial<CreateChapterDto> | any): Promise<Chapter> {
    const chapter = await this.chapterRepository.findOne({ where: { id } });
    if (!chapter) {
      throw new NotFoundException('章节不存在');
    }
    if (dto.name !== undefined) chapter.name = dto.name;
    if (dto.parentId !== undefined) chapter.parentId = dto.parentId;
    if (dto.sort !== undefined) chapter.sort = dto.sort;
    return this.chapterRepository.save(chapter);
  }

  /**
   * 删除章节
   */
  async deleteChapter(id: number): Promise<void> {
    const result = await this.chapterRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('章节不存在');
    }
  }

  // ==================== 知识点管理 ====================

  /**
   * 获取知识点列表
   */
  async getKnowledgePoints(chapterId: number): Promise<KnowledgePoint[]> {
    return this.knowledgePointRepository.find({
      where: { chapterId },
      order: { id: 'ASC' },
    });
  }

  /**
   * 创建知识点
   */
  async createKnowledgePoint(dto: CreateKnowledgePointDto): Promise<KnowledgePoint> {
    const kp = this.knowledgePointRepository.create(dto);
    return this.knowledgePointRepository.save(kp);
  }

  /**
   * 更新知识点
   */
  async updateKnowledgePoint(
    id: number,
    dto: Partial<CreateKnowledgePointDto>,
  ): Promise<KnowledgePoint> {
    const kp = await this.knowledgePointRepository.findOne({ where: { id } });
    if (!kp) {
      throw new NotFoundException('知识点不存在');
    }
    Object.assign(kp, dto);
    return this.knowledgePointRepository.save(kp);
  }

  /**
   * 删除知识点
   */
  async deleteKnowledgePoint(id: number): Promise<void> {
    const result = await this.knowledgePointRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('知识点不存在');
    }
  }

  // ==================== 试卷管理 ====================

  /**
   * 获取试卷列表
   */
  async getPapers(
    subjectId?: number,
    type?: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ list: any[]; total: number }> {
    const where: Record<string, unknown> = {};
    if (subjectId) where.subjectId = subjectId;
    if (type) where.type = type;

    const [list, total] = await this.paperRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    const subjects = await this.subjectRepository.find();
    const subjectMap = new Map(subjects.map((s) => [Number(s.id), s.name]));

    const parseSeason = (name: string): string => {
      if (name.includes('下半年') || name.includes('11月')) return '下半年';
      if (name.includes('上半年') || name.includes('5月')) return '上半年';
      if (name.includes('模拟') || name.includes('押题')) return '模考';
      return '真题';
    };

    const parseYear = (p: Paper): number => {
      if (p.year) return Number(p.year);
      const m = p.name.match(/(20\d{2})/);
      if (m) return Number(m[1]);
      return new Date(p.createdAt).getFullYear();
    };

    const formattedList = list.map((p) => {
      const year = parseYear(p);
      const season = parseSeason(p.name);
      return {
        id: Number(p.id),
        subjectId: Number(p.subjectId),
        subjectName: subjectMap.get(Number(p.subjectId)) || '系统集成项目管理工程师',
        name: p.name,
        year,
        season,
        type: p.type,
        description: `考试时长 ${p.duration} 分钟，总分 ${p.totalScore} 分`,
        totalTime: p.duration,
        duration: p.duration,
        totalScore: p.totalScore,
        questionCount: (p.questionIds && p.questionIds.length) || 0,
        passScore: Math.round(p.totalScore * 0.6),
        status: p.status === 1 ? 1 : 0,
        createdAt: p.createdAt,
      };
    });

    return { list: formattedList, total };
  }

  /**
   * 获取试卷详情（含完整题目列表，用于全景预览与编辑）
   */
  async getPaper(id: number): Promise<any> {
    const paper = await this.paperRepository.findOne({ where: { id } });
    if (!paper) {
      throw new NotFoundException('试卷不存在');
    }
    const subject = await this.subjectRepository.findOne({ where: { id: paper.subjectId } });

    let questions: any[] = [];
    if (paper.questionIds && Array.isArray(paper.questionIds) && paper.questionIds.length > 0) {
      const qList = await this.questionRepository
        .createQueryBuilder('q')
        .where('q.id IN (:...ids)', { ids: paper.questionIds })
        .getMany();

      const qMap = new Map(qList.map((q) => [Number(q.id), q]));
      questions = paper.questionIds
        .map((qid) => {
          const found = qMap.get(Number(qid));
          if (!found) return null;
          let options = found.options;
          if (typeof options === 'string') {
            try {
              options = JSON.parse(options);
            } catch {
              options = [];
            }
          }
          return {
            ...found,
            id: Number(found.id),
            options: options || [],
            score: (found as any).score || 1,
          };
        })
        .filter(Boolean);
    }

    const parseSeason = (name: string): string => {
      if (name.includes('下半年') || name.includes('11月')) return '下半年';
      if (name.includes('上半年') || name.includes('5月')) return '上半年';
      if (name.includes('模拟') || name.includes('押题')) return '模考';
      return '真题';
    };

    const parseYear = (p: Paper): number => {
      if (p.year) return Number(p.year);
      const m = p.name.match(/(20\d{2})/);
      if (m) return Number(m[1]);
      return new Date(p.createdAt).getFullYear();
    };

    const year = parseYear(paper);
    const season = parseSeason(paper.name);

    return {
      ...paper,
      id: Number(paper.id),
      subjectId: Number(paper.subjectId),
      subjectName: subject ? subject.name : '软考科目',
      year,
      season,
      questionCount: (paper.questionIds && paper.questionIds.length) || questions.length,
      totalTime: paper.duration,
      duration: paper.duration,
      passScore: Math.round(paper.totalScore * 0.6),
      questions,
    };
  }

  /**
   * 创建试卷
   */
  async createPaper(dto: CreatePaperDto | any): Promise<Paper> {
    const questionIds = dto.questionIds || [];
    const paper = this.paperRepository.create({
      subjectId: dto.subjectId || 1,
      name: dto.name,
      year: dto.year || (dto.name ? Number((dto.name.match(/(20\d{2})/) || [])[1]) || undefined : undefined),
      type: dto.type || 'real',
      duration: dto.totalTime || dto.duration || 150,
      totalScore: dto.totalScore || (questionIds.length > 0 ? questionIds.length : 75),
      questionIds,
      status: dto.status === 0 || dto.status === 'draft' ? 0 : 1,
    });
    return this.paperRepository.save(paper);
  }

  /**
   * 更新试卷
   */
  async updatePaper(id: number, dto: Partial<CreatePaperDto> | any): Promise<Paper> {
    const paper = await this.paperRepository.findOne({ where: { id } });
    if (!paper) {
      throw new NotFoundException('试卷不存在');
    }
    if (dto.name !== undefined) paper.name = dto.name;
    if (dto.subjectId !== undefined) paper.subjectId = dto.subjectId;
    if (dto.year !== undefined) paper.year = dto.year;
    if (dto.type !== undefined) paper.type = dto.type;
    if (dto.totalTime !== undefined) paper.duration = dto.totalTime;
    if (dto.duration !== undefined) paper.duration = dto.duration;
    if (dto.totalScore !== undefined) paper.totalScore = dto.totalScore;
    if (dto.questionIds !== undefined) {
      paper.questionIds = dto.questionIds;
      if (dto.totalScore === undefined) {
        paper.totalScore = dto.questionIds.length || paper.totalScore;
      }
    }
    if (dto.status !== undefined) paper.status = dto.status === 0 || dto.status === 'draft' ? 0 : 1;
    return this.paperRepository.save(paper);
  }

  /**
   * 删除试卷
   */
  async deletePaper(id: number): Promise<void> {
    const result = await this.paperRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('试卷不存在');
    }
  }

  /**
   * 组卷 - 按规则自动生成试卷
   */
  async generatePaper(dto: GeneratePaperDto | any): Promise<Paper> {
    const questionIds: number[] = [];

    const qb = this.questionRepository
      .createQueryBuilder('q')
      .where('q.status = :status', { status: 'published' });

    if (dto.subjectId) {
      qb.andWhere('q.subjectId = :subjectId', { subjectId: dto.subjectId });
    }

    if (dto.chapterIds && dto.chapterIds.length > 0) {
      qb.andWhere('q.chapterId IN (:...chapterIds)', {
        chapterIds: dto.chapterIds,
      });
    }

    // 按题型比例或数量抽题
    const totalCount = dto.questionCount || 75;
    const questions = await qb
      .orderBy('RAND()')
      .take(totalCount)
      .getMany();

    questionIds.push(...questions.map((q) => Number(q.id)));

    const paper = this.paperRepository.create({
      subjectId: dto.subjectId || 1,
      name: dto.name || `智能组卷_${new Date().toLocaleDateString()}`,
      type: dto.type || 'mock',
      duration: dto.duration || dto.totalTime || 150,
      totalScore: questionIds.length || 75,
      questionIds,
      status: 1,
    });

    return this.paperRepository.save(paper);
  }

  /**
   * 导入试卷（支持解析题目并建卷，或绑定已有题目建卷）
   */
  async importPaper(dto: any): Promise<any> {
    const subjectId = Number(dto.subjectId || 1);
    const questionIds: number[] = [];

    const toDbType = (t?: string) => {
      const str = String(t || '').toLowerCase().trim();
      if (str === 'multiple' || str === 'multiple_choice' || str.includes('多选')) return 'multiple_choice';
      if (str === 'judge' || str === 'true_false' || str.includes('判断')) return 'true_false';
      if (str === 'case' || str === 'case_analysis' || str.includes('案例')) return 'case_analysis';
      if (str === 'essay' || str === 'subjective' || str.includes('问答') || str.includes('简答') || str.includes('论述')) return 'subjective';
      return 'single_choice';
    };

    const toPaperType = (t?: string) => {
      if (['real', 'mock', 'practice'].includes(String(t))) return String(t);
      return 'real';
    };

    if (Array.isArray(dto.questionIds)) {
      questionIds.push(...dto.questionIds.map((id: any) => Number(id)));
    }

    // 如果携带了解析后的题目列表，则先写入题库并绑定
    if (Array.isArray(dto.questions) && dto.questions.length > 0) {
      for (const q of dto.questions) {
        if (!q.content && !q.title) continue;
        const newQ = this.questionRepository.create({
          subjectId,
          chapterId: q.chapterId ? Number(q.chapterId) : undefined,
          knowledgePointIds: q.knowledgePointId ? [Number(q.knowledgePointId)] : [],
          type: toDbType(q.type),
          difficulty: Number(q.difficulty) || 3,
          content: q.content || q.title,
          options: q.options || [],
          answer: q.answer || 'A',
          analysis: q.analysis || '',
          tags: [],
          status: 'published',
          source: 'word',
        } as any);
        const savedQ: any = await this.questionRepository.save(newQ);
        if (savedQ && savedQ.id) {
          questionIds.push(Number(savedQ.id));
        }
      }
    }

    const totalQuestions = questionIds.length;
    const totalScore = dto.totalScore || (totalQuestions > 0 ? totalQuestions : 75);

    const paper = this.paperRepository.create({
      subjectId,
      name: dto.name,
      year: dto.year || new Date().getFullYear(),
      type: toPaperType(dto.type) as any,
      duration: dto.duration || dto.totalTime || 150,
      totalScore,
      questionIds,
      status: 1,
    });

    const savedPaper = await this.paperRepository.save(paper);
    return {
      paperId: Number(savedPaper.id),
      paper: savedPaper,
      questionCount: questionIds.length,
      message: '试卷导入成功',
    };
  }

  /**
   * 关联/添加题目至试卷
   */
  async addQuestionsToPaper(paperId: number, questionIds: number[]): Promise<Paper> {
    const paper = await this.paperRepository.findOne({ where: { id: paperId } });
    if (!paper) {
      throw new NotFoundException('试卷不存在');
    }
    const currentIds = new Set(paper.questionIds || []);
    for (const qId of questionIds) {
      currentIds.add(Number(qId));
    }
    paper.questionIds = Array.from(currentIds);
    paper.totalScore = paper.questionIds.length;
    return this.paperRepository.save(paper);
  }
}
