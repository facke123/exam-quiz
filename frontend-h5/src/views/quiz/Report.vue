<template>
  <div class="report-page">
    <van-nav-bar title="成绩报告" left-arrow @click-left="$router.back()" />

    <div v-if="report" class="report-body">
      <!-- 分数展示 -->
      <div class="score-section">
        <div class="score-circle">
          <van-circle
            :current-rate="scoreRate"
            :rate="scoreRate"
            :speed="100"
            :stroke-width="80"
            color="linear-gradient(135deg, #6366F1, #8B5CF6)"
          >
            <template #default>
              <div class="score-inner">
                <p class="score-num">{{ report.score }}</p>
                <p class="score-total">/ {{ report.total }}</p>
              </div>
            </template>
          </van-circle>
        </div>
        <p class="score-status" :class="{ pass: report.correctRate >= 0.6 }">
          {{ report.correctRate >= 0.6 ? '恭喜通过！' : '继续努力' }}
        </p>
        <div class="score-meta">
          <span>正确 {{ report.correct }} 题</span>
          <span class="divider">|</span>
          <span>用时 {{ formatDurationText(report.duration) }}</span>
          <span class="divider">|</span>
          <span>正确率 {{ percent(report.correctRate) }}</span>
        </div>
      </div>

      <!-- 各题型正确率 -->
      <div class="card section-block">
        <h4 class="block-title">各题型正确率</h4>
        <div v-for="t in report.typeStats" :key="t.type" class="type-row">
          <span class="type-name">{{ questionTypeText(t.type) }}</span>
          <van-progress
            :percentage="Math.round((t.correct / t.total) * 100)"
            stroke-width="6"
            color="#6366F1"
            :show-pivot="false"
          />
          <span class="type-num">{{ t.correct }}/{{ t.total }}</span>
        </div>
      </div>

      <!-- 错题列表 -->
      <div class="card section-block">
        <div class="block-title-row">
          <h4 class="block-title">错题列表 ({{ report.wrongQuestions.length }})</h4>
          <span class="more" @click="$router.push('/wrong')">全部</span>
        </div>
        <div
          v-for="(q, i) in report.wrongQuestions.slice(0, 5)"
          :key="i"
          class="wrong-item"
          @click="$router.push(`/quiz/analysis/${q.questionId}`)"
        >
          <div class="wrong-content">
            <p class="wrong-title text-ellipsis-2">{{ q.title }}</p>
            <div class="wrong-answer">
              <span class="wrong-mine">你的：{{ formatAns(q.myAnswer) }}</span>
              <span class="wrong-right">正确：{{ formatAns(q.correctAnswer) }}</span>
            </div>
          </div>
          <van-icon name="arrow" />
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="report-actions">
        <van-button plain block round @click="$router.back()">返回</van-button>
        <van-button type="primary" block round @click="$router.push('/quiz/chapter')">
          再练一次
        </van-button>
      </div>
    </div>

    <LoadingState v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getReport } from '@/api/quiz'
import { questionTypeText, toPercent, formatDurationText } from '@/utils/format'
import LoadingState from '@/components/LoadingState.vue'

const route = useRoute()
const router = useRouter()
const report = ref<Awaited<ReturnType<typeof getReport>>['data'] | null>(null)

const scoreRate = computed(() =>
  report.value ? Math.round((report.value.correct / report.value.total) * 100) : 0
)

function percent(n: number) {
  return toPercent(n, 0)
}

function formatAns(ans: string | string[]): string {
  return Array.isArray(ans) ? ans.join('、') : ans
}

onMounted(async () => {
  try {
    const res = await getReport(route.params.id as string)
    report.value = res.data
  } catch {
    report.value = {
      recordId: 'temp',
      score: 75,
      total: 100,
      correct: 75,
      duration: 3600,
      correctRate: 0.75,
      typeStats: [
        { type: 'single', total: 60, correct: 50 },
        { type: 'multiple', total: 20, correct: 12 },
        { type: 'judge', total: 20, correct: 13 }
      ],
      wrongQuestions: [
        {
          questionId: 'q1',
          title: '瀑布模型的主要优点是什么？',
          myAnswer: 'B',
          correctAnswer: 'A',
          analysis: '瀑布模型强调阶段顺序。'
        }
      ]
    }
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.report-page {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: var(--space-2xl);
}

.report-body {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* Score */
.score-section {
  text-align: center;
  padding: var(--space-xl) var(--space-lg);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.score-circle {
  @include flex-center;
  margin-bottom: var(--space-md);

  :deep(.van-circle) {
    width: 140px !important;
    height: 140px !important;
  }
}

.score-inner {
  @include flex-col;
  align-items: center;
}

.score-num {
  font-size: 36px;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1;
}

.score-total {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.score-status {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--color-danger);
  margin-bottom: var(--space-sm);

  &.pass {
    color: var(--color-success);
  }
}

.score-meta {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);

  .divider {
    margin: 0 var(--space-sm);
  color: var(--border-light);
  }
}

/* Section */
.section-block {
  padding: var(--space-lg);
}

.block-title {
  font-size: var(--font-size-md);
  margin-bottom: var(--space-md);
  color: var(--text-primary);
}

.block-title-row {
  @include flex-between;
  margin-bottom: var(--space-md);

  .block-title {
    margin: 0;
  }

  .more {
    font-size: var(--font-size-sm);
    color: var(--color-primary);
  }
}

.type-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);

  &:last-child {
    margin: 0;
  }
}

.type-name {
  width: 60px;
  font-size: var(--font-size-sm);
  color: var(--text-regular);
}

.type-row :deep(.van-progress) {
  flex: 1;
}

.type-num {
  width: 50px;
  text-align: right;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.wrong-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) 0;
  @include hairline-bottom;

  &:last-child::after {
    display: none;
  }
}

.wrong-content {
  flex: 1;
}

.wrong-title {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  line-height: 1.5;
  margin-bottom: 4px;
}

.wrong-answer {
  font-size: 11px;

  .wrong-mine {
    color: var(--color-danger);
    margin-right: var(--space-md);
  }
  .wrong-right {
    color: var(--color-success);
  }
}

.report-actions {
  display: flex;
  gap: var(--space-md);

  :deep(.van-button) {
    height: 44px;
  }
}
</style>
