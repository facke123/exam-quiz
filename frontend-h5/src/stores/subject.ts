import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '@/utils/storage'
import { getSubjects } from '@/api/exam'

export interface Subject {
  id: number | string
  name: string
  level?: string
  category?: string
  description?: string
  examDate?: string
  examTitle?: string
  icon: string
  questionCount?: number
  sort?: number
  bg?: string
}

export const useSubjectStore = defineStore('subject', () => {
  const subjectList = ref<Subject[]>([])
  const loading = ref(false)

  // 默认图标和背景映射
  const defaultIcons: Record<string, { icon: string; bg: string }> = {
    '系统集成管理工程师': { icon: '📋', bg: 'var(--primary-bg)' },
    '系统集成项目管理工程师': { icon: '📋', bg: 'var(--primary-bg)' },
    '信息系统项目管理师': { icon: '📊', bg: 'var(--success-bg)' },
    '软件设计师': { icon: '💻', bg: 'var(--primary-bg)' },
    '网络工程师': { icon: '🌐', bg: 'var(--cyan-bg)' },
    '信息系统监理师': { icon: '🏗️', bg: 'var(--warning-bg)' },
    '系统架构设计师': { icon: '🏢', bg: 'var(--purple-bg)' },
    '程序员': { icon: '⌨️', bg: 'var(--gray-2)' },
  }

  const currentSubjectId = ref<number | string>(
    storage.get<number | string>('currentSubjectId') || ''
  )

  const currentSubject = computed(() => {
    if (!subjectList.value.length) return null
    const found = subjectList.value.find(
      (s) => String(s.id) === String(currentSubjectId.value)
    )
    return found || subjectList.value[0]
  })

  async function fetchSubjects() {
    loading.value = true
    try {
      const res = await getSubjects()
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        subjectList.value = res.data.map((s: any) => {
          const matchedMeta = defaultIcons[s.name] || { icon: s.icon || '💻', bg: 'var(--primary-bg)' }
          return {
            id: s.id,
            name: s.name,
            level: s.name.includes('高级') || s.name.includes('师') ? '高级' : '中级',
            category: s.category || '软考',
            description: s.description || '',
            examDate: s.examDate || '',
            examTitle: s.examTitle || '',
            icon: matchedMeta.icon,
            bg: matchedMeta.bg,
            questionCount: s.questionCount || 0,
            sort: s.sort || 0,
          }
        })

        // 若当前未选择或选择的科目不存在，默认选中真实列表中第一个有效科目
        if (
          !currentSubjectId.value ||
          !subjectList.value.some((s) => String(s.id) === String(currentSubjectId.value))
        ) {
          currentSubjectId.value = subjectList.value[0].id
          storage.set('currentSubjectId', subjectList.value[0].id)
        }
      }
    } catch {
      // 容错处理
    } finally {
      loading.value = false
    }
  }

  function switchSubject(id: number | string) {
    currentSubjectId.value = id
    storage.set('currentSubjectId', id)
  }

  return {
    subjectList,
    loading,
    currentSubjectId,
    currentSubject,
    fetchSubjects,
    switchSubject,
  }
})
