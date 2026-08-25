<template>
  <div class="question-card">
    <div class="q-header">
      <span
        class="question-type-tag"
        :class="`tag-${normalizedType}`"
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

    <!-- 题干（支持公式与图片） -->
    <div
      class="question-content"
      v-html="renderedTitle"
    />

    <!-- 选项列表（单选、多选、判断题） -->
    <div
      v-if="effectiveOptions.length && !isSubjective"
      class="options-list"
    >
      <OptionItem
        v-for="opt in effectiveOptions"
        :key="opt.key"
        :option="opt"
        :mode="isMultiple ? 'multiple' : 'single'"
        :selected="isSelected(opt.key)"
        :show-result="showResult"
        :correct="isCorrect(opt.key)"
        @click="onSelect(opt.key)"
      />
    </div>

    <!-- 主观题/问答题/案例分析/填空题输入区 -->
    <div
      v-else-if="isSubjective"
      class="subjective-wrap"
    >
      <div class="subjective-bar">
        <span class="sb-tip">✍️ 请在下方输入你的作答要点：</span>
        <span
          v-if="subjectiveAnswer"
          class="sb-clear"
          @click="subjectiveAnswer = ''"
        >清空作答</span>
      </div>
      <textarea
        v-model="subjectiveAnswer"
        class="subjective-input"
        placeholder="请输入你的作答内容、推导过程或分析要点..."
        rows="6"
      />
      <div class="subjective-hint">
        {{ subjectiveAnswer.length }} / 1000字
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Question, QuestionOption } from '@/api/question'
import { questionTypeText, difficultyText } from '@/utils/format'
import { renderWithFormula } from '@/utils/katex'
import OptionItem from './OptionItem.vue'

interface Props {
  question: Question
  modelValue?: string | string[]
  showResult?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | string[]): void
}>()

const subjectiveAnswer = ref<string>('')

const normalizedType = computed(() => {
  const t = String(props.question.type || 'single').toLowerCase()
  if (t === 'true_false' || t === 'judgment') return 'judge'
  if (t === 'case_analysis') return 'case'
  if (t === 'single_choice') return 'single'
  if (t === 'multiple_choice') return 'multiple'
  return t
})

const typeText = computed(() => questionTypeText(props.question.type))
const isMultiple = computed(() => normalizedType.value === 'multiple')
const renderedTitle = computed(() => renderWithFormula(props.question.title || (props.question as any).content || ''))

// 针对判断题或缺失选项的题目生成安全选项
const effectiveOptions = computed<QuestionOption[]>(() => {
  const t = normalizedType.value
  if (t === 'judge') {
    if (props.question.options && props.question.options.length >= 2) {
      return props.question.options
    }
    return [
      { key: 'A', content: '正确' },
      { key: 'B', content: '错误' },
    ]
  }
  return props.question.options || []
})

// 判断是否为主观题/问答题/案例题
const isSubjective = computed(() => {
  const t = normalizedType.value
  const subjectiveTypes = ['subjective', 'essay', 'case', 'qa', 'blank', 'fill_blank']
  if (subjectiveTypes.includes(t)) return true
  // 选项为空且不是判断题时作为主观题渲染
  return effectiveOptions.value.length === 0 && t !== 'judge'
})

const selected = computed<string | string[]>(() => props.modelValue || (isMultiple.value ? [] : ''))

watch(
  () => props.modelValue,
  (v) => {
    if (isSubjective.value) {
      subjectiveAnswer.value = typeof v === 'string' ? v : Array.isArray(v) ? v.join('') : ''
    }
  },
  { immediate: true }
)

watch(subjectiveAnswer, (v) => {
  if (isSubjective.value) {
    emit('update:modelValue', v)
  }
})

function isSelected(key: string): boolean {
  const sel = selected.value
  if (Array.isArray(sel)) return sel.includes(key)
  if (normalizedType.value === 'judge') {
    if (sel === key) return true
    if (key === 'A' && (sel === '正确' || sel === 'T' || sel === 'true')) return true
    if (key === 'B' && (sel === '错误' || sel === 'F' || sel === 'false')) return true
    return false
  }
  return sel === key
}

function isCorrect(key: string): boolean {
  if (!props.showResult) return false
  const ans = props.question.answer
  if (Array.isArray(ans)) return ans.includes(key)
  if (normalizedType.value === 'judge') {
    if (ans === key) return true
    if (key === 'A' && (ans === '正确' || ans === 'T' || ans === 'true')) return true
    if (key === 'B' && (ans === '错误' || ans === 'F' || ans === 'false')) return true
    return false
  }
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

  &.tag-subjective,
  &.tag-essay,
  &.tag-qa,
  &.tag-case {
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

.subjective-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;

  .sb-tip {
    color: var(--gray-6);
  }

  .sb-clear {
    color: var(--primary);
    cursor: pointer;
    font-size: 12px;
  }
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
  transition: all 0.2s;

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
