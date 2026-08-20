import { SetMetadata } from '@nestjs/common';

/**
 * 角色元数据标识
 */
export const ROLES_KEY = 'roles';

/**
 * @Roles() 方法装饰器
 * 标记访问该接口所需的角色
 * @example @Roles('admin', 'super_admin')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
