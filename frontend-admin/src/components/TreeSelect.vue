<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: number | number[] | null
    data: any[]
    /** 是否多选 */
    multiple?: boolean
    placeholder?: string
    disabled?: boolean
  }>(),
  {
    multiple: false,
    placeholder: '请选择',
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: any): void
  (e: 'change', val: any): void
}>()

const value = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const cascaderProps = {
  checkStrictly: true,
  emitPath: false,
  label: 'name',
  value: 'id',
  children: 'children',
  multiple: props.multiple,
}

function handleChange(val: any) {
  emit('change', val)
}
</script>

<template>
  <el-cascader
    v-model="value"
    :options="data"
    :props="cascaderProps"
    :placeholder="placeholder"
    :disabled="disabled"
    clearable
    filterable
    style="width: 100%"
    @change="handleChange"
  />
</template>
