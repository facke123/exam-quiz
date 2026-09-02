import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('系统状态')
@Controller()
export class AppController {
  @Public()
  @Get('health')
  @ApiOperation({ summary: '系统健康检查接口' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'API 根路径服务探活' })
  root() {
    return {
      name: 'exam-quiz-api',
      status: 'online',
      version: '1.0.0',
      time: new Date().toISOString(),
    };
  }
}
