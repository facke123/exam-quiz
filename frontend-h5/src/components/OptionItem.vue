<template>
  <div
    class="option-item"
    :class="{
      selected,
      correct: showResult && correct,
      wrong: showResult && selected && !correct,
    }"
    @click="$emit('click')"
  >
    <div class="opt-letter">
      <span v-if="showResult && correct">✓</span>
      <span v-else-if="showResult && selected && !correct">✗</span>
      <span v-else>{{ option.key }}</span>
    </div>
    <div class="opt-text" v-html="renderedContent"></div>
    <div v-if="showResult && correct" class="opt-icon correct">✓</div>
    <div v-else-if="showResult && selected && !correct" class="opt-icon wrong">✗</div>
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
.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--gray-0);
  border: 1.5px solid var(--gray-3);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;

  &:active {
    transform: scale(0.99);
  }

  &.selected {
    border-color: var(--primary);
    background: var(--primary-bg);

    .opt-letter {
      background: var(--primary);
      color: #fff;
    }

    .opt-text {
      color: var(--primary-dark);
      font-weight: 600;
    }
  }

  &.correct {
    border-color: var(--success);
    background: var(--success-bg);

    .opt-letter {
      background: var(--success);
      color: #fff;
    }

    .opt-text {
      color: #065f46;
      font-weight: 600;
    }
  }

  &.wrong {
    border-color: var(--danger);
    background: var(--danger-bg);

    .opt-letter {
      background: var(--danger);
      color: #fff;
    }

    .opt-text {
      color: #991b1b;
    }
  }
}

.opt-letter {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--gray-2);
  color: var(--gray-7);
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.opt-text {
  flex: 1;
  font-size: 15px;
  line-height: 1.5;
  color: var(--gray-8);
}

.opt-icon {
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;

  &.correct {
    color: var(--success);
  }

  &.wrong {
    color: var(--danger);
  }
}
</style>
