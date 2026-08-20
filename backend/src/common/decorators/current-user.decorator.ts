import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 当前用户信息接口
 */
export interface UserPayload {
  /** 用户ID */
  id: number;
  /** 用户名 */
  username: string;
  /** 昵称 */
  nickname?: string;
  /** VIP 等级 */
  vipLevel?: number;
}

/**
 * @CurrentUser() 参数装饰器
 * 从 request.user 中获取当前登录用户信息
 */
export const CurrentUser = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserPayload;
    return data ? user?.[data] : user;
  },
);
