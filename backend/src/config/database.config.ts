import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

/**
 * TypeORM 配置
 * 供 TypeOrmModule.forRootAsync 使用
 */
export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: configService.get('database.host'),
  port: configService.get('database.port'),
  username: configService.get('database.username'),
  password: configService.get('database.password'),
  database: configService.get('database.database'),
  autoLoadEntities: true,
  synchronize: configService.get('database.synchronize'),
  logging: configService.get('database.logging'),
  timezone: '+08:00',
  charset: 'utf8mb4',
  entities: [join(__dirname, '..', 'database', 'entities', '*.entity{.ts,.js}')],
  migrations: [join(__dirname, '..', 'database', 'migrations', '*{.ts,.js}')],
});
