<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchForm, { type SearchItem } from '@/components/SearchForm.vue'
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import ProDialog from '@/components/ProDialog.vue'
import RichEditor from '@/components/RichEditor.vue'
import {
  getPromptList,
  createPrompt,
  updatePrompt,
  deletePrompt,
  type PromptTemplate,
} from '@/api/ai'
import { formatDateTime } from '@/utils/format'

const loading = ref(false)
const list = ref<PromptTemplate[]>([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 10, type: '' })

const searchItems: SearchItem[] = [
  {
    prop: 'type',
    label: '类型',
    type: 'select',
    options: [
      { label: '出题', value: 'generate' },
      { label: '解析', value: 'analysis' },
      { label: '导入', value: 'import' },
    ],
  },
]

const columns: ProColumn[] = [
  { prop: 'id', label: 'ID', width: 70 },
  { prop: 'name', label: '模板名称', minWidth: 150 },
  { prop: 'type', label: '类型', width: 90, slot: 'type' },
  { prop: 'status', label: '状态', width: 90, slot: 'status' },
  { prop: 'updatedAt', label: '更新时间', width: 160, formatter: (r) => formatDateTime(r.updatedAt) },
]

async function fetchList() {
  loading.value = true
  try {
    const res = await getPromptList(query)
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
const form = ref<Partial<PromptTemplate>>({
  variables: [],
  status: 'enabled',
})

function handleAdd() {
  form.value = { variables: [], status: 'enabled' }
  dialogVisible.value = true
}

function handleEdit(row: PromptTemplate) {
  form.value = { ...row, variables: row.variables ? [...row.variables] : [] }
  dialogVisible.value = true
}

function addVariable() {
  form.value.variables!.push({ name: '', description: '' })
}

function removeVariable(idx: number) {
  form.value.variables!.splice(idx, 1)
}

async function handleSubmit() {
  if (!form.value.name || !form.value.content) {
    ElMessage.warning('请填写完整')
    return
  }
  submitLoading.value = true
  try {
    if (form.value.id) {
      await updatePrompt(form.value.id, form.value)
    } else {
      await createPrompt(form.value)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchList()
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row: PromptTemplate) {
  await ElMessageBox.confirm(`确定删除「${row.name}」吗？`, '提示', { type: 'warning' })
  await deletePrompt(row.id)
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
        <el-button type="primary" :icon="'Plus'" @click="handleAdd">新增模板</el-button>
      </template>

      <template #type="{ row }">
        <el-tag size="small">{{ row.type }}</el-tag>
      </template>

      <template #status="{ row }">
        <el-tag size="small" :type="row.status === 'enabled' ? 'success' : 'info'">
          {{ row.status === 'enabled' ? '启用' : '禁用' }}
        </el-tag>
      </template>

      <template #operation="{ row }">
        <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
        <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
      </template>
    </ProTable>

    <ProDialog
      v-model="dialogVisible"
      :title="form.id ? '编辑模板' : '新增模板'"
      width="800px"
      :loading="submitLoading"
      @confirm="handleSubmit"
    >
      <el-form label-width="100px">
        <el-form-item label="模板名称">
          <el-input v-model="form.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="出题" value="generate" />
            <el-option label="解析" value="analysis" />
            <el-option label="导入" value="import" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" active-value="enabled" inactive-value="disabled" />
        </el-form-item>
        <el-form-item label="模板内容">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="8"
            placeholder="使用 {{变量名}} 引用变量"
          />
        </el-form-item>
        <el-form-item label="变量定义">
          <div class="var-list">
            <div v-for="(v, idx) in form.variables" :key="idx" class="var-list__item">
              <el-input v-model="v.name" placeholder="变量名" style="width: 150px" />
              <el-input v-model="v.description" placeholder="描述" style="flex: 1" />
              <el-button type="danger" :icon="'Delete'" circle @click="removeVariable(idx)" />
            </div>
            <el-button type="primary" link :icon="'Plus'" @click="addVariable">添加变量</el-button>
          </div>
        </el-form-item>
      </el-form>
    </ProDialog>
  </div>
</template>

<style scoped lang="scss">
.var-list {
  width: 100%;

  &__item {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
    align-items: center;
  }
}
</style>
