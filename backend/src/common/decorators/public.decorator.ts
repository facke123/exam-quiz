import { SetMetadata } from '@nestjs/common';

/**
 * 公开接口元数据标识
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() 方法装饰器
 * 标记某个接口为公开接口，不需要 JWT 认证
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
