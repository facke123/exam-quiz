import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Admin } from '@/database/entities/admin.entity';
import { User } from '@/database/entities/user.entity';
import { SystemConfig } from '@/database/entities/system-config.entity';
import { OperationLog } from '@/database/entities/operation-log.entity';

/**
 * 管理模块
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, User, SystemConfig, OperationLog]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
