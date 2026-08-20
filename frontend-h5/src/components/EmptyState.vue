<template>
  <div class="empty-state">
    <div class="empty-icon">
      <van-icon :name="icon" />
    </div>
    <p class="empty-text">{{ text }}</p>
    <van-button v-if="actionText" type="primary" size="small" round @click="$emit('action')">
      {{ actionText }}
    </van-button>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    icon?: string
    text?: string
    actionText?: string
  }>(),
  {
    icon: 'search',
    text: '暂无数据',
    actionText: ''
  }
)

defineEmits<{ action: [] }>()
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.empty-state {
  @include flex-col;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-2xl) 0;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  background: var(--gradient-primary-soft);
  @include flex-center;

  .van-icon {
    font-size: 36px;
    color: var(--color-primary-light);
  }
}

.empty-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}
</style>
