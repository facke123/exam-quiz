// 校验工具函数

export function isEmail(value: string): boolean {
  return /^[\w.-]+@[\w-]+(\.[\w-]+)+$/.test(value)
}

export function isPhone(value: string): boolean {
  return /^1[3-9]\d{9}$/.test(value)
}

export function isUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

export function isUsername(value: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(value)
}

// 密码强度：至少8位，含字母和数字
export function isPassword(value: string): boolean {
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&_]{8,20}$/.test(value)
}

// 身份证号
export function isIdCard(value: string): boolean {
  return /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(value)
}

// 非空
export function isNotEmpty(value: any): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}
