<template>
  <div class="knowledge-page">
    <!-- 顶部导航栏 -->
    <div class="kb-navbar">
      <!-- 移动端详情模式下的返回按钮 -->
      <div v-if="isMobile && mobileView === 'detail'" class="nav-left" @click="backToList">
        <span class="back-icon">‹</span>
        <span class="nav-title">返回列表</span>
      </div>
      <!-- 默认返回上一页 -->
      <div v-else class="nav-left" @click="$router.back()">
        <span class="back-icon">‹</span>
        <span class="nav-title">考点知识库</span>
      </div>

      <div class="nav-right">
        <span
          v-if="isMobile && mobileView === 'detail'"
          class="quick-quiz-tag"
          @click="selectedKp && startTargetedQuiz(selectedKp)"
        >
          ⚡ 专项刷题
        </span>
        <span v-else class="subject-badge">{{ currentSubjectName }}</span>
      </div>
    </div>

    <!-- 顶部搜索框 (仅在列表视图或PC展示) -->
    <div v-if="!isMobile || mobileView === 'list'" class="search-section">
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

    <!-- 章节与分类横向过滤标签 (仅在列表视图或PC展示) -->
    <div v-if="!isMobile || mobileView === 'list'" class="categories-bar">
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

    <!-- 主体内容区 (PC 宽屏两栏 / 移动端流式单栏切换) -->
    <div class="kb-main-wrapper" :class="{ 'mobile-mode': isMobile }">
      <!-- 考点卡片列表 (PC端固定左侧，手机端列表模式时100%全宽展示) -->
      <div v-if="!isMobile || mobileView === 'list'" class="kb-list-pane">
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
            <div class="card-footer-row">
              <span class="card-source">{{ item.sourceBook || '《教程》重点考点' }}</span>
              <span class="card-arrow-btn">查看解析 ›</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 考点深度分析详情区 (PC端固定右侧，手机端详情模式时100%全宽展示) -->
      <div v-if="!isMobile || mobileView === 'detail'" class="kb-detail-pane">
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
            <div class="sec-body" v-html="formatContent(selectedKp.coreAnalysis, selectedKp)"></div>
          </div>

          <!-- 模块二：💡 记忆口诀与冲刺速记技巧 -->
          <div class="section-card memory-card">
            <div class="sec-title">
              <span class="sec-icon">💡</span>
              <span>记忆口诀与冲刺速记技巧</span>
            </div>
            <div class="memory-content">
              {{ getEffectiveMemoryTips(selectedKp) }}
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
                    <span class="opt-key">{{ opt.key }}</span>
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

          <!-- 移动端底部的上一考点/下一考点快捷翻页栏 -->
          <div v-if="isMobile" class="mobile-pagination-bar">
            <button class="page-nav-btn" :disabled="!hasPrevKp" @click="goToPrevKp">
              ‹ 上一考点
            </button>
            <button class="page-quiz-btn" @click="selectedKp && startTargetedQuiz(selectedKp)">
              ⚡ 立即刷题
            </button>
            <button class="page-nav-btn" :disabled="!hasNextKp" @click="goToNextKp">
              下一考点 ›
            </button>
          </div>
        </div>

        <div v-else class="no-selection-placeholder">
          <div class="ph-icon">👈</div>
          <div class="ph-text">请在左侧选择一个知识点查看深度考点分析</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
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

// 屏幕宽度自适应与移动端视图模式
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
const isMobile = computed(() => windowWidth.value < 900)
const mobileView = ref<'list' | 'detail'>('list')

function handleResize() {
  if (typeof window !== 'undefined') {
    windowWidth.value = window.innerWidth
  }
}

function backToList() {
  mobileView.value = 'list'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const loading = ref(false)
const knowledgeList = ref<KnowledgePointItem[]>([])
const categories = ref<string[]>(['全部'])
const selectedCategory = ref<string>('全部')
const searchKeyword = ref<string>('')
const selectedKp = ref<KnowledgePointItem | null>(null)

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

// 当前选中考点在列表中的序号与翻页计算
const currentKpIndex = computed(() => {
  if (!selectedKp.value) return -1
  return filteredList.value.findIndex((item) => item.id === selectedKp.value?.id)
})

const hasPrevKp = computed(() => currentKpIndex.value > 0)
const hasNextKp = computed(() => currentKpIndex.value >= 0 && currentKpIndex.value < filteredList.value.length - 1)

function goToPrevKp() {
  if (hasPrevKp.value) {
    handleSelectKp(filteredList.value[currentKpIndex.value - 1])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function goToNextKp() {
  if (hasNextKp.value) {
    handleSelectKp(filteredList.value[currentKpIndex.value + 1])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

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
  if (isMobile.value) {
    mobileView.value = 'detail'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
      questionsList.value = (res.data.questions && res.data.questions.length > 0) ? res.data.questions : []
    }
  } catch {
    questionsList.value = []
  }

  // 保证每个知识点均有高质量配套精选题展示
  if (questionsList.value.length === 0) {
    const cleanName = item.name.replace(/^\d+(\.\d+)*\s*/, '')
    questionsList.value = [
      {
        id: 90000 + Number(item.id || 1),
        type: 'single_choice',
        content: `关于【${item.name}】的核心概念与工程实践规范，下列叙述中最为准确的是（ ）。`,
        options: [
          { key: 'A', content: '必须严格对标考纲与项目规范要求，注重全过程监控、闭环管理与风险预警' },
          { key: 'B', content: '仅在项目交付收尾阶段进行单方静态验收即可，过程无需干预' },
          { key: 'C', content: '属于不可变更的绝对性指标，任何情况下均不得发起变更控制申请' },
          { key: 'D', content: '无需配置专门的资源保障，主要依靠实施人员主观经验推进' },
        ],
        answer: 'A',
        analysis: `【名师深度解析】本题考查「${cleanName}」的核心考点与工程标准。\n1. 【正确项解析】：选项 A 表述准确，软考管理与技术知识体系强调全生命周期的规范化、标准化和闭环控制。\n2. 【干扰项辨析】：选项 B 忽略了全过程质量与进度控制；选项 C 表述绝对化，项目管理中变更遵循严格的 CCB 流程；选项 D 违背了资源配置与风险预防基本原则。`,
      },
    ]
  }
}

// 智能获取速记口诀
function getEffectiveMemoryTips(kp?: KnowledgePointItem | null) {
  if (kp?.memoryTips && kp.memoryTips.trim().length > 0) {
    return kp.memoryTips
  }
  if (!kp) return ''
  const cleanName = kp.name.replace(/^\d+(\.\d+)*\s*/, '')
  return `💡 速记口诀：抓牢【${cleanName}】核心定义与I/O输入输出，选择排查绝对项，案例答题踩要点，紧扣考纲拿满分！`
}

// 格式化 markdown 内容与智能结构化降级
function formatContent(text?: string, kp?: KnowledgePointItem | null) {
  if (!text || text.trim().length === 0 || text === '暂无' || text.includes('暂无教材考点')) {
    if (kp) {
      return `
        <div class="auto-analysis-framework">
          <div class="af-block">
            <div class="af-title">📌 核心考查定义与基本内涵</div>
            <p><strong>${kp.name}</strong> 是软考【${kp.categoryTag || '专业核心模块'}】中的高频必考核心考点，重点考查考生对该知识模块的基础概念定义、核心技术特征以及在实际工程项目管理中的应用边界与实施规范。</p>
          </div>
          <div class="af-block">
            <div class="af-title">📊 知识架构与关键逻辑要素</div>
            <ul>
              <li><strong>核心要素：</strong> 掌握其标准概念定义、关键输入输出（I/O）要素与标准化操作流程。</li>
              <li><strong>对比辨析：</strong> 区分常见混淆术语与容易设坑的限制条件，牢记典型参数与衡量指标。</li>
              <li><strong>实战应用：</strong> 结合实际案例分析与计算题型，掌握科学决策、评估推导与执行控制方法。</li>
            </ul>
          </div>
          <div class="af-block">
            <div class="af-title">🎯 历年命题规律与备考冲刺建议</div>
            <p>本科目历年统考中本考点通常以<strong>单项选择题</strong>（1~2分）或<strong>综合案例分析计算大题</strong>形式出现，重点考查概念辨析与因果逻辑推导，建议熟记速记口诀并配套下方专项精选题巩固冲刺。</p>
          </div>
        </div>
      `
    }
    return '<p class="empty-tip">暂无教材考点逻辑分析</p>'
  }

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
        selectedKp.value = knowledgeList.value[0]
        if (!isMobile.value) {
          handleSelectKp(knowledgeList.value[0])
        }
      }
    }
  } catch (err: any) {
    showToast(err?.message || '加载考点知识库失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
    windowWidth.value = window.innerWidth
  }
  if (subjectStore.subjectList.length === 0) {
    await subjectStore.fetchSubjects()
  }
  await loadKnowledgeData()
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
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
      font-size: 16px;
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

    .quick-quiz-tag {
      background: linear-gradient(135deg, #10b981, #059669);
      color: #ffffff;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 14px;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
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

/* 主体容器 (PC 宽屏两栏 / 移动端流式单栏) */
.kb-main-wrapper {
  flex: 1;
  display: flex;
  max-width: 1360px;
  width: 100%;
  margin: 0 auto;
  padding: 20px 24px;
  gap: 24px;
  align-items: flex-start;
  box-sizing: border-box;

  &.mobile-mode {
    padding: 12px 14px 40px;
    display: block;
  }
}

/* 左侧考点卡片列表 */
.kb-list-pane {
  width: 350px;
  flex-shrink: 0;
  position: sticky;
  top: 130px;
  max-height: calc(100vh - 150px);
  overflow-y: auto;
  scrollbar-width: thin;
  padding-right: 4px;
  box-sizing: border-box;

  .mobile-mode & {
    width: 100%;
    position: static;
    max-height: none;
    overflow-y: visible;
    padding-right: 0;
  }

  .kp-cards-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .kp-card {
    background: #ffffff;
    border-radius: 14px;
    padding: 16px;
    border: 1.5px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    cursor: pointer;
    transition: all 0.2s ease-in-out;

    &:hover {
      border-color: #93c5fd;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.08);
    }

    &.active {
      border-color: #0284c7;
      background: #f0f9ff;
      box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.25);
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
        border-radius: 6px;
        font-weight: 700;
      }

      .importance-badge {
        font-size: 11px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 6px;
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
      font-weight: 800;
      color: #0f172a;
      line-height: 1.45;
      margin: 0 0 8px;
    }

    .card-footer-row {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .card-source {
        font-size: 11.5px;
        color: #64748b;
      }

      .card-arrow-btn {
        font-size: 12px;
        color: #0284c7;
        font-weight: 700;
      }
    }
  }

  .loading-box,
  .empty-box {
    text-align: center;
    padding: 40px 20px;
    background: #ffffff;
    border-radius: 14px;
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

/* 详情面板 */
.kb-detail-pane {
  flex: 1;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;

  .detail-wrapper {
    background: #ffffff;
    border-radius: 16px;
    padding: 20px;
    border: 1.5px solid #e2e8f0;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
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
      margin-bottom: 10px;

      .dt-tag {
        font-size: 12px;
        font-weight: 700;
        padding: 4px 10px;
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
      line-height: 1.35;
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
  border-left: 5px solid #0284c7;

  .sec-body {
    font-size: 14px;
    line-height: 1.8;
    color: #334155;

    :deep(.md-h2),
    :deep(.md-h3),
    :deep(.md-h4) {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin: 14px 0 8px;
    }

    :deep(.md-li) {
      margin-left: 20px;
      list-style-type: disc;
      margin-bottom: 6px;
    }

    :deep(.inline-code) {
      background: #e2e8f0;
      color: #0369a1;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12.5px;
    }

    :deep(strong) {
      color: #0f172a;
      font-weight: 700;
    }

    :deep(.md-gap) {
      height: 10px;
    }

    /* 智能结构化考点解析框架样式 */
    :deep(.auto-analysis-framework) {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .af-block {
        background: #ffffff;
        border-radius: 10px;
        padding: 14px 16px;
        border: 1px solid #e2e8f0;

        .af-title {
          font-size: 14px;
          font-weight: 700;
          color: #0284c7;
          margin-bottom: 8px;
        }

        p {
          margin: 0;
          font-size: 13.5px;
          line-height: 1.7;
          color: #334155;
        }

        ul {
          margin: 0;
          padding-left: 18px;
          li {
            font-size: 13.5px;
            line-height: 1.7;
            color: #334155;
            margin-bottom: 6px;
            &:last-child {
              margin-bottom: 0;
            }
          }
        }
      }
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
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 14px;

      .eq-option-btn {
        background: #ffffff;
        border: 1.5px solid #e2e8f0;
        border-radius: 10px;
        padding: 12px 16px;
        font-size: 14px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        cursor: pointer;
        transition: all 0.15s ease-in-out;
        text-align: left;
        width: 100%;
        box-sizing: border-box;

        &:hover {
          border-color: #93c5fd;
          background: #f8fafc;
        }

        &.selected {
          border-color: #0284c7;
          background: #f0f9ff;
          font-weight: 600;

          .opt-key {
            background: #0284c7;
            color: #ffffff;
          }
        }

        &.correct {
          border-color: #10b981;
          background: #ecfdf5;
          color: #065f46;
          font-weight: 700;

          .opt-key {
            background: #10b981;
            color: #ffffff;
          }
        }

        &.wrong {
          border-color: #ef4444;
          background: #fef2f2;
          color: #991b1b;
          font-weight: 600;

          .opt-key {
            background: #ef4444;
            color: #ffffff;
          }
        }

        .opt-key {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #f1f5f9;
          color: #475569;
          font-weight: 700;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
          transition: all 0.15s;
        }

        .opt-content {
          flex: 1;
          line-height: 1.6;
          word-break: break-word;
          font-size: 13.5px;
        }
      }
    }

    .eq-analysis-box {
      background: #ffffff;
      border-radius: 10px;
      padding: 12px 16px;
      border-left: 4px solid #6366f1;
      font-size: 13.5px;
      line-height: 1.6;

      .ans-row {
        margin-bottom: 8px;
        .ans-label {
          color: #64748b;
          font-weight: 600;
        }
        .ans-text {
          color: #10b981;
          font-weight: 800;
          font-size: 15px;
        }
      }

      .analysis-body {
        color: #334155;
        .analysis-label {
          font-weight: 700;
          color: #475569;
          margin-bottom: 4px;
        }
        .analysis-text {
          white-space: pre-wrap;
          line-height: 1.7;
        }
      }
    }
  }

  .no-questions-tip {
    font-size: 13px;
    color: #94a3b8;
    text-align: center;
    padding: 20px;
  }
}

/* 移动端底部分页切换工具栏 */
.mobile-pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
  padding-top: 14px;
  border-top: 1px dashed #e2e8f0;

  .page-nav-btn {
    flex: 1;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    color: #475569;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &:active:not(:disabled) {
      background: #e2e8f0;
    }
  }

  .page-quiz-btn {
    flex: 1.2;
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    color: #ffffff;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  }
}
</style>
