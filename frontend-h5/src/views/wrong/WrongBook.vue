<template>
  <div class="wrong-page">
    <van-nav-bar title="错题本" :border="false" />

    <div class="filter-bar">
      <van-tabs v-model:active="activeTab" shrink color="#6366F1" line-width="24">
        <van-tab title="全部" />
        <van-tab title="单选题" />
        <van-tab title="多选题" />
        <van-tab title="判断题" />
        <van-tab title="案例" />
      </van-tabs>
    </div>

    <div class="wrong-summary">
      <div class="summary-item">
        <p class="sum-num">{{ total }}</p>
        <p class="sum-label">错题总数</p>
      </div>
      <div class="summary-item">
        <p class="sum-num">{{ wrongCount }}</p>
        <p class="sum-label">今日新增</p>
      </div>
      <div class="summary-item">
        <p class="sum-num">{{ masteredCount }}</p>
        <p class="sum-label">已掌握</p>
      </div>
    </div>

    <div class="wrong-list">
      <van-checkbox-group v-model="checkedIds">
        <div
          v-for="item in list"
          :key="item.id"
          class="wrong-card"
          @click="goAnalysis(item.questionId)"
        >
          <van-checkbox
            v-if="editMode"
            :name="item.questionId"
            class="card-check"
            @click.stop
          />
          <div class="card-body">
            <div class="card-head">
              <van-tag plain :type="typeColor(item.type)" size="medium">
                {{ questionTypeText(item.type) }}
              </van-tag>
              <span class="wrong-count">错 {{ item.wrongCount }} 次</span>
            </div>
            <p class="card-title text-ellipsis-2">{{ item.title }}</p>
            <p class="card-chapter">{{ item.chapterName }}</p>
          </div>
          <van-icon name="arrow" class="card-arrow" />
        </div>
      </van-checkbox-group>
    </div>

    <!-- 底部操作栏 -->
    <div v-if="editMode" class="edit-bar">
      <van-checkbox v-model="allChecked" @click="toggleAll">全选</van-checkbox>
      <div class="edit-actions">
        <van-button type="primary" size="small" @click="onRedo">重做</van-button>
        <van-button type="danger" size="small" plain @click="onRemove">移除</van-button>
      </div>
    </div>
    <div v-else class="action-bar">
      <van-button block round @click="editMode = true">管理</van-button>
      <van-button block round type="primary" @click="onRedoAll">错题重做</van-button>
    </div>

    <EmptyState v-if="!list.length" text="暂无错题，继续加油！" icon="checked" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { getWrongList, removeWrong, redoWrong, type WrongItem } from '@/api/wrong'
import { questionTypeText } from '@/utils/format'
import EmptyState from '@/components/EmptyState.vue'

const router = useRouter()
const activeTab = ref(0)
const editMode = ref(false)
const checkedIds = ref<string[]>([])

const list = ref<WrongItem[]>([])
const total = ref(48)
const wrongCount = ref(5)
const masteredCount = ref(12)

const allChecked = computed({
  get: () => checkedIds.value.length === list.value.length && list.value.length > 0,
  set: (v) => {
    checkedIds.value = v ? list.value.map((i) => i.questionId) : []
  }
})

function toggleAll() {
  allChecked.value = !allChecked.value
}

function typeColor(type: string) {
  const map: Record<string, string> = {
    single: 'primary',
    multiple: 'primary',
    judge: 'success',
    case: 'warning',
    subjective: 'danger'
  }
  return (map[type] || 'primary') as any
}

function goAnalysis(id: string) {
  if (editMode.value) return
  router.push(`/quiz/analysis/${id}`)
}

async function onRedo() {
  if (!checkedIds.value.length) return showToast('请选择题目')
  try {
    const res = await redoWrong(checkedIds.value)
    router.push(`/quiz/chapter?recordId=${res.data.recordId}`)
  } catch {
    showToast('操作失败')
  }
}

async function onRedoAll() {
  try {
    const res = await redoWrong(list.value.map((i) => i.questionId))
    router.push(`/quiz/chapter?recordId=${res.data.recordId}`)
  } catch {
    showToast('操作失败')
  }
}

async function onRemove() {
  if (!checkedIds.value.length) return showToast('请选择题目')
  try {
    await showConfirmDialog({ title: '确认', message: '确定移除选中的错题吗？' })
    await removeWrong(checkedIds.value)
    list.value = list.value.filter((i) => !checkedIds.value.includes(i.questionId))
    checkedIds.value = []
    showToast({ type: 'success', message: '已移除' })
  } catch {
    // 取消
  }
}

onMounted(async () => {
  try {
    const res = await getWrongList({})
    list.value = res.data.list
    total.value = res.data.total
  } catch {
    list.value = [
      {
        id: 'w1',
        questionId: 'q1',
        type: 'single',
        title: '瀑布模型的主要优点是什么？',
        chapterName: '第6章 软件工程',
        wrongCount: 3,
        lastWrongAt: '2026-08-19'
      },
      {
        id: 'w2',
        questionId: 'q2',
        type: 'multiple',
        title: '下列哪些属于敏捷开发方法？',
        chapterName: '第6章 软件工程',
        wrongCount: 2,
        lastWrongAt: '2026-08-18'
      }
    ]
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.wrong-page {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: calc(var(--tabbar-height) + var(--safe-bottom) + 70px);
}

.filter-bar {
  background: var(--bg-card);
}

.wrong-summary {
  display: flex;
  padding: var(--space-lg);
  margin: var(--space-lg) var(--space-lg) 0;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.summary-item {
  flex: 1;
  text-align: center;

  .sum-num {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--color-primary);
  }

  .sum-label {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    margin-top: 2px;
  }
}

.wrong-list {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.wrong-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);

  &:active {
    transform: scale(0.99);
  }
}

.card-check {
  flex-shrink: 0;
}

.card-body {
  flex: 1;
}

.card-head {
  @include flex-between;
  margin-bottom: 6px;

  .wrong-count {
    font-size: var(--font-size-xs);
    color: var(--color-danger);
  }
}

.card-title {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  line-height: 1.5;
}

.card-chapter {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.card-arrow {
  color: var(--text-placeholder);
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-card);
  @include safe-bottom(12px);
  @include hairline-top;

  :deep(.van-button) {
    height: 44px;
  }
}

.edit-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  @include flex-between;
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-card);
  @include safe-bottom(12px);
  @include hairline-top;

  .edit-actions {
    display: flex;
    gap: var(--space-sm);
  }
}
</style>
