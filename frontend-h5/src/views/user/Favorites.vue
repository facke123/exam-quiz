<template>
  <div class="fav-page">
    <div class="nav-bar">
      <div
        class="back"
        @click="onBack"
      >
        ‹
      </div>
      <div class="title">
        我的题目收藏
      </div>
      <div
        class="right"
        @click="toggleEdit"
      >
        {{ editMode ? '完成' : '批量管理' }}
      </div>
    </div>

    <!-- 科目与收藏总览 -->
    <div class="subject-bar">
      <div class="sub-info">
        <span class="sub-icon">⭐</span>
        <span class="sub-name">{{ currentSubjectName }}</span>
      </div>
      <div class="sub-toggle" @click="toggleSubjectFilter">
        {{ showAllSubjects ? '查看当前科目' : '查看全科收藏' }} ⇋
      </div>
    </div>

    <!-- 题型过滤器 -->
    <div class="fav-header">
      <div
        v-for="t in typeTabs"
        :key="t.value"
        class="filter-chip"
        :class="{ active: currentType === t.value }"
        @click="currentType = t.value"
      >
        {{ t.label }}
        <span v-if="getTypeCount(t.value) > 0" class="chip-count">{{ getTypeCount(t.value) }}</span>
      </div>
    </div>

    <!-- 收藏统计与集中攻关 -->
    <div class="fav-stats">
      <div class="fs-info">
        <div class="fs-num">
          {{ filteredList.length }}
        </div>
        <div class="fs-label">
          道收藏试题
        </div>
      </div>
      <div class="fs-actions">
        <div
          v-if="editMode && filteredList.length > 0"
          class="fs-btn danger"
          @click="clearAllCurrent"
        >
          一键清空
        </div>
        <div
          class="fs-btn"
          @click="startRedo"
        >
          🚀 开始收藏重练
        </div>
      </div>
    </div>

    <!-- 收藏卡片列表 -->
    <div
      v-if="loading"
      class="loading-state"
      style="padding: 50px 16px; text-align: center"
    >
      <van-loading
        type="spinner"
        color="var(--primary)"
      >
        加载收藏题目数据中...
      </van-loading>
    </div>
    <div
      v-else-if="filteredList.length === 0"
      class="empty-state"
      style="padding: 50px 16px; text-align: center"
    >
      <van-empty description="暂无收藏的试题记录" />
      <div class="empty-tip">在平时刷题做题或查看解析时，点击“⭐ 收藏”即可汇总至此</div>
      <van-button
        type="primary"
        round
        size="small"
        style="margin-top: 14px; padding: 0 20px"
        @click="$router.push('/chapter')"
      >
        去题库刷题
      </van-button>
    </div>
    <div
      v-else
      class="fav-list"
    >
      <div
        v-for="(item, idx) in filteredList"
        :key="item.id || item.questionId"
        class="fav-card"
      >
        <div class="fc-header">
          <div class="fc-tags">
            <span class="fc-idx">#{{ idx + 1 }}</span>
            <span class="fc-type">{{ item.typeText || '单选题' }}</span>
            <span class="fc-chapter">{{ item.chapterName || item.subjectName || '核心考点' }}</span>
          </div>
          <div class="fc-time">
            {{ formatTime(item.createdAt) }}
          </div>
        </div>

        <!-- 题干富文本渲染（含公式与图片） -->
        <div
          class="fc-content"
          v-html="renderWithFormula(item.content || item.title || '题目内容加载中...')"
        />

        <!-- 选项简览（展开时展示） -->
        <div
          v-if="item.options && item.options.length > 0 && expandedIds.includes(item.questionId || item.id)"
          class="fc-options-box"
        >
          <div
            v-for="opt in item.options"
            :key="opt.key"
            class="fc-opt-row"
            :class="{ 'is-correct': isOptionCorrect(item, opt.key) }"
          >
            <span class="opt-key">{{ opt.key }}.</span>
            <span class="opt-val" v-html="renderWithFormula(opt.value || opt.content || opt.label || '')" />
          </div>
        </div>

        <!-- 正确答案与解析摘要 -->
        <div class="fc-answer-bar">
          <div class="ans-left">
            <span class="ans-badge correct">正确答案：{{ item.correctAnswer || item.answer || 'A' }}</span>
          </div>
          <div
            class="ans-toggle"
            @click="toggleExpand(item.questionId || item.id)"
          >
            {{ expandedIds.includes(item.questionId || item.id) ? '收起选项 ▲' : '查看选项 ▼' }}
          </div>
        </div>

        <!-- 底部操作区 -->
        <div class="fc-footer">
          <div class="fc-actions">
            <div
              class="fca primary"
              @click.stop="goAnalysis(item.questionId || item.id)"
            >
              📖 深度解析
            </div>
            <div
              class="fca"
              @click.stop="redoSingle(item)"
            >
              🎯 单题攻关
            </div>
            <div
              class="fca note-btn"
              @click.stop="openNote(item)"
            >
              📓 笔记
            </div>
          </div>
          <div
            class="fca remove"
            @click.stop="remove(item.questionId || item.id)"
          >
            ✕ 取消收藏
          </div>
        </div>
      </div>
    </div>

    <!-- 题目笔记弹窗 -->
    <NotePopup
      v-model:show="notePopupVisible"
      :question-id="currentNoteQuestion?.questionId || currentNoteQuestion?.id"
      :question-title="currentNoteQuestion?.title || currentNoteQuestion?.content"
    />

    <div style="height: 80px" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { useSubjectStore } from '@/stores/subject'
import { useQuizStore } from '@/stores/quiz'
import { getFavorites, removeFavorite, type FavoriteItem } from '@/api/favorite'
import { renderWithFormula } from '@/utils/katex'
import NotePopup from '@/components/NotePopup.vue'

const router = useRouter()
const subjectStore = useSubjectStore()
const quizStore = useQuizStore()

const editMode = ref(false)
const showAllSubjects = ref(false)
const currentType = ref('all')
const loading = ref(false)
const favList = ref<FavoriteItem[]>([])
const expandedIds = ref<string[]>([])

// 笔记弹窗状态
const notePopupVisible = ref(false)
const currentNoteQuestion = ref<any>(null)

const typeTabs = [
  { label: '全部', value: 'all' },
  { label: '单选题', value: 'single' },
  { label: '多选题', value: 'multiple' },
  { label: '判断题', value: 'judge' },
  { label: '案例分析', value: 'case' },
]

const currentSubjectName = computed(() => {
  if (showAllSubjects.value) return '全部考证科目'
  return subjectStore.currentSubject?.name || '系统集成项目管理工程师'
})

const filteredList = computed(() => {
  let list = favList.value
  if (currentType.value !== 'all') {
    list = list.filter((i) => i.type === currentType.value || i.typeText?.includes(currentType.value))
  }
  return list
})

function getTypeCount(typeKey: string) {
  if (typeKey === 'all') return favList.value.length
  return favList.value.filter((i) => i.type === typeKey || i.typeText?.includes(typeKey)).length
}

function formatTime(t?: string) {
  if (!t) return '近期'
  try {
    const d = new Date(t)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return t
  }
}

function isOptionCorrect(item: any, optKey: string) {
  const ans = String(item.correctAnswer || item.answer || '').toUpperCase()
  return ans.includes(String(optKey).toUpperCase())
}

function toggleExpand(id: string) {
  const sId = String(id)
  if (expandedIds.value.includes(sId)) {
    expandedIds.value = expandedIds.value.filter((i) => i !== sId)
  } else {
    expandedIds.value.push(sId)
  }
}

function toggleEdit() {
  editMode.value = !editMode.value
}

function toggleSubjectFilter() {
  showAllSubjects.value = !showAllSubjects.value
  fetchFavoritesList()
}

function onBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/mine')
  }
}

async function fetchFavoritesList() {
  loading.value = true
  try {
    const subId = showAllSubjects.value ? undefined : (subjectStore.currentSubjectId ? String(subjectStore.currentSubjectId) : undefined)
    const res = await getFavorites({ subjectId: subId, pageSize: 100 })
    if (res?.data?.list) {
      favList.value = res.data.list
    } else {
      favList.value = []
    }
  } catch {
    favList.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => subjectStore.currentSubjectId,
  () => {
    if (!showAllSubjects.value) {
      fetchFavoritesList()
    }
  }
)

onMounted(() => {
  fetchFavoritesList()
})

function goAnalysis(id: string | number) {
  router.push(`/quiz/analysis/${id}`)
}

function redoSingle(item: any) {
  router.push(`/quiz/practice?mode=practice&questionId=${item.questionId || item.id}`)
}

function openNote(item: any) {
  currentNoteQuestion.value = item
  notePopupVisible.value = true
}

function startRedo() {
  if (filteredList.value.length === 0) {
    return showToast('当前暂无收藏题目')
  }
  const subId = subjectStore.currentSubjectId || '1'
  router.push(`/quiz/practice?mode=favorite&subjectId=${subId}`)
}

async function clearAllCurrent() {
  if (filteredList.value.length === 0) return
  showDialog({
    title: '清空确认',
    message: `确定要清空当前的 ${filteredList.value.length} 道题目收藏吗？`,
    showCancelButton: true,
  }).then(async () => {
    const ids = filteredList.value.map((i) => i.questionId || i.id)
    for (const qId of ids) {
      try {
        await removeFavorite(qId)
      } catch {
        // ignore
      }
    }
    favList.value = []
    quizStore.fetchFavorites()
    showToast('已清空题目收藏')
  })
}

async function remove(id: string | number) {
  try {
    await removeFavorite(id)
    favList.value = favList.value.filter((i) => String(i.id) !== String(id) && String(i.questionId) !== String(id))
    quizStore.fetchFavorites()
    showToast('已取消收藏')
  } catch (err: any) {
    showToast(err?.message || '操作失败')
  }
}
</script>

<style scoped lang="scss">
.fav-page {
  min-height: 100vh;
  background: var(--gray-1);
  padding-bottom: calc(var(--tabbar-height) + var(--safe-bottom) + 20px);
}

.nav-bar {
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

  .back {
    font-size: 26px;
    color: var(--gray-7);
    cursor: pointer;
    line-height: 1;
  }

  .title {
    font-size: 16px;
    font-weight: 700;
    color: var(--gray-8);
  }

  .right {
    font-size: 13px;
    color: var(--primary);
    cursor: pointer;
    font-weight: 600;
  }
}

.subject-bar {
  background: #f8fafc;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--gray-2);

  .sub-info {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--gray-8);

    .sub-icon {
      color: #f59e0b;
    }
  }

  .sub-toggle {
    font-size: 12px;
    color: var(--primary);
    cursor: pointer;
    font-weight: 600;
  }
}

.fav-header {
  display: flex;
  gap: 8px;
  padding: 10px 14px;
  overflow-x: auto;
  background: var(--gray-0);
  border-bottom: 1px solid var(--gray-2);

  &::-webkit-scrollbar {
    display: none;
  }

  .filter-chip {
    padding: 5px 12px;
    border-radius: 16px;
    font-size: 12px;
    color: var(--gray-6);
    background: var(--gray-2);
    cursor: pointer;
    white-space: nowrap;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;

    .chip-count {
      font-size: 10px;
      background: rgba(0, 0, 0, 0.08);
      padding: 1px 5px;
      border-radius: 8px;
    }

    &.active {
      background: #fef3c7;
      color: #d97706;
      font-weight: 700;

      .chip-count {
        background: #f59e0b;
        color: #fff;
      }
    }
  }
}

.fav-stats {
  margin: 12px 14px;
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow-sm);

  .fs-info {
    display: flex;
    flex-direction: column;

    .fs-num {
      font-size: 26px;
      font-weight: 800;
      color: #f59e0b;
      line-height: 1.1;
    }

    .fs-label {
      font-size: 12px;
      color: var(--gray-5);
      margin-top: 2px;
    }
  }

  .fs-actions {
    display: flex;
    gap: 8px;
  }

  .fs-btn {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    box-shadow: 0 3px 8px rgba(245, 158, 11, 0.3);
    display: flex;
    align-items: center;

    &.danger {
      background: var(--danger);
      box-shadow: none;
    }
  }
}

.empty-state {
  .empty-tip {
    font-size: 12px;
    color: var(--gray-5);
    margin-top: -6px;
  }
}

.fav-list {
  padding: 0 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fav-card {
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-2);

  .fc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    .fc-tags {
      display: flex;
      gap: 6px;
      align-items: center;

      .fc-idx {
        font-size: 11px;
        font-weight: 800;
        color: var(--gray-4);
      }

      .fc-type {
        font-size: 11px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        background: #fef3c7;
        color: #d97706;
      }

      .fc-chapter {
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 4px;
        background: var(--gray-2);
        color: var(--gray-6);
        max-width: 130px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .fc-time {
      font-size: 11px;
      color: var(--gray-4);
    }
  }

  .fc-content {
    font-size: 14px;
    font-weight: 600;
    color: var(--gray-8);
    line-height: 1.6;
    margin-bottom: 12px;
    word-break: break-word;

    :deep(img) {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      margin: 8px 0;
      display: block;
    }
  }

  .fc-options-box {
    background: #f8fafc;
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .fc-opt-row {
      font-size: 13px;
      color: var(--gray-7);
      line-height: 1.4;
      display: flex;
      gap: 6px;

      .opt-key {
        font-weight: 700;
        color: var(--gray-6);
      }

      &.is-correct {
        color: #15803d;
        font-weight: 600;

        .opt-key {
          color: #15803d;
        }
      }
    }
  }

  .fc-answer-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f1f5f9;
    padding: 6px 10px;
    border-radius: 6px;
    margin-bottom: 12px;

    .ans-badge {
      font-size: 12px;
      font-weight: 700;
      color: #0f766e;
    }

    .ans-toggle {
      font-size: 11px;
      color: var(--primary);
      cursor: pointer;
      font-weight: 600;
    }
  }

  .fc-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--gray-2);
    padding-top: 10px;
    font-size: 12px;

    .fc-actions {
      display: flex;
      gap: 12px;

      .fca {
        cursor: pointer;
        font-weight: 600;
        color: var(--gray-6);

        &.primary {
          color: var(--primary);
        }

        &.note-btn {
          color: #8b5cf6;
        }
      }
    }

    .remove {
      color: var(--gray-4);
      cursor: pointer;

      &:hover {
        color: var(--danger);
      }
    }
  }
}
</style>
