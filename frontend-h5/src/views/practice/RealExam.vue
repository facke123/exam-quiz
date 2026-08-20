<template>
  <div class="real-exam">
    <van-nav-bar title="历年真题" left-arrow @click-left="$router.back()" />

    <div class="filter">
      <van-dropdown-menu>
        <van-dropdown-item v-model="year" :options="yearOptions" />
        <van-dropdown-item v-model="type" :options="typeOptions" />
      </van-dropdown-menu>
    </div>

    <div class="exam-list">
      <div
        v-for="exam in exams"
        :key="exam.id"
        class="exam-card"
        @click="enterExam(exam)"
      >
        <div class="exam-left">
          <div class="exam-year">{{ exam.year }}</div>
          <div class="exam-season">{{ exam.season }}</div>
        </div>
        <div class="exam-info">
          <p class="exam-title">{{ exam.title }}</p>
          <div class="exam-meta">
            <van-tag plain type="primary" size="medium">{{ exam.paperType }}</van-tag>
            <span class="duration">{{ exam.duration }}分钟</span>
            <span class="dot">·</span>
            <span>{{ exam.questionCount }}题</span>
          </div>
          <div v-if="exam.done" class="exam-score">
            <span>上次成绩：{{ exam.score }}分</span>
          </div>
        </div>
        <van-icon name="arrow" class="exam-arrow" />
      </div>
    </div>

    <EmptyState v-if="!exams.length" text="暂无真题" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const year = ref('')
const type = ref('')

const yearOptions = [
  { text: '全部年份', value: '' },
  { text: '2025年', value: '2025' },
  { text: '2024年', value: '2024' },
  { text: '2023年', value: '2023' },
  { text: '2022年', value: '2022' }
]
const typeOptions = [
  { text: '全部题型', value: '' },
  { text: '上午综合', value: 'morning' },
  { text: '下午案例', value: 'afternoon' }
]

const exams = ref([
  { id: '1', year: '2025', season: '上半年', title: '软件设计师 2025年上午综合知识', paperType: '上午综合', duration: 150, questionCount: 75, done: true, score: 68 },
  { id: '2', year: '2025', season: '上半年', title: '软件设计师 2025年下午案例分析', paperType: '下午案例', duration: 150, questionCount: 6, done: false, score: 0 },
  { id: '3', year: '2024', season: '下半年', title: '软件设计师 2024年上午综合知识', paperType: '上午综合', duration: 150, questionCount: 75, done: false, score: 0 },
  { id: '4', year: '2024', season: '下半年', title: '软件设计师 2024年下午案例分析', paperType: '下午案例', duration: 150, questionCount: 6, done: false, score: 0 },
  { id: '5', year: '2024', season: '上半年', title: '软件设计师 2024年上午综合知识', paperType: '上午综合', duration: 150, questionCount: 75, done: false, score: 0 }
])

function enterExam(exam: any) {
  router.push(`/quiz/real?examId=${exam.id}`)
}
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.real-exam {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: var(--space-2xl);
}

.filter {
  background: var(--bg-card);
}

.exam-list {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.exam-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);

  &:active {
    transform: scale(0.99);
  }
}

.exam-left {
  text-align: center;
  padding-right: var(--space-md);
  border-right: 1px solid var(--border-light);
}

.exam-year {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-primary);
}

.exam-season {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.exam-info {
  flex: 1;
}

.exam-title {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  margin-bottom: 6px;
}

.exam-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 11px;
  color: var(--text-secondary);

  .dot {
    color: var(--border-light);
  }
}

.exam-score {
  margin-top: 6px;
  font-size: 11px;
  color: var(--color-success);
}

.exam-arrow {
  color: var(--text-placeholder);
}
</style>
