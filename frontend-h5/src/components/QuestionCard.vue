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
      <span
        v-if="reciteMode"
        class="recite-mode-badge"
      >
        📖 背题模式
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
        :correct="isKeyCorrect(opt.key)"
        :is-user-wrong="isKeyUserWrong(opt.key)"
        :disabled="showResult && !reciteMode"
        @click="onSelect(opt.key)"
      />

      <!-- 多选题专属：确认作答按钮 -->
      <div
        v-if="isMultiple && !showResult"
        class="multi-submit-wrap"
      >
        <button
          class="btn-multi-confirm"
          :disabled="!hasMultiSelection"
          @click="$emit('confirm-multi')"
        >
          确认作答 (已选 {{ (selected as string[]).length }} 项)
        </button>
      </div>
    </div>

    <!-- 主观题/问答题/案例分析/填空题输入区 -->
    <div
      v-else-if="isSubjective"
      class="subjective-wrap"
    >
      <div class="subjective-bar">
        <span class="sb-tip">✍️ 请在下方输入你的作答要点：</span>
        <span
          v-if="subjectiveAnswer && !showResult"
          class="sb-clear"
          @click="subjectiveAnswer = ''"
        >清空作答</span>
      </div>
      <textarea
        v-model="subjectiveAnswer"
        class="subjective-input"
        :disabled="showResult && !reciteMode"
        placeholder="请输入你的作答内容、推导过程或分析要点..."
        rows="5"
      />
      <div class="subjective-hint">
        {{ subjectiveAnswer.length }} / 1000字
      </div>
      <div
        v-if="!showResult"
        class="subjective-submit-wrap"
      >
        <button
          class="btn-subjective-confirm"
          @click="$emit('confirm-subjective', subjectiveAnswer)"
        >
          查看参考答案与采分点
        </button>
      </div>
    </div>

    <!-- 试题答案与答案原解析区域 (答错时、背题模式时、或点击解析展开时呈现，完全对标参考截图) -->
    <div
      v-if="showResult && (showAnalysis || !isAnswerCorrect || reciteMode)"
      class="analysis-container"
    >
      <!-- 模块 1：试题答案 -->
      <div class="answer-section">
        <div class="section-header">
          <div class="section-title">
            <span class="double-dot">●●</span>
            <span>试题答案</span>
          </div>
          <button
            class="feedback-btn"
            @click="$emit('report')"
          >
            反馈/纠错
          </button>
        </div>

        <div class="answer-row-content">
          <div class="answer-detail">
            <div class="answer-item">
              <span class="label">正确答案：</span>
              <span class="val correct-val">{{ formattedCorrectAnswer }}</span>
            </div>
            <div
              v-if="!reciteMode"
              class="answer-item"
            >
              <span class="label">你的答案：</span>
              <span
                class="val"
                :class="isAnswerCorrect ? 'correct-val' : 'wrong-val'"
              >
                {{ formattedUserAnswer || '未作答' }}
              </span>
            </div>
          </div>

          <!-- 右侧逼真印章 -->
          <div
            class="stamp-wrapper"
            :class="isAnswerCorrect ? 'stamp-correct' : 'stamp-wrong'"
          >
            <div class="stamp-inner">
              <span class="stamp-text">{{ isAnswerCorrect ? '回答正确' : '回答错误' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 模块 2：答案原解析 -->
      <div class="explanation-section">
        <div class="section-title">
          <span class="double-dot">●●</span>
          <span>答案原解析</span>
        </div>

        <!-- 考点标签提示 -->
        <div
          v-if="question.knowledgePoint || (question as any).knowledgePointName"
          class="kp-tag"
        >
          📌 核心考点：{{ (question as any).knowledgePointName || (question as any).knowledgePoint?.name || '考点精讲' }}
        </div>

        <!-- 解析主体 -->
        <div
          class="explanation-text"
          v-html="renderedAnalysis"
        />
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
  isCorrect?: boolean | null
  showAnalysis?: boolean
  reciteMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  showResult: false,
  isCorrect: null,
  showAnalysis: false,
  reciteMode: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | string[]): void
  (e: 'select', key: string): void
  (e: 'confirm-multi'): void
  (e: 'confirm-subjective', answer: string): void
  (e: 'report'): void
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

// 针对判断题或缺失选项安全生成
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
  return effectiveOptions.value.length === 0 && t !== 'judge'
})

const selected = computed<string | string[]>(() => props.modelValue || (isMultiple.value ? [] : ''))
const hasMultiSelection = computed(() => Array.isArray(selected.value) && selected.value.length > 0)

// 当前题目是否判定正确
const isAnswerCorrect = computed(() => {
  if (props.reciteMode) return true
  if (props.isCorrect !== null) return props.isCorrect
  return false
})

// 解析正文渲染
const renderedAnalysis = computed(() => {
  const ana = props.question.analysis || (props.question as any).explanation || '本题暂无详细官方文字解析，请参考标准答案与考点要点。'
  return renderWithFormula(ana)
})

// 格式化标准答案
const formattedCorrectAnswer = computed(() => {
  const ans = props.question.answer
  if (Array.isArray(ans)) return ans.join('、')
  if (normalizedType.value === 'judge') {
    if (ans === 'A' || ans === '正确' || ans === 'T' || ans === 'true') return 'A (正确)'
    if (ans === 'B' || ans === '错误' || ans === 'F' || ans === 'false') return 'B (错误)'
  }
  return String(ans || '').toUpperCase()
})

// 格式化用户答案
const formattedUserAnswer = computed(() => {
  const user = props.modelValue
  if (Array.isArray(user)) return user.join('、')
  if (normalizedType.value === 'judge') {
    if (user === 'A' || user === '正确') return 'A (正确)'
    if (user === 'B' || user === '错误') return 'B (错误)'
  }
  return String(user || '').toUpperCase()
})

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

// 该选项是否属于正确答案
function isKeyCorrect(key: string): boolean {
  const ans = props.question.answer
  if (Array.isArray(ans)) return ans.includes(key)
  if (normalizedType.value === 'judge') {
    if (ans === key) return true
    if (key === 'A' && (ans === '正确' || ans === 'T' || ans === 'true')) return true
    if (key === 'B' && (ans === '错误' || ans === 'F' || ans === 'false')) return true
    return false
  }
  return String(ans).toUpperCase() === key
}

// 该选项是否是用户选错的项
function isKeyUserWrong(key: string): boolean {
  if (!isSelected(key)) return false
  return !isKeyCorrect(key)
}

function onSelect(key: string) {
  if (props.showResult && !props.reciteMode) return
  if (isMultiple.value) {
    const arr = Array.isArray(selected.value) ? [...selected.value] : []
    const idx = arr.indexOf(key)
    if (idx >= 0) arr.splice(idx, 1)
    else arr.push(key)
    arr.sort()
    emit('update:modelValue', arr)
  } else {
    emit('update:modelValue', key)
    emit('select', key)
  }
}
</script>

<style scoped lang="scss">
.question-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.q-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.question-type-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  background: #fef0f0;
  color: #f56c6c;

  &.tag-multiple {
    background: #f3e8ff;
    color: #9333ea;
  }

  &.tag-judge {
    background: #ecfeff;
    color: #0891b2;
  }

  &.tag-case,
  &.tag-subjective {
    background: #fff7ed;
    color: #ea580c;
  }
}

.recite-mode-badge {
  font-size: 11px;
  font-weight: 600;
  background: #e0f2fe;
  color: #0284c7;
  padding: 2px 8px;
  border-radius: 6px;
  margin-left: auto;
}

.q-score,
.q-difficulty {
  font-size: 12px;
  color: #9ca3af;
}

.question-content {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.65;
  color: #111827;
  margin-bottom: 18px;
  word-break: break-word;
}

.options-list {
  display: flex;
  flex-direction: column;
}

.multi-submit-wrap {
  margin-top: 6px;
  margin-bottom: 10px;
}

.btn-multi-confirm {
  width: 100%;
  height: 42px;
  border-radius: 21px;
  border: none;
  background: #f56c6c;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(245, 108, 108, 0.3);

  &:disabled {
    background: #e5e7eb;
    color: #9ca3af;
    box-shadow: none;
    cursor: not-allowed;
  }
}

/* 主观题作答区 */
.subjective-wrap {
  margin-bottom: 16px;
}

.subjective-bar {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.sb-clear {
  color: #f56c6c;
  cursor: pointer;
}

.subjective-input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  background: #f9fafb;

  &:focus {
    outline: none;
    border-color: #f56c6c;
    background: #ffffff;
  }
}

.subjective-hint {
  text-align: right;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.subjective-submit-wrap {
  margin-top: 10px;
}

.btn-subjective-confirm {
  width: 100%;
  height: 40px;
  border-radius: 20px;
  border: none;
  background: #f56c6c;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

/* ========================================================
   试题答案与解析区域（完全对标截图样式）
   ======================================================== */
.analysis-container {
  margin-top: 18px;
  border-top: 1px solid #f3f4f6;
  padding-top: 18px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;

  .double-dot {
    color: #f56c6c;
    font-size: 12px;
    letter-spacing: -1px;
  }
}

.feedback-btn {
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #9ca3af;
  border-radius: 12px;
  padding: 3px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover,
  &:active {
    background: #f9fafb;
    color: #f56c6c;
    border-color: #fca5a5;
  }
}

/* 答案对比与印章区 */
.answer-row-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  padding: 8px 4px 14px;
  margin-bottom: 14px;
  border-bottom: 1px dashed #f0f2f5;
}

.answer-detail {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.answer-item {
  font-size: 15px;

  .label {
    color: #374151;
  }

  .val {
    font-weight: 700;
    font-size: 17px;
  }

  .correct-val {
    color: #22c55e;
  }

  .wrong-val {
    color: #ef4444;
  }
}

/* 真实仿真双边框印章（回答错误 / 回答正确） */
.stamp-wrapper {
  transform: rotate(-10deg);
  user-select: none;
  pointer-events: none;
  padding: 2px;
  border-radius: 6px;

  .stamp-inner {
    border: 2px solid currentColor;
    border-radius: 5px;
    padding: 3px 8px;
    position: relative;
    box-shadow: inset 0 0 2px currentColor;

    &::after {
      content: '';
      position: absolute;
      inset: 1px;
      border: 1px dashed currentColor;
      border-radius: 3px;
      opacity: 0.6;
    }
  }

  .stamp-text {
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 1px;
  }

  &.stamp-wrong {
    color: #ef4444;
  }

  &.stamp-correct {
    color: #22c55e;
  }
}

/* 答案原解析模块 */
.explanation-section {
  background: #fafafa;
  border-radius: 12px;
  padding: 14px 14px 16px;
  margin-top: 4px;
}

.kp-tag {
  font-size: 12px;
  color: #4b5563;
  background: #ffffff;
  padding: 4px 8px;
  border-radius: 6px;
  margin-bottom: 10px;
  border: 1px solid #f3f4f6;
  display: inline-block;
}

.explanation-text {
  font-size: 14.5px;
  line-height: 1.7;
  color: #374151;
  word-break: break-word;
}
</style>
