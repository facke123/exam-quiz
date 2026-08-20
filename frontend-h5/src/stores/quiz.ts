import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type { Question } from '@/api/question'

export const useQuizStore = defineStore('quiz', () => {
  const recordId = ref<string>('')
  const mode = ref<string>('')
  const questionList = ref<Question[]>([])
  const currentIndex = ref<number>(0)
  const answers = reactive<Record<string, string | string[]>>({})
  const duration = ref<number>(0)
  const favoritedIds = ref<string[]>([])

  const total = () => questionList.value.length
  const currentQuestion = () => questionList.value[currentIndex.value]
  const answeredCount = () => Object.keys(answers).filter((k) => answers[k]).length
  const progress = () => (total() ? Math.round((answeredCount() / total()) * 100) : 0)

  function setQuestions(list: Question[]) {
    questionList.value = list
  }

  function setAnswer(questionId: string, answer: string | string[]) {
    answers[questionId] = answer
  }

  function getAnswer(questionId: string) {
    return answers[questionId]
  }

  function next() {
    if (currentIndex.value < questionList.value.length - 1) {
      currentIndex.value++
    }
  }

  function prev() {
    if (currentIndex.value > 0) {
      currentIndex.value--
    }
  }

  function goTo(index: number) {
    currentIndex.value = Math.min(Math.max(0, index), questionList.value.length - 1)
  }

  function toggleFavorite(questionId: string) {
    const idx = favoritedIds.value.indexOf(questionId)
    if (idx > -1) {
      favoritedIds.value.splice(idx, 1)
    } else {
      favoritedIds.value.push(questionId)
    }
  }

  function reset() {
    recordId.value = ''
    mode.value = ''
    questionList.value = []
    currentIndex.value = 0
    Object.keys(answers).forEach((k) => delete answers[k])
    duration.value = 0
    favoritedIds.value = []
  }

  return {
    recordId,
    mode,
    questionList,
    currentIndex,
    answers,
    duration,
    favoritedIds,
    total,
    currentQuestion,
    answeredCount,
    progress,
    setQuestions,
    setAnswer,
    getAnswer,
    next,
    prev,
    goTo,
    toggleFavorite,
    reset
  }
})
