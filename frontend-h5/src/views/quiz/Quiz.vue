<template>
  <div class="quiz-page">
    <!-- 顶部导航栏（对标截图：答题模式 vs 背题模式 切换） -->
    <div class="quiz-top-nav">
      <div
        class="nav-back-btn"
        @click="$router.back()"
      >
        ‹
      </div>

      <!-- 模式切换 Tab -->
      <div class="mode-tabs">
        <div
          class="mode-tab-item"
          :class="{ active: practiceMode === 'practice' }"
          @click="switchPracticeMode('practice')"
        >
          <span>答题模式</span>
          <div class="tab-indicator" />
        </div>
        <div
          class="mode-tab-item"
          :class="{ active: practiceMode === 'recite' }"
          @click="switchPracticeMode('recite')"
        >
          <span>背题模式</span>
          <div class="tab-indicator" />
        </div>
      </div>

      <!-- 右侧答题卡快捷入口 -->
      <div
        class="nav-sheet-btn"
        @click="sheetVisible = true"
      >
        <svg
          viewBox="0 0 24 24"
          class="sheet-svg"
        >
          <path
            fill="currentColor"
            d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"
          />
        </svg>
      </div>
    </div>

    <!-- 题目进度与副标题栏（对标截图：左侧试卷/科目名称，右侧 13/30 题量，下方红色进度条） -->
    <div class="quiz-progress-bar-wrap">
      <div class="progress-info-row">
        <span class="exam-title-text">{{ examDisplayTitle }}</span>
        <span class="progress-count-text">
          <strong>{{ currentIndex + 1 }}</strong>/{{ total }}
        </span>
      </div>
      <!-- 红色横向进度条 -->
      <div class="progress-track">
        <div
          class="progress-fill"
          :style="{ width: progressPercentage + '%' }"
        />
      </div>
    </div>

    <!-- 计时器条（真题/模考模式开启） -->
    <div
      v-if="needCountdown"
      class="quiz-timer"
    >
      ⏱️ 考试倒计时：{{ formatTime(remainingSeconds) }}
    </div>

    <!-- 加载与空状态 -->
    <div
      v-if="loading"
      class="loading-state"
      style="padding: 60px 16px; text-align: center;"
    >
      <van-loading
        type="spinner"
        color="#6366f1"
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
        style="margin-top: 12px; background: #6366f1; border-color: #6366f1;"
        @click="$router.push('/')"
      >
        返回首页选择其他科目
      </van-button>
    </div>

    <!-- 核心做题区域 -->
    <div
      v-else-if="currentQuestion"
      class="quiz-body"
    >
      <QuestionCard
        :key="currentQuestion.id"
        v-model="currentAnswer"
        :question="currentQuestion"
        :show-result="isCurrentShowResult"
        :is-correct="currentJudgeState?.isCorrect"
        :show-analysis="isCurrentShowAnalysis"
        :recite-mode="practiceMode === 'recite'"
        @select="handleOptionSelect"
        @confirm-multi="handleMultiConfirm"
        @confirm-subjective="handleSubjectiveConfirm"
        @report="onReport"
      />
    </div>

    <!-- 底部操作栏（对标截图：收藏、答题卡、笔记、解析，右侧红色下一题） -->
    <QuizFooter
      v-if="questions.length > 0"
      :current="currentIndex"
      :total="total"
      :favorited="isFavorited()"
      :has-note="hasNoteForCurrent"
      :is-analysis-active="isCurrentShowAnalysis"
      @toggle-favorite="onFavorite"
      @sheet="sheetVisible = true"
      @note="onNote"
      @toggle-analysis="onToggleAnalysis"
      @prev="onPrev"
      @next="onNextClick"
      @submit="onSubmit"
    />

    <!-- 答题卡抽屉 -->
    <AnswerSheet
      v-model="sheetVisible"
      :list="sheetList"
      :current-index="currentIndex"
      :show-submit="true"
      @select="goTo"
      @submit="onSubmit"
    />

    <!-- 笔记弹窗 -->
    <NotePopup
      v-model:show="notePopupVisible"
      :question-id="currentQuestion?.id"
      :question-title="currentQuestion?.title || currentQuestion?.content"
      @saved="handleNoteSaved"
      @deleted="handleNoteDeleted"
    />

    <!-- 纠错反馈弹窗 -->
    <ReportPopup
      v-model:show="reportPopupVisible"
      :question-id="currentQuestion?.id"
      :question-title="currentQuestion?.title || currentQuestion?.content"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showDialog, showToast } from 'vant'
import { useQuizStore } from '@/stores/quiz'
import { useSubjectStore } from '@/stores/subject'
import { getQuestions } from '@/api/question'
import { getPaperDetail } from '@/api/exam'
import { recordWrong, getWrongList } from '@/api/wrong'
import { getFavorites } from '@/api/favorite'
import { getReviewQuestions } from '@/api/review'
import { submit } from '@/api/quiz'
import QuestionCard from '@/components/QuestionCard.vue'
import QuizFooter from '@/components/QuizFooter.vue'
import AnswerSheet from '@/components/AnswerSheet.vue'
import NotePopup from '@/components/NotePopup.vue'
import ReportPopup from '@/components/ReportPopup.vue'

const route = useRoute()
const router = useRouter()
const quizStore = useQuizStore()
const subjectStore = useSubjectStore()

const loading = ref(false)
const mode = computed(() => (route.query.mode as string) || (route.params.mode as string) || 'practice')
const needCountdown = computed(() => ['real', 'mock'].includes(mode.value))
const remainingSeconds = ref(9000)
const currentRecordId = ref<string | number | undefined>(route.query.recordId ? String(route.query.recordId) : undefined)
let timer: any = null
let autoNextTimer: any = null

// 模式切换：答题模式 vs 背题模式
const practiceMode = ref<'practice' | 'recite'>('practice')

const questions = ref<any[]>([])
const currentIndex = ref(0)
const answers = ref<Record<string, string | string[]>>({})

// 记录每道题的判定状态：judged 是否判定，isCorrect 是否答对，showAnalysis 是否展开解析
interface JudgeRecord {
  judged: boolean
  isCorrect: boolean
  showAnalysis: boolean
}
const judgeMap = ref<Record<string, JudgeRecord>>({})

const sheetVisible = ref(false)
const notePopupVisible = ref(false)
const reportPopupVisible = ref(false)
const paperName = ref('')

const total = computed(() => questions.value.length)
const currentQuestion = computed(() => questions.value[currentIndex.value])
const hasNoteForCurrent = computed(() => currentQuestion.value ? quizStore.hasNote(currentQuestion.value.id) : false)

// 考试或科目副标题
const examDisplayTitle = computed(() => {
  if (paperName.value) return paperName.value
  if (route.query.title) return String(route.query.title)
  if (mode.value === 'daily') {
    const curSub = subjectStore.currentSubject?.name || '软考冲刺'
    return `${curSub}·每日一练`
  }
  if (mode.value === 'hot_wrong') {
    const curSub = subjectStore.currentSubject?.name || '软考冲刺'
    return `${curSub}·高频错题专练`
  }
  if (mode.value === 'hot_point') {
    const curSub = subjectStore.currentSubject?.name || '软考冲刺'
    return `${curSub}·高频考点专练`
  }
  if (mode.value === 'wrong') return '错题本·针对性强化'
  if (mode.value === 'favorite') return '我的收藏·查漏补缺'
  if (mode.value === 'review') return '艾宾浩斯·遗忘曲线复习'
  return subjectStore.currentSubject?.name || '软考通关刷题·备考中~'
})

// 进度百分比
const progressPercentage = computed(() => {
  if (total.value <= 0) return 0
  return Math.min(100, Math.round(((currentIndex.value + 1) / total.value) * 100))
})

// 当前题目是否显示结果
const isCurrentShowResult = computed(() => {
  if (practiceMode.value === 'recite') return true
  if (!currentQuestion.value) return false
  return !!judgeMap.value[currentQuestion.value.id]?.judged
})

// 当前题目判分状态
const currentJudgeState = computed(() => {
  if (!currentQuestion.value) return null
  return judgeMap.value[currentQuestion.value.id] || null
})

// 当前题目是否展开解析
const isCurrentShowAnalysis = computed(() => {
  if (practiceMode.value === 'recite') return true
  if (!currentQuestion.value) return false
  const state = judgeMap.value[currentQuestion.value.id]
  return !!state?.showAnalysis
})

// 当前答案
const currentAnswer = computed<string | string[]>({
  get: () => answers.value[currentQuestion.value?.id] || (currentQuestion.value?.type === 'multiple' ? [] : ''),
  set: (v) => {
    if (currentQuestion.value) {
      answers.value[currentQuestion.value.id] = v
    }
  },
})

// 答题卡数据模型（支持对错着色）
const sheetList = computed(() =>
  questions.value.map((q) => {
    const j = judgeMap.value[q.id]
    let status: 'correct' | 'wrong' | undefined = undefined
    if (j?.judged) {
      status = j.isCorrect ? 'correct' : 'wrong'
    }
    return {
      answered: !!answers.value[q.id],
      marked: quizStore.favoritedIds.includes(String(q.id)),
      status,
      correct: j?.judged && j.isCorrect,
      wrong: j?.judged && !j.isCorrect,
    }
  })
)

// 模式切换
function switchPracticeMode(m: 'practice' | 'recite') {
  practiceMode.value = m
  if (m === 'recite') {
    showToast({ message: '已切换为背题模式：直接研读答案与解析', duration: 1500 })
  } else {
    showToast({ message: '已切换为答题模式：自主作答检验', duration: 1500 })
  }
}

// 核心判题工具函数
function checkIsCorrect(q: any, userAns: string | string[]): boolean {
  if (!q || q.answer === undefined || q.answer === null) return false
  const correctAns = q.answer
  const normType = String(q.type || 'single').toLowerCase()

  // 判断题支持各种常用表达
  if (normType === 'true_false' || normType === 'judgment' || normType === 'judge') {
    const u = String(userAns).trim().toUpperCase()
    const c = String(correctAns).trim().toUpperCase()
    if (u === c) return true
    if ((u === 'A' || u === '正确') && (c === 'A' || c === '正确' || c === 'T' || c === 'TRUE')) return true
    if ((u === 'B' || u === '错误') && (c === 'B' || c === '错误' || c === 'F' || c === 'FALSE')) return true
    return false
  }

  // 多选题比对
  if (Array.isArray(correctAns)) {
    const userArr = Array.isArray(userAns) ? [...userAns] : [userAns]
    if (userArr.length !== correctAns.length) return false
    const s1 = [...userArr].map(String).sort().join('')
    const s2 = [...correctAns].map(String).sort().join('')
    return s1.toUpperCase() === s2.toUpperCase()
  }

  // 单选题常规比对
  return String(userAns).trim().toUpperCase() === String(correctAns).trim().toUpperCase()
}

// 单选与判断题选项点击处理（核心功能实现！）
function handleOptionSelect(optKey: string) {
  if (practiceMode.value === 'recite') return
  const q = currentQuestion.value
  if (!q) return

  // 如果当前题目已经判定过且处于答错显示解析状态，不阻断重复但避免乱跳
  if (judgeMap.value[q.id]?.judged) {
    return
  }

  // 清理可能遗留的跳转定时器
  if (autoNextTimer) clearTimeout(autoNextTimer)

  // 1. 记录作答
  answers.value[q.id] = optKey

  // 2. 判题
  const isRight = checkIsCorrect(q, optKey)

  // 3. 记录判分状态
  judgeMap.value[q.id] = {
    judged: true,
    isCorrect: isRight,
    showAnalysis: !isRight, // 答错立即显示解析
  }

  // 4. 答对了：立即高亮绿勾，并在 380ms 延时后自动跳转下一题
  if (isRight) {
    autoNextTimer = setTimeout(() => {
      onNext(true)
    }, 380)
  } else {
    // 5. 答错了：高亮红叉，正确选项高亮绿勾，下方展开解析和红印章，同时将错题异步收录至错题本
    recordWrong({
      questionId: q.id,
      subjectId: q.subjectId || route.query.subjectId,
      chapterId: q.chapterId,
      userAnswer: optKey,
    }).catch(() => {})
  }
}

// 多选题确认作答
function handleMultiConfirm() {
  const q = currentQuestion.value
  if (!q) return
  const userAns = answers.value[q.id]
  if (!userAns || (Array.isArray(userAns) && userAns.length === 0)) {
    showToast('请至少选择一个选项')
    return
  }

  const isRight = checkIsCorrect(q, userAns)
  judgeMap.value[q.id] = {
    judged: true,
    isCorrect: isRight,
    showAnalysis: !isRight,
  }

  if (isRight) {
    showToast({ type: 'success', message: '回答正确！', duration: 1000 })
    setTimeout(() => {
      onNext(true)
    }, 400)
  } else {
    recordWrong({
      questionId: q.id,
      subjectId: q.subjectId || route.query.subjectId,
      chapterId: q.chapterId,
      userAnswer: Array.isArray(userAns) ? userAns.join('') : String(userAns),
    }).catch(() => {})
  }
}

// 主观题确认查看
function handleSubjectiveConfirm(ans: string) {
  const q = currentQuestion.value
  if (!q) return
  answers.value[q.id] = ans
  judgeMap.value[q.id] = {
    judged: true,
    isCorrect: true,
    showAnalysis: true,
  }
}

// 手动切换解析展开/折叠
function onToggleAnalysis() {
  const q = currentQuestion.value
  if (!q) return
  if (!judgeMap.value[q.id]) {
    judgeMap.value[q.id] = {
      judged: false,
      isCorrect: false,
      showAnalysis: true,
    }
  } else {
    judgeMap.value[q.id].showAnalysis = !judgeMap.value[q.id].showAnalysis
  }
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

function isFavorited() {
  return currentQuestion.value ? quizStore.isFavorited(currentQuestion.value.id) : false
}

async function onFavorite() {
  if (currentQuestion.value) {
    const isNowFav = await quizStore.toggleFavorite(currentQuestion.value.id)
    showToast(isNowFav ? '已加入收藏' : '已取消收藏')
  }
}

function onNote() {
  notePopupVisible.value = true
}

function handleNoteSaved(data: { questionId: string | number; content: string }) {
  quizStore.setNote(data.questionId, data.content)
}

function handleNoteDeleted(questionId: string | number) {
  quizStore.setNote(questionId, '')
}

function onReport() {
  reportPopupVisible.value = true
}

function onPrev() {
  if (autoNextTimer) clearTimeout(autoNextTimer)
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

// 点击右下角“下一题”主按钮
function onNextClick() {
  if (autoNextTimer) clearTimeout(autoNextTimer)
  onNext(false)
}

function onNext(fromAuto = false) {
  if (currentIndex.value < total.value - 1) {
    currentIndex.value++
  } else {
    // 最后一题自动跳转或点击时的提醒
    if (fromAuto) {
      showDialog({
        title: '恭喜完成',
        message: '您已做完所有题目，是否现在交卷并查看成绩报告？',
        showCancelButton: true,
        confirmButtonText: '查看报告',
        cancelButtonText: '再检查一下',
      }).then(() => {
        onSubmit()
      }).catch(() => {})
    } else {
      onSubmit()
    }
  }
}

function goTo(idx: number) {
  if (autoNextTimer) clearTimeout(autoNextTimer)
  currentIndex.value = idx
  sheetVisible.value = false
}

async function onSubmit() {
  if (autoNextTimer) clearTimeout(autoNextTimer)
  try {
    await showDialog({
      title: '交卷确认',
      message: `您已答 ${Object.keys(answers.value).length} / ${total.value} 题，确定要交卷吗？`,
      showCancelButton: true,
    })
  } catch {
    return
  }

  const dParam = route.query.duration ? Number(route.query.duration) : undefined
  const durationVal = dParam ? dParam * 60 : (needCountdown.value ? (9000 - remainingSeconds.value) : 180)
  let submittedRecordId = currentRecordId.value

  try {
    const submitRes = await submit({
      recordId: currentRecordId.value,
      answers: answers.value,
      subjectId: route.query.subjectId ? String(route.query.subjectId) : (subjectStore.currentSubjectId || 1),
      chapterId: route.query.chapterId ? String(route.query.chapterId) : undefined,
      mode: mode.value,
      paperId: route.query.paperId ? String(route.query.paperId) : (['real', 'mock'].includes(mode.value) ? String(route.query.examId || '') : undefined),
      duration: durationVal,
      totalCount: questions.value.length,
      questions: questions.value,
    })
    if (submitRes?.data?.recordId) {
      submittedRecordId = submitRes.data.recordId
    }
  } catch {
    // ignore
  }

  const reportData = {
    recordId: submittedRecordId || '1',
    answers: answers.value,
    questions: questions.value,
    duration: durationVal,
    mode: mode.value,
  }
  try {
    sessionStorage.setItem('last_quiz_report', JSON.stringify(reportData))
  } catch {
    // ignore
  }

  router.push({
    path: `/quiz/report/${submittedRecordId || 1}`,
    state: reportData,
  })
}

onMounted(async () => {
  quizStore.fetchFavorites()

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
    } else if (mode.value === 'favorite') {
      const targetSubjectId = route.query.subjectId || subjectStore.currentSubjectId || '1'
      const fRes = await getFavorites({ subjectId: String(targetSubjectId), pageSize: 100 })
      if (fRes?.data?.list && Array.isArray(fRes.data.list) && fRes.data.list.length > 0) {
        questions.value = fRes.data.list.map((item: any) => ({
          id: item.questionId || item.id,
          subjectId: item.subjectId,
          chapterId: item.chapterId,
          type: item.type,
          title: item.title || item.content,
          content: item.content || item.title,
          options: item.options || [],
          answer: item.answer || item.correctAnswer,
          analysis: item.analysis,
          difficulty: 3,
          score: 1,
        }))
      } else {
        questions.value = []
      }
    } else if (mode.value === 'review') {
      const targetSubjectId = route.query.subjectId || subjectStore.currentSubjectId || '1'
      const targetStage = (route.query.stage as any) || 'due'
      const targetQuestionIds = route.query.questionIds ? String(route.query.questionIds) : (route.query.questionId ? String(route.query.questionId) : undefined)
      const countParam = route.query.count ? Number(route.query.count) : 50
      const rRes = await getReviewQuestions({
        subjectId: String(targetSubjectId),
        stage: targetStage,
        questionIds: targetQuestionIds,
        pageSize: countParam,
      })
      if (rRes?.data?.list && Array.isArray(rRes.data.list) && rRes.data.list.length > 0) {
        const rawList = rRes.data.list.map((item: any) => ({
          id: item.questionId || item.id,
          subjectId: item.subjectId,
          chapterId: item.chapterId,
          type: item.type,
          title: item.title || item.content,
          content: item.content || item.title,
          options: item.options || [],
          answer: item.answer || item.correctAnswer,
          analysis: item.analysis,
          difficulty: 3,
          score: 1,
        }))
        const seenReview = new Set<string>()
        questions.value = rawList.filter((q) => {
          const id = String(q.id)
          if (seenReview.has(id)) return false
          seenReview.add(id)
          return true
        })
      } else {
        questions.value = []
      }
    } else if (paperId) {
      const res = await getPaperDetail(String(paperId))
      if (res?.data?.questions && Array.isArray(res.data.questions) && res.data.questions.length > 0) {
        questions.value = res.data.questions
        paperName.value = res.data.name || (res.data as any).title || ''
        const duration = res.data.duration || durationParam || 150
        remainingSeconds.value = duration * 60
      } else {
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

    // 全局题目去重
    if (questions.value && questions.value.length > 0) {
      const globalSeen = new Set<string>()
      questions.value = questions.value.filter((q) => {
        const id = String(q.id)
        if (globalSeen.has(id)) return false
        globalSeen.add(id)
        return true
      })
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

  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (autoNextTimer) clearTimeout(autoNextTimer)
  window.removeEventListener('keydown', handleKeydown)
})

// PC 键盘快捷键监听
function handleKeydown(e: KeyboardEvent) {
  const tag = (document.activeElement?.tagName || '').toLowerCase()
  if (tag === 'input' || tag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) {
    return
  }

  if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    e.preventDefault()
    onPrev()
    return
  }

  if (e.key === 'ArrowRight' || e.key === 'PageDown') {
    e.preventDefault()
    onNextClick()
    return
  }

  if (e.code === 'Space') {
    e.preventDefault()
    sheetVisible.value = !sheetVisible.value
    return
  }

  const q = currentQuestion.value
  if (!q) return

  const keyMap: Record<string, string> = {
    '1': 'A', '2': 'B', '3': 'C', '4': 'D',
    'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D',
    'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D',
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
      handleOptionSelect(selectedOpt)
    }
  }
}
</script>

<style scoped lang="scss">
.quiz-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 80px;
}

/* 顶部导航栏 */
.quiz-top-nav {
  height: 48px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid #f3f4f6;

  .nav-back-btn {
    font-size: 26px;
    color: #4b5563;
    cursor: pointer;
    line-height: 1;
    width: 32px;
  }

  .nav-sheet-btn {
    width: 32px;
    display: flex;
    justify-content: flex-end;
    cursor: pointer;
    color: #4b5563;

    .sheet-svg {
      width: 20px;
      height: 20px;
    }
  }
}

/* 答题模式 / 背题模式 Tabs (对标参考截图) */
.mode-tabs {
  display: flex;
  align-items: center;
  gap: 36px;
}

.mode-tab-item {
  position: relative;
  font-size: 16px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  padding: 10px 0;
  transition: all 0.2s;

  .tab-indicator {
    position: absolute;
    bottom: 2px;
    left: 50%;
    transform: translateX(-50%);
    width: 28px;
    height: 3px;
    background: transparent;
    border-radius: 2px;
    transition: all 0.2s;
  }

  &.active {
    color: #6366f1;
    font-weight: 700;

    .tab-indicator {
      background: #6366f1;
    }
  }
}

/* 进度与试卷名称栏 (对标截图) */
.quiz-progress-bar-wrap {
  background: #ffffff;
  padding: 10px 16px 8px;
  border-bottom: 1px solid #f0f2f5;

  .progress-info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }

  .exam-title-text {
    font-size: 13.5px;
    color: #374151;
    font-weight: 500;
    max-width: 78%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .progress-count-text {
    font-size: 13.5px;
    color: #6b7280;

    strong {
      color: #6366f1;
      font-size: 14.5px;
    }
  }

  .progress-track {
    width: 100%;
    height: 3px;
    background: #f3f4f6;
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: 2px;
    transition: width 0.3s ease;
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
  padding: 12px 14px;
}
</style>
