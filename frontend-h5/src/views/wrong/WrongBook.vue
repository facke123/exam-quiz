<template>
  <div class="wrong-page">
    <div class="nav-bar">
      <div
        class="back"
        @click="onBack"
      >
        ‹
      </div>
      <div class="title">
        错题本攻关
      </div>
      <div
        class="right"
        @click="toggleEdit"
      >
        {{ editMode ? '完成' : '批量管理' }}
      </div>
    </div>

    <!-- 科目与错题总览 -->
    <div class="subject-bar">
      <div class="sub-info">
        <span class="sub-icon">📚</span>
        <span class="sub-name">{{ currentSubjectName }}</span>
      </div>
      <div class="sub-toggle" @click="toggleSubjectFilter">
        {{ showAllSubjects ? '查看当前科目' : '查看全科错题' }} ⇋
      </div>
    </div>

    <!-- 题型过滤器 -->
    <div class="wrong-header">
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

    <!-- 错题统计与集中攻关 -->
    <div class="wrong-stats">
      <div class="ws-info">
        <div class="ws-num">
          {{ filteredList.length }}
        </div>
        <div class="ws-label">
          道待攻克错题
        </div>
      </div>
      <div class="ws-actions">
        <div
          v-if="editMode && filteredList.length > 0"
          class="ws-btn danger"
          @click="clearAllCurrent"
        >
          一键清空
        </div>
        <div
          class="ws-btn"
          @click="startRedo"
        >
          🚀 开始错题重练
        </div>
      </div>
    </div>

    <!-- 错题卡片列表 -->
    <div
      v-if="loading"
      class="loading-state"
      style="padding: 50px 16px; text-align: center"
    >
      <van-loading
        type="spinner"
        color="var(--primary)"
      >
        加载错题数据中...
      </van-loading>
    </div>
    <div
      v-else-if="filteredList.length === 0"
      class="empty-state"
      style="padding: 50px 16px; text-align: center"
    >
      <van-empty description="暂无待攻克的错题记录，太棒了！" />
      <div class="empty-tip">在平时刷题做错时，系统将自动汇总至错题本中</div>
      <van-button
        type="primary"
        round
        size="small"
        style="margin-top: 14px; padding: 0 20px"
        @click="$router.push('/quiz/practice')"
      >
        去刷题巩固
      </van-button>
    </div>
    <div
      v-else
      class="wrong-list"
    >
      <div
        v-for="(item, idx) in filteredList"
        :key="item.id || item.questionId"
        class="wrong-card"
      >
        <div class="wc-header">
          <div class="wc-tags">
            <span class="wc-idx">#{{ idx + 1 }}</span>
            <span class="wc-type">{{ item.typeText || '单选题' }}</span>
            <span class="wc-chapter">{{ item.chapterName || item.subjectName || '核心考点' }}</span>
          </div>
          <div class="wc-time">
            已错 <strong class="danger-text">{{ item.wrongCount || 1 }}</strong> 次
          </div>
        </div>

        <!-- 题干富文本渲染（含公式与图片） -->
        <div
          class="wc-content"
          v-html="renderWithFormula(item.content || item.title || '题目内容加载中...')"
        />

        <!-- 选项简览（展开时展示） -->
        <div
          v-if="item.options && item.options.length > 0 && expandedIds.includes(item.questionId || item.id)"
          class="wc-options-box"
        >
          <div
            v-for="opt in item.options"
            :key="opt.key"
            class="wc-opt-row"
            :class="{ 'is-correct': isOptionCorrect(item, opt.key) }"
          >
            <span class="opt-key">{{ opt.key }}.</span>
            <span class="opt-val" v-html="renderWithFormula(opt.value || opt.content || opt.label || '')" />
          </div>
        </div>

        <!-- 正确答案与解析摘要 -->
        <div class="wc-answer-bar">
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
        <div class="wc-footer">
          <div class="wc-actions">
            <div
              class="wca primary"
              @click.stop="goAnalysis(item.questionId || item.id)"
            >
              📖 深度解析
            </div>
            <div
              class="wca"
              @click.stop="redoSingle(item)"
            >
              🎯 单题攻关
            </div>
          </div>
          <div
            class="wca remove"
            @click.stop="remove(item.questionId || item.id)"
          >
            ✕ 移出错题本
          </div>
        </div>
      </div>
    </div>

    <div style="height: 80px" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { useSubjectStore } from '@/stores/subject'
import { getWrongList, removeWrong } from '@/api/wrong'
import { renderWithFormula } from '@/utils/katex'

const router = useRouter()
const subjectStore = useSubjectStore()
const editMode = ref(false)
const showAllSubjects = ref(false)
const currentType = ref('all')
const loading = ref(false)
const wrongList = ref<any[]>([])
const expandedIds = ref<string[]>([])

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
  let list = wrongList.value
  if (currentType.value !== 'all') {
    list = list.filter((i) => (i.type === currentType.value || i.typeText?.includes(currentType.value)))
  }
  return list
})

function getTypeCount(typeKey: string) {
  if (typeKey === 'all') return wrongList.value.length
  return wrongList.value.filter((i) => i.type === typeKey || i.typeText?.includes(typeKey)).length
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
  fetchWrongList()
}

function onBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}

async function fetchWrongList() {
  loading.value = true
  try {
    const subId = showAllSubjects.value ? undefined : (subjectStore.currentSubjectId ? String(subjectStore.currentSubjectId) : undefined)
    const res = await getWrongList({ subjectId: subId })
    if (res?.data?.list) {
      wrongList.value = res.data.list
    } else {
      wrongList.value = []
    }
  } catch {
    wrongList.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => subjectStore.currentSubjectId,
  () => {
    if (!showAllSubjects.value) {
      fetchWrongList()
    }
  }
)

onMounted(() => {
  fetchWrongList()
})

function goAnalysis(id: string | number) {
  router.push(`/quiz/analysis/${id}`)
}

function redoSingle(item: any) {
  router.push(`/quiz/practice?mode=practice&questionId=${item.questionId || item.id}`)
}

function startRedo() {
  if (filteredList.value.length === 0) {
    return showToast('当前暂无错题需要重做')
  }
  const subId = subjectStore.currentSubjectId || '4'
  router.push(`/quiz/practice?mode=wrong&subjectId=${subId}`)
}

async function clearAllCurrent() {
  if (filteredList.value.length === 0) return
  showDialog({
    title: '清空确认',
    message: `确定要清空当前的 ${filteredList.value.length} 道错题记录吗？`,
    showCancelButton: true,
  }).then(async () => {
    const ids = filteredList.value.map((i) => i.questionId || i.id)
    try {
      await removeWrong(ids)
    } catch {
      // ignore
    }
    wrongList.value = []
    showToast('已清空错题本')
  })
}

async function remove(id: string) {
  try {
    await removeWrong([id])
  } catch {
    // ignore
  }
  wrongList.value = wrongList.value.filter((i) => String(i.id) !== String(id) && String(i.questionId) !== String(id))
  showToast('已移出错题本')
}
</script>

<style scoped lang="scss">
.wrong-page {
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
  }

  .sub-toggle {
    font-size: 12px;
    color: var(--primary);
    cursor: pointer;
    font-weight: 600;
  }
}

.wrong-header {
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
      background: var(--primary-bg);
      color: var(--primary);
      font-weight: 700;

      .chip-count {
        background: var(--primary);
        color: #fff;
      }
    }
  }
}

.wrong-stats {
  margin: 12px 14px;
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow-sm);

  .ws-info {
    display: flex;
    flex-direction: column;

    .ws-num {
      font-size: 26px;
      font-weight: 800;
      color: var(--danger);
      line-height: 1.1;
    }

    .ws-label {
      font-size: 12px;
      color: var(--gray-5);
      margin-top: 2px;
    }
  }

  .ws-actions {
    display: flex;
    gap: 8px;
  }

  .ws-btn {
    background: var(--primary);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    box-shadow: 0 3px 8px var(--primary-glow);
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

.wrong-list {
  padding: 0 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wrong-card {
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-2);

  .wc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    .wc-tags {
      display: flex;
      gap: 6px;
      align-items: center;

      .wc-idx {
        font-size: 11px;
        font-weight: 800;
        color: var(--gray-4);
      }

      .wc-type {
        font-size: 11px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        background: var(--primary-bg);
        color: var(--primary);
      }

      .wc-chapter {
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

    .wc-time {
      font-size: 11px;
      color: var(--gray-5);

      .danger-text {
        color: var(--danger);
      }
    }
  }

  .wc-content {
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

  .wc-options-box {
    background: #f8fafc;
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .wc-opt-row {
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

  .wc-answer-bar {
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

  .wc-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--gray-2);
    padding-top: 10px;
    font-size: 12px;

    .wc-actions {
      display: flex;
      gap: 12px;

      .wca {
        cursor: pointer;
        font-weight: 600;
        color: var(--gray-6);

        &.primary {
          color: var(--primary);
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
