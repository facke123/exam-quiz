<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import SearchForm, { type SearchItem } from '@/components/SearchForm.vue'
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import ProDialog from '@/components/ProDialog.vue'
import { getOperationLogs, getLogDetail, type OperationLog } from '@/api/system'
import { formatDateTime } from '@/utils/format'

const loading = ref(false)
const list = ref<OperationLog[]>([])
const total = ref(0)
const query = reactive({
  page: 1,
  pageSize: 20,
  module: '',
  adminName: '',
  status: '',
})

const searchItems: SearchItem[] = [
  { prop: 'adminName', label: '操作人', type: 'input' },
  {
    prop: 'module',
    label: '模块',
    type: 'select',
    options: [
      { label: '题目管理', value: 'question' },
      { label: '用户管理', value: 'user' },
      { label: '考试管理', value: 'exam' },
      { label: '系统管理', value: 'system' },
      { label: '内容管理', value: 'content' },
    ],
  },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '成功', value: 'success' },
      { label: '失败', value: 'fail' },
    ],
  },
]

const columns: ProColumn[] = [
  { prop: 'id', label: 'ID', width: 70 },
  { prop: 'adminName', label: '操作人', width: 110 },
  { prop: 'module', label: '模块', width: 100, slot: 'module' },
  { prop: 'action', label: '操作', minWidth: 150 },
  { prop: 'method', label: '请求方法', width: 90, slot: 'method' },
  { prop: 'ip', label: 'IP', width: 130 },
  { prop: 'costTime', label: '耗时(ms)', width: 90, slot: 'costTime' },
  { prop: 'status', label: '状态', width: 80, slot: 'status' },
  { prop: 'createdAt', label: '操作时间', width: 160, formatter: (r) => formatDateTime(r.createdAt) },
]

const methodTagType: Record<string, string> = {
  GET: 'info',
  POST: 'success',
  PUT: 'warning',
  DELETE: 'danger',
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getOperationLogs(query)
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function handleSearch(form: Record<string, any>) {
  Object.assign(query, form)
  query.page = 1
  fetchList()
}

// 详情弹窗
const detailVisible = ref(false)
const currentLog = ref<OperationLog | null>(null)

async function handleDetail(row: OperationLog) {
  const res = await getLogDetail(row.id)
  currentLog.value = res.data
  detailVisible.value = true
}

onMounted(fetchList)
</script>

<template>
  <div class="page-container">
    <SearchForm :items="searchItems" :model-value="query" :loading="loading" @search="handleSearch" />

    <ProTable
      :columns="columns"
      :data="list"
      :loading="loading"
      :page="query.page"
      :page-size="query.pageSize"
      :total="total"
      @update:page="(p) => (query.page = p)"
      @update:page-size="(s) => (query.pageSize = s)"
    >
      <template #module="{ row }">
        <el-tag size="small">{{ row.module }}</el-tag>
      </template>

      <template #method="{ row }">
        <el-tag size="small" :type="methodTagType[row.method] || 'info'">{{ row.method }}</el-tag>
      </template>

      <template #costTime="{ row }">
        <span :style="{ color: row.costTime > 1000 ? '#ef4444' : '' }">{{ row.costTime }}</span>
      </template>

      <template #status="{ row }">
        <el-tag size="small" :type="row.status === 'success' ? 'success' : 'danger'">
          {{ row.status === 'success' ? '成功' : '失败' }}
        </el-tag>
      </template>

      <template #operation="{ row }">
        <el-button link type="primary" size="small" @click="handleDetail(row)">详情</el-button>
      </template>
    </ProTable>

    <ProDialog v-model="detailVisible" title="日志详情" width="700px" :show-footer="false">
      <el-descriptions v-if="currentLog" :column="2" border>
        <el-descriptions-item label="ID">{{ currentLog.id }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentLog.adminName }}</el-descriptions-item>
        <el-descriptions-item label="模块">{{ currentLog.module }}</el-descriptions-item>
        <el-descriptions-item label="操作">{{ currentLog.action }}</el-descriptions-item>
        <el-descriptions-item label="请求方法">{{ currentLog.method }}</el-descriptions-item>
        <el-descriptions-item label="IP">{{ currentLog.ip }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ currentLog.costTime }} ms</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag size="small" :type="currentLog.status === 'success' ? 'success' : 'danger'">
            {{ currentLog.status === 'success' ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作时间" :span="2">{{ formatDateTime(currentLog.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <pre class="log-params">{{ currentLog.params }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </ProDialog>
  </div>
</template>

<style scoped lang="scss">
.log-params {
  background: var(--el-fill-color-light);
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}
</style>
