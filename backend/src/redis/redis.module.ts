import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Redis 模块（全局）
 * 提供 ioredis 客户端
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
