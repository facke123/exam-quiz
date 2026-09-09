<template>
  <div
    class="option-item"
    :class="{
      selected: selected && !showResult,
      correct: showResult && correct,
      wrong: showResult && isUserWrong,
      'is-disabled': disabled
    }"
    @click="handleClick"
  >
    <!-- 左侧标记区（正方形图标或字母） -->
    <div class="opt-prefix">
      <!-- 判定正确：绿色方框 + 白色勾号 -->
      <div
        v-if="showResult && correct"
        class="status-box correct"
      >
        <svg
          viewBox="0 0 24 24"
          class="svg-icon"
        >
          <path
            fill="currentColor"
            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
          />
        </svg>
      </div>

      <!-- 判定错误：红色方框 + 白色叉号 -->
      <div
        v-else-if="showResult && isUserWrong"
        class="status-box wrong"
      >
        <svg
          viewBox="0 0 24 24"
          class="svg-icon"
        >
          <path
            fill="currentColor"
            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
          />
        </svg>
      </div>

      <!-- 多选作答中已选（未判分） -->
      <div
        v-else-if="mode === 'multiple' && selected"
        class="status-box multi-selected"
      >
        <svg
          viewBox="0 0 24 24"
          class="svg-icon"
        >
          <path
            fill="currentColor"
            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
          />
        </svg>
      </div>

      <!-- 普通字母显示 -->
      <span
        v-else
        class="opt-letter"
      >{{ option.key }}</span>

      <!-- 字母/图标与内容之间的竖线分隔符 -->
      <span class="opt-divider" />
    </div>

    <!-- 选项文本内容（支持公式渲染） -->
    <div
      class="opt-text"
      v-html="renderedContent"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { QuestionOption } from '@/api/question'
import { renderWithFormula } from '@/utils/katex'

const props = withDefaults(
  defineProps<{
    option: QuestionOption
    mode?: 'single' | 'multiple'
    selected?: boolean
    showResult?: boolean
    correct?: boolean
    isUserWrong?: boolean
    disabled?: boolean
  }>(),
  {
    mode: 'single',
    selected: false,
    showResult: false,
    correct: false,
    isUserWrong: false,
    disabled: false
  }
)

const emit = defineEmits<{ click: [] }>()

const renderedContent = computed(() => renderWithFormula(props.option.content || ''))

function handleClick() {
  if (props.disabled) return
  emit('click')
}
</script>

<style scoped lang="scss">
.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border: 1.5px solid #f0f2f5;
  border-radius: 12px;
  padding: 13px 14px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);

  &:active:not(.is-disabled) {
    transform: scale(0.99);
  }

  &.is-disabled {
    cursor: default;
  }

  /* 未判题时的常规选中样式（统一系统主色 #6366f1） */
  &.selected {
    border-color: #6366f1;
    background: #eef0ff;

    .opt-letter {
      color: #6366f1;
      font-weight: 700;
    }

    .opt-divider {
      background-color: rgba(99, 102, 241, 0.35);
    }

    .opt-text {
      color: #4f46e5;
      font-weight: 600;
    }
  }

  /* 正确选项样式（浅绿背景 + 绿色边框 + 绿色文字） */
  &.correct {
    border-color: #22c55e;
    background: #edfbf3;

    .opt-divider {
      background-color: rgba(34, 197, 94, 0.4);
    }

    .opt-text {
      color: #15803d;
      font-weight: 600;
    }
  }

  /* 错误选项样式（浅粉红背景 + 红色边框 + 红色文字） */
  &.wrong {
    border-color: #fca5a5;
    background: #fef0f0;

    .opt-divider {
      background-color: rgba(239, 68, 68, 0.4);
    }

    .opt-text {
      color: #dc2626;
      font-weight: 600;
    }
  }
}

.opt-prefix {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

/* 状态小方块（绿底勾号 或 红底叉号） */
.status-box {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .svg-icon {
    width: 17px;
    height: 17px;
    fill: #ffffff;
  }

  &.correct {
    background: #22c55e;
  }

  &.wrong {
    background: #ef4444;
  }

  &.multi-selected {
    background: #6366f1;
  }
}

/* 普通大号字母显示 */
.opt-letter {
  width: 26px;
  height: 26px;
  font-size: 17px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 字母/图标右侧竖线 */
.opt-divider {
  width: 1px;
  height: 16px;
  background-color: #e5e7eb;
  flex-shrink: 0;
}

/* 选项内容主体 */
.opt-text {
  flex: 1;
  font-size: 15px;
  line-height: 1.55;
  color: #1f2937;
  word-break: break-word;
}
</style>
