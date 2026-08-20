/**
 * 校验工具函数
 */

/** 手机号校验 */
export function isPhone(value: string): boolean {
  return /^1[3-9]\d{9}$/.test(value)
}

/** 邮箱校验 */
export function isEmail(value: string): boolean {
  return /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(value)
}

/** 手机号或邮箱 */
export function isAccount(value: string): boolean {
  return isPhone(value) || isEmail(value)
}

/** 密码强度：返回 0-4 */
export function passwordStrength(password: string): number {
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password) && /[^a-zA-Z\d]/.test(password)) score++
  return score
}

/** 密码强度文字 */
export function strengthText(score: number): string {
  return ['很弱', '较弱', '一般', '较强', '很强'][score] || '一般'
}

/** 密码强度颜色 */
export function strengthColor(score: number): string {
  return ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#22c55e'][score] || '#f59e0b'
}

/** 密码是否符合最低要求（6-20位） */
export function isValidPassword(password: string): boolean {
  return password.length >= 6 && password.length <= 20
}

/** 验证码校验（6位数字） */
export function isVerifyCode(code: string): boolean {
  return /^\d{6}$/.test(code)
}
