/**
 * localStorage 封装，自动 JSON 序列化
 */

const PREFIX = 'ruankao_'

export const storage = {
  get<T = any>(key: string): T | null {
    const fullKey = PREFIX + key
    const raw = localStorage.getItem(fullKey)
    if (raw === null) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return raw as unknown as T
    }
  },

  set<T = any>(key: string, value: T): void {
    const fullKey = PREFIX + key
    const str = typeof value === 'string' ? value : JSON.stringify(value)
    localStorage.setItem(fullKey, str)
  },

  remove(key: string): void {
    const fullKey = PREFIX + key
    localStorage.removeItem(fullKey)
  },

  clear(): void {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  },

  has(key: string): boolean {
    return localStorage.getItem(PREFIX + key) !== null
  }
}

export default storage
