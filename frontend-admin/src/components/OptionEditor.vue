<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

export interface OptionItem {
  label: string
  content: string
  isCorrect?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue: OptionItem[]
    /** 是否允许多选（多选题） */
    multiple?: boolean
  }>(),
  {
    multiple: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: OptionItem[]): void
}>()

const options = ref<OptionItem[]>(props.modelValue?.length ? props.modelValue : defaultOptions())

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

function defaultOptions(): OptionItem[] {
  return [
    { label: 'A', content: '', isCorrect: false },
    { label: 'B', content: '', isCorrect: false },
    { label: 'C', content: '', isCorrect: false },
    { label: 'D', content: '', isCorrect: false },
  ]
}

watch(
  () => props.modelValue,
  (val) => {
    if (val && val.length) options.value = val
  },
  { deep: true },
)

function emitChange() {
  emit('update:modelValue', [...options.value])
}

function addOption() {
  const nextLabel = LABELS[options.value.length]
  if (!nextLabel) {
    ElMessage.warning('最多支持 8 个选项')
    return
  }
  options.value.push({ label: nextLabel, content: '', isCorrect: false })
  emitChange()
}

function removeOption(idx: number) {
  if (options.value.length <= 2) {
    ElMessage.warning('至少保留 2 个选项')
    return
  }
  options.value.splice(idx, 1)
  // 重新排列标签
  options.value.forEach((o, i) => (o.label = LABELS[i]))
  emitChange()
}

function toggleCorrect(idx: number) {
  if (props.multiple) {
    options.value[idx].isCorrect = !options.value[idx].isCorrect
  } else {
    options.value.forEach((o, i) => (o.isCorrect = i === idx))
  }
  emitChange()
}

function onInput() {
  emitChange()
}
</script>

<template>
  <div class="option-editor">
    <div
      v-for="(opt, idx) in options"
      :key="idx"
      class="option-editor__item"
    >
      <el-button
        :type="opt.isCorrect ? 'success' : 'default'"
        circle
        size="small"
        @click="toggleCorrect(idx)"
      >
        {{ opt.label }}
      </el-button>
      <el-input
        v-model="opt.content"
        placeholder="请输入选项内容"
        type="textarea"
        :autosize="{ minRows: 1, maxRows: 3 }"
        @input="onInput"
      />
      <el-button type="danger" :icon="'Delete'" circle size="small" @click="removeOption(idx)" />
    </div>
    <el-button type="primary" link :icon="'Plus'" @click="addOption">添加选项</el-button>
    <p class="option-editor__tip">
      点击字母标记正确答案{{ multiple ? '（可多选）' : '（单选）' }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.option-editor {
  &__item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;

    .el-button.is-circle {
      flex-shrink: 0;
      margin-top: 4px;
    }
  }

  &__tip {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
