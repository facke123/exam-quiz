import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from '@/database/entities/user.entity';
import { PracticeRecord } from '@/database/entities/practice-record.entity';
import { Subject } from '@/database/entities/subject.entity';

/**
 * 用户模块
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, PracticeRecord, Subject])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
