<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchForm, { type SearchItem } from '@/components/SearchForm.vue'
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import ProDialog from '@/components/ProDialog.vue'
import {
  getPromptList,
  createPrompt,
  updatePrompt,
  deletePrompt,
  resetPrompts,
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
    label: '模板类型',
    type: 'select',
    options: [
      { label: '试题与解析一体化生成', value: 'generate_question' },
      { label: '独立解析生成', value: 'generate_analysis' },
      { label: '文档/试卷导入提取', value: 'import' },
    ],
  },
]

const typeMap: Record<string, { label: string; tagType: string }> = {
  generate_question: { label: '试题与解析生成', tagType: 'primary' },
  generate: { label: '试题与解析生成', tagType: 'primary' },
  generate_analysis: { label: '独立解析生成', tagType: 'warning' },
  analysis: { label: '独立解析生成', tagType: 'warning' },
  import: { label: '文档导入提取', tagType: 'success' },
  import_parse: { label: '文档导入提取', tagType: 'success' },
}

const columns: ProColumn[] = [
  { prop: 'id', label: 'ID', width: 70 },
  { prop: 'name', label: '模板名称', minWidth: 200 },
  { prop: 'type', label: '类型', width: 150, slot: 'type' },
  { prop: 'variables', label: '变量定义', minWidth: 200, slot: 'variables' },
  { prop: 'status', label: '状态', width: 90, slot: 'status' },
  { prop: 'updatedAt', label: '更新时间', width: 170, formatter: (r) => formatDateTime(r.updatedAt) },
]

async function fetchList() {
  loading.value = true
  try {
    const res = await getPromptList(query)
    list.value = res.data?.list || []
    total.value = res.data?.total !== undefined ? res.data.total : list.value.length
  } catch (err: any) {
    ElMessage.error(err.message || '获取 Prompt 模板失败')
    list.value = []
    total.value = 0
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
const form = ref<{
  id?: number
  name: string
  type: string
  content: string
  variables: Array<{ name: string; description: string }>
  status: string
}>({
  name: '',
  type: 'generate_question',
  content: '',
  variables: [],
  status: 'enabled',
})

const quickVars = [
  { name: 'subject', label: '{{subject}} (科目)' },
  { name: 'chapter', label: '{{chapter}} (章节)' },
  { name: 'knowledge_point', label: '{{knowledge_point}} (知识点)' },
  { name: 'difficulty', label: '{{difficulty}} (难度)' },
  { name: 'type', label: '{{type}} (题型)' },
  { name: 'content', label: '{{content}} (试题/文档内容)' },
  { name: 'answer', label: '{{answer}} (正确答案)' },
]

function insertVar(varCode: string) {
  form.value.content = (form.value.content || '') + ` {{${varCode}}} `
  if (!form.value.variables.some((v) => v.name === varCode)) {
    const matched = quickVars.find((q) => q.name === varCode)
    form.value.variables.push({
      name: varCode,
      description: matched ? matched.label.replace(`{{${varCode}}} `, '').replace(/[()]/g, '') : '',
    })
  }
}

function handleAdd() {
  form.value = {
    name: '',
    type: 'generate_question',
    content: `你是一位国家软考资深命题专家与官方教材主编。请根据以下考点要求，生成一道标准单项选择题，并同步输出高水平的名师解题解析。

【命题考点要求】
考试科目: {{subject}}
所属章节: {{chapter}}
考查知识点: {{knowledge_point}}
难度等级: {{difficulty}} (1-5星)

【出题与解析规范】
1. 题干严谨清晰、情境贴合实战，完全符合国家软考命题标准。
2. 包含 A、B、C、D 四个互斥且具辨析度的选项。
3. 明确指定唯一权威正确答案。
4. 深度解析必须涵盖：
   - 【考点定位】：归纳考查的理论依据与教材核心知识域；
   - 【答案剖析】：详述正确选项的推导逻辑；
   - 【选项辨析】：逐一分析错误选项的陷阱与混淆点；
   - 【名师点拨】：提供考前速记口诀或易错防坑指南。

【输出格式】
必须严格输出纯 JSON 格式：
{
  "content": "题干内容描述",
  "options": [
    {"key": "A", "label": "A", "content": "选项A内容"},
    {"key": "B", "label": "B", "content": "选项B内容"},
    {"key": "C", "label": "C", "content": "选项C内容"},
    {"key": "D", "label": "D", "content": "选项D内容"}
  ],
  "answer": "A",
  "analysis": "【考点定位】...\\n【答案剖析】...\\n【选项辨析】...\\n【名师点拨】..."
}`,
    variables: [
      { name: 'subject', description: '考试科目名称' },
      { name: 'chapter', description: '指定考点章节' },
      { name: 'knowledge_point', description: '考查核心知识点' },
      { name: 'difficulty', description: '难度等级 (1-5)' },
    ],
    status: 'enabled',
  }
  dialogVisible.value = true
}

function handleEdit(row: PromptTemplate) {
  let vars: Array<{ name: string; description: string }> = []
  if (Array.isArray(row.variables)) {
    vars = row.variables.map((v: any) =>
      typeof v === 'string' ? { name: v, description: '' } : { name: v.name || '', description: v.description || '' }
    )
  }
  form.value = {
    id: row.id,
    name: row.name,
    type: row.type || 'generate_question',
    content: row.content,
    variables: vars,
    status: row.status === 'enabled' || (row.status as any) === 1 || row.status === '1' ? 'enabled' : 'disabled',
  }
  dialogVisible.value = true
}

function addVariable() {
  form.value.variables.push({ name: '', description: '' })
}

function removeVariable(idx: number) {
  form.value.variables.splice(idx, 1)
}

async function handleSubmit() {
  if (!form.value.name || !form.value.content) {
    ElMessage.warning('请填写模板名称与Prompt内容')
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
  await ElMessageBox.confirm(`确定删除模板「${row.name}」吗？`, '提示', { type: 'warning' })
  await deletePrompt(row.id)
  ElMessage.success('删除成功')
  fetchList()
}

async function handleResetDefault() {
  await ElMessageBox.confirm(
    '确定将全部 Prompt 重置为官方推荐的「单选题与名师解析一体化综合标准模板」吗？现有自定义修改将被覆盖。',
    '重置确认',
    { type: 'warning' }
  )
  loading.value = true
  try {
    await resetPrompts()
    ElMessage.success('已成功重置为标准一体化模板')
    fetchList()
  } finally {
    loading.value = false
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
      <template #toolbar>
        <el-button type="primary" :icon="'Plus'" @click="handleAdd">新增模板</el-button>
        <el-button type="warning" plain :icon="'Refresh'" @click="handleResetDefault">
          恢复默认一体化综合模板
        </el-button>
      </template>

      <template #type="{ row }">
        <el-tag size="small" :type="typeMap[row.type]?.tagType || 'info'">
          {{ typeMap[row.type]?.label || row.type }}
        </el-tag>
      </template>

      <template #variables="{ row }">
        <div v-if="Array.isArray(row.variables) && row.variables.length > 0" class="var-tag-list">
          <el-tag
            v-for="(v, idx) in row.variables"
            :key="idx"
            size="small"
            type="info"
            effect="plain"
            style="margin-right: 4px; margin-bottom: 2px"
          >
            {{ typeof v === 'string' ? v : v.name }}
          </el-tag>
        </div>
        <span v-else style="color: var(--el-text-color-secondary)">无变量</span>
      </template>

      <template #status="{ row }">
        <el-tag
          size="small"
          :type="row.status === 'enabled' || row.status === 1 || row.status === '1' ? 'success' : 'info'"
        >
          {{ row.status === 'enabled' || row.status === 1 || row.status === '1' ? '启用' : '禁用' }}
        </el-tag>
      </template>

      <template #operation="{ row }">
        <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
        <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
      </template>
    </ProTable>

    <ProDialog
      v-model="dialogVisible"
      :title="form.id ? '编辑 Prompt 模板' : '新增 Prompt 模板'"
      width="850px"
      :loading="submitLoading"
      @confirm="handleSubmit"
    >
      <el-form label-width="100px">
        <el-form-item label="模板名称" required>
          <el-input v-model="form.name" placeholder="如：单选题与名师深度解析生成（综合标准模板）" />
        </el-form-item>
        <el-form-item label="模板类型" required>
          <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="试题与解析一体化生成" value="generate_question" />
            <el-option label="独立题目解析生成" value="generate_analysis" />
            <el-option label="文档/试卷文本结构化提取" value="import" />
          </el-select>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="form.status" active-value="enabled" inactive-value="disabled" />
        </el-form-item>

        <el-form-item label="快捷变量">
          <div class="quick-var-box">
            <span style="font-size: 12px; color: var(--el-text-color-secondary); margin-right: 8px">
              点击快速插入：
            </span>
            <el-tag
              v-for="qv in quickVars"
              :key="qv.name"
              size="small"
              class="quick-var-tag"
              @click="insertVar(qv.name)"
            >
              + {{ qv.label }}
            </el-tag>
          </div>
        </el-form-item>

        <el-form-item label="Prompt内容" required>
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="12"
            placeholder="支持使用 {{变量名}} 进行动态插值替换..."
            style="font-family: Consolas, Monaco, monospace; font-size: 13px"
          />
        </el-form-item>

        <el-form-item label="变量定义">
          <div class="var-list">
            <div v-for="(v, idx) in form.variables" :key="idx" class="var-list__item">
              <el-input v-model="v.name" placeholder="变量标识(如 subject)" style="width: 180px" />
              <el-input v-model="v.description" placeholder="变量描述(如 考试科目名称)" style="flex: 1" />
              <el-button type="danger" :icon="'Delete'" circle @click="removeVariable(idx)" />
            </div>
            <el-button type="primary" link :icon="'Plus'" @click="addVariable">添加新变量</el-button>
          </div>
        </el-form-item>
      </el-form>
    </ProDialog>
  </div>
</template>

<style scoped lang="scss">
.quick-var-box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.quick-var-tag {
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    transform: scale(1.05);
    background-color: var(--el-color-primary-light-8);
  }
}

.var-list {
  width: 100%;

  &__item {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
    align-items: center;
  }
}

.var-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
