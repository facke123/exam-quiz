<template>
  <van-popup
    v-model:show="visible"
    round
    closeable
    position="bottom"
    :style="{ maxHeight: '80%', minHeight: '360px' }"
    @closed="onClosed"
  >
    <div class="note-popup-wrap">
      <div class="np-header">
        <div class="np-title">
          📝 题目备考笔记
        </div>
        <div v-if="questionTitle" class="np-question-preview">
          {{ cleanTitle(questionTitle) }}
        </div>
      </div>

      <!-- 快捷标签 -->
      <div class="np-tags-row">
        <span class="tag-label">快捷标签：</span>
        <span
          v-for="tag in quickTags"
          :key="tag"
          class="quick-tag"
          @click="insertTag(tag)"
        >
          + {{ tag }}
        </span>
      </div>

      <!-- 文本输入框 -->
      <div class="np-input-wrap">
        <textarea
          ref="textareaRef"
          v-model="content"
          class="np-textarea"
          rows="6"
          maxlength="1000"
          placeholder="记录本题的解题思路、核心考点、口诀或易错总结..."
        />
        <div class="np-counter">
          {{ content.length }} / 1000 字
        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="np-actions">
        <van-button
          v-if="hasExistingNote"
          class="btn-delete"
          type="default"
          round
          :loading="deleting"
          @click="handleDelete"
        >
          🗑️ 清空笔记
        </van-button>
        <van-button
          class="btn-save"
          type="primary"
          round
          block
          :loading="saving"
          @click="handleSave"
        >
          💾 保存笔记
        </van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { getNote, saveNote, deleteNote } from '@/api/user'

const props = defineProps<{
  show: boolean
  questionId?: string | number
  questionTitle?: string
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  saved: [data: { questionId: string | number; content: string }]
  deleted: [questionId: string | number]
}>()

const visible = ref(props.show)
const content = ref('')
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const hasExistingNote = ref(false)
const existingNoteId = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const quickTags = ['【核心考点】', '【解题技巧】', '【易错总结】', '【记忆口诀】']

function cleanTitle(t: string) {
  return t.replace(/<[^>]+>/g, '').slice(0, 48) + (t.length > 48 ? '...' : '')
}

function insertTag(tag: string) {
  if (content.value.includes(tag)) return
  content.value = tag + ' ' + content.value
}

async function fetchNoteData() {
  if (!props.questionId) return
  loading.value = true
  try {
    const res = await getNote(props.questionId)
    if (res?.data && res.data.content) {
      content.value = res.data.content
      hasExistingNote.value = true
      existingNoteId.value = String(res.data.id || '')
    } else {
      content.value = ''
      hasExistingNote.value = false
      existingNoteId.value = ''
    }
  } catch {
    content.value = ''
    hasExistingNote.value = false
    existingNoteId.value = ''
  } finally {
    loading.value = false
  }
}

watch(
  () => props.show,
  (val) => {
    visible.value = val
    if (val && props.questionId) {
      fetchNoteData()
      nextTick(() => {
        textareaRef.value?.focus()
      })
    }
  }
)

watch(
  () => props.questionId,
  () => {
    if (visible.value && props.questionId) {
      fetchNoteData()
    }
  }
)

watch(visible, (val) => {
  emit('update:show', val)
})

function onClosed() {
  emit('update:show', false)
}

async function handleSave() {
  if (!props.questionId) {
    return showToast('题目ID异常')
  }
  const trimmed = content.value.trim()
  saving.value = true
  try {
    await saveNote({
      questionId: props.questionId,
      content: trimmed,
    })
    hasExistingNote.value = !!trimmed
    showToast(trimmed ? '笔记保存成功' : '笔记已清空')
    emit('saved', { questionId: props.questionId, content: trimmed })
    visible.value = false
  } catch (err: any) {
    showToast(err?.message || '保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!props.questionId) return
  try {
    await showConfirmDialog({
      title: '清空确认',
      message: '确定要清空这道题目的笔记吗？',
    })
    deleting.value = true
    await deleteNote(existingNoteId.value || props.questionId)
    content.value = ''
    hasExistingNote.value = false
    existingNoteId.value = ''
    showToast('笔记已清空')
    emit('deleted', props.questionId)
    visible.value = false
  } catch {
    // cancel
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped lang="scss">
.note-popup-wrap {
  padding: 18px 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.np-header {
  margin-bottom: 2px;

  .np-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--gray-8);
  }

  .np-question-preview {
    font-size: 12px;
    color: var(--gray-5);
    margin-top: 4px;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.np-tags-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;

  .tag-label {
    font-size: 11px;
    color: var(--gray-5);
  }

  .quick-tag {
    font-size: 11px;
    font-weight: 600;
    color: #4f46e5;
    background: #eef2ff;
    padding: 3px 8px;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.2s;

    &:active {
      background: #e0e7ff;
    }
  }
}

.np-input-wrap {
  background: var(--gray-1);
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--gray-3);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  &:focus-within {
    border-color: #6366f1;
    background: var(--gray-0);
  }

  .np-textarea {
    width: 100%;
    border: none;
    background: transparent;
    font-size: 14px;
    line-height: 1.6;
    color: var(--gray-8);
    resize: none;
    outline: none;
    box-sizing: border-box;
    font-family: inherit;
  }

  .np-counter {
    font-size: 11px;
    color: var(--gray-4);
    text-align: right;
  }
}

.np-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;

  .btn-delete {
    flex: 0 0 110px;
    color: var(--danger);
    border-color: var(--danger-bg);
  }

  .btn-save {
    flex: 1;
    font-weight: 700;
  }
}
</style>
