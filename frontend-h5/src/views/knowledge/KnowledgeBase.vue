<template>
  <div class="knowledge-page">
    <!-- 顶部导航栏 -->
    <div class="kb-navbar">
      <div class="nav-left" @click="$router.back()">
        <span class="back-icon">‹</span>
        <span class="nav-title">考点知识库</span>
      </div>
      <div class="nav-right">
        <span class="subject-badge">{{ currentSubjectName }}</span>
      </div>
    </div>

    <!-- 顶部搜索框 (还原设计) -->
    <div class="search-section">
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          v-model="searchKeyword"
          type="text"
          class="search-input"
          placeholder="搜索教材知识点，如：净值分析，关键路径，三点估算，CCB..."
          @input="handleSearchInput"
        />
        <button v-if="searchKeyword" class="clear-btn" @click="clearSearch">✕</button>
      </div>
    </div>

    <!-- 章节与分类横向过滤标签 -->
    <div class="categories-bar">
      <div class="category-scroll">
        <div
          v-for="cat in categories"
          :key="cat"
          class="category-chip"
          :class="{ active: selectedCategory === cat }"
          @click="selectCategory(cat)"
        >
          {{ cat }}
        </div>
      </div>
    </div>

    <!-- 主体内容区 (PC 两栏布局 / 移动端流式列表) -->
    <div class="kb-content-container">
      <!-- 左侧：考点列表 -->
      <div class="kb-list-pane">
        <!-- 列表状态 -->
        <div v-if="loading && knowledgeList.length === 0" class="loading-box">
          <van-loading type="spinner" color="#0284c7">加载知识点中...</van-loading>
        </div>

        <div v-else-if="filteredList.length === 0" class="empty-box">
          <div class="empty-icon">📂</div>
          <div class="empty-text">未找到相关知识点</div>
        </div>

        <div v-else class="kp-cards-list">
          <div
            v-for="item in filteredList"
            :key="item.id"
            class="kp-card"
            :class="{ active: selectedKp?.id === item.id }"
            @click="handleSelectKp(item)"
          >
            <div class="card-header-row">
              <span class="cat-tag">{{ item.categoryTag || '核心考点' }}</span>
              <span
                class="importance-badge"
                :class="getImportanceClass(item.importance)"
              >
                <span class="badge-icon">📌</span>
                {{ item.importance || '必考' }}
              </span>
            </div>
            <h4 class="card-title">{{ item.name }}</h4>
            <div class="card-source">{{ item.sourceBook || '《教程》重点考点' }}</div>
          </div>
        </div>
      </div>

      <!-- 右侧：考点重点分析详情区 (PC 桌面展示) -->
      <div class="kb-detail-pane pc-only">
        <div v-if="selectedKp" class="detail-wrapper">
          <!-- 头部标签与大标题 -->
          <div class="detail-header">
            <div class="detail-tags-row">
              <span class="dt-tag cat-pill">{{ selectedKp.categoryTag || '项目风险管理' }}</span>
              <span class="dt-tag source-pill">{{ selectedKp.sourceBook || '《教程》第12章 项目风险管理' }}</span>
              <span
                class="dt-tag level-pill"
                :class="getImportanceClass(selectedKp.importance)"
              >
                考点级别: {{ selectedKp.importance || '高频' }}
              </span>
            </div>
            <h2 class="detail-title">{{ selectedKp.name }}</h2>
          </div>

          <!-- 模块一：📖 教材考点提炼与逻辑框架 -->
          <div class="section-card framework-card">
            <div class="sec-title">
              <span class="sec-icon">📖</span>
              <span>教材考点提炼与逻辑框架</span>
            </div>
            <div class="sec-body" v-html="formatContent(selectedKp.coreAnalysis)"></div>
          </div>

          <!-- 模块二：💡 记忆口诀与冲刺速记技巧 -->
          <div v-if="selectedKp.memoryTips" class="section-card memory-card">
            <div class="sec-title">
              <span class="sec-icon">💡</span>
              <span>记忆口诀与冲刺速记技巧</span>
            </div>
            <div class="memory-content">
              {{ selectedKp.memoryTips }}
            </div>
          </div>

          <!-- 模块三：一键专项刷题操作栏 -->
          <div class="detail-footer-bar">
            <div class="footer-left">
              <span class="quiz-info-label">包含配套精选试题：</span>
              <span class="quiz-count">{{ questionsList.length || selectedKp.questionCount || 1 }}</span>
              <span class="quiz-unit">道</span>
            </div>
            <button class="quiz-action-btn" @click="startTargetedQuiz(selectedKp)">
              <span class="btn-icon">⚡</span>
              <span>针对此知识点一键专项刷题</span>
            </button>
          </div>

          <!-- 模块四：🔮 配套精选试题与答案深度解析 (对齐原型) -->
          <div class="section-card questions-section">
            <div class="sec-title purple-title">
              <span class="sec-icon">🔮</span>
              <span>配套精选试题与答案深度解析</span>
            </div>

            <div v-if="questionsList.length > 0" class="exam-questions-list">
              <div
                v-for="(q, qIdx) in questionsList"
                :key="q.id || qIdx"
                class="example-question-box"
              >
                <!-- 题目标签行 -->
                <div class="eq-badge-row" @click="toggleQuestionExpand(qIdx)">
                  <div class="eq-badges">
                    <span class="eq-num-tag">例题 {{ qIdx + 1 }}</span>
                    <span class="eq-type-tag">{{ getQuestionTypeName(q.type) }}</span>
                  </div>
                  <span class="eq-toggle-arrow">{{ expandedQuestions[qIdx] ? '▲' : '▼' }}</span>
                </div>

                <!-- 题干 -->
                <div class="eq-stem">{{ q.content }}</div>

                <!-- 选项列表 -->
                <div v-if="q.options && q.options.length" class="eq-options-grid">
                  <div
                    v-for="opt in q.options"
                    :key="opt.key"
                    class="eq-option-btn"
                    :class="{
                      selected: userAnswers[qIdx] === opt.key,
                      correct: userAnswers[qIdx] && opt.key === q.answer,
                      wrong: userAnswers[qIdx] === opt.key && opt.key !== q.answer,
                    }"
                    @click="handleSelectOption(qIdx, opt.key)"
                  >
                    <span class="opt-key">{{ opt.key }}.</span>
                    <span class="opt-content">{{ opt.content }}</span>
                  </div>
                </div>

                <!-- 答案与名师深度解析面板 (可展开或作答后查看) -->
                <div v-if="expandedQuestions[qIdx] || userAnswers[qIdx]" class="eq-analysis-box">
                  <div class="ans-row">
                    <span class="ans-label">正确答案：</span>
                    <span class="ans-text">{{ q.answer }}</span>
                  </div>
                  <div class="analysis-body">
                    <div class="analysis-label">深度解析：</div>
                    <div class="analysis-text">{{ q.analysis || '本题考核核心知识点定义的精准理解与实操应用。' }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="no-questions-tip">
              暂无匹配试题，点击上方按钮即可通过 AI 专项抽题。
            </div>
          </div>
        </div>

        <div v-else class="no-selection-placeholder">
          <div class="ph-icon">👈</div>
          <div class="ph-text">请在左侧选择一个知识点查看深度考点分析</div>
        </div>
      </div>
    </div>

    <!-- 移动端考点详情弹出抽屉 (手机端显示) -->
    <van-popup
      v-model:show="mobileDetailVisible"
      position="bottom"
      round
      closeable
      :style="{ height: '90%', display: 'flex', flexDirection: 'column' }"
      class="mobile-detail-popup"
    >
      <div v-if="selectedKp" class="mobile-detail-container">
        <div class="mobile-detail-scroll">
          <div class="detail-tags-row">
            <span class="dt-tag cat-pill">{{ selectedKp.categoryTag || '核心考点' }}</span>
            <span class="dt-tag source-pill">{{ selectedKp.sourceBook || '《教程》重点考点' }}</span>
            <span class="dt-tag level-pill" :class="getImportanceClass(selectedKp.importance)">
              考点级别: {{ selectedKp.importance || '必考' }}
            </span>
          </div>

          <h2 class="mobile-detail-title">{{ selectedKp.name }}</h2>

          <!-- 📖 教材考点提炼与逻辑框架 -->
          <div class="section-card framework-card">
            <div class="sec-title">
              <span class="sec-icon">📖</span>
              <span>教材考点提炼与逻辑框架</span>
            </div>
            <div class="sec-body" v-html="formatContent(selectedKp.coreAnalysis)"></div>
          </div>

          <!-- 💡 记忆口诀与冲刺速记技巧 -->
          <div v-if="selectedKp.memoryTips" class="section-card memory-card">
            <div class="sec-title">
              <span class="sec-icon">💡</span>
              <span>记忆口诀与冲刺速记技巧</span>
            </div>
            <div class="memory-content">
              {{ selectedKp.memoryTips }}
            </div>
          </div>

          <!-- 🔮 配套精选试题与答案深度解析 -->
          <div class="section-card questions-section">
            <div class="sec-title purple-title">
              <span class="sec-icon">🔮</span>
              <span>配套精选试题与答案深度解析</span>
            </div>

            <div v-if="questionsList.length > 0" class="exam-questions-list">
              <div
                v-for="(q, qIdx) in questionsList"
                :key="q.id || qIdx"
                class="example-question-box"
              >
                <div class="eq-badge-row" @click="toggleQuestionExpand(qIdx)">
                  <div class="eq-badges">
                    <span class="eq-num-tag">例题 {{ qIdx + 1 }}</span>
                    <span class="eq-type-tag">{{ getQuestionTypeName(q.type) }}</span>
                  </div>
                  <span class="eq-toggle-arrow">{{ expandedQuestions[qIdx] ? '▲' : '▼' }}</span>
                </div>

                <div class="eq-stem">{{ q.content }}</div>

                <div v-if="q.options && q.options.length" class="eq-options-grid">
                  <div
                    v-for="opt in q.options"
                    :key="opt.key"
                    class="eq-option-btn"
                    :class="{
                      selected: userAnswers[qIdx] === opt.key,
                      correct: userAnswers[qIdx] && opt.key === q.answer,
                      wrong: userAnswers[qIdx] === opt.key && opt.key !== q.answer,
                    }"
                    @click="handleSelectOption(qIdx, opt.key)"
                  >
                    <span class="opt-key">{{ opt.key }}.</span>
                    <span class="opt-content">{{ opt.content }}</span>
                  </div>
                </div>

                <div v-if="expandedQuestions[qIdx] || userAnswers[qIdx]" class="eq-analysis-box">
                  <div class="ans-row">
                    <span class="ans-label">正确答案：</span>
                    <span class="ans-text">{{ q.answer }}</span>
                  </div>
                  <div class="analysis-body">
                    <div class="analysis-label">深度解析：</div>
                    <div class="analysis-text">{{ q.analysis || '详见教材对应知识点逻辑框架。' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 移动端底部吸底刷题按钮 -->
        <div class="mobile-footer-bar">
          <div class="m-footer-info">
            <span>配套精选题: <strong>{{ questionsList.length || selectedKp.questionCount || 1 }}</strong> 道</span>
          </div>
          <button class="quiz-action-btn mobile-btn" @click="startTargetedQuiz(selectedKp)">
            <span class="btn-icon">⚡</span>
            <span>一键专项刷题</span>
          </button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { useSubjectStore } from '@/stores/subject'
import {
  getKnowledgeBase,
  getKnowledgePointDetail,
  type KnowledgePointItem,
} from '@/api/knowledge'
import { createPractice } from '@/api/quiz'

const router = useRouter()
const subjectStore = useSubjectStore()

const currentSubjectName = computed(() => {
  const cur = subjectStore.currentSubject
  return cur ? cur.name.replace(/系统集成项目管理工程师/, '集成').replace(/信息系统项目管理师/, '高项') : '软考'
})

const loading = ref(false)
const knowledgeList = ref<KnowledgePointItem[]>([])
const categories = ref<string[]>(['全部'])
const selectedCategory = ref<string>('全部')
const searchKeyword = ref<string>('')
const selectedKp = ref<KnowledgePointItem | null>(null)
const mobileDetailVisible = ref(false)

// 配套例题列表与交互状态
const questionsList = ref<any[]>([])
const expandedQuestions = reactive<Record<number, boolean>>({})
const userAnswers = reactive<Record<number, string>>({})

// 过滤计算
const filteredList = computed(() => {
  let list = knowledgeList.value

  // 分类筛选
  if (selectedCategory.value && selectedCategory.value !== '全部') {
    list = list.filter(
      (item) =>
        item.categoryTag === selectedCategory.value ||
        item.categoryTag?.includes(selectedCategory.value)
    )
  }

  // 搜索关键字筛选
  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.trim().toLowerCase()
    list = list.filter(
      (item) =>
        item.name.toLowerCase().includes(kw) ||
        item.sourceBook?.toLowerCase().includes(kw) ||
        item.categoryTag?.toLowerCase().includes(kw) ||
        item.coreAnalysis?.toLowerCase().includes(kw) ||
        item.memoryTips?.toLowerCase().includes(kw)
    )
  }

  return list
})

function getImportanceClass(level?: string) {
  if (!level) return 'level-must'
  if (level.includes('必考') || level === 'must_know') return 'level-must'
  if (level.includes('高频') || level === 'high') return 'level-high'
  return 'level-normal'
}

function getQuestionTypeName(type?: string) {
  if (type === 'multiple_choice' || type === 'multiple') return '多选题'
  if (type === 'case_analysis' || type === 'case') return '案例分析'
  return '单选题'
}

function selectCategory(cat: string) {
  selectedCategory.value = cat
}

function handleSearchInput() {
  // input reactive
}

function clearSearch() {
  searchKeyword.value = ''
}

function toggleQuestionExpand(idx: number) {
  expandedQuestions[idx] = !expandedQuestions[idx]
}

function handleSelectOption(qIdx: number, optKey: string) {
  userAnswers[qIdx] = optKey
  // 点击作答后自动展开解析
  expandedQuestions[qIdx] = true
}

async function handleSelectKp(item: KnowledgePointItem) {
  selectedKp.value = item
  mobileDetailVisible.value = true
  // 重置作答与展开状态
  Object.keys(userAnswers).forEach((k) => delete userAnswers[Number(k)])
  Object.keys(expandedQuestions).forEach((k) => delete expandedQuestions[Number(k)])
  expandedQuestions[0] = true // 默认展开第一道例题

  try {
    const res = await getKnowledgePointDetail(item.id)
    if (res?.data) {
      selectedKp.value = {
        ...item,
        ...res.data,
      }
      questionsList.value = res.data.questions || []
    }
  } catch {
    questionsList.value = []
  }
}

// 格式化 markdown 内容
function formatContent(text?: string) {
  if (!text) return '<p class="empty-tip">暂无教材考点逻辑分析</p>'

  let formatted = text
    .replace(/^### (.*$)/gim, '<h4 class="md-h4">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 class="md-h3">$1</h3>')
    .replace(/^# (.*$)/gim, '<h2 class="md-h2">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/^[*-] (.*$)/gim, '<li class="md-li">$1</li>')
    .replace(/\n\n/g, '<div class="md-gap"></div>')
    .replace(/\n/g, '<br/>')

  return formatted
}

// 针对此知识点一键专项刷题
async function startTargetedQuiz(kp: KnowledgePointItem) {
  showLoadingToast({
    message: '正在针对考点精准组卷...',
    forbidClick: true,
    duration: 0,
  })

  try {
    const subId = subjectStore.currentSubjectId || 1
    const res = await createPractice({
      subjectId: Number(subId),
      mode: 'chapter',
      chapterId: kp.chapterId,
      knowledgePointId: kp.id,
      knowledgePointName: kp.name,
      questionCount: 15,
    })

    closeToast()

    router.push({
      path: '/quiz/chapter',
      query: {
        chapterId: String(kp.chapterId || ''),
        knowledgePointId: String(kp.id),
        title: `${kp.name}·专项刷题`,
        recordId: res?.data?.recordId || undefined,
      },
    })
  } catch (err: any) {
    closeToast()
    router.push({
      path: '/quiz/chapter',
      query: {
        chapterId: String(kp.chapterId || ''),
        knowledgePointId: String(kp.id),
        title: `${kp.name}·专项刷题`,
      },
    })
  }
}

// 加载知识库数据
async function loadKnowledgeData() {
  loading.value = true
  try {
    const subId = subjectStore.currentSubjectId ? String(subjectStore.currentSubjectId) : '1'
    const res = await getKnowledgeBase({ subjectId: subId })

    if (res?.data) {
      knowledgeList.value = res.data.list || []
      if (res.data.categories && Array.isArray(res.data.categories)) {
        categories.value = res.data.categories
      }

      if (knowledgeList.value.length > 0) {
        handleSelectKp(knowledgeList.value[0])
      }
    }
  } catch (err: any) {
    showToast(err?.message || '加载考点知识库失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (subjectStore.subjectList.length === 0) {
    await subjectStore.fetchSubjects()
  }
  await loadKnowledgeData()
})
</script>

<style scoped lang="scss">
.knowledge-page {
  min-height: 100vh;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
  color: #1e293b;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

/* 顶部导航 */
.kb-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  position: sticky;
  top: 0;
  z-index: 50;

  .nav-left {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;

    .back-icon {
      font-size: 24px;
      line-height: 1;
      color: #64748b;
    }

    .nav-title {
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
    }
  }

  .nav-right {
    .subject-badge {
      background: #e0f2fe;
      color: #0284c7;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
    }
  }
}

/* 搜索栏 */
.search-section {
  padding: 12px 16px 8px;
  background: #ffffff;

  .search-box {
    display: flex;
    align-items: center;
    background: #f1f5f9;
    border-radius: 20px;
    padding: 8px 14px;
    gap: 8px;
    border: 1px solid transparent;
    transition: all 0.2s;

    &:focus-within {
      background: #ffffff;
      border-color: #0284c7;
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
    }

    .search-icon {
      width: 16px;
      height: 16px;
      color: #94a3b8;
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 13px;
      color: #1e293b;

      &::placeholder {
        color: #94a3b8;
      }
    }

    .clear-btn {
      background: #cbd5e1;
      border: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      color: #ffffff;
      font-size: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

/* 章节横向分类标签 */
.categories-bar {
  background: #ffffff;
  padding: 6px 16px 12px;
  border-bottom: 1px solid #f1f5f9;

  .category-scroll {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }

    .category-chip {
      flex-shrink: 0;
      padding: 6px 14px;
      border-radius: 16px;
      font-size: 12px;
      color: #475569;
      background: #f1f5f9;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;

      &:hover {
        background: #e2e8f0;
      }

      &.active {
        background: #0284c7;
        color: #ffffff;
        font-weight: 600;
        box-shadow: 0 2px 6px rgba(2, 132, 199, 0.3);
      }
    }
  }
}

/* 主体容器 */
.kb-content-container {
  flex: 1;
  display: flex;
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding: 16px;
  gap: 18px;
}

/* 左侧考点卡片列表 */
.kb-list-pane {
  flex: 1;
  min-width: 0;

  .kp-cards-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .kp-card {
    background: #ffffff;
    border-radius: 12px;
    padding: 14px 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: #93c5fd;
      transform: translateY(-1px);
    }

    &.active {
      border-color: #0284c7;
      background: #f0f9ff;
      box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.2);
    }

    .card-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;

      .cat-tag {
        font-size: 12px;
        color: #0284c7;
        background: #e0f2fe;
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 600;
      }

      .importance-badge {
        font-size: 11px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 3px;

        &.level-must {
          background: #fee2e2;
          color: #ef4444;
        }

        &.level-high {
          background: #ffedd5;
          color: #f97316;
        }

        &.level-normal {
          background: #e0e7ff;
          color: #6366f1;
        }
      }
    }

    .card-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.4;
      margin: 0 0 6px;
    }

    .card-source {
      font-size: 11px;
      color: #64748b;
    }
  }

  .loading-box,
  .empty-box {
    text-align: center;
    padding: 40px 20px;
    background: #ffffff;
    border-radius: 12px;
    color: #64748b;
  }

  .empty-box {
    .empty-icon {
      font-size: 36px;
      margin-bottom: 8px;
    }
    .empty-text {
      font-size: 14px;
    }
  }
}

/* 右侧详情面板 */
.kb-detail-pane {
  flex: 1.4;
  min-width: 0;

  .detail-wrapper {
    background: #ffffff;
    border-radius: 14px;
    padding: 22px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .detail-header {
    .detail-tags-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      .dt-tag {
        font-size: 11px;
        font-weight: 600;
        padding: 3px 8px;
        border-radius: 6px;

        &.cat-pill {
          background: #e0f2fe;
          color: #0284c7;
        }

        &.source-pill {
          background: #f1f5f9;
          color: #475569;
        }

        &.level-pill {
          &.level-must {
            background: #fee2e2;
            color: #ef4444;
          }
          &.level-high {
            background: #ffedd5;
            color: #f97316;
          }
          &.level-normal {
            background: #e0e7ff;
            color: #6366f1;
          }
        }
      }
    }

    .detail-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      line-height: 1.3;
    }
  }

  .no-selection-placeholder {
    background: #ffffff;
    border-radius: 14px;
    padding: 60px 20px;
    text-align: center;
    border: 1px dashed #cbd5e1;
    color: #64748b;

    .ph-icon {
      font-size: 40px;
      margin-bottom: 12px;
    }

    .ph-text {
      font-size: 14px;
    }
  }
}

/* 核心通用卡片 */
.section-card {
  border-radius: 12px;
  padding: 16px 18px;
  border: 1px solid #e2e8f0;

  .sec-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 12px;
    color: #0f172a;

    .sec-icon {
      font-size: 18px;
    }

    &.purple-title {
      color: #6366f1;
    }
  }
}

/* 模块一：教材考点提炼与逻辑框架 */
.framework-card {
  background: #f8fafc;
  border-left: 4px solid #0284c7;

  .sec-body {
    font-size: 13.5px;
    line-height: 1.7;
    color: #334155;

    :deep(.md-h2),
    :deep(.md-h3),
    :deep(.md-h4) {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin: 12px 0 6px;
    }

    :deep(.md-li) {
      margin-left: 18px;
      list-style-type: disc;
      margin-bottom: 4px;
    }

    :deep(.inline-code) {
      background: #e2e8f0;
      color: #0369a1;
      padding: 1px 5px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
    }

    :deep(strong) {
      color: #0f172a;
      font-weight: 700;
    }

    :deep(.md-gap) {
      height: 8px;
    }
  }
}

/* 模块二：记忆口诀与冲刺速记技巧 (暖黄高亮) */
.memory-card {
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-left: 4px solid #f59e0b;

  .sec-title {
    color: #b45309;
  }

  .memory-content {
    font-size: 13.5px;
    line-height: 1.6;
    color: #92400e;
    font-weight: 600;
  }
}

/* 模块三：专项刷题操作栏 */
.detail-footer-bar {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 12px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  .footer-left {
    font-size: 13px;
    color: #166534;
    font-weight: 500;

    .quiz-count {
      color: #15803d;
      font-size: 18px;
      font-weight: 800;
      margin: 0 2px;
    }

    .quiz-unit {
      color: #166534;
    }
  }

  .quiz-action-btn {
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    color: #ffffff;
    padding: 9px 18px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 4px 10px rgba(16, 185, 129, 0.35);
    transition: all 0.2s;

    &:active {
      transform: translateY(1px);
    }
  }
}

/* 模块四：配套精选试题与答案深度解析 */
.questions-section {
  background: #ffffff;
  border: 1px solid #e0e7ff;

  .exam-questions-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .example-question-box {
    border: 1px solid #f1f5f9;
    border-radius: 10px;
    padding: 14px 16px;
    background: #fafafa;

    .eq-badge-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      cursor: pointer;

      .eq-badges {
        display: flex;
        gap: 6px;

        .eq-num-tag {
          background: #e0e7ff;
          color: #4338ca;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .eq-type-tag {
          background: #f1f5f9;
          color: #64748b;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
        }
      }

      .eq-toggle-arrow {
        color: #94a3b8;
        font-size: 11px;
      }
    }

    .eq-stem {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.5;
      margin-bottom: 12px;
    }

    .eq-options-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 12px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }

      .eq-option-btn {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 12.5px;
        display: flex;
        gap: 6px;
        cursor: pointer;
        transition: all 0.15s;

        &:hover {
          border-color: #93c5fd;
          background: #f8fafc;
        }

        &.selected {
          border-color: #0284c7;
          background: #f0f9ff;
          font-weight: 600;
        }

        &.correct {
          border-color: #10b981;
          background: #ecfdf5;
          color: #065f46;
          font-weight: 700;
        }

        &.wrong {
          border-color: #ef4444;
          background: #fef2f2;
          color: #991b1b;
          font-weight: 600;
        }

        .opt-key {
          font-weight: 700;
        }
      }
    }

    .eq-analysis-box {
      background: #ffffff;
      border-radius: 8px;
      padding: 10px 14px;
      border-left: 3px solid #6366f1;
      font-size: 12.5px;
      line-height: 1.5;

      .ans-row {
        margin-bottom: 6px;
        .ans-label {
          color: #64748b;
          font-weight: 600;
        }
        .ans-text {
          color: #10b981;
          font-weight: 800;
          font-size: 14px;
        }
      }

      .analysis-body {
        color: #334155;
        .analysis-label {
          font-weight: 700;
          color: #475569;
          margin-bottom: 2px;
        }
      }
    }
  }

  .no-questions-tip {
    font-size: 12px;
    color: #94a3b8;
    text-align: center;
    padding: 16px;
  }
}

/* 移动端详情抽屉 */
.mobile-detail-popup {
  .mobile-detail-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #ffffff;

    .mobile-detail-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 20px 16px 80px;
      display: flex;
      flex-direction: column;
      gap: 16px;

      .mobile-detail-title {
        font-size: 18px;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
        line-height: 1.35;
      }
    }

    .mobile-footer-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: #ffffff;
      padding: 10px 16px;
      border-top: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);

      .m-footer-info {
        font-size: 12px;
        color: #64748b;
        strong {
          color: #10b981;
          font-size: 15px;
        }
      }

      .mobile-btn {
        padding: 8px 16px;
        font-size: 13px;
      }
    }
  }
}

/* 响应式控制 */
.pc-only {
  display: block;
}

@media (max-width: 768px) {
  .pc-only {
    display: none;
  }

  .kb-content-container {
    padding: 12px;
  }
}
</style>
