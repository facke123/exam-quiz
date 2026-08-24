<template>
  <div class="chapter-page">
    <div class="nav-bar">
      <div class="back" @click="onBack">‹</div>
      <div class="title">章节练习</div>
      <div class="right" @click="showFilter = true">筛选</div>
    </div>

    <!-- 整体进度卡片 -->
    <div class="chapter-progress">
      <div class="cp-title">整体进度</div>
      <div class="cp-num">{{ answeredCount }}<span> / {{ totalQuestions }} 题</span></div>
      <div class="progress-bar">
        <div class="fill" :style="{ width: overallProgress + '%' }"></div>
      </div>
    </div>

    <!-- 章节列表 -->
    <div v-if="loading" class="loading-box" style="padding: 40px; text-align: center;">
      <van-loading type="spinner" color="var(--primary)">加载章节数据中...</van-loading>
    </div>
    <div v-else-if="chapters.length === 0" class="empty-box" style="padding: 40px; text-align: center;">
      <van-empty description="当前科目暂无章节数据" />
    </div>
    <div v-else class="chapter-list">
      <div
        v-for="(ch, idx) in chapters"
        :key="ch.id"
        class="chapter-item"
        @click="enterChapter(ch)"
      >
        <div class="ch-num">{{ idx + 1 }}</div>
        <div class="ch-info">
          <div class="ch-name">{{ ch.name }}</div>
          <div class="ch-meta">
            <span>{{ ch.questionCount || 0 }}题</span>
            <span v-if="(ch.progress || 0) > 0">已做{{ Math.round(((ch.progress || 0) / 100) * (ch.questionCount || 0)) }}题</span>
            <span v-else>未开始</span>
            <span v-if="(ch.progress || 0) > 0" class="rate">正确率{{ percent(ch.correctRate || 0) }}</span>
          </div>
        </div>
        <div class="ch-arrow">›</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSubjectStore } from '@/stores/subject'
import { getChapterList, type Chapter } from '@/api/question'
import { toPercent } from '@/utils/format'

const router = useRouter()
const subjectStore = useSubjectStore()
const loading = ref(false)

function onBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}

const showFilter = ref(false)
const chapters = ref<Chapter[]>([])

const totalQuestions = computed(() => chapters.value.reduce((s, c) => s + (c.questionCount || 0), 0))
const answeredCount = computed(() =>
  chapters.value.reduce((s, c) => s + Math.round(((c.progress || 0) / 100) * (c.questionCount || 0)), 0)
)
const overallProgress = computed(() =>
  totalQuestions.value ? Math.min(100, Math.round((answeredCount.value / totalQuestions.value) * 100)) : 0
)

function percent(n: number) {
  return toPercent(n, 0)
}

function enterChapter(ch: Chapter) {
  router.push(`/quiz/chapter?chapterId=${ch.id}`)
}

async function loadChapters() {
  loading.value = true
  try {
    const subId = subjectStore.currentSubjectId ? String(subjectStore.currentSubjectId) : '1'
    const res = await getChapterList(subId)
    if (res?.data && Array.isArray(res.data)) {
      chapters.value = res.data
    } else {
      chapters.value = []
    }
  } catch {
    chapters.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => subjectStore.currentSubjectId,
  () => {
    loadChapters()
  }
)

onMounted(async () => {
  if (subjectStore.subjectList.length === 0) {
    await subjectStore.fetchSubjects()
  }
  await loadChapters()
})
</script>

<style scoped lang="scss">
.chapter-page {
  min-height: 100vh;
  background: var(--gray-1);
  padding-bottom: calc(var(--tabbar-height) + var(--safe-bottom) + 20px);
}

/* 顶部导航条 */
.nav-bar {
  height: 48px;
  background: var(--gray-0);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid var(--gray-2);

  .back {
    font-size: 24px;
    color: var(--gray-7);
    cursor: pointer;
    width: 32px;
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
    width: 32px;
    text-align: right;
  }
}

/* 进度卡片 */
.chapter-progress {
  margin: 14px;
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 16px 18px;
  box-shadow: var(--shadow-sm);

  .cp-title {
    font-size: 13px;
    color: var(--gray-5);
  }

  .cp-num {
    font-size: 24px;
    font-weight: 800;
    color: var(--gray-9);
    margin: 4px 0 10px;

    span {
      font-size: 14px;
      font-weight: 500;
      color: var(--gray-5);
    }
  }

  .progress-bar {
    height: 8px;
    background: var(--gray-2);
    border-radius: 4px;
    overflow: hidden;

    .fill {
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      border-radius: 4px;
      transition: width 0.3s;
    }
  }
}

/* 章节列表 */
.chapter-list {
  padding: 0 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chapter-item {
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.2s;

  &:active {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .ch-num {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    background: var(--primary-bg);
    color: var(--primary);
    font-size: 15px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ch-info {
    flex: 1;
    min-width: 0;

    .ch-name {
      font-size: 15px;
      font-weight: 700;
      color: var(--gray-8);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ch-meta {
      display: flex;
      gap: 8px;
      font-size: 12px;
      color: var(--gray-5);
      margin-top: 4px;

      .rate {
        color: var(--success);
        font-weight: 600;
      }
    }
  }

  .ch-arrow {
    font-size: 20px;
    color: var(--gray-4);
  }
}
</style>
