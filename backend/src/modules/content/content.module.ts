import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { Announcement } from '@/database/entities/announcement.entity';
import { Banner } from '@/database/entities/banner.entity';

/**
 * 内容管理模块
 */
@Module({
  imports: [TypeOrmModule.forFeature([Announcement, Banner])],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
