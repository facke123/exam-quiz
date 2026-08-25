import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 文件与图片上传服务
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * 上传图片
   */
  async uploadImage(file: Express.Multer.File, purpose = 'images'): Promise<{
    url: string;
    filename: string;
    size: number;
  }> {
    const uploadDir = path.join(process.cwd(), 'uploads', purpose);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.originalname || '.png') || '.png';
    const cleanBase = path.basename(file.originalname || 'image', ext).replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5]/g, '_');
    const filename = `${Date.now()}-${cleanBase}${ext}`;
    const filePath = path.join(uploadDir, filename);

    if (file.buffer) {
      fs.writeFileSync(filePath, file.buffer);
    }

    const url = `/api/uploads/${purpose}/${filename}`;
    this.logger.log(`文件上传成功: ${file.originalname} -> ${url}`);

    return {
      url,
      filename,
      size: file.size,
    };
  }

  /**
   * 上传文件
   */
  async uploadFile(file: Express.Multer.File, purpose = 'files'): Promise<{
    url: string;
    filename: string;
    size: number;
  }> {
    return this.uploadImage(file, purpose);
  }

  /**
   * 删除文件
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      if (fileUrl.startsWith('/api/uploads/')) {
        const relativePath = fileUrl.replace('/api/uploads/', '');
        const fullPath = path.join(process.cwd(), 'uploads', relativePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          this.logger.log(`删除文件成功: ${fullPath}`);
        }
      }
    } catch (err: any) {
      this.logger.warn(`删除文件失败: ${err.message}`);
    }
  }
}

