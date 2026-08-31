<template>
  <div class="knowledge-page">
    <!-- 顶部导航栏 -->
    <div class="kb-navbar">
      <div class="nav-left" @click="$router.back()">
        <span class="back-icon">‹</span>
        <span class="nav-title">考点知识库</span>
      </div>
      <div class="nav-right">
        <button class="ai-extract-btn" @click="openAiExtractModal">
          <span class="icon">✨</span>
          <span>AI 提取考点</span>
        </button>
      </div>
    </div>

    <!-- 顶部搜索框 (还原原型) -->
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

    <!-- 章节与分类横向过滤标签 (还原原型) -->
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
          <button class="empty-ai-btn" @click="openAiExtractModal">🤖 呼叫 AI 提炼本章考点</button>
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

          <!-- 底部固定/操作栏 (针对此知识点一键专项刷题) -->
          <div class="detail-footer-bar">
            <div class="footer-left">
              <span class="quiz-info-label">包含配套精选试题：</span>
              <span class="quiz-count">{{ selectedKp.questionCount || 1 }}</span>
              <span class="quiz-unit">道</span>
            </div>
            <button class="quiz-action-btn" @click="startTargetedQuiz(selectedKp)">
              <span class="btn-icon">⚡</span>
              <span>针对此知识点一键专项刷题</span>
            </button>
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
        </div>

        <!-- 移动端底部吸底刷题按钮 -->
        <div class="mobile-footer-bar">
          <div class="m-footer-info">
            <span>配套精选试题: <strong>{{ selectedKp.questionCount || 1 }}</strong> 道</span>
          </div>
          <button class="quiz-action-btn mobile-btn" @click="startTargetedQuiz(selectedKp)">
            <span class="btn-icon">⚡</span>
            <span>一键专项刷题</span>
          </button>
        </div>
      </div>
    </van-popup>

    <!-- AI 自动提取章节考点弹窗 -->
    <van-dialog
      v-model:show="aiModalVisible"
      title="🤖 AI 自动提炼章节考点"
      show-cancel-button
      :confirm-button-text="aiExtracting ? 'AI 正在提炼中...' : '开始提炼'"
      :confirm-button-disabled="aiExtracting"
      @confirm="handleAiExtract"
    >
      <div class="ai-modal-content">
        <p class="ai-hint">输入或选择需要提炼考点的教材章节，AI 将自动分析核心逻辑框架并生成冲刺速记口诀：</p>
        <div class="ai-form-group">
          <label>章节名称 / 考点范围：</label>
          <input
            v-model="aiChapterName"
            type="text"
            placeholder="例如：第9章 项目成本管理 (或输入具体知识点)"
            class="ai-input"
          />
        </div>
        <div class="ai-form-group">
          <label>大纲或补充资料（可选）：</label>
          <textarea
            v-model="aiSyllabusText"
            placeholder="可粘贴大纲文本或考点笔记，留空则由 AI 自动根据官方软考大纲推导..."
            rows="3"
            class="ai-textarea"
          ></textarea>
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { useSubjectStore } from '@/stores/subject'
import {
  getKnowledgeBase,
  extractKnowledgePoints,
  type KnowledgePointItem,
} from '@/api/knowledge'
import { createPractice } from '@/api/quiz'

const router = useRouter()
const subjectStore = useSubjectStore()

const loading = ref(false)
const knowledgeList = ref<KnowledgePointItem[]>([])
const categories = ref<string[]>(['全部'])
const selectedCategory = ref<string>('全部')
const searchKeyword = ref<string>('')
const selectedKp = ref<KnowledgePointItem | null>(null)
const mobileDetailVisible = ref(false)

// AI 提取弹窗
const aiModalVisible = ref(false)
const aiExtracting = ref(false)
const aiChapterName = ref('')
const aiSyllabusText = ref('')

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

function selectCategory(cat: string) {
  selectedCategory.value = cat
  // 若当前选中的卡片不在筛选列表中，自动选中首个
  setTimeout(() => {
    if (filteredList.value.length > 0) {
      if (!selectedKp.value || !filteredList.value.find((i) => i.id === selectedKp.value?.id)) {
        selectedKp.value = filteredList.value[0]
      }
    }
  }, 50)
}

function handleSearchInput() {
  if (filteredList.value.length > 0 && !filteredList.value.find((i) => i.id === selectedKp.value?.id)) {
    selectedKp.value = filteredList.value[0]
  }
}

function clearSearch() {
  searchKeyword.value = ''
}

function handleSelectKp(item: KnowledgePointItem) {
  selectedKp.value = item
  // 如果在移动端视图（屏幕宽度 < 768px），弹出浮层展示详情
  if (window.innerWidth < 768) {
    mobileDetailVisible.value = true
  }
}

function formatContent(text?: string) {
  if (!text) return '<p class="empty-tip">暂无教材考点提炼内容</p>'
  
  // 简单安全且美观的 Markdown 解析为 HTML
  let html = text
    .replace(/^### (.*$)/gim, '<h4 class="md-h4">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 class="md-h3">$1</h3>')
    .replace(/^# (.*$)/gim, '<h2 class="md-h2">$1</h2>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code class="inline-code">$1</code>')
    .replace(/^\s*-\s+(.*$)/gim, '<li class="md-li">$1</li>')
    .replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="md-ol-li">$1</li>')

  // 将连续的换行转换为段落
  html = html.replace(/\n\n/g, '<br/>')
  html = html.replace(/\n/g, '<br/>')

  return html
}

async function fetchKnowledgeBase() {
  loading.value = true
  try {
    const subId = subjectStore.currentSubjectId || undefined
    const res = await getKnowledgeBase({ subjectId: subId })
    if (res?.data) {
      knowledgeList.value = res.data.list || []
      if (res.data.categories && res.data.categories.length > 0) {
        categories.value = res.data.categories
      }
      if (knowledgeList.value.length > 0) {
        selectedKp.value = knowledgeList.value[0]
      }
    }
  } catch (err: any) {
    showToast(err?.message || '获取知识库数据失败')
  } finally {
    loading.value = false
  }
}

// 专项刷题启动
async function startTargetedQuiz(kp: KnowledgePointItem) {
  const toast = showLoadingToast({
    message: '正在生成专项试卷...',
    forbidClick: true,
    duration: 0,
  })

  try {
    const subId = subjectStore.currentSubjectId ? Number(subjectStore.currentSubjectId) : 1
    const res = await createPractice({
      subjectId: subId,
      mode: 'chapter',
      chapterId: kp.chapterId,
      knowledgePointId: kp.id,
      knowledgePointName: kp.name,
      questionCount: kp.questionCount || 10,
    })

    closeToast()
    const recordId = res.data?.recordId || res.data?.record?.id
    if (recordId) {
      router.push({
        path: '/quiz/practice',
        query: { recordId, title: `${kp.name}·专项刷题` },
      })
    } else {
      showToast('试卷准备失败，请稍后重试')
    }
  } catch (err: any) {
    closeToast()
    showToast(err?.message || '专项练习启动失败')
  }
}

function openAiExtractModal() {
  aiChapterName.value = selectedCategory.value !== '全部' ? selectedCategory.value : '项目风险管理'
  aiSyllabusText.value = ''
  aiModalVisible.value = true
}

async function handleAiExtract() {
  if (!aiChapterName.value.trim()) {
    showToast('请输入章节名称')
    return
  }

  aiExtracting.value = true
  const toast = showLoadingToast({
    message: 'AI 正在深度解析大纲并提炼考点...',
    forbidClick: true,
    duration: 0,
  })

  try {
    const subId = subjectStore.currentSubjectId ? Number(subjectStore.currentSubjectId) : 1
    const res = await extractKnowledgePoints({
      subjectId: subId,
      chapterName: aiChapterName.value.trim(),
      syllabusText: aiSyllabusText.value.trim(),
      count: 4,
    })

    closeToast()
    aiModalVisible.value = false
    showToast('AI 考点提炼完成！')
    await fetchKnowledgeBase()
  } catch (err: any) {
    closeToast()
    showToast(err?.message || 'AI 提炼异常，请检查配置')
  } finally {
    aiExtracting.value = false
  }
}

onMounted(() => {
  fetchKnowledgeBase()
})
</script>

<style scoped lang="scss">
.knowledge-page {
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏 */
.kb-navbar {
  height: 52px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 20;

  .nav-left {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;

    .back-icon {
      font-size: 24px;
      line-height: 1;
      color: #334155;
    }

    .nav-title {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
    }
  }

  .ai-extract-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    background: linear-gradient(135deg, #0ea5e9, #0284c7);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 20px;
    border: none;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(14, 165, 233, 0.35);
    transition: all 0.2s;

    &:active {
      transform: scale(0.96);
    }
  }
}

/* 顶部搜索框 (还原原型) */
.search-section {
  padding: 14px 16px 8px;
  background: #ffffff;

  .search-box {
    width: 100%;
    height: 44px;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 22px;
    display: flex;
    align-items: center;
    padding: 0 14px;
    gap: 8px;
    transition: border-color 0.2s;

    &:focus-within {
      border-color: #0ea5e9;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
    }

    .search-icon {
      width: 18px;
      height: 18px;
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
        font-size: 13px;
      }
    }

    .clear-btn {
      background: #cbd5e1;
      border: none;
      color: #fff;
      font-size: 10px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
  }
}

/* 章节横向分类过滤 (还原原型胶囊设计) */
.categories-bar {
  background: #ffffff;
  padding: 6px 16px 14px;
  border-bottom: 1px solid #f1f5f9;

  .category-scroll {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .category-chip {
    flex-shrink: 0;
    padding: 6px 14px;
    border-radius: 20px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    color: #475569;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: #cbd5e1;
    }

    &.active {
      background: #0284c7;
      color: #ffffff;
      border-color: #0284c7;
      font-weight: 600;
      box-shadow: 0 2px 6px rgba(2, 132, 199, 0.3);
    }
  }
}

/* 主内容容器 */
.kb-content-container {
  flex: 1;
  display: flex;
  padding: 16px;
  gap: 16px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

/* 左侧列表 */
.kb-list-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.kp-cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 考点卡片 (还原原型高保真卡片) */
.kp-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1.5px solid #e2e8f0;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);

  &:hover {
    border-color: #38bdf8;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);
  }

  &.active {
    border-color: #0ea5e9;
    background: #f0f9ff;
    box-shadow: 0 0 0 1px #0ea5e9, 0 4px 16px rgba(14, 165, 233, 0.15);
  }

  .card-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .cat-tag {
    font-size: 11px;
    font-weight: 600;
    color: #0369a1;
    background: #e0f2fe;
    padding: 2px 8px;
    border-radius: 6px;
  }

  .importance-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 2px;

    .badge-icon {
      font-size: 9px;
    }

    &.level-must {
      color: #e11d48;
      background: #ffe4e6;
    }

    &.level-high {
      color: #ea580c;
      background: #ffedd5;
    }

    &.level-normal {
      color: #0284c7;
      background: #e0f2fe;
    }
  }

  .card-title {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.45;
    margin: 0 0 6px;
  }

  .card-source {
    font-size: 11px;
    color: #64748b;
  }
}

/* 右侧详情面板 (PC 端) */
.kb-detail-pane {
  flex: 1.35;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 22px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.detail-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.detail-header {
  margin-bottom: 18px;

  .detail-tags-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;

    .dt-tag {
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 20px;
      font-weight: 600;
    }

    .cat-pill {
      background: #e0f2fe;
      color: #0284c7;
    }

    .source-pill {
      background: #f1f5f9;
      color: #475569;
    }

    .level-pill {
      &.level-must {
        background: #ffe4e6;
        color: #e11d48;
      }
      &.level-high {
        background: #ffedd5;
        color: #ea580c;
      }
      &.level-normal {
        background: #e0f2fe;
        color: #0284c7;
      }
    }
  }

  .detail-title {
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.35;
    margin: 0;
  }
}

/* 核心内容卡片 */
.section-card {
  border-radius: 14px;
  padding: 16px 18px;
  margin-bottom: 16px;

  .sec-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 12px;

    .sec-icon {
      font-size: 16px;
    }
  }
}

/* 框架卡片 (还原原型灰色质感) */
.framework-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;

  .sec-body {
    font-size: 13px;
    color: #334155;
    line-height: 1.7;

    :deep(.md-h3),
    :deep(.md-h4) {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin: 12px 0 6px;
    }

    :deep(.md-li),
    :deep(.md-ol-li) {
      margin-bottom: 6px;
      padding-left: 4px;
    }

    :deep(strong) {
      color: #0f172a;
      font-weight: 700;
    }

    :deep(.inline-code) {
      background: #e2e8f0;
      color: #0284c7;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
    }
  }
}

/* 记忆口诀卡片 (还原原型暖黄卡片) */
.memory-card {
  background: #fffbeb;
  border: 1px solid #fef3c7;

  .sec-title {
    color: #b45309;
  }

  .memory-content {
    font-size: 13px;
    font-weight: 600;
    color: #92400e;
    line-height: 1.6;
  }
}

/* 底部操作栏 (还原原型绿色发光按钮) */
.detail-footer-bar {
  margin-top: auto;
  padding-top: 18px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .footer-left {
    font-size: 12px;
    color: #64748b;

    .quiz-count {
      font-size: 14px;
      font-weight: 800;
      color: #0284c7;
      margin: 0 2px;
    }
  }

  .quiz-action-btn {
    background: #059669;
    color: #ffffff;
    border: none;
    border-radius: 24px;
    padding: 10px 22px;
    font-size: 14px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35);
    transition: all 0.2s;

    &:hover {
      background: #047857;
      box-shadow: 0 6px 18px rgba(5, 150, 105, 0.45);
    }

    &:active {
      transform: scale(0.98);
    }

    .btn-icon {
      font-size: 16px;
    }
  }
}

/* 移动端详情浮层 */
.mobile-detail-popup {
  background: #f8fafc;
}

.mobile-detail-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.mobile-detail-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 24px 16px 16px;
}

.mobile-detail-title {
  font-size: 17px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.4;
  margin: 10px 0 16px;
}

.mobile-footer-bar {
  background: #ffffff;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .m-footer-info {
    font-size: 12px;
    color: #64748b;

    strong {
      color: #0284c7;
      font-size: 14px;
    }
  }

  .mobile-btn {
    padding: 9px 18px;
    font-size: 13px;
  }
}

/* AI 弹窗内容 */
.ai-modal-content {
  padding: 12px 16px;

  .ai-hint {
    font-size: 12px;
    color: #64748b;
    line-height: 1.5;
    margin-bottom: 12px;
  }

  .ai-form-group {
    margin-bottom: 12px;

    label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 6px;
    }

    .ai-input,
    .ai-textarea {
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 13px;
      color: #1e293b;
      outline: none;

      &:focus {
        border-color: #0284c7;
      }
    }
  }
}

/* 空状态与加载状态 */
.loading-box,
.empty-box,
.no-selection-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #94a3b8;
  gap: 12px;

  .empty-icon,
  .ph-icon {
    font-size: 36px;
  }

  .empty-text,
  .ph-text {
    font-size: 13px;
  }

  .empty-ai-btn {
    background: #0284c7;
    color: #fff;
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
}

/* 响应式媒体查询 */
@media (max-width: 767px) {
  .pc-only {
    display: none !important;
  }

  .kb-content-container {
    padding: 10px 12px;
  }
}
</style>
