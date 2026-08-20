import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { getRedisConfig } from '../config/redis.config';

/**
 * Redis 服务
 * 封装 ioredis 常用操作
 */
@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.client = new Redis(getRedisConfig(this.configService));
    this.client.on('connect', () => {
      this.logger.log('Redis 连接成功');
    });
    this.client.on('error', (err) => {
      this.logger.error(`Redis 连接错误: ${err.message}`);
    });
  }

  /**
   * 获取底层 Redis 客户端
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * 获取值
   */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /**
   * 设置值
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.set(key, value, 'EX', ttl);
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * 删除键
   */
  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  /**
   * 设置过期时间
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.client.expire(key, seconds);
    return result === 1;
  }

  /**
   * 自增
   */
  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  /**
   * 自减
   */
  async decr(key: string): Promise<number> {
    return this.client.decr(key);
  }

  /**
   * 判断键是否存在
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * 获取哈希字段值
   */
  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  /**
   * 设置哈希字段值
   */
  async hset(key: string, field: string, value: string): Promise<number> {
    return this.client.hset(key, field, value);
  }

  /**
   * 获取哈希所有字段
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  /**
   * 删除哈希字段
   */
  async hdel(key: string, ...fields: string[]): Promise<number> {
    return this.client.hdel(key, ...fields);
  }

  /**
   * 向列表左侧插入
   */
  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.client.lpush(key, ...values);
  }

  /**
   * 从列表右侧弹出
   */
  async rpop(key: string): Promise<string | null> {
    return this.client.rpop(key);
  }

  /**
   * 获取列表长度
   */
  async llen(key: string): Promise<number> {
    return this.client.llen(key);
  }

  /**
   * 设置集合成员
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.client.sadd(key, ...members);
  }

  /**
   * 判断是否为集合成员
   */
  async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.client.sismember(key, member);
    return result === 1;
  }

  /**
   * 获取集合所有成员
   */
  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }
}
