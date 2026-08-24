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

  async onModuleInit() {
    try {
      await this.announcementRepository.query(
        "ALTER TABLE announcements MODIFY type VARCHAR(50) DEFAULT 'system', MODIFY status VARCHAR(20) DEFAULT 'published'",
      );
    } catch {
      // ignore
    }
    try {
      await this.bannerRepository.query(
        "ALTER TABLE banners ADD COLUMN IF NOT EXISTS updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
      );
    } catch {
      // ignore
    }
  }

  // ==================== 公告管理 ====================

  /**
   * 获取公告列表（前台）
   */
  async getAnnouncements(): Promise<any[]> {
    try {
      let list = await this.announcementRepository.find({
        where: [
          { status: 'published' },
          { status: '1' as any },
          { status: 1 as any },
        ],
        order: { publishAt: 'DESC', createdAt: 'DESC' },
      });
      if (list.length === 0) {
        const defaults = [
          {
            title: '2026年下半年全国计算机技术与软件专业技术资格（水平）考试报名通知',
            content:
              '2026年下半年软考报名已开启，请各位考生密切关注考试时间及考区要求，合理安排刷题复习计划。',
            type: 'system',
            status: 'published',
            publishAt: new Date(),
          },
          {
            title: '软考刷题系统 1.0 版本正式上线',
            content:
              '涵盖系统集成项目管理工程师、软件设计师、网络工程师等科目真题、智能组卷、AI 解析等功能，助力高效通关！',
            type: 'activity',
            status: 'published',
            publishAt: new Date(),
          },
        ];
        for (const d of defaults) {
          const item = this.announcementRepository.create(d as any);
          await this.announcementRepository.save(item);
        }
        list = await this.announcementRepository.find({
          order: { publishAt: 'DESC', createdAt: 'DESC' },
        });
      }
      return list.map((a) => ({
        id: Number(a.id),
        title: a.title,
        content: a.content,
        type: a.type,
        status: a.status,
        publishAt: a.publishAt || a.createdAt,
        createdAt: a.createdAt,
      }));
    } catch {
      return [
        {
          id: 1,
          title: '2026年下半年全国计算机技术与软件专业技术资格（水平）考试报名通知',
          content:
            '2026年下半年软考报名已开启，请各位考生密切关注考试时间及考区要求，合理安排刷题复习计划。',
          type: 'system',
          status: 'published',
          publishAt: new Date().toISOString(),
        },
      ];
    }
  }

  /**
   * 获取公告列表（后台）
   */
  async getAdminAnnouncements(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ list: any[]; total: number }> {
    const [list, total] = await this.announcementRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });
    if (total === 0) {
      await this.getAnnouncements();
      return this.getAdminAnnouncements(page, pageSize);
    }
    const formatted = list.map((a) => ({
      id: Number(a.id),
      title: a.title,
      content: a.content,
      type: a.type || 'notice',
      status: a.status || 'published',
      isTop: true,
      viewCount: 100,
      publishAt: a.publishAt || a.createdAt,
      createdAt: a.createdAt,
    }));
    return { list: formatted, total };
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
  async createAnnouncement(dto: CreateAnnouncementDto | any): Promise<Announcement> {
    const announcement = this.announcementRepository.create({
      title: dto.title,
      content: dto.content,
      type: dto.type || 'notice',
      status: dto.status || 'published',
      publishAt: dto.publishAt ? new Date(dto.publishAt) : new Date(),
    } as any);
    return this.announcementRepository.save(announcement as any);
  }

  /**
   * 更新公告
   */
  async updateAnnouncement(
    id: number,
    dto: Partial<CreateAnnouncementDto> | any,
  ): Promise<Announcement> {
    const announcement = await this.getAnnouncement(id);
    if (dto.title !== undefined) announcement.title = dto.title;
    if (dto.content !== undefined) announcement.content = dto.content;
    if (dto.type !== undefined) announcement.type = dto.type;
    if (dto.status !== undefined) announcement.status = dto.status;
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
    let list = await this.bannerRepository.find({
      where: { status: 1 },
      order: { sort: 'ASC' },
    });
    if (list.length === 0) {
      const defaults = [
        {
          title: '2026年软考冲刺刷题营',
          imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60',
          linkUrl: '/practice/mock-exam',
          sort: 1,
          status: 1,
        },
        {
          title: '历年真题AI智能解析全面上线',
          imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
          linkUrl: '/practice/real-exam',
          sort: 2,
          status: 1,
        },
      ];
      for (const d of defaults) {
        const item = this.bannerRepository.create(d);
        await this.bannerRepository.save(item);
      }
      list = await this.bannerRepository.find({
        where: { status: 1 },
        order: { sort: 'ASC' },
      });
    }
    return list;
  }

  /**
   * 获取 Banner 列表（后台）
   */
  async getAdminBanners(page: number = 1, pageSize: number = 20): Promise<{ list: any[]; total: number }> {
    const [list, total] = await this.bannerRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { sort: 'ASC', id: 'ASC' },
    });
    if (total === 0) {
      await this.getBanners();
      return this.getAdminBanners(page, pageSize);
    }
    const formatted = list.map((b) => ({
      id: Number(b.id),
      title: b.title,
      imageUrl: b.imageUrl,
      image: b.imageUrl,
      linkUrl: b.linkUrl,
      url: b.linkUrl,
      position: 'home',
      sort: b.sort || 0,
      status: b.status === 1 ? 'online' : 'offline',
      startAt: b.createdAt,
      endAt: null,
      createdAt: b.createdAt,
    }));
    return { list: formatted, total };
  }

  /**
   * 创建 Banner
   */
  async createBanner(dto: CreateBannerDto | any): Promise<Banner> {
    const banner = this.bannerRepository.create({
      title: dto.title,
      imageUrl: dto.imageUrl || dto.image || '',
      linkUrl: dto.linkUrl || dto.url || '',
      sort: dto.sort || 0,
      status: dto.status === 'offline' || dto.status === 0 ? 0 : 1,
    });
    return this.bannerRepository.save(banner);
  }

  /**
   * 更新 Banner
   */
  async updateBanner(id: number, dto: Partial<CreateBannerDto> | any): Promise<Banner> {
    const banner = await this.bannerRepository.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException('Banner不存在');
    }
    if (dto.title !== undefined) banner.title = dto.title;
    if (dto.imageUrl !== undefined) banner.imageUrl = dto.imageUrl;
    if (dto.image !== undefined) banner.imageUrl = dto.image;
    if (dto.linkUrl !== undefined) banner.linkUrl = dto.linkUrl;
    if (dto.url !== undefined) banner.linkUrl = dto.url;
    if (dto.sort !== undefined) banner.sort = dto.sort;
    if (dto.status !== undefined) banner.status = dto.status === 'offline' || dto.status === 0 ? 0 : 1;
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
