<template>
  <div class="analysis-card">
    <!-- 我的回答 vs 正确答案 -->
    <div class="answer-row">
      <div class="answer-block">
        <span class="label">你的回答</span>
        <span class="value" :class="isCorrect ? 'right' : 'wrong'">
          {{ formatAnswer(myAnswer) || '未作答' }}
        </span>
      </div>
      <van-icon name="arrow" class="arrow" />
      <div class="answer-block">
        <span class="label">正确答案</span>
        <span class="value right">{{ formatAnswer(correctAnswer) }}</span>
      </div>
    </div>

    <!-- 结果 -->
    <div class="result-badge" :class="isCorrect ? 'correct' : 'wrong'">
      <van-icon :name="isCorrect ? 'checked' : 'warning'" />
      {{ isCorrect ? '回答正确' : '回答错误' }}
    </div>

    <!-- 详细解析 -->
    <div class="section">
      <h4 class="section-title"><van-icon name="description" />解析</h4>
      <div class="section-content" v-html="analysisHtml"></div>
    </div>

    <!-- AI 深度分析 -->
    <div class="section ai-section">
      <h4 class="section-title">
        <span class="ai-badge">AI</span>深度分析
      </h4>
      <div class="section-content">{{ aiAnalysis || 'AI 分析生成中...' }}</div>
    </div>

    <!-- 考点标签 -->
    <div v-if="knowledgePoints?.length" class="section">
      <h4 class="section-title"><van-icon name="bookmark-o" />考点</h4>
      <div class="tag-list">
        <van-tag v-for="(p, i) in knowledgePoints" :key="i" plain type="primary" size="medium">
          {{ p }}
        </van-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { renderWithFormula } from '@/utils/katex'

const props = defineProps<{
  myAnswer?: string | string[]
  correctAnswer: string | string[]
  analysis: string
  aiAnalysis?: string
  knowledgePoints?: string[]
}>()

const isCorrect = computed(() => {
  const my = Array.isArray(props.myAnswer) ? props.myAnswer.join(',') : props.myAnswer
  const correct = Array.isArray(props.correctAnswer) ? props.correctAnswer.join(',') : props.correctAnswer
  return my === correct
})

const analysisHtml = computed(() => renderWithFormula(props.analysis))

function formatAnswer(ans: string | string[] | undefined): string {
  if (!ans) return ''
  return Array.isArray(ans) ? ans.join('、') : ans
}
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.analysis-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.answer-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.answer-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .label {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
  }
  .value {
    font-size: var(--font-size-md);
    font-weight: 600;

    &.right { color: var(--color-success); }
    &.wrong { color: var(--color-danger); }
  }
}

.arrow {
  color: var(--text-placeholder);
  font-size: 16px;
}

.result-badge {
  @include flex-center;
  gap: 4px;
  align-self: flex-start;
  padding: 6px 16px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 600;

  &.correct {
    background: rgba(16, 185, 129, 0.1);
    color: var(--color-success);
  }
  &.wrong {
    background: rgba(239, 68, 68, 0.1);
    color: var(--color-danger);
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-base);
  margin-bottom: var(--space-sm);
  color: var(--text-primary);
}

.section-content {
  font-size: var(--font-size-sm);
  line-height: 1.7;
  color: var(--text-regular);
}

.ai-section {
  padding: var(--space-lg);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(139, 92, 246, 0.06));
  border-radius: var(--radius-md);
}

.ai-badge {
  display: inline-block;
  padding: 1px 8px;
  background: var(--gradient-primary);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 700;
  margin-right: 4px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}
</style>
