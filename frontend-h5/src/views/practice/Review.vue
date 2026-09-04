<template>
  <div class="review-page">
    <!-- 顶部导航 -->
    <div class="nav-bar">
      <div class="back" @click="onBack">‹</div>
      <div class="title-wrap">
        <span class="title">艾宾浩斯智能复习</span>
        <span class="sub-badge" @click="showSubjectPicker = true">
          {{ subjectStore.currentSubject?.name || '当前科目' }} ▼
        </span>
      </div>
      <div class="right" @click="showExplain">原理说明</div>
    </div>

    <div class="review-content">
      <!-- 遗忘曲线今日待复习 Hero 卡片 -->
      <div class="review-hero">
        <div class="hero-top">
          <div class="rh-label">今日待复习题目</div>
          <div class="sync-btn" @click="onSyncWrong">
            <span :class="{ spinning: syncing }">🔄</span> 同步错题
          </div>
        </div>
        <div class="rh-num">{{ overview.totalDue }}</div>
        <div class="rh-desc">
          基于艾宾浩斯记忆遗忘曲线 · 科学定制 1/2/4/7/15 天强化节点
        </div>
        <div class="rh-actions">
          <button
            class="rh-btn primary"
            :disabled="overview.totalDue === 0"
            @click="startReview('due')"
          >
            🚀 立即开始智能复习 ({{ overview.totalDue }} 题)
          </button>
        </div>
      </div>

      <!-- 复习排期分类卡片 -->
      <div class="plan-card">
        <div class="card-header">
          <div class="card-title">📅 记忆排期看板</div>
          <div class="card-tip">点击卡片可快速筛选复习</div>
        </div>
        <div class="plan-grid">
          <div
            class="plan-grid-item danger"
            :class="{ active: currentStage === 'urgent' }"
            @click="selectStage('urgent')"
          >
            <div class="pi-header">
              <span class="pi-emoji">🔥</span>
              <span class="pi-name">紧急复习</span>
            </div>
            <div class="pi-count">{{ overview.urgentCount }}</div>
            <div class="pi-sub">已逾期/临界点</div>
          </div>

          <div
            class="plan-grid-item warning"
            :class="{ active: currentStage === 'today' }"
            @click="selectStage('today')"
          >
            <div class="pi-header">
              <span class="pi-emoji">⚠️</span>
              <span class="pi-name">今日强化</span>
            </div>
            <div class="pi-count">{{ overview.todayCount }}</div>
            <div class="pi-sub">最佳记忆节点</div>
          </div>

          <div
            class="plan-grid-item info"
            :class="{ active: currentStage === 'tomorrow' }"
            @click="selectStage('tomorrow')"
          >
            <div class="pi-header">
              <span class="pi-emoji">📋</span>
              <span class="pi-name">明日预告</span>
            </div>
            <div class="pi-count">{{ overview.tomorrowCount }}</div>
            <div class="pi-sub">提前准备任务</div>
          </div>

          <div
            class="plan-grid-item success"
            :class="{ active: currentStage === 'completed' }"
            @click="selectStage('completed')"
          >
            <div class="pi-header">
              <span class="pi-emoji">✨</span>
              <span class="pi-name">长效固化</span>
            </div>
            <div class="pi-count">{{ overview.completedCount }}</div>
            <div class="pi-sub">已完成全周期</div>
          </div>
        </div>
      </div>

      <!-- 记忆效果指标 -->
      <div class="effect-card">
        <div class="card-title">📈 记忆巩固成效</div>
        <div class="effect-grid">
          <div class="eg-item">
            <div class="eg-num success">{{ overview.consolidationRate }}%</div>
            <div class="eg-label">长效巩固率</div>
          </div>
          <div class="eg-item">
            <div class="eg-num primary">{{ overview.totalQueue }}</div>
            <div class="eg-label">复习库题量</div>
          </div>
          <div class="eg-item">
            <div class="eg-num orange">{{ overview.averageRound }} 轮</div>
            <div class="eg-label">平均复习轮次</div>
          </div>
        </div>

        <!-- 艾宾浩斯 6 阶段进度条 -->
        <div class="stage-pipeline" v-if="overview.totalQueue > 0">
          <div class="sp-title">🧠 艾宾浩斯 6 阶记忆分布：</div>
          <div class="sp-steps">
            <div class="sp-step" title="阶段1: 第1天">
              <span class="sp-dot">🌱 1天</span>
              <span class="sp-num">{{ overview.stageDistribution?.step0 || 0 }}</span>
            </div>
            <div class="sp-step" title="阶段2: 第2天">
              <span class="sp-dot">🌿 2天</span>
              <span class="sp-num">{{ overview.stageDistribution?.step1 || 0 }}</span>
            </div>
            <div class="sp-step" title="阶段3: 第4天">
              <span class="sp-dot">🌳 4天</span>
              <span class="sp-num">{{ overview.stageDistribution?.step2 || 0 }}</span>
            </div>
            <div class="sp-step" title="阶段4: 第7天">
              <span class="sp-dot">🌲 7天</span>
              <span class="sp-num">{{ overview.stageDistribution?.step3 || 0 }}</span>
            </div>
            <div class="sp-step" title="阶段5: 第15天">
              <span class="sp-dot">👑 15天</span>
              <span class="sp-num">{{ overview.stageDistribution?.step4 || 0 }}</span>
            </div>
            <div class="sp-step completed" title="长效掌握">
              <span class="sp-dot">✨ 已掌握</span>
              <span class="sp-num">{{ overview.stageDistribution?.completed || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 题目列表区域 -->
      <div class="question-section">
        <!-- 分类切换标签 -->
        <div class="tabs-header">
          <div
            class="tab-item"
            :class="{ active: currentStage === 'due' }"
            @click="selectStage('due')"
          >
            今日必背 ({{ overview.totalDue }})
          </div>
          <div
            class="tab-item"
            :class="{ active: currentStage === 'urgent' }"
            @click="selectStage('urgent')"
          >
            🔥 紧急 ({{ overview.urgentCount }})
          </div>
          <div
            class="tab-item"
            :class="{ active: currentStage === 'today' }"
            @click="selectStage('today')"
          >
            ⚠️ 今日 ({{ overview.todayCount }})
          </div>
          <div
            class="tab-item"
            :class="{ active: currentStage === 'tomorrow' }"
            @click="selectStage('tomorrow')"
          >
            📋 明日 ({{ overview.tomorrowCount }})
          </div>
          <div
            class="tab-item"
            :class="{ active: currentStage === 'completed' }"
            @click="selectStage('completed')"
          >
            ✨ 已掌握 ({{ overview.completedCount }})
          </div>
          <div
            class="tab-item"
            :class="{ active: currentStage === 'all' }"
            @click="selectStage('all')"
          >
            全部 ({{ overview.totalQueue }})
          </div>
        </div>

        <!-- 题目列表加载态 -->
        <div v-if="loading && reviewList.length === 0" class="list-loading">
          <van-loading type="spinner" color="#f97316" vertical>加载复习题库中...</van-loading>
        </div>

        <!-- 题目列表 -->
        <div v-else-if="reviewList.length > 0" class="question-list">
          <div
            v-for="(item, idx) in reviewList"
            :key="item.id || item.questionId"
            class="review-item-card"
          >
            <!-- 头部状态徽章 -->
            <div class="ric-header">
              <div class="ric-left">
                <span class="ric-stage" :class="'stage-' + item.step">
                  {{ item.stageIcon }} {{ item.stageText }}
                </span>
                <span class="ric-type-badge">{{ item.typeText || '单选题' }}</span>
              </div>
              <div class="ric-right">
                <span class="ric-due-badge" :class="item.dueStatus">
                  {{ item.dueText }}
                </span>
              </div>
            </div>

            <!-- 考点与章节 -->
            <div class="ric-meta">
              <span class="ric-chap">📂 {{ item.chapterName || item.subjectName || '核心考点' }}</span>
            </div>

            <!-- 题干内容 -->
            <div class="ric-title">
              <span class="index-num">{{ idx + 1 }}.</span>
              <span v-html="renderWithFormula(item.content || item.title)" />
            </div>

            <!-- 选项自测区域（展开或自测中） -->
            <div class="ric-options" v-if="expandedCards[item.questionId]">
              <div
                v-for="opt in item.options"
                :key="opt.label"
                class="ric-option-row"
                :class="getOptionClass(item, opt.label)"
                @click="onSelectOption(item, opt.label)"
              >
                <span class="opt-label">{{ opt.label }}</span>
                <span class="opt-text">{{ opt.text }}</span>
                <span
                  v-if="userAnswers[item.questionId] && isCorrectOption(item, opt.label)"
                  class="correct-tag"
                >
                  ✓ 正确答案
                </span>
                <span
                  v-else-if="userAnswers[item.questionId] === opt.label && !isCorrectOption(item, opt.label)"
                  class="wrong-tag"
                >
                  ✗ 你的选择
                </span>
              </div>

              <!-- 自测反馈与快速推进条 -->
              <div class="ric-quick-feedback" v-if="userAnswers[item.questionId]">
                <div class="qf-status" :class="userAnswers[item.questionId] === (item.answer || item.correctAnswer) ? 'is-pass' : 'is-fail'">
                  {{ userAnswers[item.questionId] === (item.answer || item.correctAnswer) ? '🎉 自测正确！已强化记忆' : '💡 记错啦，建议加强理解' }}
                </div>
                <div class="qf-actions">
                  <button class="qf-btn advance" @click="onAdvanceItem(item)">
                    ✅ 记住了 · 推进下一阶段
                  </button>
                  <button class="qf-btn reset" @click="onResetProgress(item)">
                    🔄 没记住 · 明日重测
                  </button>
                </div>
              </div>

              <!-- 官方解析 -->
              <div class="ric-analysis-box" v-if="item.analysis">
                <div class="ab-title">💡 官方考点解析：</div>
                <div class="ab-content" v-html="renderWithFormula(item.analysis)" />
              </div>
            </div>

            <!-- 底部操作按钮栏 -->
            <div class="ric-footer">
              <div
                class="ric-toggle-btn"
                @click="toggleCardExpand(item.questionId)"
              >
                <span>{{ expandedCards[item.questionId] ? '收起解析 ▴' : '自测 / 查看解析 ▾' }}</span>
              </div>

              <div class="ric-btn-group">
                <button
                  class="act-btn mini practice"
                  @click="startSingleQuiz(item)"
                  title="立即单题全屏做题"
                >
                  🎯 练习此题
                </button>
                <button
                  v-if="item.status !== 'completed'"
                  class="act-btn mini advance-btn"
                  @click="onAdvanceItem(item)"
                  title="推进到下一艾宾浩斯强化阶段"
                >
                  ⚡ 推进
                </button>
                <button
                  class="act-btn mini note"
                  @click="openNote(item)"
                >
                  📓 笔记
                </button>
                <button
                  class="act-btn mini report"
                  @click="openReport(item)"
                >
                  ⚠️ 纠错
                </button>
                <button
                  v-if="item.status !== 'completed'"
                  class="act-btn mini master"
                  @click="onMarkMastered(item)"
                >
                  ✅ 掌握
                </button>
                <button
                  v-else
                  class="act-btn mini reset"
                  @click="onResetProgress(item)"
                >
                  🔄 重学
                </button>
                <button
                  class="act-btn mini delete"
                  @click="onRemoveItem(item)"
                  title="从复习库移除"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>

          <!-- 分页加载更多 -->
          <div class="load-more-wrap" v-if="hasMore">
            <button class="load-more-btn" :disabled="loadingMore" @click="loadMore">
              {{ loadingMore ? '加载中...' : `加载更多题目 (剩余 ${totalCount - reviewList.length} 题)` }}
            </button>
          </div>
          <div class="no-more-tip" v-else-if="reviewList.length >= totalCount && totalCount > 0">
            已显示全部 {{ totalCount }} 道复习题目
          </div>
        </div>

        <!-- 空数据状态 -->
        <div v-else class="empty-wrap">
          <div class="empty-icon">🎉</div>
          <div class="empty-title">当前暂无待复习题目</div>
          <div class="empty-desc">
            {{ currentStage === 'due' ? '太棒了！今日的复习任务已全部达成。' : '当前分类下暂无题目，可随时同步错题或前往题库刷题。' }}
          </div>
          <div class="empty-actions">
            <button class="empty-btn primary" @click="onSyncWrong">
              📥 一键同步错题到复习库
            </button>
            <button class="empty-btn secondary" @click="router.push('/chapter')">
              📚 前往章节考点刷题
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 科目选择弹窗 -->
    <SubjectPicker
      v-model="showSubjectPicker"
      @select="onSubjectSelect"
    />

    <!-- 试题笔记弹窗 -->
    <NotePopup
      v-model:show="notePopupVisible"
      :question-id="currentQuestion?.questionId"
      :question-title="currentQuestion?.content || currentQuestion?.title"
    />

    <!-- 试题纠错弹窗 -->
    <ReportPopup
      v-model:show="reportPopupVisible"
      :question-id="currentQuestion?.questionId"
      :question-title="currentQuestion?.content || currentQuestion?.title"
    />

    <!-- 原理说明弹窗 -->
    <van-dialog
      v-model:show="showExplainModal"
      title="艾宾浩斯记忆遗忘曲线原理"
      confirm-button-text="我明白了"
      confirm-button-color="#f97316"
    >
      <div class="explain-modal-body">
        <p class="emb-p">德国心理学家赫尔曼·艾宾浩斯（Hermann Ebbinghaus）研究发现，大脑遗忘规律呈现<strong>“先快后慢”</strong>的特征：</p>
        <div class="curve-list">
          <div class="cl-row"><span>⏱️ 20分钟后：</span> 遗忘约 42%</div>
          <div class="cl-row"><span>⏱️ 1天后：</span> 遗忘约 66%（关键拐点）</div>
          <div class="cl-row"><span>⏱️ 2天后：</span> 遗忘约 72%</div>
          <div class="cl-row"><span>⏱️ 6天后：</span> 遗忘约 75%</div>
        </div>
        <div class="emb-divider"></div>
        <div class="emb-title">🔄 科学 5 阶抗遗忘排期：</div>
        <div class="cycle-steps">
          <div class="cs-item">🌱 <strong>第 1 天</strong>：做错后 24 小时黄金期初次复习</div>
          <div class="cs-item">🌿 <strong>第 2 天</strong>：巩固短时突触记忆</div>
          <div class="cs-item">🌳 <strong>第 4 天</strong>：强化形成中期记忆</div>
          <div class="cs-item">🌲 <strong>第 7 天</strong>：深化建立长效记忆通路</div>
          <div class="cs-item">👑 <strong>第 15 天</strong>：考前永久固化肌肉记忆</div>
        </div>
        <p class="emb-footer">每次复习只需数秒，系统智能推演记忆临界点，考前不再死记硬背！</p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { useSubjectStore } from '@/stores/subject'
import { renderWithFormula } from '@/utils/katex'
import {
  getReviewOverview,
  getReviewQuestions,
  syncWrongToReview,
  advanceReviewItem,
  markReviewMastered,
  resetReviewItem,
  removeReviewItem,
  type ReviewItem,
  type ReviewOverview,
} from '@/api/review'
import SubjectPicker from '@/components/SubjectPicker.vue'
import NotePopup from '@/components/NotePopup.vue'
import ReportPopup from '@/components/ReportPopup.vue'

const router = useRouter()
const subjectStore = useSubjectStore()

const loading = ref(false)
const loadingMore = ref(false)
const syncing = ref(false)
const showExplainModal = ref(false)
const showSubjectPicker = ref(false)
const notePopupVisible = ref(false)
const reportPopupVisible = ref(false)
const currentQuestion = ref<ReviewItem | null>(null)

const currentStage = ref<'due' | 'urgent' | 'today' | 'tomorrow' | 'completed' | 'all'>('due')
const reviewList = ref<ReviewItem[]>([])
const expandedCards = reactive<Record<string, boolean>>({})
const userAnswers = reactive<Record<string, string>>({})

const currentPage = ref(1)
const pageSize = ref(30)
const totalCount = ref(0)
const hasMore = computed(() => reviewList.value.length < totalCount.value)

const overview = reactive<ReviewOverview>({
  totalDue: 0,
  urgentCount: 0,
  todayCount: 0,
  tomorrowCount: 0,
  futureCount: 0,
  completedCount: 0,
  totalQueue: 0,
  averageRound: '1.0',
  consolidationRate: 0,
  stageDistribution: {
    step0: 0,
    step1: 0,
    step2: 0,
    step3: 0,
    step4: 0,
    completed: 0,
  },
})

function onBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}

function showExplain() {
  showExplainModal.value = true
}

function onSubjectSelect(id: number | string) {
  subjectStore.switchSubject(id)
  currentPage.value = 1
  loadData()
}

async function loadData() {
  loading.value = true
  currentPage.value = 1
  try {
    const subId = subjectStore.currentSubjectId ? String(subjectStore.currentSubjectId) : undefined
    const [ovRes, listRes] = await Promise.all([
      getReviewOverview(subId),
      getReviewQuestions({
        stage: currentStage.value,
        subjectId: subId,
        page: 1,
        pageSize: pageSize.value,
      }),
    ])

    if (ovRes?.data) {
      Object.assign(overview, ovRes.data)
    }

    if (listRes?.data?.list) {
      reviewList.value = listRes.data.list
      totalCount.value = listRes.data.total || listRes.data.list.length
    } else {
      reviewList.value = []
      totalCount.value = 0
    }
  } catch {
    showToast('获取复习数据失败，请重试')
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try {
    const subId = subjectStore.currentSubjectId ? String(subjectStore.currentSubjectId) : undefined
    const nextPage = currentPage.value + 1
    const res = await getReviewQuestions({
      stage: currentStage.value,
      subjectId: subId,
      page: nextPage,
      pageSize: pageSize.value,
    })
    if (res?.data?.list && res.data.list.length > 0) {
      reviewList.value = [...reviewList.value, ...res.data.list]
      currentPage.value = nextPage
      totalCount.value = res.data.total || reviewList.value.length
    }
  } catch {
    showToast('加载更多题目失败')
  } finally {
    loadingMore.value = false
  }
}

async function selectStage(stage: 'due' | 'urgent' | 'today' | 'tomorrow' | 'completed' | 'all') {
  currentStage.value = stage
  currentPage.value = 1
  await loadData()
}

async function onSyncWrong() {
  if (syncing.value) return
  syncing.value = true
  try {
    const res = await syncWrongToReview(subjectStore.currentSubjectId)
    showToast(`同步成功！已更新复习库 (${res?.data?.totalCount || 0} 题)`)
    await loadData()
  } catch {
    showToast('同步错题失败')
  } finally {
    syncing.value = false
  }
}

function startReview(stage: 'due' | 'urgent' | 'today' | 'all' = 'due') {
  const count = stage === 'due' ? overview.totalDue : (stage === 'urgent' ? overview.urgentCount : overview.totalQueue)
  if (count === 0 && overview.totalQueue === 0) {
    showToast('复习库暂无题目，正在从错题库同步...')
    onSyncWrong()
    return
  }
  showToast('进入艾宾浩斯智能复习模式')
  router.push(`/quiz/review?mode=review&stage=${stage}&subjectId=${subjectStore.currentSubjectId || 1}&count=50`)
}

function startSingleQuiz(item: ReviewItem) {
  router.push(`/quiz/review?mode=review&questionIds=${item.questionId}&subjectId=${subjectStore.currentSubjectId || 1}`)
}

function toggleCardExpand(qId: string) {
  expandedCards[qId] = !expandedCards[qId]
}

function isCorrectOption(item: ReviewItem, optLabel: string): boolean {
  const correct = String(item.answer || item.correctAnswer || '').toUpperCase().trim()
  return correct.includes(optLabel.toUpperCase().trim())
}

function getOptionClass(item: ReviewItem, optLabel: string) {
  const userAns = userAnswers[item.questionId]
  const isRight = isCorrectOption(item, optLabel)
  if (!userAns) {
    return isRight ? 'is-correct-preview' : ''
  }
  if (isRight) {
    return 'is-correct'
  }
  if (userAns === optLabel && !isRight) {
    return 'is-wrong'
  }
  return ''
}

function onSelectOption(item: ReviewItem, optLabel: string) {
  userAnswers[item.questionId] = optLabel
  if (!expandedCards[item.questionId]) {
    expandedCards[item.questionId] = true
  }
}

async function onAdvanceItem(item: ReviewItem) {
  try {
    const res = await advanceReviewItem(item.questionId)
    showToast(res?.message || '阶段已推进')
    await loadData()
  } catch {
    showToast('推进失败')
  }
}

function openNote(item: ReviewItem) {
  currentQuestion.value = item
  notePopupVisible.value = true
}

function openReport(item: ReviewItem) {
  currentQuestion.value = item
  reportPopupVisible.value = true
}

async function onMarkMastered(item: ReviewItem) {
  showConfirmDialog({
    title: '标记已掌握',
    message: '确定该题已形成长效记忆并标记掌握吗？该题将直接晋升至长效固化归档。',
  }).then(async () => {
    try {
      await markReviewMastered(item.questionId)
      showToast('已标记掌握')
      await loadData()
    } catch {
      showToast('标记失败')
    }
  })
}

async function onResetProgress(item: ReviewItem) {
  showConfirmDialog({
    title: '重置复习进度',
    message: '确定重置此题记忆周期，从第 1 天重新开始强化记忆吗？',
  }).then(async () => {
    try {
      await resetReviewItem(item.questionId)
      showToast('复习进度已重置')
      await loadData()
    } catch {
      showToast('重置失败')
    }
  })
}

async function onRemoveItem(item: ReviewItem) {
  showConfirmDialog({
    title: '移出复习库',
    message: '确定将此题从艾宾浩斯复习计划中移除吗？',
  }).then(async () => {
    try {
      await removeReviewItem(item.questionId)
      showToast('已移除')
      await loadData()
    } catch {
      showToast('移除失败')
    }
  })
}

onMounted(() => {
  loadData()
})

onActivated(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.review-page {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: 60px;
}

.nav-bar {
  height: 50px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 50;

  .back {
    font-size: 24px;
    color: #475569;
    cursor: pointer;
    line-height: 1;
  }

  .title-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;

    .title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }

    .sub-badge {
      font-size: 11px;
      color: #f97316;
      background: #fff7ed;
      padding: 1px 8px;
      border-radius: 10px;
      margin-top: 2px;
      cursor: pointer;
    }
  }

  .right {
    font-size: 13px;
    color: #f97316;
    font-weight: 600;
    cursor: pointer;
  }
}

.review-content {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Hero Header */
.review-hero {
  background: linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%);
  border-radius: 16px;
  padding: 20px 18px;
  color: #fff;
  box-shadow: 0 10px 25px -5px rgba(249, 115, 22, 0.4);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -30px;
    right: -30px;
    width: 140px;
    height: 140px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
    border-radius: 50%;
  }

  .hero-top {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .rh-label {
      font-size: 13px;
      font-weight: 500;
      opacity: 0.95;
      letter-spacing: 0.5px;
    }

    .sync-btn {
      font-size: 12px;
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 10px;
      border-radius: 14px;
      backdrop-filter: blur(4px);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;

      &:active {
        opacity: 0.8;
      }

      .spinning {
        display: inline-block;
        animation: spin 1s infinite linear;
      }
    }
  }

  .rh-num {
    font-size: 52px;
    font-weight: 800;
    margin: 8px 0 2px;
    line-height: 1.05;
    letter-spacing: -1px;
  }

  .rh-desc {
    font-size: 12px;
    opacity: 0.9;
    line-height: 1.4;
  }

  .rh-actions {
    margin-top: 16px;

    .rh-btn {
      width: 100%;
      background: #ffffff;
      color: #ea580c;
      border: none;
      padding: 12px 20px;
      border-radius: 25px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
      transition: all 0.2s;

      &:active {
        transform: scale(0.98);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }
}

/* Plan Card */
.plan-card,
.effect-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 12px;

    .card-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }

    .card-tip {
      font-size: 11px;
      color: #94a3b8;
    }
  }

  .card-title {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 12px;
  }
}

.plan-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.plan-grid-item {
  border-radius: 12px;
  padding: 12px;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all 0.2s;

  &.danger {
    background: #fef2f2;
    color: #ef4444;
    &.active {
      border-color: #ef4444;
      background: #fee2e2;
    }
  }

  &.warning {
    background: #fffbeb;
    color: #d97706;
    &.active {
      border-color: #d97706;
      background: #fef3c7;
    }
  }

  &.info {
    background: #eff6ff;
    color: #2563eb;
    &.active {
      border-color: #2563eb;
      background: #dbeafe;
    }
  }

  &.success {
    background: #f0fdf4;
    color: #16a34a;
    &.active {
      border-color: #16a34a;
      background: #dcfce7;
    }
  }

  .pi-header {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    color: #475569;
  }

  .pi-count {
    font-size: 26px;
    font-weight: 800;
    margin: 4px 0 2px;
    line-height: 1.1;
  }

  .pi-sub {
    font-size: 11px;
    color: #94a3b8;
  }
}

/* Effect Card */
.effect-grid {
  display: flex;
  justify-content: space-around;
  text-align: center;
  padding-bottom: 12px;
  border-bottom: 1px dashed #f1f5f9;

  .eg-item {
    .eg-num {
      font-size: 22px;
      font-weight: 800;

      &.success { color: #16a34a; }
      &.primary { color: #2563eb; }
      &.orange { color: #f97316; }
    }

    .eg-label {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
    }
  }
}

.stage-pipeline {
  margin-top: 12px;

  .sp-title {
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    margin-bottom: 8px;
  }

  .sp-steps {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 4px;
    text-align: center;

    .sp-step {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 2px;
      display: flex;
      flex-direction: column;
      align-items: center;

      &.completed {
        background: #f0fdf4;
        border-color: #bbf7d0;
      }

      .sp-dot {
        font-size: 10px;
        color: #64748b;
        white-space: nowrap;
      }

      .sp-num {
        font-size: 13px;
        font-weight: 700;
        color: #0f172a;
        margin-top: 2px;
      }
    }
  }
}

/* Question Section */
.question-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tabs-header {
  display: flex;
  overflow-x: auto;
  gap: 8px;
  padding: 4px 2px;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  .tab-item {
    padding: 6px 14px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s;

    &.active {
      background: #ea580c;
      border-color: #ea580c;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(234, 88, 12, 0.3);
    }
  }
}

.list-loading {
  padding: 40px 0;
  text-align: center;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-item-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;

  .ric-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .ric-left {
      display: flex;
      align-items: center;
      gap: 6px;

      .ric-stage {
        font-size: 11px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 4px;
        background: #f1f5f9;
        color: #475569;

        &.stage-0 { background: #fee2e2; color: #dc2626; }
        &.stage-1 { background: #ffedd5; color: #ea580c; }
        &.stage-2 { background: #fef9c3; color: #ca8a04; }
        &.stage-3 { background: #e0e7ff; color: #4338ca; }
        &.stage-4 { background: #ede9fe; color: #7c3aed; }
        &.stage-5 { background: #dcfce7; color: #16a34a; }
      }

      .ric-type-badge {
        font-size: 11px;
        color: #64748b;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 1px 6px;
        border-radius: 4px;
      }
    }

    .ric-right {
      .ric-due-badge {
        font-size: 11px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 10px;

        &.urgent { background: #fef2f2; color: #ef4444; }
        &.today { background: #fff7ed; color: #ea580c; }
        &.tomorrow { background: #eff6ff; color: #2563eb; }
        &.future { background: #f8fafc; color: #64748b; }
        &.completed { background: #f0fdf4; color: #16a34a; }
      }
    }
  }

  .ric-meta {
    font-size: 11px;
    color: #94a3b8;
    margin-bottom: 8px;
  }

  .ric-title {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    line-height: 1.5;
    margin-bottom: 12px;

    .index-num {
      color: #ea580c;
      font-weight: 700;
      margin-right: 4px;
    }
  }

  .ric-options {
    background: #f8fafc;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .ric-option-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 13px;
      color: #334155;
      padding: 8px 10px;
      border-radius: 6px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s;

      &:hover {
        background: #f1f5f9;
      }

      &.is-correct-preview {
        background: #f0fdf4;
        color: #15803d;
        border-color: #bbf7d0;
      }

      &.is-correct {
        background: #dcfce7;
        color: #15803d;
        font-weight: 600;
        border-color: #86efac;
      }

      &.is-wrong {
        background: #fee2e2;
        color: #b91c1c;
        font-weight: 600;
        border-color: #fca5a5;
      }

      .opt-label {
        font-weight: 700;
      }

      .opt-text {
        flex: 1;
      }

      .correct-tag {
        font-size: 11px;
        color: #16a34a;
        font-weight: 700;
      }

      .wrong-tag {
        font-size: 11px;
        color: #dc2626;
        font-weight: 700;
      }
    }

    .ric-quick-feedback {
      margin-top: 6px;
      padding: 8px 10px;
      border-radius: 6px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .qf-status {
        font-size: 12px;
        font-weight: 700;

        &.is-pass { color: #16a34a; }
        &.is-fail { color: #ea580c; }
      }

      .qf-actions {
        display: flex;
        gap: 8px;

        .qf-btn {
          flex: 1;
          border: none;
          padding: 6px 12px;
          border-radius: 14px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;

          &.advance {
            background: #16a34a;
            color: #ffffff;
          }

          &.reset {
            background: #fff7ed;
            color: #ea580c;
            border: 1px solid #fed7aa;
          }

          &:active {
            transform: scale(0.97);
          }
        }
      }
    }

    .ric-analysis-box {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed #cbd5e1;

      .ab-title {
        font-size: 12px;
        font-weight: 700;
        color: #ea580c;
        margin-bottom: 4px;
      }

      .ab-content {
        font-size: 12px;
        color: #475569;
        line-height: 1.5;
      }
    }
  }

  .ric-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 10px;
    border-top: 1px solid #f1f5f9;

    .ric-toggle-btn {
      font-size: 12px;
      color: #ea580c;
      font-weight: 600;
      cursor: pointer;
    }

    .ric-btn-group {
      display: flex;
      gap: 6px;
      align-items: center;

      .act-btn {
        border: none;
        padding: 4px 10px;
        border-radius: 14px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        &.practice {
          background: #ea580c;
          color: #ffffff;
        }

        &.advance-btn {
          background: #dbeafe;
          color: #1d4ed8;
        }

        &.note {
          background: #f1f5f9;
          color: #475569;
        }

        &.report {
          background: #fef2f2;
          color: #ef4444;
        }

        &.master {
          background: #dcfce7;
          color: #16a34a;
        }

        &.reset {
          background: #fff7ed;
          color: #ea580c;
        }

        &.delete {
          background: #f8fafc;
          color: #94a3b8;
          padding: 4px 8px;
        }

        &:active {
          opacity: 0.8;
          transform: scale(0.96);
        }
      }
    }
  }
}

.load-more-wrap {
  text-align: center;
  padding: 12px 0;

  .load-more-btn {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    color: #ea580c;
    font-size: 13px;
    font-weight: 600;
    padding: 8px 24px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #fff7ed;
      border-color: #ea580c;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.no-more-tip {
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  padding: 16px 0 8px;
}

/* Empty State */
.empty-wrap {
  background: #ffffff;
  border-radius: 14px;
  padding: 40px 20px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  .empty-title {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 6px;
  }

  .empty-desc {
    font-size: 13px;
    color: #64748b;
    max-width: 280px;
    margin: 0 auto 20px;
    line-height: 1.5;
  }

  .empty-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 240px;
    margin: 0 auto;

    .empty-btn {
      width: 100%;
      padding: 10px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;

      &.primary {
        background: #ea580c;
        color: #ffffff;
        border: none;
      }

      &.secondary {
        background: #f8fafc;
        color: #475569;
        border: 1px solid #e2e8f0;
      }
    }
  }
}

/* Principle Modal */
.explain-modal-body {
  padding: 14px 18px;
  font-size: 13px;
  color: #334155;
  line-height: 1.6;

  .emb-p {
    margin-bottom: 10px;
  }

  .curve-list {
    background: #f8fafc;
    border-radius: 8px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
  }

  .emb-divider {
    height: 1px;
    background: #e2e8f0;
    margin: 12px 0;
  }

  .emb-title {
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 8px;
  }

  .cycle-steps {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
  }

  .emb-footer {
    margin-top: 12px;
    font-size: 12px;
    color: #ea580c;
    font-weight: 600;
    text-align: center;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
