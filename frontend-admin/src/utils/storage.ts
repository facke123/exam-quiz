const PREFIX = 'ruankao_admin_'

export const storage = {
  get<T = any>(key: string): T | null {
    const fullKey = PREFIX + key
    const value = localStorage.getItem(fullKey)
    if (value === null) return null
    try {
      return JSON.parse(value) as T
    } catch {
      return value as unknown as T
    }
  },

  set(key: string, value: any): void {
    const fullKey = PREFIX + key
    const str = typeof value === 'string' ? value : JSON.stringify(value)
    localStorage.setItem(fullKey, str)
  },

  remove(key: string): void {
    localStorage.removeItem(PREFIX + key)
  },

  clear(): void {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  },
}
