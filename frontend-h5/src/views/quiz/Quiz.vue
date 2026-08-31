<template>
  <div class="quiz-page">
    <!-- 顶部状态栏 -->
    <div class="quiz-header">
      <div
        class="back-btn"
        @click="$router.back()"
      >
        ‹
      </div>
      <div class="q-progress">
        <strong>{{ currentIndex + 1 }}</strong> / {{ total }} 题
      </div>
      <div class="q-actions">
        <div
          class="qa-item"
          @click="sheetVisible = true"
        >
          📋 答题卡
        </div>
        <div
          class="qa-item"
          @click="onFavorite"
        >
          {{ isFavorited() ? '⭐ 已收藏' : '☆ 收藏' }}
        </div>
      </div>
    </div>

    <!-- 计时器条（模考/真题时显示） -->
    <div
      v-if="needCountdown"
      class="quiz-timer"
    >
      ⏱️ {{ formatTime(remainingSeconds) }}
    </div>

    <div
      v-if="loading"
      class="loading-state"
      style="padding: 60px 16px; text-align: center;"
    >
      <van-loading
        type="spinner"
        color="var(--primary)"
      >
        正在组卷抽取考点试题...
      </van-loading>
    </div>
    <div
      v-else-if="questions.length === 0"
      class="empty-state"
      style="padding: 60px 16px; text-align: center;"
    >
      <van-empty description="当前科目或章节暂无已发布试题" />
      <van-button
        type="primary"
        size="small"
        round
        style="margin-top: 12px"
        @click="$router.push('/')"
      >
        返回首页选择其他科目
      </van-button>
    </div>
    <div
      v-else-if="currentQuestion"
      class="quiz-body"
    >
      <QuestionCard
        v-model="currentAnswer"
        :question="currentQuestion"
        :show-result="false"
      />
    </div>

    <!-- 底部操作栏 -->
    <QuizFooter
      v-if="questions.length > 0"
      :current="currentIndex"
      :total="total"
      :favorited="isFavorited()"
      @toggle-favorite="onFavorite"
      @note="onNote"
      @report="onReport"
      @prev="onPrev"
      @next="onNext"
      @submit="onSubmit"
    />

    <!-- 答题卡弹窗抽屉 -->
    <AnswerSheet
      v-model="sheetVisible"
      :list="sheetList"
      :current-index="currentIndex"
      :show-submit="true"
      @select="goTo"
      @submit="onSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showDialog, showToast } from 'vant'
import { useQuizStore } from '@/stores/quiz'
import { useSubjectStore } from '@/stores/subject'
import { getQuestions, type Question } from '@/api/question'
import { getPaperDetail } from '@/api/exam'
import { recordWrong, getWrongList } from '@/api/wrong'
import QuestionCard from '@/components/QuestionCard.vue'
import QuizFooter from '@/components/QuizFooter.vue'
import AnswerSheet from '@/components/AnswerSheet.vue'

const route = useRoute()
const router = useRouter()
const quizStore = useQuizStore()
const subjectStore = useSubjectStore()

const loading = ref(false)
const mode = computed(() => (route.params.mode as string) || (route.query.mode as string) || 'practice')
const needCountdown = computed(() => ['real', 'mock'].includes(mode.value))
const remainingSeconds = ref(9000)
let timer: any = null

const questions = ref<any[]>([])
const currentIndex = ref(0)
const answers = ref<Record<string, string | string[]>>({})
const sheetVisible = ref(false)

const total = computed(() => questions.value.length)
const currentQuestion = computed(() => questions.value[currentIndex.value])

const currentAnswer = computed<string | string[]>({
  get: () => answers.value[currentQuestion.value?.id] || (currentQuestion.value?.type === 'multiple' ? [] : ''),
  set: (v) => {
    if (currentQuestion.value) {
      answers.value[currentQuestion.value.id] = v
    }
  },
})

const sheetList = computed(() =>
  questions.value.map((q) => ({
    answered: !!answers.value[q.id],
    marked: quizStore.favoritedIds.includes(q.id),
  }))
)

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

function isFavorited() {
  return currentQuestion.value ? quizStore.favoritedIds.includes(currentQuestion.value.id) : false
}

function onFavorite() {
  if (currentQuestion.value) {
    quizStore.toggleFavorite(currentQuestion.value.id)
    showToast(isFavorited() ? '已加入收藏' : '已取消收藏')
  }
}

function onNote() {
  showToast('可在解析页记录笔记')
}

function onReport() {
  showDialog({
    title: '题目报错',
    message: '感谢您的反馈，已将该题加入纠错队列。',
  })
}

function onPrev() {
  if (currentIndex.value > 0) currentIndex.value--
}

function onNext() {
  if (currentIndex.value < total.value - 1) {
    currentIndex.value++
  } else {
    onSubmit()
  }
}

function goTo(idx: number) {
  currentIndex.value = idx
  sheetVisible.value = false
}

async function onSubmit() {
  showDialog({
    title: '交卷确认',
    message: `您已答 ${Object.keys(answers.value).length} / ${total.value} 题，确定要交卷吗？`,
    showCancelButton: true,
  }).then(async () => {
    // 自动持久化保存错题到数据库
    for (const q of questions.value) {
      const userAns = answers.value[q.id]
      const rightAns = String(q.answer || '').toUpperCase().trim()
      const formattedUserAns = Array.isArray(userAns)
        ? userAns.sort().join('').toUpperCase().trim()
        : String(userAns || '').toUpperCase().trim()
      if (formattedUserAns !== rightAns) {
        try {
          await recordWrong({
            questionId: q.id,
            subjectId: q.subjectId || subjectStore.currentSubjectId || 4,
            chapterId: q.chapterId,
            userAnswer: formattedUserAns || '未作答',
          })
        } catch {
          // ignore
        }
      }
    }

    const dParam = route.query.duration ? Number(route.query.duration) : undefined
    const durationVal = dParam ? dParam * 60 : (needCountdown.value ? (9000 - remainingSeconds.value) : 180)
    const reportData = {
      answers: answers.value,
      questions: questions.value,
      duration: durationVal,
    }
    try {
      sessionStorage.setItem('last_quiz_report', JSON.stringify(reportData))
    } catch {
      // ignore
    }

    router.push({
      path: '/quiz/report/1',
      state: reportData,
    })
  })
}

onMounted(async () => {
  const paperId = route.query.paperId || (['real', 'mock'].includes(mode.value) ? route.query.examId : undefined)
  const durationParam = route.query.duration ? Number(route.query.duration) : undefined

  loading.value = true
  try {
    if (mode.value === 'wrong') {
      const targetSubjectId = route.query.subjectId || subjectStore.currentSubjectId || '4'
      const wRes = await getWrongList({ subjectId: String(targetSubjectId) })
      if (wRes?.data?.list && Array.isArray(wRes.data.list) && wRes.data.list.length > 0) {
        questions.value = wRes.data.list.map((item: any) => ({
          id: item.questionId || item.id,
          subjectId: item.subjectId,
          chapterId: item.chapterId,
          type: item.type,
          title: item.title || item.content,
          content: item.content || item.title,
          options: item.options || [],
          answer: item.answer || item.correctAnswer,
          analysis: item.analysis,
          difficulty: item.difficulty || 3,
          score: item.score || 1,
        }))
      } else {
        questions.value = []
      }
    } else if (paperId) {
      const res = await getPaperDetail(String(paperId))
      if (res?.data?.questions && Array.isArray(res.data.questions) && res.data.questions.length > 0) {
        questions.value = res.data.questions
        const duration = res.data.duration || durationParam || 150
        remainingSeconds.value = duration * 60
      } else {
        // Fallback 按科目抽题
        const targetSubjectId = route.query.subjectId || subjectStore.currentSubjectId || '1'
        const qRes = await getQuestions({
          subjectId: String(targetSubjectId),
          mode: mode.value,
          count: 75,
        })
        if (qRes?.data && Array.isArray(qRes.data)) {
          questions.value = qRes.data
        }
      }
    } else {
      const targetSubjectId = route.query.subjectId || subjectStore.currentSubjectId || '1'
      const targetChapterId = route.query.chapterId ? String(route.query.chapterId) : undefined
      const targetKpId = route.query.knowledgePointId ? String(route.query.knowledgePointId) : undefined
      const count = route.query.count ? Number(route.query.count) : (['real', 'mock'].includes(mode.value) ? 75 : 20)
      const res = await getQuestions({
        subjectId: String(targetSubjectId),
        chapterId: targetChapterId,
        knowledgePointId: targetKpId,
        mode: mode.value,
        count,
      })
      if (res?.data) {
        if (Array.isArray(res.data)) {
          questions.value = res.data
        } else if (Array.isArray((res.data as any).list)) {
          questions.value = (res.data as any).list
        } else {
          questions.value = []
        }
      } else {
        questions.value = []
      }
    }
  } catch {
    questions.value = []
  } finally {
    loading.value = false
  }

  if (needCountdown.value) {
    timer = setInterval(() => {
      if (remainingSeconds.value > 0) remainingSeconds.value--
      else onSubmit()
    }, 1000)
  }

  // 绑定 PC 键盘快捷键监听
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  window.removeEventListener('keydown', handleKeydown)
})

// PC 桌面端快捷键处理
function handleKeydown(e: KeyboardEvent) {
  // 如果焦点在输入框/富文本中则忽略
  const tag = (document.activeElement?.tagName || '').toLowerCase()
  if (tag === 'input' || tag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) {
    return
  }

  // 方向键左 / PageUp：上一题
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    e.preventDefault()
    onPrev()
    return
  }

  // 方向键右 / PageDown：下一题
  if (e.key === 'ArrowRight' || e.key === 'PageDown') {
    e.preventDefault()
    onNext()
    return
  }

  // 空格键：展开/收起答题卡
  if (e.code === 'Space') {
    e.preventDefault()
    sheetVisible.value = !sheetVisible.value
    return
  }

  // A/B/C/D 或 1/2/3/4 选择选项
  const q = currentQuestion.value
  if (!q) return

  const keyMap: Record<string, string> = {
    '1': 'A',
    '2': 'B',
    '3': 'C',
    '4': 'D',
    'a': 'A',
    'b': 'B',
    'c': 'C',
    'd': 'D',
    'A': 'A',
    'B': 'B',
    'C': 'C',
    'D': 'D',
  }

  const selectedOpt = keyMap[e.key]
  if (selectedOpt) {
    if (q.type === 'multiple') {
      const current = Array.isArray(currentAnswer.value) ? [...currentAnswer.value] : []
      const idx = current.indexOf(selectedOpt)
      if (idx > -1) {
        current.splice(idx, 1)
      } else {
        current.push(selectedOpt)
      }
      currentAnswer.value = current
    } else if (q.type === 'single' || q.type === 'judge') {
      currentAnswer.value = selectedOpt
    }
  }
}
</script>

<style scoped lang="scss">
.quiz-page {
  min-height: 100vh;
  background: var(--gray-1);
  padding-bottom: 80px;
}

.quiz-header {
  height: 48px;
  background: var(--gray-0);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid var(--gray-2);
  position: sticky;
  top: 0;
  z-index: 50;

  .back-btn {
    font-size: 24px;
    color: var(--gray-7);
    cursor: pointer;
  }

  .q-progress {
    font-size: 15px;
    color: var(--gray-6);

    strong {
      color: var(--primary);
      font-size: 17px;
    }
  }

  .q-actions {
    display: flex;
    gap: 12px;

    .qa-item {
      font-size: 13px;
      color: var(--gray-7);
      cursor: pointer;
      font-weight: 500;
    }
  }
}

.quiz-timer {
  background: #fffbeb;
  color: #d97706;
  text-align: center;
  padding: 6px;
  font-size: 13px;
  font-weight: 700;
  border-bottom: 1px solid #fef3c7;
}

.quiz-body {
  padding: 14px;
}
</style>
