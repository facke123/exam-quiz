<template>
  <div
    class="loading-state"
    :class="{ fullscreen }"
  >
    <van-loading
      type="spinner"
      color="#6366F1"
      :size="size"
      vertical
    >
      {{ text }}
    </van-loading>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    text?: string
    size?: string
    fullscreen?: boolean
  }>(),
  {
    text: '加载中...',
    size: '32px',
    fullscreen: false
  }
)
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.loading-state {
  @include flex-center;
  padding: var(--space-2xl) 0;
}

.loading-state.fullscreen {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: var(--backdrop-blur);
}
</style>
