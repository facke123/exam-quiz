<template>
  <van-popup
    v-model:show="visible"
    position="bottom"
    round
    safe-area-inset-bottom
    class="report-popup"
  >
    <div class="rp-container">
      <!-- 弹窗标题栏 -->
      <div class="rp-header">
        <div class="rp-title-wrap">
          <div class="rp-title">
            <span class="rp-icon">🚩</span> 试题纠错与反馈
          </div>
          <div class="rp-subtitle">
            感谢您帮助完善题库，教研团队将逐一核实并修正
          </div>
        </div>
        <div
          class="rp-close"
          @click="visible = false"
        >
          ✕
        </div>
      </div>

      <!-- 关联题目概要 -->
      <div class="rp-question-box">
        <span class="rp-qid">[题#{{ questionId || '-' }}]</span>
        <span class="rp-qtext">{{ questionExcerpt }}</span>
      </div>

      <!-- 纠错类型选择 -->
      <div class="rp-section-title">
        请选择问题类型 <span class="req">*</span>
      </div>
      <div class="rp-type-grid">
        <div
          v-for="t in errorTypes"
          :key="t.value"
          class="rp-type-item"
          :class="{ active: currentType === t.value }"
          @click="selectType(t.value)"
        >
          <span class="type-icon">{{ t.icon }}</span>
          <span class="type-name">{{ t.label }}</span>
        </div>
      </div>

      <!-- 快捷标签插入 -->
      <div class="rp-quick-tags">
        <span class="tag-title">常用快捷语：</span>
        <span
          v-for="tag in quickTags"
          :key="tag"
          class="q-tag"
          @click="insertTag(tag)"
        >
          {{ tag }}
        </span>
      </div>

      <!-- 详细描述输入框 -->
      <div class="rp-input-box">
        <van-field
          v-model="description"
          type="textarea"
          rows="3"
          autosize
          maxlength="500"
          show-word-limit
          placeholder="请详细描述您发现的问题（如：参考答案应为C，原解析缺少关键依据...）"
          class="rp-textarea"
        />
      </div>

      <!-- 联系方式（选填） -->
      <div class="rp-contact-box">
        <van-field
          v-model="contact"
          placeholder="微信号 / 手机号 / 邮箱（选填，便于接收核实答复）"
          class="rp-contact-input"
          left-icon="contact"
          clearable
        />
      </div>

      <!-- 底部操作按钮 -->
      <div class="rp-footer">
        <button
          class="btn-cancel"
          @click="visible = false"
        >
          取消
        </button>
        <button
          class="btn-submit"
          :disabled="submitting || !description.trim()"
          @click="onSubmit"
        >
          <van-loading
            v-if="submitting"
            size="16px"
            color="#fff"
            style="margin-right: 6px;"
          />
          {{ submitting ? '正在提交...' : '提交纠错反馈' }}
        </button>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { showToast } from 'vant'
import { submitErrorReport } from '@/api/question'

const props = defineProps<{
  show: boolean
  questionId?: string | number
  questionTitle?: string
}>()

const emit = defineEmits<{
  'update:show': [val: boolean]
  submitted: []
}>()

const visible = computed({
  get: () => props.show,
  set: (v) => emit('update:show', v),
})

const submitting = ref(false)
const currentType = ref('answer')
const description = ref('')
const contact = ref('')

const errorTypes = [
  { label: '答案错误', value: 'answer', icon: '🎯' },
  { label: '解析有误', value: 'analysis', icon: '📖' },
  { label: '错字/排版', value: 'content', icon: '🔤' },
  { label: '选项缺失', value: 'options', icon: '📑' },
  { label: '公式/配图', value: 'image_formula', icon: '🖼️' },
  { label: '其他问题', value: 'other', icon: '💬' },
]

const quickTags = [
  '【答案有误】',
  '【解析不完整】',
  '【题目有错字】',
  '【配图无法显示】',
  '【选项重复】',
]

const questionExcerpt = computed(() => {
  const t = props.questionTitle || ''
  const clean = t.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
  return clean.length > 50 ? clean.slice(0, 50) + '...' : clean || '当前试题'
})

function selectType(t: string) {
  currentType.value = t
}

function insertTag(tag: string) {
  if (!description.value.includes(tag)) {
    description.value = tag + ' ' + description.value
  }
}

watch(
  () => props.show,
  (val) => {
    if (val) {
      currentType.value = 'answer'
      description.value = ''
      contact.value = ''
    }
  }
)

async function onSubmit() {
  if (!description.value.trim()) {
    return showToast('请填写具体的问题描述')
  }

  if (!props.questionId) {
    return showToast('试题参数异常，请重试')
  }

  submitting.value = true
  try {
    const res = await submitErrorReport({
      questionId: props.questionId,
      type: currentType.value,
      description: description.value.trim(),
      contact: contact.value.trim() || undefined,
    })

    showToast(res?.data?.message || '反馈提交成功，教研团队将尽快核实！')
    emit('submitted')
    visible.value = false
  } catch (err: any) {
    showToast(err?.message || '提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.report-popup {
  max-height: 85vh;
  border-radius: 16px 16px 0 0;
  overflow-y: auto;
}

.rp-container {
  padding: 18px 16px;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.rp-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;

  .rp-title {
    font-size: 17px;
    font-weight: 800;
    color: var(--gray-8);
    display: flex;
    align-items: center;
    gap: 6px;

    .rp-icon {
      font-size: 18px;
    }
  }

  .rp-subtitle {
    font-size: 12px;
    color: var(--gray-5);
    margin-top: 4px;
  }

  .rp-close {
    font-size: 16px;
    color: var(--gray-4);
    cursor: pointer;
    padding: 4px;
    line-height: 1;

    &:hover {
      color: var(--gray-7);
    }
  }
}

.rp-question-box {
  background: #f8fafc;
  border: 1px solid var(--gray-2);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--gray-7);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;

  .rp-qid {
    font-weight: 700;
    color: var(--primary);
    flex-shrink: 0;
  }

  .rp-qtext {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--gray-6);
  }
}

.rp-section-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--gray-8);
  margin-bottom: 8px;

  .req {
    color: #ef4444;
  }
}

.rp-type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;

  .rp-type-item {
    border: 1.5px solid var(--gray-2);
    background: #fff;
    border-radius: 8px;
    padding: 8px 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition: all 0.2s;

    .type-icon {
      font-size: 16px;
    }

    .type-name {
      font-size: 12px;
      font-weight: 600;
      color: var(--gray-7);
    }

    &.active {
      border-color: #ef4444;
      background: #fef2f2;

      .type-name {
        color: #dc2626;
        font-weight: 700;
      }
    }
  }
}

.rp-quick-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;

  .tag-title {
    font-size: 11px;
    color: var(--gray-5);
  }

  .q-tag {
    font-size: 11px;
    background: var(--gray-1);
    color: var(--gray-6);
    padding: 2px 8px;
    border-radius: 12px;
    cursor: pointer;
    border: 1px solid var(--gray-2);

    &:active {
      background: var(--gray-2);
    }
  }
}

.rp-input-box {
  margin-bottom: 10px;

  .rp-textarea {
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid var(--gray-2);
    padding: 10px 12px;
    font-size: 13px;

    :deep(textarea) {
      line-height: 1.5;
      color: var(--gray-8);
    }
  }
}

.rp-contact-box {
  margin-bottom: 16px;

  .rp-contact-input {
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid var(--gray-2);
    padding: 6px 12px;
    font-size: 12px;
  }
}

.rp-footer {
  display: flex;
  gap: 10px;

  .btn-cancel {
    flex: 1;
    height: 42px;
    background: var(--gray-1);
    color: var(--gray-6);
    border: 1px solid var(--gray-2);
    border-radius: 21px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-submit {
    flex: 2;
    height: 42px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: #fff;
    border: none;
    border-radius: 21px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);

    &:disabled {
      background: #fca5a5;
      cursor: not-allowed;
      box-shadow: none;
    }
  }
}
</style>
