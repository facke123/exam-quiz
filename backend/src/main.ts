import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 静态资源服务（题目配图、上传文件）
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.useStaticAssets(uploadDir, { prefix: '/api/uploads/' });

  // 全局前缀
  app.setGlobalPrefix('api');

  // 启用 CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // 全局 ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局拦截器
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // Swagger 文档配置
  const config = new DocumentBuilder()
    .setTitle('软考刷题系统 API 接口文档')
    .setDescription(
      `### 软考刷题与AI智能备考系统后端接口规范
- **默认管理员账号**：\`admin\` / \`admin123\`
- **前台测试账号**：可调用 \`/api/auth/register\` 快速注册，或使用手机号 \`13800138000\` / \`Pass1234\`
- **鉴权方式**：点击右侧 **Authorize** 按钮输入 Bearer Token（从登录接口获取）即可发起调试。`,
    )
    .setVersion('1.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: '请输入 JWT Token（不需要带 Bearer 前缀）',
    })
    .addTag('认证', '用户注册、登录、找回密码、密码修改与基本信息')
    .addTag('用户', '用户个人中心、目标考试日期与当前科目切换')
    .addTag('题库', '前台题目检索、题目解析、后台题库管理与查重纠错')
    .addTag('做题', '组卷练习、答题进度、交卷判分、错题本与艾宾浩斯复习')
    .addTag('考试与试卷管理', '科目管理、章节拓扑树、知识点管理与自动组卷')
    .addTag('AI', 'AI出题、大纲考点自动解析归纳、AI解析生成与Prompt模板')
    .addTag('统计', '前后台学习总览、雷达图、用户增长、营收与做题统计')
    .addTag('会员', 'VIP套餐列表、订单创建、支付回调与退款流程')
    .addTag('内容管理', '公告与轮播Banner图管理')
    .addTag('文件上传', '题目配图与考纲文档上传接口')
    .addTag('管理', '管理后台管理员、用户权限、系统配置与操作审计日志')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: '软考刷题系统 API 接口文档',
  });

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger docs at: http://localhost:${port}/api/docs`);
}

bootstrap();
