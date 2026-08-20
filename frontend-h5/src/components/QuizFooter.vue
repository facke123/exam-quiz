<template>
  <div class="quiz-footer">
    <div class="left-actions">
      <div class="action-btn" :class="{ active: favorited }" @click="$emit('toggle-favorite')">
        <van-icon :name="favorited ? 'star' : 'star-o'" />
        <span>收藏</span>
      </div>
      <div class="action-btn" @click="$emit('note')">
        <van-icon name="edit-line" />
        <span>笔记</span>
      </div>
      <div class="action-btn" @click="$emit('report')">
        <van-icon name="warning-o" />
        <span>报错</span>
      </div>
    </div>

    <div class="nav-actions">
      <van-button
        v-if="current > 0"
        plain
        type="primary"
        size="small"
        class="nav-btn"
        @click="$emit('prev')"
      >
        上一题
      </van-button>
      <van-button
        v-if="current < total - 1"
        type="primary"
        size="small"
        class="nav-btn"
        @click="$emit('next')"
      >
        下一题
      </van-button>
      <van-button
        v-else
        type="danger"
        size="small"
        class="nav-btn submit-btn"
        @click="$emit('submit')"
      >
        交卷
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  current: number
  total: number
  favorited?: boolean
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
@use '@/styles/mixins.scss' as *;

.quiz-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-lg);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: var(--backdrop-blur);
  -webkit-backdrop-filter: var(--backdrop-blur);
  border-top: 1px solid var(--border-light);
  @include safe-bottom(8px);
}

.left-actions {
  display: flex;
  gap: var(--space-lg);
}

.action-btn {
  @include flex-col;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: var(--text-secondary);

  .van-icon {
    font-size: 20px;
  }

  &.active {
    color: var(--color-primary);
    .van-icon {
      color: var(--color-secondary);
    }
  }
}

.nav-actions {
  display: flex;
  gap: var(--space-sm);

  .nav-btn {
    border-radius: var(--radius-full);
    height: 36px;
    padding: 0 18px;
  }

  .submit-btn {
    background: linear-gradient(135deg, #ef4444, #f97316);
    border: none;
  }
}
</style>
