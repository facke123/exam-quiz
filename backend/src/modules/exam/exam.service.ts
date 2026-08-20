import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
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
export class ExamService {
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

  // ==================== 科目管理 ====================

  /**
   * 获取科目列表
   */
  async getSubjects(): Promise<Subject[]> {
    return this.subjectRepository.find({
      where: { status: 1 },
      order: { sort: 'ASC' },
    });
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
  async createSubject(dto: CreateSubjectDto): Promise<Subject> {
    const subject = this.subjectRepository.create(dto);
    return this.subjectRepository.save(subject);
  }

  /**
   * 更新科目
   */
  async updateSubject(id: number, dto: Partial<CreateSubjectDto>): Promise<Subject> {
    const subject = await this.getSubject(id);
    Object.assign(subject, dto);
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

  // ==================== 章节管理 ====================

  /**
   * 获取章节列表（树形结构）
   */
  async getChapters(subjectId: number): Promise<Chapter[]> {
    const chapters = await this.chapterRepository.find({
      where: { subjectId },
      order: { sort: 'ASC' },
    });
    // TODO: 构建树形结构
    return chapters;
  }

  /**
   * 创建章节
   */
  async createChapter(dto: CreateChapterDto): Promise<Chapter> {
    const chapter = this.chapterRepository.create(dto);
    return this.chapterRepository.save(chapter);
  }

  /**
   * 更新章节
   */
  async updateChapter(id: number, dto: Partial<CreateChapterDto>): Promise<Chapter> {
    const chapter = await this.chapterRepository.findOne({ where: { id } });
    if (!chapter) {
      throw new NotFoundException('章节不存在');
    }
    Object.assign(chapter, dto);
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
      order: { createdAt: 'ASC' },
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
  ): Promise<Paper[]> {
    const where: Record<string, unknown> = {};
    if (subjectId) where.subjectId = subjectId;
    if (type) where.type = type;
    return this.paperRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取试卷详情
   */
  async getPaper(id: number): Promise<Paper> {
    const paper = await this.paperRepository.findOne({ where: { id } });
    if (!paper) {
      throw new NotFoundException('试卷不存在');
    }
    return paper;
  }

  /**
   * 创建试卷
   */
  async createPaper(dto: CreatePaperDto): Promise<Paper> {
    const paper = this.paperRepository.create(dto);
    return this.paperRepository.save(paper);
  }

  /**
   * 更新试卷
   */
  async updatePaper(id: number, dto: Partial<CreatePaperDto>): Promise<Paper> {
    const paper = await this.getPaper(id);
    Object.assign(paper, dto);
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
  async generatePaper(dto: GeneratePaperDto): Promise<Paper> {
    const questionIds: number[] = [];

    const qb = this.questionRepository
      .createQueryBuilder('q')
      .where('q.status = :status', { status: 'published' })
      .andWhere('q.subjectId = :subjectId', { subjectId: dto.subjectId });

    if (dto.chapterIds && dto.chapterIds.length > 0) {
      qb.andWhere('q.chapterId IN (:...chapterIds)', {
        chapterIds: dto.chapterIds,
      });
    }

    // 按难度分布抽题
    if (dto.difficultyDistribution) {
      for (const [difficulty, count] of Object.entries(
        dto.difficultyDistribution,
      )) {
        const questions = await qb
          .clone()
          .andWhere('q.difficulty = :difficulty', {
            difficulty: Number(difficulty),
          })
          .orderBy('RAND()')
          .take(count as number)
          .getMany();
        questionIds.push(...questions.map((q) => Number(q.id)));
      }
    } else {
      const questions = await qb
        .orderBy('RAND()')
        .take(dto.questionCount || 100)
        .getMany();
      questionIds.push(...questions.map((q) => Number(q.id)));
    }

    const paper = this.paperRepository.create({
      subjectId: dto.subjectId,
      name: dto.name,
      type: dto.type,
      duration: dto.duration,
      totalScore: questionIds.length,
      questionIds,
      status: 'published',
    });

    return this.paperRepository.save(paper);
  }
}
