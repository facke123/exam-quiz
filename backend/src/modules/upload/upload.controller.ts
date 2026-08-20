import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Query,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { UploadFileDto } from './dto/upload.dto';

/**
 * 文件上传控制器
 */
@ApiTags('文件上传')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiOperation({ summary: '上传图片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '上传图片文件',
    type: UploadFileDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('purpose') purpose?: string,
  ) {
    return this.uploadService.uploadImage(file, purpose);
  }

  @Post('file')
  @ApiOperation({ summary: '上传文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '上传文件',
    type: UploadFileDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('purpose') purpose?: string,
  ) {
    return this.uploadService.uploadFile(file, purpose);
  }

  @Delete('file')
  @ApiOperation({ summary: '删除文件' })
  async deleteFile(@Query('url') url: string) {
    await this.uploadService.deleteFile(url);
    return { message: '删除成功' };
  }
}
