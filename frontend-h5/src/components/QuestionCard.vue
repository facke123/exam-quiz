<template>
  <div class="question-card">
    <div class="q-header">
      <span class="q-type-tag" :class="`tag-${question.type}`">
        {{ typeText }}
      </span>
      <span v-if="question.difficulty" class="q-difficulty">
        {{ difficultyText(question.difficulty) }}
      </span>
      <span v-if="question.score" class="q-score">{{ question.score }}分</span>
    </div>

    <!-- 题干 -->
    <div class="q-title" v-html="renderedTitle"></div>

    <!-- 选项 -->
    <div v-if="question.options?.length" class="q-options">
      <OptionItem
        v-for="opt in question.options"
        :key="opt.key"
        :option="opt"
        :mode="isMultiple ? 'multiple' : 'single'"
        :selected="isSelected(opt.key)"
        :show-result="showResult"
        :correct="isCorrect(opt.key)"
        @click="onSelect(opt.key)"
      />
    </div>

    <!-- 主观题输入区 -->
    <van-field
      v-else-if="question.type === 'subjective'"
      v-model="subjectiveAnswer"
      type="textarea"
      rows="4"
      autosize
      placeholder="请在此作答..."
      class="q-textarea"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Question } from '@/api/question'
import { questionTypeText, difficultyText } from '@/utils/format'
import { renderWithFormula } from '@/utils/katex'
import OptionItem from './OptionItem.vue'

const props = defineProps<{
  question: Question
  modelValue?: string | string[]
  showResult?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
}>()

const subjectiveAnswer = ref<string>('')

const typeText = computed(() => questionTypeText(props.question.type))
const isMultiple = computed(() => props.question.type === 'multiple')
const renderedTitle = computed(() => renderWithFormula(props.question.title))

const selected = computed<string | string[]>(() => props.modelValue || (isMultiple.value ? [] : ''))

watch(
  () => props.modelValue,
  (v) => {
    if (props.question.type === 'subjective' && typeof v === 'string') {
      subjectiveAnswer.value = v
    }
  }
)

watch(subjectiveAnswer, (v) => {
  if (props.question.type === 'subjective') {
    emit('update:modelValue', v)
  }
})

function isSelected(key: string): boolean {
  const sel = selected.value
  if (Array.isArray(sel)) return sel.includes(key)
  return sel === key
}

function isCorrect(key: string): boolean {
  if (!props.showResult) return false
  const ans = props.question.answer
  if (Array.isArray(ans)) return ans.includes(key)
  return ans === key
}

function onSelect(key: string) {
  if (props.showResult) return
  if (isMultiple.value) {
    const arr = Array.isArray(selected.value) ? [...selected.value] : []
    const idx = arr.indexOf(key)
    if (idx > -1) arr.splice(idx, 1)
    else arr.push(key)
    emit('update:modelValue', arr)
  } else {
    emit('update:modelValue', key)
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.question-card {
  padding: var(--space-lg);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.q-header {
  @include flex-between;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.q-type-tag {
  @include tag-primary;
  font-weight: 500;

  &.tag-single { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
  &.tag-multiple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
  &.tag-judge { background: rgba(16, 185, 129, 0.1); color: #10b981; }
  &.tag-case { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
  &.tag-subjective { background: rgba(236, 72, 153, 0.1); color: #ec4899; }
}

.q-difficulty,
.q-score {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.q-title {
  font-size: var(--font-size-md);
  line-height: 1.6;
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
}

.q-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.q-textarea {
  :deep(.van-field__control) {
    border-radius: var(--radius-sm);
    background: var(--bg-page);
    padding: var(--space-md);
  }
}
</style>
