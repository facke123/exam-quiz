<template>
  <div class="real-exam-page">
    <div class="nav-bar">
      <div
        class="back"
        @click="onBack"
      >
        ‹
      </div>
      <div class="title">
        历年真题
      </div>
      <div class="right" />
    </div>

    <!-- 年份与类型筛选 -->
    <div class="filter-header">
      <div
        v-for="y in yearList"
        :key="y"
        class="filter-tab"
        :class="{ active: currentYear === y }"
        @click="currentYear = y"
      >
        {{ y }}
      </div>
    </div>

    <!-- 真题试卷列表 -->
    <div class="exam-list">
      <div
        v-for="exam in filteredExams"
        :key="exam.id"
        class="exam-card"
        @click="enterExam(exam)"
      >
        <div class="ec-left">
          <div class="ec-year">
            {{ exam.year }}
          </div>
          <div class="ec-season">
            {{ exam.season }}
          </div>
        </div>
        <div class="ec-info">
          <div class="ec-title">
            {{ exam.title }}
          </div>
          <div class="ec-meta">
            <span class="ec-tag">{{ exam.paperType }}</span>
            <span>⏱️ {{ exam.duration }}分钟</span>
            <span>{{ exam.questionCount }}题</span>
          </div>
          <div
            v-if="exam.score > 0"
            class="ec-score"
          >
            历史最高分：<strong>{{ exam.score }}分</strong>
          </div>
        </div>
        <div class="ec-btn">
          开始
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSubjectStore } from '@/stores/subject'

const router = useRouter()
const subjectStore = useSubjectStore()

function onBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}
const currentYear = ref('全部')
const yearList = ['全部', '2025年', '2024年', '2023年', '2022年']

const exams = computed(() => {
  const name = subjectStore.currentSubject?.name || '系统集成管理工程师'
  return [
    { id: '1', year: '2025', season: '下半年', title: `${name} 2025下半年综合知识`, paperType: '上午综合', duration: 150, questionCount: 75, score: 0 },
    { id: '2', year: '2025', season: '上半年', title: `${name} 2025上半年综合知识`, paperType: '上午综合', duration: 150, questionCount: 75, score: 0 },
    { id: '3', year: '2024', season: '下半年', title: `${name} 2024下半年综合知识`, paperType: '上午综合', duration: 150, questionCount: 75, score: 0 },
    { id: '4', year: '2024', season: '上半年', title: `${name} 2024上半年综合知识`, paperType: '上午综合', duration: 150, questionCount: 75, score: 0 },
    { id: '5', year: '2023', season: '下半年', title: `${name} 2023下半年综合知识`, paperType: '上午综合', duration: 150, questionCount: 75, score: 0 },
  ]
})

const filteredExams = computed(() => {
  if (currentYear.value === '全部') return exams.value
  const y = currentYear.value.replace('年', '')
  return exams.value.filter((e) => e.year === y)
})

function enterExam(exam: any) {
  router.push(`/quiz/real?examId=${exam.id}&subjectId=${subjectStore.currentSubjectId}`)
}
</script>

<style scoped lang="scss">
.real-exam-page {
  min-height: 100vh;
  background: var(--gray-1);
  padding-bottom: 40px;
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
    width: 24px;
  }
}

.filter-header {
  display: flex;
  gap: 8px;
  padding: 12px 14px;
  background: var(--gray-0);
  border-bottom: 1px solid var(--gray-2);
  overflow-x: auto;

  .filter-tab {
    padding: 6px 14px;
    border-radius: 16px;
    font-size: 13px;
    color: var(--gray-6);
    background: var(--gray-2);
    cursor: pointer;
    white-space: nowrap;

    &.active {
      background: var(--primary-bg);
      color: var(--primary);
      font-weight: 700;
    }
  }
}

.exam-list {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.exam-card {
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.2s;

  &:active {
    box-shadow: var(--shadow-md);
  }

  .ec-left {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    background: var(--primary-bg);
    color: var(--primary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .ec-year {
      font-size: 13px;
      font-weight: 800;
    }

    .ec-season {
      font-size: 10px;
      opacity: 0.85;
    }
  }

  .ec-info {
    flex: 1;
    min-width: 0;

    .ec-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--gray-8);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ec-meta {
      display: flex;
      gap: 8px;
      font-size: 12px;
      color: var(--gray-5);
      margin-top: 4px;

      .ec-tag {
        color: var(--primary);
        font-weight: 600;
      }
    }

    .ec-score {
      font-size: 11px;
      color: var(--success);
      margin-top: 4px;
    }
  }

  .ec-btn {
    background: var(--primary);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    padding: 6px 14px;
    border-radius: 14px;
    flex-shrink: 0;
  }
}
</style>
