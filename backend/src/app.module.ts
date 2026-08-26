import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { RedisModule } from './redis/redis.module';
import { SnakeNamingStrategy } from './common/strategies/snake-naming.strategy';
import { AuthModule } from './modules/auth/auth.module';
import { QuestionModule } from './modules/question/question.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { UserModule } from './modules/user/user.module';
import { VipModule } from './modules/vip/vip.module';
import { AiModule } from './modules/ai/ai.module';
import { StatsModule } from './modules/stats/stats.module';
import { AdminModule } from './modules/admin/admin.module';
import { ExamModule } from './modules/exam/exam.module';
import { UploadModule } from './modules/upload/upload.module';
import { ContentModule } from './modules/content/content.module';
import { MailModule } from './modules/mail/mail.module';

@Module({
  imports: [
    // 配置模块（全局）
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      load: [configuration],
    }),
    // TypeORM 数据库模块
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        autoLoadEntities: true,
        synchronize: false,
        namingStrategy: new SnakeNamingStrategy(),
        logging: configService.get('database.logging'),
        timezone: '+08:00',
        charset: 'utf8mb4',
      }),
    }),
    // Redis 模块
    RedisModule,
    // 业务模块
    AuthModule,
    QuestionModule,
    QuizModule,
    UserModule,
    VipModule,
    AiModule,
    StatsModule,
    AdminModule,
    ExamModule,
    UploadModule,
    ContentModule,
    MailModule,
  ],
})
export class AppModule {}
