import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from '@/database/entities/announcement.entity';
import { Banner } from '@/database/entities/banner.entity';
import { CreateAnnouncementDto, CreateBannerDto } from './dto/content.dto';

/**
 * 内容管理服务
 */
@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepository: Repository<Announcement>,
    @InjectRepository(Banner)
    private readonly bannerRepository: Repository<Banner>,
  ) {}

  // ==================== 公告管理 ====================

  /**
   * 获取公告列表（前台）
   */
  async getAnnouncements(): Promise<Announcement[]> {
    return this.announcementRepository.find({
      where: { status: 'published' },
      order: { publishAt: 'DESC' },
    });
  }

  /**
   * 获取公告列表（后台）
   */
  async getAdminAnnouncements(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ list: Announcement[]; total: number }> {
    const [list, total] = await this.announcementRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });
    return { list, total };
  }

  /**
   * 获取公告详情
   */
  async getAnnouncement(id: number): Promise<Announcement> {
    const announcement = await this.announcementRepository.findOne({
      where: { id },
    });
    if (!announcement) {
      throw new NotFoundException('公告不存在');
    }
    return announcement;
  }

  /**
   * 创建公告
   */
  async createAnnouncement(dto: CreateAnnouncementDto): Promise<Announcement> {
    const announcement = this.announcementRepository.create({
      ...dto,
      publishAt: dto.publishAt ? new Date(dto.publishAt) : new Date(),
    });
    return this.announcementRepository.save(announcement);
  }

  /**
   * 更新公告
   */
  async updateAnnouncement(
    id: number,
    dto: Partial<CreateAnnouncementDto>,
  ): Promise<Announcement> {
    const announcement = await this.getAnnouncement(id);
    Object.assign(announcement, dto);
    if (dto.publishAt) {
      announcement.publishAt = new Date(dto.publishAt);
    }
    return this.announcementRepository.save(announcement);
  }

  /**
   * 删除公告
   */
  async deleteAnnouncement(id: number): Promise<void> {
    const result = await this.announcementRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('公告不存在');
    }
  }

  // ==================== Banner 管理 ====================

  /**
   * 获取 Banner 列表（前台）
   */
  async getBanners(): Promise<Banner[]> {
    return this.bannerRepository.find({
      where: { status: 1 },
      order: { sort: 'ASC' },
    });
  }

  /**
   * 获取 Banner 列表（后台）
   */
  async getAdminBanners(): Promise<Banner[]> {
    return this.bannerRepository.find({
      order: { sort: 'ASC' },
    });
  }

  /**
   * 创建 Banner
   */
  async createBanner(dto: CreateBannerDto): Promise<Banner> {
    const banner = this.bannerRepository.create(dto);
    return this.bannerRepository.save(banner);
  }

  /**
   * 更新 Banner
   */
  async updateBanner(id: number, dto: Partial<CreateBannerDto>): Promise<Banner> {
    const banner = await this.bannerRepository.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException('Banner不存在');
    }
    Object.assign(banner, dto);
    return this.bannerRepository.save(banner);
  }

  /**
   * 删除 Banner
   */
  async deleteBanner(id: number): Promise<void> {
    const result = await this.bannerRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Banner不存在');
    }
  }
}
