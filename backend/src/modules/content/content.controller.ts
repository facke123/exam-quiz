import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { CreateAnnouncementDto, CreateBannerDto } from './dto/content.dto';
import { Public } from '@/common/decorators/public.decorator';

/**
 * 内容管理控制器
 */
@ApiTags('内容管理')
@ApiBearerAuth()
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // ==================== 公告 ====================

  @Public()
  @Get('announcements')
  @ApiOperation({ summary: '公告列表（前台）' })
  async getAnnouncements() {
    return this.contentService.getAnnouncements();
  }

  @Public()
  @Get('announcements/:id')
  @ApiOperation({ summary: '公告详情' })
  async getAnnouncement(@Param('id', ParseIntPipe) id: number) {
    return this.contentService.getAnnouncement(id);
  }

  @Get('admin/announcements')
  @ApiOperation({ summary: '后台-公告列表' })
  async getAdminAnnouncements(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.contentService.getAdminAnnouncements(
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Post('admin/announcements')
  @ApiOperation({ summary: '创建公告' })
  async createAnnouncement(@Body() dto: CreateAnnouncementDto) {
    return this.contentService.createAnnouncement(dto);
  }

  @Patch('admin/announcements/:id')
  @ApiOperation({ summary: '更新公告' })
  async updateAnnouncement(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateAnnouncementDto>,
  ) {
    return this.contentService.updateAnnouncement(id, dto);
  }

  @Delete('admin/announcements/:id')
  @ApiOperation({ summary: '删除公告' })
  async deleteAnnouncement(@Param('id', ParseIntPipe) id: number) {
    await this.contentService.deleteAnnouncement(id);
    return { message: '删除成功' };
  }

  // ==================== Banner ====================

  @Public()
  @Get('banners')
  @ApiOperation({ summary: 'Banner列表（前台）' })
  async getBanners() {
    return this.contentService.getBanners();
  }

  @Get('admin/banners')
  @ApiOperation({ summary: '后台-Banner列表' })
  async getAdminBanners() {
    return this.contentService.getAdminBanners();
  }

  @Post('admin/banners')
  @ApiOperation({ summary: '创建Banner' })
  async createBanner(@Body() dto: CreateBannerDto) {
    return this.contentService.createBanner(dto);
  }

  @Patch('admin/banners/:id')
  @ApiOperation({ summary: '更新Banner' })
  async updateBanner(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateBannerDto>,
  ) {
    return this.contentService.updateBanner(id, dto);
  }

  @Delete('admin/banners/:id')
  @ApiOperation({ summary: '删除Banner' })
  async deleteBanner(@Param('id', ParseIntPipe) id: number) {
    await this.contentService.deleteBanner(id);
    return { message: '删除成功' };
  }
}
