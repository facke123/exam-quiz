import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserPayload } from '../decorators/current-user.decorator';

/**
 * 会员权限守卫
 * 校验当前用户是否为 VIP 会员（且会员未过期）
 */
@Injectable()
export class VipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserPayload & {
      vipLevel?: number;
      vipExpireAt?: Date | string;
    };

    if (!user) {
      throw new ForbiddenException('未登录');
    }

    const isVip = user.vipLevel && user.vipLevel > 0;
    const isExpired =
      user.vipExpireAt && new Date(user.vipExpireAt).getTime() < Date.now();

    if (!isVip || isExpired) {
      throw new ForbiddenException('该功能仅限会员使用');
    }

    return true;
  }
}
