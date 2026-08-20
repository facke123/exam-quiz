<template>
  <van-popup
    v-model:show="visible"
    position="bottom"
    round
    closeable
    close-icon-position="top-left"
    :style="{ maxHeight: '75%' }"
  >
    <div class="subject-picker">
      <h3 class="picker-title">选择科目</h3>
      <div class="picker-list">
        <div
          v-for="item in subjects"
          :key="item.id"
          class="subject-item"
          :class="{ active: item.id === currentId }"
          @click="onSelect(item.id)"
        >
          <span class="sub-icon">{{ item.icon }}</span>
          <div class="sub-info">
            <p class="sub-name">{{ item.name }}</p>
            <p class="sub-meta">{{ item.level }} · {{ item.category }}</p>
          </div>
          <van-icon v-if="item.id === currentId" name="success" class="check-icon" />
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSubjectStore } from '@/stores/subject'

const props = defineProps<{ modelValue: boolean; currentId?: string }>()
const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  select: [id: string]
}>()

const subjectStore = useSubjectStore()
const subjects = computed(() => subjectStore.subjectList)
const currentId = computed(() => props.currentId || subjectStore.currentSubjectId)

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

function onSelect(id: string) {
  emit('select', id)
  visible.value = false
}
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.subject-picker {
  padding: var(--space-xl) var(--space-lg) var(--space-lg);
}

.picker-title {
  text-align: center;
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-lg);
}

.picker-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  max-height: 60vh;
  overflow-y: auto;
}

.subject-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);

  &.active {
    border-color: var(--color-primary);
    background: rgba(99, 102, 241, 0.06);
  .check-icon {
      color: var(--color-primary);
    }
  }
}

.sub-icon {
  font-size: 24px;
}

.sub-info {
  flex: 1;
}

.sub-name {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--text-primary);
}

.sub-meta {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: 2px;
}

.check-icon {
  font-size: 20px;
  color: var(--text-placeholder);
}
</style>
