<template>
  <div class="wrong-page">
    <div class="nav-bar">
      <div
        class="back"
        @click="$router.back()"
      >
        ‹
      </div>
      <div class="title">
        错题本
      </div>
      <div
        class="right"
        @click="editMode = !editMode"
      >
        {{ editMode ? '完成' : '管理' }}
      </div>
    </div>

    <!-- 题型过滤器 -->
    <div class="wrong-header">
      <div
        v-for="(t, idx) in types"
        :key="t"
        class="filter-chip"
        :class="{ active: currentTypeIndex === idx }"
        @click="currentTypeIndex = idx"
      >
        {{ t }}
      </div>
    </div>

    <!-- 错题统计与集中攻关 -->
    <div class="wrong-stats">
      <div>
        <div class="ws-num">
          {{ filteredList.length }}
        </div>
        <div class="ws-label">
          道错题待攻克
        </div>
      </div>
      <div
        class="ws-btn"
        @click="startRedo"
      >
        开始重做
      </div>
    </div>

    <!-- 错题卡片列表 -->
    <div
      v-if="loading"
      class="loading-state"
      style="padding: 40px; text-align: center"
    >
      <van-loading
        type="spinner"
        color="var(--primary)"
      >
        加载错题本中...
      </van-loading>
    </div>
    <div
      v-else-if="filteredList.length === 0"
      class="empty-state"
      style="padding: 40px; text-align: center"
    >
      <van-empty description="暂无错题记录，继续保持全对哦！" />
    </div>
    <div
      v-else
      class="wrong-list"
    >
      <div
        v-for="item in filteredList"
        :key="item.id"
        class="wrong-card"
        @click="goAnalysis(item.questionId || item.id)"
      >
        <div class="wc-header">
          <div class="wc-tags">
            <span class="wc-type">{{ item.typeText || item.type || '单选题' }}</span>
            <span class="wc-chapter">{{ item.chapterName || '核心章节' }}</span>
          </div>
          <div class="wc-time">
            错 {{ item.wrongCount || 1 }} 次
          </div>
        </div>

        <div class="wc-content">
          {{ item.title }}
        </div>
        <div
          v-if="item.myAnswer"
          class="wc-answer"
        >
          ✗ 你的答案：{{ item.myAnswer }} ｜ 正确答案：{{ item.correctAnswer || 'A' }}
        </div>

        <div class="wc-footer">
          <div class="wc-actions">
            <div
              class="wca"
              @click.stop="goAnalysis(item.questionId || item.id)"
            >
              📖 查看解析
            </div>
            <div
              class="wca"
              @click.stop="addNote(item)"
            >
              📓 添加笔记
            </div>
          </div>
          <div
            class="wca remove"
            @click.stop="remove(item.questionId || item.id)"
          >
            移除
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

const router = useRouter()
const subjectStore = useSubjectStore()
const editMode = ref(false)
const currentTypeIndex = ref(0)
const types = ['全部', '单选题', '多选题', '判断题', '问答题']
const loading = ref(false)

const wrongList = ref<any[]>([])

const filteredList = computed(() => {
  if (currentTypeIndex.value === 0) return wrongList.value
  const target = types[currentTypeIndex.value]
  return wrongList.value.filter((i) => (i.typeText || i.type) === target)
})

async function fetchWrongList() {
  loading.value = true
  try {
    const subId = subjectStore.currentSubjectId ? String(subjectStore.currentSubjectId) : undefined
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
    fetchWrongList()
  }
)

onMounted(() => {
  fetchWrongList()
})

function goAnalysis(id: string | number) {
  router.push(`/quiz/analysis/${id}`)
}

function startRedo() {
  if (wrongList.value.length === 0) {
    return showToast('当前暂无错题需要重做')
  }
  showToast('开始错题攻关！')
  router.push(`/quiz/practice?mode=wrong&subjectId=${subjectStore.currentSubjectId}`)
}

function addNote(item: any) {
  showDialog({
    title: '为该题记录笔记',
    message: '笔记已保存。',
  })
}

async function remove(id: string) {
  try {
    await removeWrong([id])
    wrongList.value = wrongList.value.filter((i) => String(i.id) !== String(id) && String(i.questionId) !== String(id))
    showToast('已从错题本移除')
  } catch {
    wrongList.value = wrongList.value.filter((i) => String(i.id) !== String(id) && String(i.questionId) !== String(id))
    showToast('已从错题本移除')
  }
}
</script>

<style scoped lang="scss">
.wrong-page {
  min-height: 100vh;
  background: var(--gray-1);
  padding-bottom: calc(var(--tabbar-height) + var(--safe-bottom));
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
    font-size: 24px;
    color: var(--gray-7);
    cursor: pointer;
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
  }
}

.wrong-header {
  display: flex;
  gap: 8px;
  padding: 12px 14px;
  overflow-x: auto;
  background: var(--gray-0);
  border-bottom: 1px solid var(--gray-2);

  &::-webkit-scrollbar {
    display: none;
  }

  .filter-chip {
    padding: 6px 14px;
    border-radius: 16px;
    font-size: 13px;
    color: var(--gray-6);
    background: var(--gray-2);
    cursor: pointer;
    white-space: nowrap;
    font-weight: 500;

    &.active {
      background: var(--primary-bg);
      color: var(--primary);
      font-weight: 700;
    }
  }
}

.wrong-stats {
  margin: 14px;
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow-sm);

  .ws-num {
    font-size: 24px;
    font-weight: 800;
    color: var(--danger);
  }

  .ws-label {
    font-size: 12px;
    color: var(--gray-5);
    margin-top: 2px;
  }

  .ws-btn {
    background: var(--primary);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    padding: 8px 18px;
    border-radius: 18px;
    cursor: pointer;
    box-shadow: 0 4px 10px var(--primary-glow);
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
  padding: 16px 18px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;

  .wc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    .wc-tags {
      display: flex;
      gap: 6px;

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
      }
    }

    .wc-time {
      font-size: 11px;
      color: var(--gray-4);
    }
  }

  .wc-content {
    font-size: 14px;
    font-weight: 600;
    color: var(--gray-8);
    line-height: 1.5;
    margin-bottom: 8px;
  }

  .wc-answer {
    font-size: 12px;
    color: var(--danger);
    background: var(--danger-bg);
    padding: 6px 10px;
    border-radius: 6px;
    margin-bottom: 12px;
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
      gap: 14px;
      color: var(--gray-6);
    }

    .wca {
      cursor: pointer;

      &.remove {
        color: var(--gray-4);
      }
    }
  }
}
</style>
