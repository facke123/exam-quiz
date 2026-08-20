<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchForm, { type SearchItem } from '@/components/SearchForm.vue'
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import ProDialog from '@/components/ProDialog.vue'
import QuestionEditor, { type QuestionFormData } from '@/components/QuestionEditor.vue'
import {
  getQuestionList,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  batchDeleteQuestions,
  updateQuestionStatus,
  exportQuestions,
  type Question,
  type QuestionQuery,
} from '@/api/question'
import { getAllSubjects } from '@/api/exam'
import { getChapterTree } from '@/api/exam'
import { formatDateTime, formatPercent } from '@/utils/format'
import { downloadBlob } from '@/utils/export'

const loading = ref(false)
const submitLoading = ref(false)
const list = ref<Question[]>([])
const total = ref(0)
const selectedRows = ref<Question[]>([])

const query = reactive<QuestionQuery>({
  page: 1,
  pageSize: 10,
  keyword: '',
  subjectId: undefined,
  chapterId: undefined,
  type: undefined,
  difficulty: undefined,
  status: undefined,
})

const subjects = ref<{ label: string; value: number }[]>([])
const chapterTree = ref<any[]>([])

const searchItems: SearchItem[] = [
  { prop: 'keyword', label: '关键词', type: 'input', placeholder: '题干关键词' },
  {
    prop: 'subjectId',
    label: '科目',
    type: 'select',
    options: [],
    props: { onChange: (v: number) => loadChapters(v) },
  },
  {
    prop: 'type',
    label: '题型',
    type: 'select',
    options: [
      { label: '单选题', value: 'single' },
      { label: '多选题', value: 'multiple' },
      { label: '判断题', value: 'judge' },
      { label: '案例分析题', value: 'case' },
      { label: '主观题', value: 'subjective' },
    ],
  },
  {
    prop: 'difficulty',
    label: '难度',
    type: 'select',
    options: [
      { label: '简单', value: 'easy' },
      { label: '中等', value: 'medium' },
      { label: '困难', value: 'hard' },
    ],
  },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '草稿', value: 'draft' },
      { label: '已发布', value: 'published' },
      { label: '已下架', value: 'offline' },
    ],
  },
]

const typeMap: Record<string, string> = {
  single: '单选题',
  multiple: '多选题',
  judge: '判断题',
  case: '案例分析题',
  subjective: '主观题',
}
const difficultyMap: Record<string, { label: string; type: string }> = {
  easy: { label: '简单', type: 'success' },
  medium: { label: '中等', type: 'warning' },
  hard: { label: '困难', type: 'danger' },
}
const statusMap: Record<string, { label: string; type: string }> = {
  draft: { label: '草稿', type: 'info' },
  published: { label: '已发布', type: 'success' },
  offline: { label: '已下架', type: 'danger' },
}
const sourceMap: Record<string, string> = {
  manual: '手动录入',
  import: '导入',
  ai: 'AI生成',
}

const columns: ProColumn[] = [
  { prop: 'id', label: 'ID', width: 70 },
  { prop: 'title', label: '题干预览', minWidth: 240, slot: 'title' },
  { prop: 'type', label: '题型', width: 100, slot: 'type' },
  { prop: 'difficulty', label: '难度', width: 80, slot: 'difficulty' },
  { prop: 'correctRate', label: '正确率', width: 90, slot: 'correctRate' },
  { prop: 'source', label: '来源', width: 90, formatter: (r) => sourceMap[r.source] || r.source },
  { prop: 'status', label: '状态', width: 90, slot: 'status' },
  { prop: 'createdAt', label: '创建时间', width: 160, formatter: (r) => formatDateTime(r.createdAt) },
]

// 弹窗
const dialogVisible = ref(false)
const editorRef = ref()
const currentForm = ref<QuestionFormData>({
  subjectId: undefined,
  chapterId: undefined,
  type: 'single',
  difficulty: 'easy',
  title: '',
  content: '',
  options: [],
  answer: '',
  analysis: '',
  status: 'draft',
})

async function fetchList() {
  loading.value = true
  try {
    const res = await getQuestionList(query)
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

async function loadSubjects() {
  const res = await getAllSubjects()
  subjects.value = res.data.map((s) => ({ label: s.name, value: s.id }))
  const subjectItem = searchItems.find((i) => i.prop === 'subjectId')
  if (subjectItem) subjectItem.options = subjects.value
}

async function loadChapters(subjectId: number) {
  if (!subjectId) {
    chapterTree.value = []
    return
  }
  const res = await getChapterTree(subjectId)
  chapterTree.value = res.data
}

function handleSearch(form: Record<string, any>) {
  Object.assign(query, form)
  query.page = 1
  fetchList()
}

function handleReset() {
  Object.assign(query, {
    page: 1,
    pageSize: 10,
    keyword: '',
    subjectId: undefined,
    chapterId: undefined,
    type: undefined,
    difficulty: undefined,
    status: undefined,
  })
  fetchList()
}

function handleAdd() {
  currentForm.value = {
    subjectId: undefined,
    chapterId: undefined,
    type: 'single',
    difficulty: 'easy',
    title: '',
    content: '',
    options: [],
    answer: '',
    analysis: '',
    status: 'draft',
  }
  dialogVisible.value = true
}

function handleEdit(row: Question) {
  currentForm.value = {
    id: row.id,
    subjectId: row.subjectId,
    chapterId: row.chapterId,
    type: row.type,
    difficulty: row.difficulty,
    title: row.title,
    content: row.content,
    options: row.options,
    answer: row.answer,
    analysis: row.analysis,
    status: row.status,
  }
  loadChapters(row.subjectId)
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await editorRef.value?.validate()
  if (!valid) {
    ElMessage.warning('请完善表单（含正确答案）')
    return
  }
  submitLoading.value = true
  try {
    if (currentForm.value.id) {
      await updateQuestion(currentForm.value.id, currentForm.value)
      ElMessage.success('修改成功')
    } else {
      await createQuestion(currentForm.value)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchList()
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row: Question) {
  await ElMessageBox.confirm('确定删除该题目吗？', '提示', { type: 'warning' })
  await deleteQuestion(row.id)
  ElMessage.success('删除成功')
  fetchList()
}

async function handleBatchDelete() {
  if (!selectedRows.value.length) {
    ElMessage.warning('请选择要删除的题目')
    return
  }
  await ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 道题目吗？`, '提示', {
    type: 'warning',
  })
  await batchDeleteQuestions(selectedRows.value.map((r) => r.id))
  ElMessage.success('批量删除成功')
  fetchList()
}

async function handleBatchStatus(status: 'published' | 'offline') {
  if (!selectedRows.value.length) {
    ElMessage.warning('请选择题目')
    return
  }
  await updateQuestionStatus(
    selectedRows.value.map((r) => r.id),
    status,
  )
  ElMessage.success(status === 'published' ? '已发布' : '已下架')
  fetchList()
}

async function handleExport() {
  const res = await exportQuestions(query)
  downloadBlob(res.data as unknown as Blob, '题目列表.xls')
}

function handleSelectionChange(rows: Question[]) {
  selectedRows.value = rows
}

onMounted(() => {
  loadSubjects()
  fetchList()
})
</script>

<template>
  <div class="page-container">
    <SearchForm
      :items="searchItems"
      :model-value="query"
      :loading="loading"
      @search="handleSearch"
      @reset="handleReset"
    />

    <ProTable
      :columns="columns"
      :data="list"
      :loading="loading"
      :page="query.page"
      :page-size="query.pageSize"
      :total="total"
      selection
      @update:page="(p) => (query.page = p)"
      @update:page-size="(s) => (query.pageSize = s)"
      @selection-change="handleSelectionChange"
    >
      <template #toolbar>
        <el-button type="primary" :icon="'Plus'" @click="handleAdd">新增题目</el-button>
        <el-button :icon="'Download'" @click="handleExport">导出</el-button>
        <el-button type="success" :icon="'Promotion'" @click="handleBatchStatus('published')">
          批量发布
        </el-button>
        <el-button type="warning" :icon="'SoldOut'" @click="handleBatchStatus('offline')">
          批量下架
        </el-button>
        <el-button type="danger" :icon="'Delete'" @click="handleBatchDelete">批量删除</el-button>
      </template>

      <template #title="{ row }">
        <el-tooltip :content="row.title" placement="top">
          <span class="text-ellipsis">{{ row.title }}</span>
        </el-tooltip>
      </template>

      <template #type="{ row }">
        <el-tag size="small">{{ typeMap[row.type] }}</el-tag>
      </template>

      <template #difficulty="{ row }">
        <el-tag size="small" :type="difficultyMap[row.difficulty]?.type">
          {{ difficultyMap[row.difficulty]?.label }}
        </el-tag>
      </template>

      <template #correctRate="{ row }">
        {{ row.correctRate != null ? formatPercent(row.correctRate) : '-' }}
      </template>

      <template #status="{ row }">
        <el-tag size="small" :type="statusMap[row.status]?.type">
          {{ statusMap[row.status]?.label }}
        </el-tag>
      </template>

      <template #operation="{ row }">
        <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
        <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
      </template>
    </ProTable>

    <ProDialog
      v-model="dialogVisible"
      :title="currentForm.id ? '编辑题目' : '新增题目'"
      width="900px"
      :loading="submitLoading"
      @confirm="handleSubmit"
    >
      <QuestionEditor
        ref="editorRef"
        v-model="currentForm"
        :subjects="subjects"
        :chapter-tree="chapterTree"
      />
    </ProDialog>
  </div>
</template>
