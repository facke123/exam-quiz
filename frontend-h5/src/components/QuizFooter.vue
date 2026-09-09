<template>
  <div class="quiz-footer">
    <!-- 左侧快捷操作按钮（收藏、答题卡、笔记、解析） -->
    <div class="footer-icons">
      <!-- 1. 收藏 -->
      <div
        class="footer-icon"
        :class="{ active: favorited }"
        @click="$emit('toggle-favorite')"
      >
        <div class="icon-wrap">
          <svg
            viewBox="0 0 24 24"
            class="footer-svg"
          >
            <path
              fill="currentColor"
              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
            />
          </svg>
        </div>
        <span class="icon-label">{{ favorited ? '已收藏' : '收藏' }}</span>
      </div>

      <!-- 2. 答题卡 -->
      <div
        class="footer-icon"
        @click="$emit('sheet')"
      >
        <div class="icon-wrap">
          <svg
            viewBox="0 0 24 24"
            class="footer-svg"
          >
            <path
              fill="currentColor"
              d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"
            />
          </svg>
        </div>
        <span class="icon-label">答题卡</span>
      </div>

      <!-- 3. 笔记 -->
      <div
        class="footer-icon"
        :class="{ active: hasNote }"
        @click="$emit('note')"
      >
        <div class="icon-wrap">
          <svg
            viewBox="0 0 24 24"
            class="footer-svg"
          >
            <path
              fill="currentColor"
              d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
            />
          </svg>
        </div>
        <span class="icon-label">{{ hasNote ? '有笔记' : '笔记' }}</span>
      </div>

      <!-- 4. 解析（支持手动点击切换显示/收起） -->
      <div
        class="footer-icon"
        :class="{ active: isAnalysisActive }"
        @click="$emit('toggle-analysis')"
      >
        <div class="icon-wrap">
          <svg
            viewBox="0 0 24 24"
            class="footer-svg"
          >
            <path
              fill="currentColor"
              d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
            />
          </svg>
        </div>
        <span class="icon-label">解析</span>
      </div>
    </div>

    <!-- 右侧大主操作按钮（下一题 / 交卷） -->
    <div class="footer-action">
      <button
        v-if="current > 0"
        class="btn-prev-outline"
        @click="$emit('prev')"
      >
        上一题
      </button>

      <button
        v-if="current < total - 1"
        class="btn-primary-action"
        @click="$emit('next')"
      >
        下一题
      </button>
      <button
        v-else
        class="btn-primary-action btn-submit"
        @click="$emit('submit')"
      >
        交卷
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    current: number
    total: number
    favorited?: boolean
    hasNote?: boolean
    isAnalysisActive?: boolean
  }>(),
  {
    favorited: false,
    hasNote: false,
    isAnalysisActive: false
  }
)

defineEmits<{
  (e: 'toggle-favorite'): void
  (e: 'sheet'): void
  (e: 'note'): void
  (e: 'toggle-analysis'): void
  (e: 'prev'): void
  (e: 'next'): void
  (e: 'submit'): void
}>()
</script>

<style scoped lang="scss">
.quiz-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #ffffff;
  border-top: 1px solid #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.04);
}

.footer-icons {
  display: flex;
  align-items: center;
  gap: 20px;
}

.footer-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  color: #6b7280;
  user-select: none;
  transition: all 0.2s;

  .icon-wrap {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;

    .footer-svg {
      width: 19px;
      height: 19px;
      fill: currentColor;
    }
  }

  .icon-label {
    font-size: 11px;
    line-height: 1.1;
  }

  &.active {
    color: #f56c6c;

    .icon-label {
      font-weight: 600;
    }
  }

  &:active {
    transform: scale(0.92);
  }
}

.footer-action {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-prev-outline {
  height: 38px;
  padding: 0 12px;
  border-radius: 19px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #4b5563;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:active {
    background: #f3f4f6;
  }
}

.btn-primary-action {
  min-width: 110px;
  height: 38px;
  padding: 0 20px;
  border-radius: 19px;
  border: none;
  background: #f56c6c;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  box-shadow: 0 3px 8px rgba(245, 108, 108, 0.35);
  transition: all 0.2s;

  &:active {
    transform: scale(0.97);
    background: #e05252;
  }

  &.btn-submit {
    background: #e11d48;
  }
}
</style>
