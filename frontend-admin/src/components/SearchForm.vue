<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance } from 'element-plus'

export interface SearchItem {
  prop: string
  label: string
  type: 'input' | 'select' | 'date' | 'daterange' | 'cascader'
  options?: { label: string; value: any }[]
  placeholder?: string
  clearable?: boolean
  props?: Record<string, any>
}

const props = defineProps<{
  items: SearchItem[]
  modelValue?: Record<string, any>
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'search', form: Record<string, any>): void
  (e: 'reset'): void
}>()

const formRef = ref<FormInstance>()
const form = reactive<Record<string, any>>({ ...props.modelValue })

function handleSearch() {
  emit('search', { ...form })
}

function handleReset() {
  formRef.value?.resetFields()
  Object.keys(form).forEach((k) => {
    form[k] = props.modelValue?.[k] ?? ''
  })
  emit('reset')
}
</script>

<template>
  <div class="search-form">
    <el-form ref="formRef" :model="form" inline>
      <el-form-item
        v-for="item in items"
        :key="item.prop"
        :label="item.label"
        :prop="item.prop"
      >
        <el-input
          v-if="item.type === 'input'"
          v-model="form[item.prop]"
          :placeholder="item.placeholder || `请输入${item.label}`"
          :clearable="item.clearable !== false"
          v-bind="item.props"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-else-if="item.type === 'select'"
          v-model="form[item.prop]"
          :placeholder="item.placeholder || `请选择${item.label}`"
          :clearable="item.clearable !== false"
          v-bind="item.props"
        >
          <el-option
            v-for="opt in item.options"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-date-picker
          v-else-if="item.type === 'date'"
          v-model="form[item.prop]"
          type="date"
          value-format="YYYY-MM-DD"
          :placeholder="item.placeholder || `请选择${item.label}`"
          v-bind="item.props"
        />
        <el-date-picker
          v-else-if="item.type === 'daterange'"
          v-model="form[item.prop]"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          v-bind="item.props"
        />
        <el-cascader
          v-else-if="item.type === 'cascader'"
          v-model="form[item.prop]"
          v-bind="item.props"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :icon="'Search'" :loading="loading" @click="handleSearch">
          搜索
        </el-button>
        <el-button :icon="'Refresh'" @click="handleReset">重置</el-button>
        <slot name="extra" />
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.search-form {
  margin-bottom: 16px;
  padding: 16px 16px 0;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}
</style>
