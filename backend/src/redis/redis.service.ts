import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { getRedisConfig } from '../config/redis.config';

/**
 * Redis 服务
 * 封装 ioredis 常用操作（支持开发模式内存降级）
 */
@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private memoryStore = new Map<string, { value: string; expireAt?: number }>();

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    try {
      const config = getRedisConfig(this.configService);
      this.client = new Redis({
        ...config,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
      });

      this.client.connect().then(() => {
        this.logger.log('Redis 连接成功');
      }).catch((err) => {
        this.logger.warn(`Redis 连接失败，已启用内存缓存降级: ${err.message}`);
        this.client = null;
      });

      this.client.on('error', (err) => {
        this.logger.warn(`Redis 异常，使用内存降级: ${err.message}`);
      });
    } catch (e: any) {
      this.logger.warn(`Redis 初始化跳过，使用内存降级: ${e.message}`);
      this.client = null;
    }
  }

  /**
   * 获取底层 Redis 客户端
   */
  getClient(): Redis | null {
    return this.client;
  }

  /**
   * 获取值
   */
  async get(key: string): Promise<string | null> {
    if (this.client) {
      try {
        return await this.client.get(key);
      } catch {
        // fallback
      }
    }
    const data = this.memoryStore.get(key);
    if (!data) return null;
    if (data.expireAt && data.expireAt < Date.now()) {
      this.memoryStore.delete(key);
      return null;
    }
    return data.value;
  }

  /**
   * 设置值
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (this.client) {
      try {
        if (ttl) {
          await this.client.set(key, value, 'EX', ttl);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch {
        // fallback
      }
    }
    const expireAt = ttl ? Date.now() + ttl * 1000 : undefined;
    this.memoryStore.set(key, { value, expireAt });
  }

  /**
   * 删除键
   */
  async del(key: string): Promise<number> {
    if (this.client) {
      try {
        return await this.client.del(key);
      } catch {
        // fallback
      }
    }
    const existed = this.memoryStore.has(key);
    this.memoryStore.delete(key);
    return existed ? 1 : 0;
  }

  /**
   * 设置过期时间
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (this.client) {
      try {
        const result = await this.client.expire(key, seconds);
        return result === 1;
      } catch {
        // fallback
      }
    }
    const data = this.memoryStore.get(key);
    if (data) {
      data.expireAt = Date.now() + seconds * 1000;
      return true;
    }
    return false;
  }

  /**
   * 自增
   */
  async incr(key: string): Promise<number> {
    if (this.client) {
      try {
        return await this.client.incr(key);
      } catch {
        // fallback
      }
    }
    const current = await this.get(key);
    const newVal = current ? parseInt(current, 10) + 1 : 1;
    await this.set(key, newVal.toString());
    return newVal;
  }

  /**
   * 自减
   */
  async decr(key: string): Promise<number> {
    if (this.client) {
      try {
        return await this.client.decr(key);
      } catch {
        // fallback
      }
    }
    const current = await this.get(key);
    const newVal = current ? parseInt(current, 10) - 1 : -1;
    await this.set(key, newVal.toString());
    return newVal;
  }

  /**
   * 判断键是否存在
   */
  async exists(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  }
}
