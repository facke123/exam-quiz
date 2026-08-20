<template>
  <div class="chapter-list">
    <van-nav-bar title="章节练习" left-arrow @click-left="$router.back()" />

    <div class="progress-card">
      <div class="progress-info">
        <p class="info-label">整体进度</p>
        <p class="info-num">{{ answeredCount }}/{{ totalQuestions }}</p>
      </div>
      <van-progress
        :percentage="overallProgress"
        stroke-width="8"
        color="linear-gradient(90deg, #6366F1, #8B5CF6)"
        track-color="#EEF2FF"
      />
    </div>

    <div class="chapter-list-inner">
      <div
        v-for="ch in chapters"
        :key="ch.id"
        class="chapter-card"
        @click="enterChapter(ch)"
      >
        <div class="ch-left">
          <p class="ch-name">{{ ch.name }}</p>
          <div class="ch-meta">
            <span>{{ ch.questionCount }} 题</span>
            <span class="dot">·</span>
            <span :class="{ ok: ch.correctRate >= 0.6 }">正确率 {{ percent(ch.correctRate) }}</span>
          </div>
        </div>
        <div class="ch-right">
          <van-circle
            :current-rate="ch.progress"
            :rate="ch.progress"
            :speed="100"
            :text="ch.progress + '%'"
            :stroke-width="60"
            color="#6366F1"
          />
          <van-icon name="arrow" class="ch-arrow" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSubjectStore } from '@/stores/subject'
import { getChapterList, type Chapter } from '@/api/question'
import { toPercent } from '@/utils/format'

const router = useRouter()
const subjectStore = useSubjectStore()

const chapters = ref<Chapter[]>([])

const totalQuestions = computed(() => chapters.value.reduce((s, c) => s + c.questionCount, 0))
const answeredCount = computed(() =>
  chapters.value.reduce((s, c) => s + Math.round((c.progress / 100) * c.questionCount), 0)
)
const overallProgress = computed(() =>
  totalQuestions.value ? Math.round((answeredCount.value / totalQuestions.value) * 100) : 0
)

function percent(n: number) {
  return toPercent(n, 0)
}

function enterChapter(ch: Chapter) {
  router.push(`/quiz/chapter?chapterId=${ch.id}`)
}

onMounted(async () => {
  try {
    const res = await getChapterList(subjectStore.currentSubjectId)
    chapters.value = res.data
  } catch {
    chapters.value = [
      { id: '1', name: '第1章 计算机系统基础', questionCount: 120, correctRate: 0.8, progress: 100 },
      { id: '2', name: '第2章 数据结构与算法', questionCount: 150, correctRate: 0.65, progress: 60 },
      { id: '3', name: '第3章 操作系统', questionCount: 100, correctRate: 0.5, progress: 40 },
      { id: '4', name: '第4章 数据库系统', questionCount: 130, correctRate: 0.7, progress: 30 },
      { id: '5', name: '第5章 计算机网络', questionCount: 110, correctRate: 0.45, progress: 10 },
      { id: '6', name: '第6章 软件工程', questionCount: 140, correctRate: 0.55, progress: 0 }
    ]
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.chapter-list {
  padding-bottom: calc(var(--tabbar-height) + var(--safe-bottom));
  min-height: 100vh;
  background: var(--bg-page);
}

.progress-card {
  margin: var(--space-lg);
  padding: var(--space-lg);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.progress-info {
  @include flex-between;
  margin-bottom: var(--space-md);
}

.info-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.info-num {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-primary);
}

.chapter-list-inner {
  padding: 0 var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.chapter-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);

  &:active {
    transform: scale(0.99);
  }
}

.ch-name {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--text-primary);
}

.ch-meta {
  margin-top: 6px;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);

  .dot {
    margin: 0 6px;
  }

  .ok {
    color: var(--color-success);
  }
}

.ch-right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.ch-arrow {
  color: var(--text-placeholder);
  font-size: 16px;
}
</style>
