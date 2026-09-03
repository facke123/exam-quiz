<template>
  <div class="quiz-footer">
    <div class="footer-icons">
      <div
        class="footer-icon"
        :class="{ active: favorited }"
        @click="$emit('toggle-favorite')"
      >
        <span>{{ favorited ? '⭐' : '☆' }}</span>
        <span>{{ favorited ? '已收藏' : '收藏' }}</span>
      </div>
      <div
        class="footer-icon"
        :class="{ active: hasNote }"
        @click="$emit('note')"
      >
        <span>📓</span>
        <span>{{ hasNote ? '有笔记' : '笔记' }}</span>
      </div>
      <div
        class="footer-icon"
        @click="$emit('report')"
      >
        <span>⚠️</span>
        <span>报错</span>
      </div>
    </div>

    <div class="footer-btns">
      <button
        v-if="current > 0"
        class="btn-prev"
        @click="$emit('prev')"
      >
        上一题
      </button>
      <button
        v-if="current < total - 1"
        class="btn-next"
        @click="$emit('next')"
      >
        下一题
      </button>
      <button
        v-else
        class="btn-submit"
        @click="$emit('submit')"
      >
        交卷
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  current: number
  total: number
  favorited?: boolean
  hasNote?: boolean
}>()

defineEmits<{
  'toggle-favorite': []
  note: []
  report: []
  prev: []
  next: []
  submit: []
}>()
</script>

<style scoped lang="scss">
.quiz-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--gray-0);
  border-top: 1px solid var(--gray-2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.04);
}

.footer-icons {
  display: flex;
  gap: 16px;
}

.footer-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: var(--gray-5);
  cursor: pointer;

  span:first-child {
    font-size: 18px;
  }

  &.active {
    color: var(--primary);
  }
}

.footer-btns {
  display: flex;
  gap: 10px;
}

.btn-prev {
  background: var(--gray-2);
  color: var(--gray-7);
  border: none;
  height: 38px;
  padding: 0 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:active {
    background: var(--gray-3);
  }
}

.btn-next,
.btn-submit {
  background: var(--primary);
  color: #fff;
  border: none;
  height: 38px;
  padding: 0 20px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 10px var(--primary-glow);

  &:active {
    background: var(--primary-dark);
  }
}

.btn-submit {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
}
</style>
