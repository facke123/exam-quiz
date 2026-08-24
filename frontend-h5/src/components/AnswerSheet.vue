<template>
  <van-popup
    v-model:show="visible"
    position="bottom"
    round
    closeable
    close-icon-position="top-left"
    :style="{ maxHeight: '70%' }"
  >
    <div class="answer-sheet">
      <h3 class="sheet-title">
        答题卡
      </h3>
      <div class="sheet-legend">
        <span><i class="dot answered" />已答 {{ answered }}</span>
        <span><i class="dot unanswered" />未答 {{ total - answered }}</span>
        <span v-if="marked"><i class="dot marked" />标记 {{ marked }}</span>
      </div>
      <div class="sheet-grid">
        <div
          v-for="(item, idx) in list"
          :key="idx"
          class="sheet-cell"
          :class="{
            answered: item.answered,
            current: idx === currentIndex,
            marked: item.marked
          }"
          @click="$emit('select', idx)"
        >
          {{ idx + 1 }}
        </div>
      </div>
      <van-button
        v-if="showSubmit"
        type="primary"
        block
        round
        class="sheet-submit"
        @click="$emit('submit')"
      >
        交卷并查看结果
      </van-button>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  list: Array<{ answered: boolean; marked?: boolean }>
  currentIndex: number
  showSubmit?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  select: [idx: number]
  submit: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const total = computed(() => props.list.length)
const answered = computed(() => props.list.filter((i) => i.answered).length)
const marked = computed(() => props.list.filter((i) => i.marked).length)
</script>

<style scoped lang="scss">
.answer-sheet {
  padding: var(--space-xl) var(--space-lg) var(--space-lg);
}

.sheet-title {
  text-align: center;
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-md);
}

.sheet-legend {
  @include flex-center;
  gap: var(--space-lg);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-lg);

  .dot {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: var(--radius-sm);
    margin-right: 4px;
    vertical-align: middle;

    &.answered { background: var(--color-primary); }
    &.unanswered { background: var(--border-light); }
    &.marked { background: var(--color-warning); }
  }
}

.sheet-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--space-sm);
}

.sheet-cell {
  aspect-ratio: 1;
  @include flex-center;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;

  &.answered {
    background: rgba(99, 102, 241, 0.08);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  &.marked {
    border-color: var(--color-warning);
  }

  &.current {
    background: var(--gradient-primary);
    color: #fff;
    border: none;
  }
}

.sheet-submit {
  margin-top: var(--space-xl);
  height: 44px;
}
</style>
