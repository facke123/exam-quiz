<template>
  <div class="question-card">
    <div class="q-header">
      <span
        class="question-type-tag"
        :class="`tag-${question.type}`"
      >
        {{ typeText }}
      </span>
      <span
        v-if="question.score"
        class="q-score"
      >{{ question.score }}分</span>
      <span
        v-if="question.difficulty"
        class="q-difficulty"
      >
        难度: {{ difficultyText(question.difficulty) }}
      </span>
    </div>

    <!-- 题干 -->
    <div
      class="question-content"
      v-html="renderedTitle"
    />

    <!-- 选项列表 -->
    <div
      v-if="question.options?.length"
      class="options-list"
    >
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

    <!-- 主观题/案例题输入 -->
    <div
      v-else-if="question.type === 'subjective' || question.type === 'case'"
      class="subjective-wrap"
    >
      <textarea
        v-model="subjectiveAnswer"
        class="subjective-input"
        placeholder="请输入你的作答内容..."
        rows="5"
      />
      <div class="subjective-hint">
        {{ subjectiveAnswer.length }} / 1000字
      </div>
    </div>
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
    if ((props.question.type === 'subjective' || props.question.type === 'case') && typeof v === 'string') {
      subjectiveAnswer.value = v
    }
  },
  { immediate: true }
)

watch(subjectiveAnswer, (v) => {
  if (props.question.type === 'subjective' || props.question.type === 'case') {
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
    if (idx >= 0) arr.splice(idx, 1)
    else arr.push(key)
    arr.sort()
    emit('update:modelValue', arr)
  } else {
    emit('update:modelValue', key)
  }
}
</script>

<style scoped lang="scss">
.question-card {
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 18px;
  box-shadow: var(--shadow-sm);
}

.q-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.question-type-tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 8px;
  background: var(--primary-bg);
  color: var(--primary);

  &.tag-multiple {
    background: var(--purple-bg);
    color: var(--purple);
  }

  &.tag-judge {
    background: var(--cyan-bg);
    color: var(--cyan);
  }

  &.tag-subjective {
    background: var(--pink-bg);
    color: var(--pink);
  }
}

.q-score,
.q-difficulty {
  font-size: 12px;
  color: var(--gray-5);
}

.question-content {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.6;
  color: var(--gray-9);
  margin-bottom: 18px;
  word-break: break-word;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.subjective-wrap {
  margin-top: 10px;
}

.subjective-input {
  width: 100%;
  padding: 14px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--gray-3);
  font-size: 14px;
  line-height: 1.6;
  background: var(--gray-1);
  box-sizing: border-box;
  resize: vertical;
  outline: none;

  &:focus {
    border-color: var(--primary);
    background: var(--gray-0);
  }
}

.subjective-hint {
  font-size: 12px;
  color: var(--gray-5);
  text-align: right;
  margin-top: 6px;
}
</style>
