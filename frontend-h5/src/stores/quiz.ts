import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type { Question } from '@/api/question'
import { getFavoriteIds, addFavorite, removeFavorite } from '@/api/favorite'

export const useQuizStore = defineStore('quiz', () => {
  const recordId = ref<string>('')
  const mode = ref<string>('')
  const questionList = ref<Question[]>([])
  const currentIndex = ref<number>(0)
  const answers = reactive<Record<string, string | string[]>>({})
  const duration = ref<number>(0)
  const favoritedIds = ref<string[]>([])
  const notesMap = reactive<Record<string, string>>({})

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

  async function fetchFavorites() {
    try {
      const res = await getFavoriteIds()
      if (res?.data?.ids && Array.isArray(res.data.ids)) {
        favoritedIds.value = res.data.ids.map(String)
      }
    } catch {
      // ignore
    }
  }

  function isFavorited(questionId: string | number) {
    const sId = String(questionId)
    return favoritedIds.value.includes(sId)
  }

  async function toggleFavorite(questionId: string | number): Promise<boolean> {
    const sId = String(questionId)
    const idx = favoritedIds.value.indexOf(sId)
    const currentlyFavorited = idx > -1

    if (currentlyFavorited) {
      favoritedIds.value.splice(idx, 1)
      try {
        await removeFavorite(questionId)
      } catch {
        // rollback if failed
        favoritedIds.value.push(sId)
        return true
      }
      return false
    } else {
      favoritedIds.value.push(sId)
      try {
        await addFavorite(questionId)
      } catch {
        // rollback if failed
        const rollbackIdx = favoritedIds.value.indexOf(sId)
        if (rollbackIdx > -1) favoritedIds.value.splice(rollbackIdx, 1)
        return false
      }
      return true
    }
  }

  function setNote(questionId: string | number, note: string) {
    notesMap[String(questionId)] = note
  }

  function hasNote(questionId: string | number) {
    return !!notesMap[String(questionId)]
  }

  function reset() {
    recordId.value = ''
    mode.value = ''
    questionList.value = []
    currentIndex.value = 0
    Object.keys(answers).forEach((k) => delete answers[k])
    duration.value = 0
    favoritedIds.value = []
    Object.keys(notesMap).forEach((k) => delete notesMap[k])
  }

  return {
    recordId,
    mode,
    questionList,
    currentIndex,
    answers,
    duration,
    favoritedIds,
    notesMap,
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
    fetchFavorites,
    isFavorited,
    toggleFavorite,
    setNote,
    hasNote,
    reset
  }
})
