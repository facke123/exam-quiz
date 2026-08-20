import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 文件上传服务
 * 对接 MinIO 对象存储
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * 上传图片
   * TODO: 对接 MinIO SDK 实现实际文件上传
   */
  async uploadImage(file: Express.Multer.File, purpose?: string): Promise<{
    url: string;
    filename: string;
    size: number;
  }> {
    const bucket = this.configService.get('minio.bucket');
    const endpoint = this.configService.get('minio.endPoint');
    const port = this.configService.get('minio.port');
    const useSSL = this.configService.get('minio.useSSL');
    const protocol = useSSL ? 'https' : 'http';

    // TODO: 调用 MinIO client.putObject 上传
    const filename = `${Date.now()}-${file.originalname}`;
    const url = `${protocol}://${endpoint}:${port}/${bucket}/${purpose || 'images'}/${filename}`;

    this.logger.log(`文件上传: ${file.originalname} -> ${url}`);

    return {
      url,
      filename,
      size: file.size,
    };
  }

  /**
   * 上传文件
   */
  async uploadFile(file: Express.Multer.File, purpose?: string): Promise<{
    url: string;
    filename: string;
    size: number;
  }> {
    // 复用图片上传逻辑
    return this.uploadImage(file, purpose);
  }

  /**
   * 删除文件
   * TODO: 对接 MinIO 删除文件
   */
  async deleteFile(fileUrl: string): Promise<void> {
    this.logger.log(`删除文件: ${fileUrl}`);
    // TODO: 解析URL获取bucket和objectName，调用 MinIO client.removeObject
  }
}
