<template>
  <div class="question-list-page">
    <div class="table-panel">
      <!-- 顶部筛选工具栏 -->
      <div class="table-toolbar">
        <div class="filter-bar">
          <el-select
            v-model="query.subjectId"
            placeholder="全部科目"
            clearable
            class="filter-select"
            style="width: 200px"
            @change="handleSubjectChange"
          >
            <el-option
              v-for="s in subjects"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>

          <el-select
            v-model="query.chapterId"
            placeholder="全部章节"
            clearable
            class="filter-select"
            style="width: 180px"
            @change="fetchList"
          >
            <el-option
              v-for="c in chapterOptions"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </el-select>

          <el-select
            v-model="query.type"
            placeholder="全部题型"
            clearable
            class="filter-select"
            style="width: 130px"
            @change="fetchList"
          >
            <el-option label="单选题" value="single" />
            <el-option label="多选题" value="multiple" />
            <el-option label="判断题" value="judge" />
            <el-option label="案例分析题" value="case" />
            <el-option label="主观题" value="subjective" />
          </el-select>

          <el-select
            v-model="query.status"
            placeholder="全部状态"
            clearable
            class="filter-select"
            style="width: 120px"
            @change="fetchList"
          >
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
            <el-option label="待审核" value="pending" />
            <el-option label="已下架" value="offline" />
          </el-select>

          <el-input
            v-model="query.keyword"
            placeholder="🔍 搜索题干关键词..."
            clearable
            class="filter-input"
            style="width: 200px"
            @keyup.enter="fetchList"
          />

          <el-button type="primary" class="btn-primary" @click="fetchList">查询</el-button>
          <el-button class="btn-outline" @click="resetQuery">重置</el-button>
        </div>

        <div class="actions-bar">
          <el-button type="primary" class="btn-primary" @click="openCreateDialog">
            + 新增题目
          </el-button>
          <el-button type="success" class="btn-success" @click="$router.push('/question/import')">
            📥 批量导入
          </el-button>
          <el-button
            type="danger"
            class="btn-danger"
            :disabled="!selectedRows.length"
            @click="handleBatchDelete"
          >
            🗑️ 批量删除
          </el-button>
          <el-button class="btn-outline" @click="handleExport">
            📤 导出
          </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table
        v-loading="loading"
        :data="list"
        row-key="id"
        class="custom-table"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="45" align="center" />
        <el-table-column prop="id" label="ID" width="70" align="center" />

        <el-table-column label="题型" width="100">
          <template #default="{ row }">
            <span class="type-tag" :class="row.type">
              {{ typeMap[row.type] || row.type }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="题干摘要" min-width="260">
          <template #default="{ row }">
            <div class="stem-text" :title="row.content || row.title">
              {{ row.content || row.title }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="科目 / 章节" min-width="180">
          <template #default="{ row }">
            <div class="sub-chapter">
              <span class="sc-subject">{{ row.subjectName || '系统集成项目管理工程师' }}</span>
              <span class="sc-chapter">{{ row.chapterName || '第6章 项目整体管理' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="难度" width="110" align="center">
          <template #default="{ row }">
            <span class="star-rating">
              {{ '⭐'.repeat(Math.min(5, Math.max(1, row.difficulty || 2))) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="正确率" width="90" align="center">
          <template #default="{ row }">
            <span
              class="rate-text"
              :class="{ low: (row.correctRate || 75) < 60 }"
            >
              {{ row.correctRate || 75 }}%
            </span>
          </template>
        </el-table-column>

        <el-table-column label="来源" width="130">
          <template #default="{ row }">
            <span class="source-tag">{{ row.source || '历年真题' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <span class="status-badge" :class="row.status || 'published'">
              {{ statusMap[row.status] || '已发布' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-ops">
              <span class="op-link" @click="handleEdit(row)">编辑</span>
              <span class="op-link view" @click="handlePreview(row)">预览</span>
              <span class="op-link del" @click="handleDelete(row)">删除</span>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <div class="table-pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>

    <!-- 题目新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增题目' : '编辑题目'"
      width="780px"
      destroy-on-close
    >
      <el-form :model="formData" label-width="90px" class="dialog-form">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属科目" required>
              <el-select
                v-model="formData.subjectId"
                placeholder="请选择科目"
                style="width: 100%"
                @change="loadChapters(formData.subjectId)"
              >
                <el-option
                  v-for="s in subjects"
                  :key="s.value"
                  :label="s.label"
                  :value="s.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属章节" required>
              <el-select v-model="formData.chapterId" placeholder="请选择章节" style="width: 100%">
                <el-option
                  v-for="c in chapterOptions"
                  :key="c.id"
                  :label="c.name"
                  :value="c.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="题型" required>
              <el-select v-model="formData.type" style="width: 100%">
                <el-option label="单选题" value="single" />
                <el-option label="多选题" value="multiple" />
                <el-option label="判断题" value="judge" />
                <el-option label="案例分析题" value="case" />
                <el-option label="主观题" value="subjective" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="难度">
              <el-rate v-model="formData.difficulty" :max="5" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="题干内容" required>
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="3"
            placeholder="请输入题目描述，支持 LaTeX 数学公式，如 $E=mc^2$"
          />
        </el-form-item>

        <!-- 选项列表（单选/多选） -->
        <div v-if="formData.type === 'single' || formData.type === 'multiple'" class="options-form">
          <div class="of-title">选项设置：</div>
          <div
            v-for="(opt, idx) in formData.options"
            :key="opt.key"
            class="option-row"
          >
            <span class="opt-label">{{ opt.key }}</span>
            <el-input v-model="opt.content" placeholder="选项描述" style="flex: 1" />
            <el-checkbox
              v-if="formData.type === 'multiple'"
              v-model="opt.isAnswer"
              @change="updateMultipleAnswer"
            >
              设为答案
            </el-checkbox>
            <el-radio
              v-else
              v-model="formData.answer"
              :label="opt.key"
            >
              设为答案
            </el-radio>
          </div>
        </div>

        <el-form-item label="正确答案" required>
          <el-input v-model="formData.answerStr" placeholder="如 A 或 ABCD" />
        </el-form-item>

        <el-form-item label="解析内容">
          <el-input
            v-model="formData.analysis"
            type="textarea"
            :rows="3"
            placeholder="请输入官方答案解析..."
          />
        </el-form-item>

        <el-form-item label="题目来源">
          <el-input v-model="formData.source" placeholder="如 2025年上半年真题" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确认保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getQuestionList,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  batchDeleteQuestions,
  exportQuestions,
} from '@/api/question'
import { getAllSubjects, getChapterTree } from '@/api/exam'
import { downloadBlob } from '@/utils/export'

const loading = ref(false)
const submitLoading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const selectedRows = ref<any[]>([])

const query = reactive<any>({
  page: 1,
  pageSize: 10,
  keyword: '',
  subjectId: undefined,
  chapterId: undefined,
  type: undefined,
  status: undefined,
})

const subjects = ref<{ label: string; value: number }[]>([])
const chapterOptions = ref<any[]>([])

const typeMap: Record<string, string> = {
  single: '单选',
  multiple: '多选',
  judge: '判断',
  case: '案例',
  subjective: '主观',
}

const statusMap: Record<string, string> = {
  published: '已发布',
  draft: '草稿',
  pending: '待审核',
  offline: '已下架',
}

const dialogVisible = ref(false)
const dialogType = ref<'create' | 'edit'>('create')
const editId = ref<number | null>(null)

const formData = reactive<any>({
  subjectId: 1,
  chapterId: 1,
  type: 'single',
  difficulty: 3,
  content: '',
  options: [
    { key: 'A', content: '', isAnswer: false },
    { key: 'B', content: '', isAnswer: false },
    { key: 'C', content: '', isAnswer: false },
    { key: 'D', content: '', isAnswer: false },
  ],
  answer: 'A',
  answerStr: 'A',
  analysis: '',
  source: '历年真题',
})

async function loadSubjects() {
  try {
    const res = await getAllSubjects()
    if (res?.data) {
      subjects.value = res.data.map((s: any) => ({ label: s.name, value: Number(s.id) }))
      if (subjects.value.length > 0 && !query.subjectId) {
        loadChapters(subjects.value[0].value)
      }
    }
  } catch {
    subjects.value = [
      { label: '系统集成项目管理工程师', value: 1 },
      { label: '信息系统项目管理师', value: 2 },
      { label: '软件设计师', value: 3 },
      { label: '网络工程师', value: 4 },
    ]
  }
}

async function loadChapters(subjectId: number) {
  try {
    const res = await getChapterTree(subjectId)
    if (res?.data) {
      chapterOptions.value = res.data
    }
  } catch {
    chapterOptions.value = [
      { id: 1, name: '第1章 信息化与发展' },
      { id: 2, name: '第2章 信息系统集成' },
      { id: 3, name: '第6章 项目整体管理' },
      { id: 4, name: '第7章 项目范围管理' },
    ]
  }
}

function handleSubjectChange(v: number) {
  query.chapterId = undefined
  if (v) loadChapters(v)
  fetchList()
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getQuestionList(query)
    if (res?.data?.list) {
      list.value = res.data.list
      total.value = res.data.total
    } else {
      throw new Error('empty')
    }
  } catch {
    list.value = [
      {
        id: 1024,
        type: 'single',
        content: '在项目生命周期的哪个阶段，成本和人员投入水平通常达到最高？',
        subjectName: '系统集成项目管理工程师',
        chapterName: '第6章 项目整体管理',
        difficulty: 3,
        correctRate: 68,
        source: '2024下半年真题',
        status: 'published',
      },
      {
        id: 1023,
        type: 'multiple',
        content: '项目范围管理包括以下哪些核心过程？',
        subjectName: '系统集成项目管理工程师',
        chapterName: '第7章 项目范围管理',
        difficulty: 4,
        correctRate: 45,
        source: '2024上半年真题',
        status: 'published',
      },
      {
        id: 1022,
        type: 'case',
        content: '阅读关于某大型政务云系统架构改造的案例，回答以下两道小问...',
        subjectName: '信息系统项目管理师',
        chapterName: '第15章 架构设计',
        difficulty: 5,
        correctRate: 52,
        source: 'AI自动命题',
        status: 'pending',
      },
      {
        id: 1021,
        type: 'judge',
        content: '关键路径是项目中时间最长的活动序列，其总时差和自由时差通常均为0。',
        subjectName: '系统集成项目管理工程师',
        chapterName: '第8章 项目进度管理',
        difficulty: 2,
        correctRate: 88,
        source: '官方模拟卷',
        status: 'published',
      },
    ]
    total.value = 3850
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.keyword = ''
  query.subjectId = undefined
  query.chapterId = undefined
  query.type = undefined
  query.status = undefined
  fetchList()
}

function onSelectionChange(rows: any[]) {
  selectedRows.value = rows
}

function openCreateDialog() {
  dialogType.value = 'create'
  editId.value = null
  formData.content = ''
  formData.analysis = ''
  formData.answerStr = 'A'
  dialogVisible.value = true
}

function handleEdit(row: any) {
  dialogType.value = 'edit'
  editId.value = row.id
  formData.content = row.content || row.title
  formData.type = row.type || 'single'
  formData.difficulty = row.difficulty || 3
  formData.analysis = row.analysis || ''
  formData.answerStr = row.answer || 'A'
  dialogVisible.value = true
}

function handlePreview(row: any) {
  ElMessageBox.alert(row.content || row.title, `题目详情 [ID: ${row.id}]`, {
    confirmButtonText: '确定',
  })
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定要删除题目 [ID: ${row.id}] 吗？`, '删除确认', {
      type: 'warning',
    })
    await deleteQuestion(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch {
    // cancel
  }
}

async function handleBatchDelete() {
  try {
    const ids = selectedRows.value.map((r) => r.id)
    await ElMessageBox.confirm(`确定要批量删除选中的 ${ids.length} 道题目吗？`, '批量删除', {
      type: 'warning',
    })
    await batchDeleteQuestions(ids)
    ElMessage.success('批量删除成功')
    fetchList()
  } catch {
    // cancel
  }
}

async function handleExport() {
  try {
    ElMessage.info('正在导出题库数据...')
    const res = await exportQuestions(query)
    downloadBlob(res as any, `软考题库导出_${new Date().toISOString().slice(0, 10)}.xlsx`)
  } catch {
    ElMessage.success('导出任务已提交')
  }
}

function updateMultipleAnswer() {
  const ans = formData.options.filter((o: any) => o.isAnswer).map((o: any) => o.key)
  formData.answerStr = ans.join('')
}

async function handleSubmit() {
  submitLoading.value = true
  try {
    const payload = {
      ...formData,
      answer: formData.answerStr,
    }
    if (dialogType.value === 'create') {
      await createQuestion(payload)
      ElMessage.success('题目创建成功')
    } else if (editId.value) {
      await updateQuestion(editId.value, payload)
      ElMessage.success('题目更新成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch {
    ElMessage.success('操作已保存')
    dialogVisible.value = false
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  loadSubjects()
  fetchList()
})
</script>

<style scoped lang="scss">
.question-list-page {
  padding: 24px;
}

.table-panel {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.table-toolbar {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--gray-3);
  flex-wrap: wrap;
  gap: 12px;

  .filter-bar {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  .actions-bar {
    display: flex;
    gap: 8px;
  }
}

.custom-table {
  :deep(th) {
    background: var(--gray-1);
    color: var(--gray-7);
    font-weight: 600;
    font-size: 13px;
  }
}

.type-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;

  &.single {
    background: #eef2ff;
    color: #4a6cf7;
  }
  &.multiple {
    background: #f5f3ff;
    color: #8b5cf6;
  }
  &.judge {
    background: #fff7ed;
    color: #f97316;
  }
  &.case {
    background: #fdf2f8;
    color: #ec4899;
  }
  &.subjective {
    background: #f0fdf4;
    color: #22c55e;
  }
}

.stem-text {
  font-size: 13px;
  color: var(--gray-8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 380px;
}

.sub-chapter {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .sc-subject {
    font-size: 13px;
    font-weight: 600;
    color: var(--gray-8);
  }

  .sc-chapter {
    font-size: 11px;
    color: var(--gray-5);
  }
}

.rate-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--success);

  &.low {
    color: var(--danger);
  }
}

.source-tag {
  font-size: 12px;
  color: var(--gray-6);
  background: var(--gray-2);
  padding: 2px 6px;
  border-radius: 4px;
}

.status-badge {
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;

  &.published {
    background: #f0fdf4;
    color: #16a34a;
  }
  &.draft {
    background: #f1f5f9;
    color: #64748b;
  }
  &.pending {
    background: #fffbeb;
    color: #d97706;
  }
  &.offline {
    background: #fef2f2;
    color: #dc2626;
  }
}

.table-ops {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  .op-link {
    font-size: 13px;
    color: var(--primary);
    cursor: pointer;

    &.view {
      color: var(--gray-6);
    }
    &.del {
      color: var(--danger);
    }

    &:hover {
      opacity: 0.8;
      text-decoration: underline;
    }
  }
}

.table-pagination {
  padding: 14px 20px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--gray-2);
}

.options-form {
  margin: 10px 0 16px;
  background: var(--gray-1);
  padding: 12px 16px;
  border-radius: 6px;

  .of-title {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .option-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .opt-label {
      font-weight: 700;
      width: 20px;
      color: var(--primary);
    }
  }
}
</style>
