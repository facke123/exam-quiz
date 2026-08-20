import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { Question } from '@/database/entities/question.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionDto } from './dto/query-question.dto';
import { ImportQuestionDto } from './dto/import-question.dto';

/**
 * 题库服务
 */
@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  /**
   * 创建题目
   */
  async create(dto: CreateQuestionDto): Promise<Question> {
    const question = this.questionRepository.create({
      ...dto,
      source: 'manual',
      status: 'draft',
    } as any);
    return this.questionRepository.save(question as any);
  }

  /**
   * 更新题目
   */
  async update(id: number, dto: UpdateQuestionDto): Promise<Question> {
    const question = await this.questionRepository.findOne({ where: { id } });
    if (!question) {
      throw new NotFoundException('题目不存在');
    }
    Object.assign(question, dto);
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
   * 获取题目详情
   */
  async findOne(id: number): Promise<Question> {
    const question = await this.questionRepository.findOne({ where: { id } });
    if (!question) {
      throw new NotFoundException('题目不存在');
    }
    return question;
  }

  /**
   * 分页查询题目（前台）
   */
  async findList(dto: QueryQuestionDto): Promise<{
    list: Question[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { page = 1, pageSize = 20, keyword, ...filters } = dto;
    const where: FindManyOptions<Question>['where'] = {
      status: 'published',
      ...filters,
    };
    if (keyword) {
      where.content = Like(`%${keyword}%`);
    }
    const [list, total] = await this.questionRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });
    return { list, total, page, pageSize };
  }

  /**
   * 分页查询题目（后台）
   */
  async findAdminList(dto: QueryQuestionDto): Promise<{
    list: Question[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { page = 1, pageSize = 20, keyword, ...filters } = dto;
    const where: FindManyOptions<Question>['where'] = { ...filters };
    if (keyword) {
      where.content = Like(`%${keyword}%`);
    }
    const [list, total] = await this.questionRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });
    return { list, total, page, pageSize };
  }

  /**
   * 批量导入题目
   */
  async batchImport(dto: ImportQuestionDto): Promise<{
    success: number;
    failed: number;
  }> {
    let success = 0;
    let failed = 0;
    for (const item of dto.questions) {
      try {
        const question = this.questionRepository.create({
          ...item,
          source: dto.source || 'manual',
          status: 'pending',
        } as any);
        await this.questionRepository.save(question as any);
        success++;
      } catch (_error) {
        failed++;
      }
    }
    return { success, failed };
  }

  /**
   * 更新题目状态
   */
  async updateStatus(id: number, status: string): Promise<void> {
    const question = await this.questionRepository.findOne({ where: { id } });
    if (!question) {
      throw new NotFoundException('题目不存在');
    }
    question.status = status;
    await this.questionRepository.save(question);
  }

  /**
   * 题目查重
   */
  async checkDuplicate(content: string): Promise<{
    isDuplicate: boolean;
    matches: Question[];
  }> {
    const matches = await this.questionRepository.find({
      where: { content: Like(`%${content}%`) },
      take: 5,
    });
    return {
      isDuplicate: matches.length > 0,
      matches,
    };
  }
}
