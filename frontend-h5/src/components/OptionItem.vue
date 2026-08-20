<template>
  <div
    class="option-item"
    :class="{ selected, correct: showResult && correct, wrong: showResult && selected && !correct }"
    @click="$emit('click')"
  >
    <div class="opt-mark">
      <van-icon v-if="showResult && correct" name="success" />
      <van-icon v-else-if="showResult && selected && !correct" name="cross" />
      <span v-else>{{ option.key }}</span>
    </div>
    <div class="opt-content" v-html="renderedContent"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { QuestionOption } from '@/api/question'
import { renderWithFormula } from '@/utils/katex'

const props = defineProps<{
  option: QuestionOption
  mode: 'single' | 'multiple'
  selected: boolean
  showResult?: boolean
  correct?: boolean
}>()

defineEmits<{ click: [] }>()

const renderedContent = computed(() => renderWithFormula(props.option.content))
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.option-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
  background: var(--bg-card);

  &:active {
    transform: scale(0.99);
  }

  &.selected {
    border-color: var(--color-primary);
    background: rgba(99, 102, 241, 0.06);
  }

  &.correct {
    border-color: var(--color-success);
    background: rgba(16, 185, 129, 0.06);
  .opt-mark {
      background: var(--color-success);
      color: #fff;
    }
  }

  &.wrong {
    border-color: var(--color-danger);
    background: rgba(239, 68, 68, 0.06);
    .opt-mark {
      background: var(--color-danger);
      color: #fff;
    }
  }
}

.opt-mark {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--bg-page);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 600;
  @include flex-center;

  .option-item.selected & {
    background: var(--gradient-primary);
    color: #fff;
  }
}

.opt-content {
  flex: 1;
  font-size: var(--font-size-base);
  line-height: 1.6;
  color: var(--text-primary);
  padding-top: 4px;
}
</style>
