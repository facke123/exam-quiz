<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { TableInstance } from 'element-plus'

export interface ProColumn {
  prop: string
  label: string
  width?: number | string
  minWidth?: number | string
  align?: 'left' | 'center' | 'right'
  fixed?: 'left' | 'right'
  sortable?: boolean
  // 自定义渲染插槽名
  slot?: string
  // 格式化函数
  formatter?: (row: any, column: any, value: any) => string
  showOverflowTooltip?: boolean
}

const props = withDefaults(
  defineProps<{
    columns: ProColumn[]
    data: any[]
    loading?: boolean
    selection?: boolean
    index?: boolean
    page?: number
    pageSize?: number
    total?: number
    pageSizes?: number[]
    rowKey?: string
    showPagination?: boolean
    operationWidth?: number | string
    operationLabel?: string
  }>(),
  {
    loading: false,
    selection: false,
    index: false,
    page: 1,
    pageSize: 10,
    total: 0,
    pageSizes: () => [10, 20, 50, 100],
    rowKey: 'id',
    showPagination: true,
    operationWidth: 230,
    operationLabel: '操作',
  },
)

const emit = defineEmits<{
  (e: 'update:page', page: number): void
  (e: 'update:pageSize', size: number): void
  (e: 'selection-change', rows: any[]): void
  (e: 'sort-change', payload: { prop: string; order: string }): void
}>()

const tableRef = ref<TableInstance>()
const selectedRows = ref<any[]>([])

const currentPage = computed({
  get: () => props.page,
  set: (v) => emit('update:page', v),
})
const currentPageSize = computed({
  get: () => props.pageSize,
  set: (v) => emit('update:pageSize', v),
})

function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows
  emit('selection-change', rows)
}

function handleSortChange({ prop, order }: { prop: string; order: string }) {
  emit('sort-change', { prop, order })
}

// 暴露清除选择方法
function clearSelection() {
  tableRef.value?.clearSelection()
}
defineExpose({ clearSelection, selectedRows })

watch(
  () => props.data,
  () => {
    // 数据变化时保持选中状态
  },
)
</script>

<template>
  <div class="pro-table">
    <div v-if="$slots.toolbar" class="pro-table__toolbar">
      <slot name="toolbar" />
    </div>

    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="data"
      :row-key="rowKey"
      border
      stripe
      style="width: 100%"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
    >
      <el-table-column v-if="selection" type="selection" width="50" align="center" fixed />
      <el-table-column v-if="index" type="index" label="序号" width="60" align="center" fixed />

      <el-table-column
        v-for="col in columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth || 120"
        :align="col.align || 'left'"
        :fixed="col.fixed"
        :sortable="col.sortable"
        :formatter="col.formatter"
        :show-overflow-tooltip="col.showOverflowTooltip !== false"
      >
        <template v-if="col.slot" #default="scope">
          <slot :name="col.slot" v-bind="scope" />
        </template>
      </el-table-column>

      <el-table-column
        v-if="$slots.operation"
        :label="operationLabel"
        fixed="right"
        :width="operationWidth"
        align="center"
      >
        <template #default="scope">
          <slot name="operation" v-bind="scope" />
        </template>
      </el-table-column>
    </el-table>

    <div v-if="showPagination" class="pro-table__pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="currentPageSize"
        :page-sizes="pageSizes"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.pro-table {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

  &__toolbar {
    margin-bottom: 12px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__pagination {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
