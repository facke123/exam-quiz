<template>
  <div class="quiz-page">
    <van-nav-bar left-arrow @click-left="$router.back()" :border="false">
      <template #title>
        <CountdownTimer v-if="needCountdown" :duration="totalDuration" @finish="onSubmit" />
      </template>
      <template #right>
        <span class="answer-sheet-btn" @click="sheetVisible = true">答题卡</span>
      </template>
    </van-nav-bar>

    <div v-if="currentQuestion" class="quiz-body">
      <!-- 题号进度 -->
      <div class="progress-line">
        <van-progress
          :percentage="progressPercent"
          stroke-width="3"
          color="linear-gradient(90deg, #6366F1, #8B5CF6)"
          track-color="#EEF2FF"
          :show-pivot="false"
        />
        <span class="progress-text">{{ currentIndex + 1 }} / {{ total }}</span>
      </div>

      <QuestionCard
        :question="currentQuestion"
        v-model="currentAnswer"
        :show-result="answered"
      />

      <!-- 做题信息 -->
      <div class="quiz-info">
        <van-tag plain size="medium">{{ questionTypeText(currentQuestion.type) }}</van-tag>
        <span v-if="currentQuestion.knowledgePoint" class="kp">
          考点：{{ currentQuestion.knowledgePoint }}
        </span>
      </div>
    </div>

    <QuizFooter
      :current="currentIndex"
      :total="total"
      :favorited="isFavorited"
      @toggle-favorite="onFavorite"
      @note="onNote"
      @report="onReport"
      @prev="onPrev"
      @next="onNext"
      @submit="onSubmit"
    />

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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showDialog, showToast } from 'vant'
import { useQuizStore } from '@/stores/quiz'
import { useSubjectStore } from '@/stores/subject'
import { getQuestions, type Question } from '@/api/question'
import { createRecord, submit } from '@/api/quiz'
import { questionTypeText } from '@/utils/format'
import QuestionCard from '@/components/QuestionCard.vue'
import QuizFooter from '@/components/QuizFooter.vue'
import AnswerSheet from '@/components/AnswerSheet.vue'
import CountdownTimer from '@/components/CountdownTimer.vue'

const route = useRoute()
const router = useRouter()
const quizStore = useQuizStore()
const subjectStore = useSubjectStore()

const mode = computed(() => route.params.mode as string)
const chapterId = computed(() => (route.query.chapterId as string) || '')
const needCountdown = computed(() => ['real', 'mock'].includes(mode.value))
const totalDuration = computed(() => (mode.value === 'real' ? 10800 : 7200))

const questions = ref<Question[]>([])
const currentIndex = ref(0)
const answers = ref<Record<string, string | string[]>>({})
const answered = ref(false)
const sheetVisible = ref(false)

const total = computed(() => questions.value.length)
const currentQuestion = computed(() => questions.value[currentIndex.value])

const currentAnswer = computed<string | string[]>({
  get: () => answers.value[currentQuestion.value?.id] || (currentQuestion.value?.type === 'multiple' ? [] : ''),
  set: (v) => {
    if (currentQuestion.value) {
      answers.value[currentQuestion.value.id] = v
    }
  }
})

const progressPercent = computed(() =>
  total.value ? Math.round(((currentIndex.value + 1) / total.value) * 100) : 0
)

const sheetList = computed(() =>
  questions.value.map((q) => ({
    answered: !!answers.value[q.id],
    marked: quizStore.favoritedIds.includes(q.id)
  }))
)

function isFavorited() {
  return currentQuestion.value ? quizStore.favoritedIds.includes(currentQuestion.value.id) : false
}

function onFavorite() {
  if (currentQuestion.value) {
    quizStore.toggleFavorite(currentQuestion.value.id)
  }
}

function onNote() {
  router.push(`/quiz/analysis/${currentQuestion.value?.id}`)
}

function onReport() {
  showDialog({
    title: '题目报错',
    message: '请描述问题，我们会尽快处理',
    showCancelButton: true
  })
}

function onPrev() {
  if (currentIndex.value > 0) currentIndex.value--
}

function onNext() {
  if (currentIndex.value < total.value - 1) currentIndex.value++
  else onSubmit()
}

function goTo(idx: number) {
  currentIndex.value = idx
  sheetVisible.value = false
}

async function onSubmit() {
  const unanswered = total.value - Object.keys(answers.value).filter((k) => answers.value[k]).length
  try {
    await showDialog({
      title: '确认交卷',
      message: `还有 ${unanswered} 题未作答，确认交卷吗？`,
      showCancelButton: true
    })
  } catch {
    return
  }

  try {
    const res = await submit({
      recordId: quizStore.recordId || 'temp',
      answers: answers.value
    })
    router.replace(`/quiz/report/${res.data.recordId}`)
  } catch {
    showToast('交卷失败')
  }
}

onMounted(async () => {
  quizStore.reset()
  try {
    const res = await getQuestions({
      subjectId: subjectStore.currentSubjectId,
      chapterId: chapterId.value,
      mode: mode.value,
      count: mode.value === 'daily' ? 10 : 50
    })
    questions.value = res.data
  } catch {
    questions.value = [
      {
        id: 'q1',
        type: 'single',
        title: '在软件开发过程中，瀑布模型的主要优点是什么？',
        options: [
          { key: 'A', content: '需求明确，阶段清晰' },
          { key: 'B', content: '灵活应对需求变更' },
          { key: 'C', content: '快速交付原型' },
          { key: 'D', content: '支持迭代开发' }
        ],
        analysis: '瀑布模型强调阶段顺序，适用于需求明确的项目。',
        answer: 'A',
        knowledgePoint: '软件工程',
        difficulty: 2,
        score: 1
      }
    ]
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.quiz-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--bg-page);
}

.answer-sheet-btn {
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.quiz-body {
  flex: 1;
  padding: var(--space-md) var(--space-lg) var(--space-2xl);
}

.progress-line {
  margin-bottom: var(--space-md);

  .progress-text {
    display: block;
    text-align: right;
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    margin-top: 4px;
  }
}

.quiz-info {
  @include flex-between;
  margin-top: var(--space-md);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);

  .kp {
    flex: 1;
    margin-left: var(--space-sm);
    text-align: right;
    @include text-ellipsis(1);
  }
}
</style>
