<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchForm, { type SearchItem } from '@/components/SearchForm.vue'
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import ProDialog from '@/components/ProDialog.vue'
import {
  getErrorReportList,
  handleErrorReport,
  type ErrorReport,
} from '@/api/question'
import { getQuestionDetail, type Question } from '@/api/question'
import { formatDateTime, formatRelativeTime } from '@/utils/format'

const loading = ref(false)
const list = ref<ErrorReport[]>([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 10, status: '', keyword: '' })

const searchItems: SearchItem[] = [
  { prop: 'keyword', label: '关键词', type: 'input', placeholder: '题干/用户' },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '待处理', value: 'pending' },
      { label: '已采纳', value: 'accepted' },
      { label: '已驳回', value: 'rejected' },
    ],
  },
]

const statusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待处理', type: 'warning' },
  accepted: { label: '已采纳', type: 'success' },
  rejected: { label: '已驳回', type: 'info' },
}

const columns: ProColumn[] = [
  { prop: 'id', label: 'ID', width: 70 },
  { prop: 'questionTitle', label: '题目', minWidth: 220, slot: 'title' },
  { prop: 'username', label: '反馈用户', width: 120 },
  { prop: 'content', label: '纠错内容', minWidth: 200, slot: 'content' },
  { prop: 'status', label: '状态', width: 90, slot: 'status' },
  { prop: 'createdAt', label: '反馈时间', width: 160, formatter: (r) => formatDateTime(r.createdAt) },
]

async function fetchList() {
  loading.value = true
  try {
    const res = await getErrorReportList(query)
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

// 处理弹窗
const dialogVisible = ref(false)
const currentReport = ref<ErrorReport | null>(null)
const currentQuestion = ref<Question | null>(null)
const reply = ref('')
const submitLoading = ref(false)

async function handleProcess(row: ErrorReport) {
  currentReport.value = row
  reply.value = ''
  try {
    const res = await getQuestionDetail(row.questionId)
    currentQuestion.value = res.data
  } catch {
    currentQuestion.value = null
  }
  dialogVisible.value = true
}

async function submitProcess(status: 'accepted' | 'rejected') {
  if (!reply.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  submitLoading.value = true
  try {
    await handleErrorReport(currentReport.value!.id, { status, reply: reply.value })
    ElMessage.success(status === 'accepted' ? '已采纳' : '已驳回')
    dialogVisible.value = false
    fetchList()
  } finally {
    submitLoading.value = false
  }
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
      <template #title="{ row }">
        <el-tooltip :content="row.questionTitle" placement="top">
          <span class="text-ellipsis">{{ row.questionTitle }}</span>
        </el-tooltip>
      </template>

      <template #content="{ row }">
        <el-tooltip :content="row.content" placement="top">
          <span class="text-ellipsis">{{ row.content }}</span>
        </el-tooltip>
      </template>

      <template #status="{ row }">
        <el-tag size="small" :type="statusMap[row.status]?.type">
          {{ statusMap[row.status]?.label }}
        </el-tag>
      </template>

      <template #operation="{ row }">
        <el-button
          link
          type="primary"
          size="small"
          :disabled="row.status !== 'pending'"
          @click="handleProcess(row)"
        >
          处理
        </el-button>
      </template>
    </ProTable>

    <ProDialog
      v-model="dialogVisible"
      title="纠错处理"
      width="700px"
      :show-footer="false"
    >
      <div v-if="currentQuestion" class="error-detail">
        <h4>题目内容</h4>
        <div class="error-detail__question" v-html="currentQuestion.content" />

        <h4>纠错反馈</h4>
        <p class="error-detail__report">{{ currentReport?.content }}</p>
        <p class="error-detail__meta">
          反馈人：{{ currentReport?.username }} · {{ formatRelativeTime(currentReport!.createdAt) }}
        </p>

        <h4>处理回复</h4>
        <el-input
          v-model="reply"
          type="textarea"
          :rows="4"
          placeholder="请输入回复内容"
        />

        <div class="error-detail__actions">
          <el-button
            type="success"
            :loading="submitLoading"
            @click="submitProcess('accepted')"
          >
            采纳纠错
          </el-button>
          <el-button
            type="danger"
            :loading="submitLoading"
            @click="submitProcess('rejected')"
          >
            驳回
          </el-button>
        </div>
      </div>
    </ProDialog>
  </div>
</template>

<style scoped lang="scss">
.error-detail {
  h4 {
    margin: 12px 0 8px;
    font-size: 14px;
    color: var(--app-text-primary);
  }

  &__question {
    padding: 12px;
    background: var(--el-fill-color-light);
    border-radius: 4px;
    font-size: 14px;
    line-height: 1.6;
  }

  &__report {
    color: var(--app-text-regular);
  }

  &__meta {
    margin-top: 4px;
    font-size: 12px;
    color: var(--app-text-secondary);
  }

  &__actions {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}
</style>
