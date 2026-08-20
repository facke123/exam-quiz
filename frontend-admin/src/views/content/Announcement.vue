<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchForm, { type SearchItem } from '@/components/SearchForm.vue'
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import ProDialog from '@/components/ProDialog.vue'
import RichEditor from '@/components/RichEditor.vue'
import {
  getAnnouncementList,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  type Announcement,
} from '@/api/content'
import { formatDateTime } from '@/utils/format'

const loading = ref(false)
const list = ref<Announcement[]>([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 10, status: '', type: '' })

const searchItems: SearchItem[] = [
  {
    prop: 'type',
    label: '类型',
    type: 'select',
    options: [
      { label: '系统', value: 'system' },
      { label: '活动', value: 'activity' },
      { label: '通知', value: 'notice' },
    ],
  },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '已发布', value: 'published' },
      { label: '草稿', value: 'draft' },
    ],
  },
]

const typeMap: Record<string, { label: string; type: string }> = {
  system: { label: '系统', type: 'danger' },
  activity: { label: '活动', type: 'warning' },
  notice: { label: '通知', type: 'info' },
}

const columns: ProColumn[] = [
  { prop: 'id', label: 'ID', width: 70 },
  { prop: 'title', label: '标题', minWidth: 200 },
  { prop: 'type', label: '类型', width: 80, slot: 'type' },
  { prop: 'top', label: '置顶', width: 70, slot: 'top' },
  { prop: 'status', label: '状态', width: 80, slot: 'status' },
  { prop: 'publishAt', label: '发布时间', width: 160, formatter: (r) => formatDateTime(r.publishAt) },
  { prop: 'createdAt', label: '创建时间', width: 160, formatter: (r) => formatDateTime(r.createdAt) },
]

async function fetchList() {
  loading.value = true
  try {
    const res = await getAnnouncementList(query)
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

// 弹窗
const dialogVisible = ref(false)
const submitLoading = ref(false)
const form = ref<Partial<Announcement>>({
  type: 'notice',
  status: 'draft',
  top: false,
})

function handleAdd() {
  form.value = { type: 'notice', status: 'draft', top: false }
  dialogVisible.value = true
}

function handleEdit(row: Announcement) {
  form.value = { ...row }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!form.value.title) {
    ElMessage.warning('请输入标题')
    return
  }
  submitLoading.value = true
  try {
    if (form.value.id) {
      await updateAnnouncement(form.value.id, form.value)
    } else {
      await createAnnouncement(form.value)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchList()
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row: Announcement) {
  await ElMessageBox.confirm(`确定删除「${row.title}」吗？`, '提示', { type: 'warning' })
  await deleteAnnouncement(row.id)
  ElMessage.success('删除成功')
  fetchList()
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
      <template #toolbar>
        <el-button type="primary" :icon="'Plus'" @click="handleAdd">新增公告</el-button>
      </template>

      <template #type="{ row }">
        <el-tag size="small" :type="typeMap[row.type]?.type">{{ typeMap[row.type]?.label }}</el-tag>
      </template>

      <template #top="{ row }">
        <el-tag v-if="row.top" size="small" type="danger">置顶</el-tag>
        <span v-else>-</span>
      </template>

      <template #status="{ row }">
        <el-tag size="small" :type="row.status === 'published' ? 'success' : 'info'">
          {{ row.status === 'published' ? '已发布' : '草稿' }}
        </el-tag>
      </template>

      <template #operation="{ row }">
        <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
        <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
      </template>
    </ProTable>

    <ProDialog
      v-model="dialogVisible"
      :title="form.id ? '编辑公告' : '新增公告'"
      width="700px"
      :loading="submitLoading"
      @confirm="handleSubmit"
    >
      <el-form label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="类型">
              <el-select v-model="form.type" style="width: 100%">
                <el-option label="系统" value="system" />
                <el-option label="活动" value="activity" />
                <el-option label="通知" value="notice" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="已发布" value="published" />
                <el-option label="草稿" value="draft" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="置顶">
              <el-switch v-model="form.top" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="内容">
          <RichEditor v-model="form.content" :height="300" />
        </el-form-item>
      </el-form>
    </ProDialog>
  </div>
</template>
