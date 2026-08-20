import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '@/utils/storage'

export interface Subject {
  id: string
  name: string
  level: '初级' | '中级' | '高级'
  category: string
  examDate?: string
  icon: string
}

export const useSubjectStore = defineStore('subject', () => {
  const subjectList = ref<Subject[]>([
    { id: 'ruankao_sysarch', name: '系统架构设计师', level: '高级', category: '软件', icon: '🏢' },
    { id: 'ruankao_sysana', name: '系统分析师', level: '高级', category: '软件', icon: '📊' },
    { id: 'ruankao_soft', name: '软件设计师', level: '中级', category: '软件', icon: '💻' },
    { id: 'ruankao_net', name: '网络工程师', level: '中级', category: '网络', icon: '🌐' },
    { id: 'ruankao_pm', name: '系统集成项目管理工程师', level: '中级', category: '管理', icon: '📋' },
    { id: 'ruankao_program', name: '程序员', level: '初级', category: '软件', icon: '⌨️' },
    { id: 'ruankao_netadm', name: '网络管理员', level: '初级', category: '网络', icon: '🔧' },
    { id: 'ruankao_infosec', name: '信息安全工程师', level: '中级', category: '安全', icon: '🔒' }
  ])

  const currentSubjectId = ref<string>(
    storage.get<string>('currentSubjectId') || 'ruankao_soft'
  )

  const currentSubject = computed(
    () => subjectList.value.find((s) => s.id === currentSubjectId.value) || subjectList.value[0]
  )

  function switchSubject(id: string) {
    currentSubjectId.value = id
    storage.set('currentSubjectId', id)
  }

  return {
    subjectList,
    currentSubjectId,
    currentSubject,
    switchSubject
  }
})
