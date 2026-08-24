<template>
  <div class="quiz-page">
    <!-- 顶部状态栏 -->
    <div class="quiz-header">
      <div class="back-btn" @click="$router.back()">‹</div>
      <div class="q-progress"><strong>{{ currentIndex + 1 }}</strong> / {{ total }} 题</div>
      <div class="q-actions">
        <div class="qa-item" @click="sheetVisible = true">📋 答题卡</div>
        <div class="qa-item" @click="onFavorite">{{ isFavorited() ? '⭐ 已收藏' : '☆ 收藏' }}</div>
      </div>
    </div>

    <!-- 计时器条（模考/真题时显示） -->
    <div v-if="needCountdown" class="quiz-timer">
      ⏱️ {{ formatTime(remainingSeconds) }}
    </div>

    <div v-if="loading" class="loading-state" style="padding: 60px 16px; text-align: center;">
      <van-loading type="spinner" color="var(--primary)">正在组卷抽取考点试题...</van-loading>
    </div>
    <div v-else-if="questions.length === 0" class="empty-state" style="padding: 60px 16px; text-align: center;">
      <van-empty description="当前科目或章节暂无已发布试题" />
      <van-button type="primary" size="small" round style="margin-top: 12px" @click="$router.push('/')">
        返回首页选择其他科目
      </van-button>
    </div>
    <div v-else-if="currentQuestion" class="quiz-body">
      <QuestionCard
        :question="currentQuestion"
        v-model="currentAnswer"
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
const remainingSeconds = ref(7200)
let timer: any = null

const questions = ref<Question[]>([])
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

function onSubmit() {
  showDialog({
    title: '交卷确认',
    message: `您已答 ${Object.keys(answers.value).length} / ${total.value} 题，确定要交卷吗？`,
    showCancelButton: true,
  }).then(() => {
    router.push({
      path: '/quiz/report/1',
      state: {
        answers: answers.value,
        questions: questions.value,
      },
    })
  })
}

onMounted(async () => {
  if (needCountdown.value) {
    timer = setInterval(() => {
      if (remainingSeconds.value > 0) remainingSeconds.value--
      else onSubmit()
    }, 1000)
  }

  loading.value = true
  try {
    const targetSubjectId = route.query.subjectId || subjectStore.currentSubjectId || '1'
    const targetChapterId = route.query.chapterId ? String(route.query.chapterId) : undefined
    const res = await getQuestions({
      subjectId: String(targetSubjectId),
      chapterId: targetChapterId,
      mode: mode.value,
      count: 20,
    })
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      questions.value = res.data
    } else {
      questions.value = []
    }
  } catch {
    questions.value = []
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
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
