import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

/**
 * Redis 配置
 * 供 RedisModule 使用
 */
export const getRedisConfig = (
  configService: ConfigService,
): RedisOptions => ({
  host: configService.get('redis.host'),
  port: configService.get('redis.port'),
  password: configService.get('redis.password'),
  db: configService.get('redis.db'),
  keyPrefix: configService.get('redis.keyPrefix'),
  retryStrategy: (times: number) => {
    if (times > 3) {
      return null;
    }
    return Math.min(times * 200, 2000);
  },
});
