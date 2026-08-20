import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AiTask } from '@/database/entities/ai-task.entity';
import { AiPrompt } from '@/database/entities/ai-prompt.entity';
import { Question } from '@/database/entities/question.entity';
import {
  AiGenerateQuestionDto,
  AiGenerateAnalysisDto,
  AiImportDto,
  CreatePromptDto,
  QueryAiTaskDto,
} from './dto/ai.dto';

/**
 * AI 服务
 */
@Injectable()
export class AiService {
  constructor(
    @InjectRepository(AiTask)
    private readonly taskRepository: Repository<AiTask>,
    @InjectRepository(AiPrompt)
    private readonly promptRepository: Repository<AiPrompt>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * AI 出题
   */
  async generateQuestion(
    dto: AiGenerateQuestionDto,
    adminId: number,
  ): Promise<AiTask> {
    const task = this.taskRepository.create({
      type: 'generate_question',
      status: 'pending',
      params: dto as unknown as Record<string, unknown>,
      adminId,
    });
    // TODO: 将任务推送到 RabbitMQ 队列，由消费者调用 AI 接口生成题目
    return this.taskRepository.save(task);
  }

  /**
   * AI 审核题目
   */
  async reviewQuestion(questionId: number, adminId: number): Promise<AiTask> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
    });
    if (!question) {
      throw new NotFoundException('题目不存在');
    }
    const task = this.taskRepository.create({
      type: 'generate_analysis',
      status: 'pending',
      params: { questionId, content: question.content } as unknown as Record<string, unknown>,
      adminId,
    });
    // TODO: 推送到队列，由 AI 审核题目质量和准确性
    return this.taskRepository.save(task);
  }

  /**
   * AI 解析生成
   */
  async generateAnalysis(dto: AiGenerateAnalysisDto, adminId: number): Promise<AiTask> {
    const task = this.taskRepository.create({
      type: 'generate_analysis',
      status: 'pending',
      params: dto as unknown as Record<string, unknown>,
      adminId,
    });
    // TODO: 推送到队列，由 AI 生成题目解析
    return this.taskRepository.save(task);
  }

  /**
   * AI 智能导入
   */
  async smartImport(dto: AiImportDto, adminId: number): Promise<AiTask> {
    const task = this.taskRepository.create({
      type: 'import',
      status: 'pending',
      params: dto as unknown as Record<string, unknown>,
      adminId,
    });
    // TODO: 推送到队列，由 AI 解析文件内容并提取题目
    return this.taskRepository.save(task);
  }

  /**
   * 查询 AI 任务
   */
  async getTasks(dto: QueryAiTaskDto): Promise<{
    list: AiTask[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { page = 1, pageSize = 20, ...filters } = dto;
    const [list, total] = await this.taskRepository.findAndCount({
      where: filters,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });
    return { list, total, page, pageSize };
  }

  /**
   * 获取 AI 任务详情
   */
  async getTask(id: number): Promise<AiTask> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    return task;
  }

  /**
   * 获取 AI 配额（今日已用次数）
   */
  async getQuota(adminId: number): Promise<{
    used: number;
    limit: number;
    remaining: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const used = await this.taskRepository.count({
      where: { adminId },
    });
    // TODO: 从系统配置读取每日限额
    const limit = 100;
    return {
      used,
      limit,
      remaining: Math.max(0, limit - used),
    };
  }

  /**
   * 获取 Prompt 模板列表
   */
  async getPrompts(): Promise<AiPrompt[]> {
    return this.promptRepository.find({ order: { updatedAt: 'DESC' } });
  }

  /**
   * 创建 Prompt 模板
   */
  async createPrompt(dto: CreatePromptDto): Promise<AiPrompt> {
    const prompt = this.promptRepository.create(dto);
    return this.promptRepository.save(prompt);
  }

  /**
   * 更新 Prompt 模板
   */
  async updatePrompt(id: number, dto: Partial<CreatePromptDto>): Promise<AiPrompt> {
    const prompt = await this.promptRepository.findOne({ where: { id } });
    if (!prompt) {
      throw new NotFoundException('模板不存在');
    }
    Object.assign(prompt, dto);
    return this.promptRepository.save(prompt);
  }

  /**
   * 删除 Prompt 模板
   */
  async deletePrompt(id: number): Promise<void> {
    const result = await this.promptRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('模板不存在');
    }
  }
}
