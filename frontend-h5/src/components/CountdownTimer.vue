<template>
  <div
    class="countdown"
    :class="{ urgent: remaining <= 300 }"
  >
    <van-icon name="clock-o" />
    <span class="time">{{ display }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { formatDuration } from '@/utils/format'

const props = withDefaults(
  defineProps<{
    duration: number // 秒
    autoStart?: boolean
  }>(),
  { autoStart: true }
)

const emit = defineEmits<{ finish: []; tick: [remaining: number] }>()

const remaining = ref<number>(props.duration)
let timer: number | null = null

const display = computed(() => formatDuration(remaining.value))

function start() {
  if (timer) return
  timer = window.setInterval(() => {
    remaining.value--
    emit('tick', remaining.value)
    if (remaining.value <= 0) {
      stop()
      emit('finish')
    }
  }, 1000)
}

function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

watch(
  () => props.duration,
  (v) => {
    remaining.value = v
  }
)

onMounted(() => {
  if (props.autoStart) start()
})

onBeforeUnmount(() => stop())

defineExpose({ start, stop, remaining })
</script>

<style scoped lang="scss">
.countdown {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(99, 102, 241, 0.1);
  color: var(--color-primary);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 600;

  .van-icon {
    font-size: 14px;
  }

  &.urgent {
    background: rgba(239, 68, 68, 0.1);
    color: var(--color-danger);
    animation: pulse 1s ease infinite;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
