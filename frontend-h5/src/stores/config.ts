import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getPublicConfig } from '@/api/content'

export const useConfigStore = defineStore('config', () => {
  const configs = ref<Record<string, string>>({
    exam_countdown_date: '2026-11-08 09:00:00',
    exam_countdown_title: '2026年全国软考统考',
    site_name: '软考刷题宝',
  })
  const loaded = ref(false)

  const examCountdownDate = computed(() => configs.value.exam_countdown_date || '2026-11-08 09:00:00')
  const examCountdownTitle = computed(() => configs.value.exam_countdown_title || '2026年全国软考统考')

  const examCountdownDateFormatted = computed(() => {
    const raw = examCountdownDate.value.trim()
    if (!raw) return '2026年11月08日'
    try {
      const dt = new Date(raw.replace(/-/g, '/'))
      if (isNaN(dt.getTime())) return raw
      return `${dt.getFullYear()}年${String(dt.getMonth() + 1).padStart(2, '0')}月${String(dt.getDate()).padStart(2, '0')}日`
    } catch {
      return raw
    }
  })

  const examDays = computed(() => {
    try {
      const raw = examCountdownDate.value.trim()
      const target = new Date(raw.replace(/-/g, '/'))
      if (isNaN(target.getTime())) return 0
      const now = new Date()
      const diff = target.getTime() - now.getTime()
      if (diff > 0) {
        return Math.ceil(diff / (1000 * 60 * 60 * 24))
      }
      return 0
    } catch {
      return 0
    }
  })

  async function fetchConfig(force = false) {
    if (loaded.value && !force) return
    try {
      const res = await getPublicConfig()
      if (res?.data) {
        configs.value = {
          ...configs.value,
          ...res.data,
        }
        loaded.value = true
      }
    } catch {
      // ignore
    }
  }

  return {
    configs,
    loaded,
    examCountdownDate,
    examCountdownTitle,
    examCountdownDateFormatted,
    examDays,
    fetchConfig,
  }
})
