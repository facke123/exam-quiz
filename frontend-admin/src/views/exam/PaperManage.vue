<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchForm, { type SearchItem } from '@/components/SearchForm.vue'
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import ProDialog from '@/components/ProDialog.vue'
import {
  getPaperList,
  createPaper,
  updatePaper,
  deletePaper,
  autoGeneratePaper,
  type Paper,
  type AutoPaperRule,
} from '@/api/exam'
import { getAllSubjects } from '@/api/exam'
import { formatDateTime } from '@/utils/format'

const loading = ref(false)
const list = ref<Paper[]>([])
const total = ref(0)
const subjects = ref<{ label: string; value: number }[]>([])

const query = reactive({ page: 1, pageSize: 10, subjectId: undefined as number | undefined, status: '' })

const searchItems: SearchItem[] = [
  { prop: 'subjectId', label: '科目', type: 'select', options: [] },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '草稿', value: 'draft' },
      { label: '已发布', value: 'published' },
    ],
  },
]

const columns: ProColumn[] = [
  { prop: 'id', label: 'ID', width: 70 },
  { prop: 'name', label: '试卷名称', minWidth: 180 },
  { prop: 'subjectName', label: '科目', width: 120 },
  { prop: 'questionCount', label: '题量', width: 80 },
  { prop: 'totalScore', label: '总分', width: 80 },
  { prop: 'totalTime', label: '时长(分)', width: 90 },
  { prop: 'status', label: '状态', width: 90, slot: 'status' },
  { prop: 'createdAt', label: '创建时间', width: 160, formatter: (r) => formatDateTime(r.createdAt) },
]

// 试卷弹窗（手动创建）
const paperDialogVisible = ref(false)
const paperForm = ref<Partial<Paper>>({})
const paperDialogTitle = ref('')

function handleAddPaper() {
  paperForm.value = { status: 'draft', totalTime: 120, totalScore: 100, passScore: 60, questionCount: 0 }
  paperDialogTitle.value = '新增试卷'
  paperDialogVisible.value = true
}

function handleEditPaper(row: Paper) {
  paperForm.value = { ...row }
  paperDialogTitle.value = '编辑试卷'
  paperDialogVisible.value = true
}

async function submitPaper() {
  if (!paperForm.value.name || !paperForm.value.subjectId) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (paperForm.value.id) {
    await updatePaper(paperForm.value.id, paperForm.value)
  } else {
    await createPaper(paperForm.value)
  }
  ElMessage.success('保存成功')
  paperDialogVisible.value = false
  fetchList()
}

async function handleDeletePaper(row: Paper) {
  await ElMessageBox.confirm(`确定删除试卷「${row.name}」吗？`, '提示', { type: 'warning' })
  await deletePaper(row.id)
  ElMessage.success('删除成功')
  fetchList()
}

// 自动组卷弹窗
const autoDialogVisible = ref(false)
const autoForm = ref<AutoPaperRule>({
  subjectId: 0,
  name: '',
  totalTime: 120,
  totalScore: 100,
  passScore: 60,
  rules: [{ type: 'single', difficulty: 'medium', chapterIds: [], count: 10, scorePerQuestion: 2 }],
})
const autoLoading = ref(false)

const typeOptions = [
  { label: '单选题', value: 'single' },
  { label: '多选题', value: 'multiple' },
  { label: '判断题', value: 'judge' },
  { label: '案例分析题', value: 'case' },
  { label: '主观题', value: 'subjective' },
]
const difficultyOptions = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' },
]

function handleAutoPaper() {
  autoDialogVisible.value = true
}

function addRule() {
  autoForm.value.rules.push({ type: 'single', difficulty: 'medium', chapterIds: [], count: 5, scorePerQuestion: 2 })
}

function removeRule(idx: number) {
  autoForm.value.rules.splice(idx, 1)
}

async function submitAuto() {
  if (!autoForm.value.subjectId || !autoForm.value.name) {
    ElMessage.warning('请填写完整信息')
    return
  }
  autoLoading.value = true
  try {
    await autoGeneratePaper(autoForm.value)
    ElMessage.success('自动组卷成功')
    autoDialogVisible.value = false
    fetchList()
  } finally {
    autoLoading.value = false
  }
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getPaperList(query)
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

async function loadSubjects() {
  const res = await getAllSubjects()
  subjects.value = res.data.map((s) => ({ label: s.name, value: s.id }))
  searchItems[0].options = subjects.value
}

onMounted(() => {
  loadSubjects()
  fetchList()
})
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
        <el-button type="primary" :icon="'Plus'" @click="handleAddPaper">手动创建</el-button>
        <el-button type="success" :icon="'MagicStick'" @click="handleAutoPaper">自动组卷</el-button>
      </template>

      <template #status="{ row }">
        <el-tag size="small" :type="row.status === 'published' ? 'success' : 'info'">
          {{ row.status === 'published' ? '已发布' : '草稿' }}
        </el-tag>
      </template>

      <template #operation="{ row }">
        <el-button link type="primary" size="small" @click="handleEditPaper(row)">编辑</el-button>
        <el-button link type="danger" size="small" @click="handleDeletePaper(row)">删除</el-button>
      </template>
    </ProTable>

    <!-- 手动创建/编辑试卷 -->
    <ProDialog v-model="paperDialogVisible" :title="paperDialogTitle" @confirm="submitPaper">
      <el-form label-width="100px">
        <el-form-item label="试卷名称">
          <el-input v-model="paperForm.name" placeholder="请输入试卷名称" />
        </el-form-item>
        <el-form-item label="所属科目">
          <el-select v-model="paperForm.subjectId" placeholder="请选择科目" style="width: 100%">
            <el-option v-for="s in subjects" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="试卷描述">
          <el-input v-model="paperForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="总分">
              <el-input-number v-model="paperForm.totalScore" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="及格分">
              <el-input-number v-model="paperForm.passScore" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="时长(分)">
              <el-input-number v-model="paperForm.totalTime" :min="0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="状态">
          <el-select v-model="paperForm.status">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
          </el-select>
        </el-form-item>
      </el-form>
    </ProDialog>

    <!-- 自动组卷 -->
    <ProDialog
      v-model="autoDialogVisible"
      title="自动组卷配置"
      width="800px"
      :loading="autoLoading"
      @confirm="submitAuto"
    >
      <el-form label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="试卷名称">
              <el-input v-model="autoForm.name" placeholder="请输入试卷名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属科目">
              <el-select v-model="autoForm.subjectId" placeholder="请选择" style="width: 100%">
                <el-option v-for="s in subjects" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="总分">
              <el-input-number v-model="autoForm.totalScore" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="及格分">
              <el-input-number v-model="autoForm.passScore" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="时长(分)">
              <el-input-number v-model="autoForm.totalTime" :min="0" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider>组卷规则</el-divider>
        <div v-for="(rule, idx) in autoForm.rules" :key="idx" class="auto-rule">
          <el-row :gutter="8" align="middle">
            <el-col :span="5">
              <el-select v-model="rule.type" placeholder="题型">
                <el-option v-for="o in typeOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-col>
            <el-col :span="5">
              <el-select v-model="rule.difficulty" placeholder="难度">
                <el-option v-for="o in difficultyOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-input-number v-model="rule.count" :min="1" placeholder="数量" />
            </el-col>
            <el-col :span="4">
              <el-input-number v-model="rule.scorePerQuestion" :min="0" placeholder="单题分值" />
            </el-col>
            <el-col :span="4">
              <el-button type="danger" :icon="'Delete'" circle @click="removeRule(idx)" />
            </el-col>
          </el-row>
        </div>
        <el-button type="primary" link :icon="'Plus'" @click="addRule">添加规则</el-button>
      </el-form>
    </ProDialog>
  </div>
</template>

<style scoped lang="scss">
.auto-rule {
  margin-bottom: 12px;
}
</style>
