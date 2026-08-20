<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  generateQuestions,
  getAIQuestionList,
  approveAIQuestion,
  rejectAIQuestion,
  batchApproveAIQuestions,
  getAIQuota,
  type AIQuestion,
  type AIGenerateParams,
  type AIQuota,
} from '@/api/ai'
import { getAllSubjects, getChapterTree } from '@/api/exam'
import { formatPercent, formatDateTime } from '@/utils/format'

const loading = ref(false)
const generateLoading = ref(false)
const list = ref<AIQuestion[]>([])
const total = ref(0)
const subjects = ref<{ label: string; value: number }[]>([])
const chapterTree = ref<any[]>([])
const quota = ref<AIQuota>({ total: 0, used: 0, remaining: 0, resetAt: '' })

const generateForm = reactive<AIGenerateParams>({
  subjectId: 0,
  chapterId: undefined,
  knowledgePointIds: [],
  type: 'single',
  count: 10,
  difficulty: 'medium',
  model: 'gpt-4',
})

const query = reactive({ page: 1, pageSize: 10, status: 'pending', subjectId: undefined as number | undefined })

const typeMap: Record<string, string> = {
  single: '单选题',
  multiple: '多选题',
  judge: '判断题',
  case: '案例分析题',
  subjective: '主观题',
}

const modelOptions = [
  { label: 'GPT-4', value: 'gpt-4' },
  { label: 'GPT-3.5', value: 'gpt-3.5' },
  { label: 'Claude-3', value: 'claude-3' },
  { label: '通义千问', value: 'qwen' },
]

const quotaPercent = computed(() => {
  if (!quota.value.total) return 0
  return Math.round((quota.value.used / quota.value.total) * 100)
})

async function loadSubjects() {
  const res = await getAllSubjects()
  subjects.value = res.data.map((s) => ({ label: s.name, value: s.id }))
}

async function loadChapters(subjectId: number) {
  const res = await getChapterTree(subjectId)
  chapterTree.value = res.data
}

async function loadQuota() {
  const res = await getAIQuota()
  quota.value = res.data
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getAIQuestionList(query)
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

async function handleGenerate() {
  if (!generateForm.subjectId) {
    ElMessage.warning('请选择科目')
    return
  }
  generateLoading.value = true
  try {
    await generateQuestions(generateForm)
    ElMessage.success('AI 出题任务已提交，请稍后查看')
    fetchList()
    loadQuota()
  } finally {
    generateLoading.value = false
  }
}

async function handleApprove(row: AIQuestion) {
  await approveAIQuestion(row.id)
  ElMessage.success('已通过')
  fetchList()
}

async function handleReject(row: AIQuestion) {
  const reason = prompt('请输入拒绝原因')
  if (!reason) return
  await rejectAIQuestion(row.id, reason)
  ElMessage.success('已拒绝')
  fetchList()
}

async function handleBatchApprove(selected: AIQuestion[]) {
  if (!selected.length) {
    ElMessage.warning('请选择题目')
    return
  }
  await batchApproveAIQuestions(selected.map((q) => q.id))
  ElMessage.success('批量通过成功')
  fetchList()
}

// 编辑弹窗
const editDialogVisible = ref(false)
const editForm = ref<AIQuestion | null>(null)

function handleEdit(row: AIQuestion) {
  editForm.value = { ...row }
  editDialogVisible.value = true
}

async function submitEdit() {
  if (editForm.value) {
    await approveAIQuestion(editForm.value.id, editForm.value)
    ElMessage.success('已保存并通过')
    editDialogVisible.value = false
    fetchList()
  }
}

onMounted(() => {
  loadSubjects()
  loadQuota()
  fetchList()
})
</script>

<template>
  <div class="page-container">
    <el-row :gutter="16">
      <!-- 左侧配置面板 -->
      <el-col :span="8">
        <div class="panel">
          <h3 class="panel__title">AI 出题配置</h3>

          <!-- 配额进度 -->
          <div class="quota">
            <div class="quota__header">
              <span>本月配额</span>
              <span>{{ quota.used }} / {{ quota.total }}</span>
            </div>
            <el-progress :percentage="quotaPercent" :color="quotaPercent > 80 ? '#ef4444' : '#2f6bff'" />
            <p class="quota__tip">重置时间：{{ formatDateTime(quota.resetAt) }}</p>
          </div>

          <el-form label-width="80px" class="generate-form">
            <el-form-item label="科目">
              <el-select
                v-model="generateForm.subjectId"
                placeholder="请选择科目"
                style="width: 100%"
                @change="(v: number) => loadChapters(v)"
              >
                <el-option v-for="s in subjects" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="章节">
              <el-cascader
                v-model="generateForm.chapterId"
                :options="chapterTree"
                :props="{ checkStrictly: true, emitPath: false, label: 'name', value: 'id' }"
                placeholder="请选择章节"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="题型">
              <el-select v-model="generateForm.type" style="width: 100%">
                <el-option v-for="(v, k) in typeMap" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="难度">
              <el-select v-model="generateForm.difficulty" style="width: 100%">
                <el-option label="简单" value="easy" />
                <el-option label="中等" value="medium" />
                <el-option label="困难" value="hard" />
              </el-select>
            </el-form-item>
            <el-form-item label="数量">
              <el-input-number v-model="generateForm.count" :min="1" :max="50" style="width: 100%" />
            </el-form-item>
            <el-form-item label="模型">
              <el-select v-model="generateForm.model" style="width: 100%">
                <el-option v-for="o in modelOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="generateLoading"
                :disabled="!quota.remaining"
                style="width: 100%"
                @click="handleGenerate"
              >
                开始生成
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>

      <!-- 右侧审核列表 -->
      <el-col :span="16">
        <div class="panel">
          <div class="panel__header">
            <h3>待审核题目</h3>
            <el-select v-model="query.status" style="width: 120px" @change="fetchList">
              <el-option label="待审核" value="pending" />
              <el-option label="已通过" value="approved" />
              <el-option label="已拒绝" value="rejected" />
            </el-select>
          </div>

          <el-table v-loading="loading" :data="list" border style="width: 100%">
            <el-table-column type="selection" width="50" />
            <el-table-column prop="content" label="题目内容" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <div class="question-preview">{{ row.content }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="题型" width="90">
              <template #default="{ row }">{{ typeMap[row.type] }}</template>
            </el-table-column>
            <el-table-column label="AI置信度" width="100">
              <template #default="{ row }">
                <el-progress
                  :percentage="Math.round(row.confidence * 100)"
                  :stroke-width="6"
                  :color="row.confidence > 0.8 ? '#22c55e' : '#f59e0b'"
                />
              </template>
            </el-table-column>
            <el-table-column prop="model" label="模型" width="90" />
            <el-table-column prop="createdAt" label="生成时间" width="150">
              <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
                <el-button
                  v-if="row.status === 'pending'"
                  link
                  type="success"
                  size="small"
                  @click="handleApprove(row)"
                >
                  通过
                </el-button>
                <el-button
                  v-if="row.status === 'pending'"
                  link
                  type="danger"
                  size="small"
                  @click="handleReject(row)"
                >
                  拒绝
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="query.page"
            v-model:page-size="query.pageSize"
            :total="total"
            layout="total, prev, pager, next"
            background
            style="margin-top: 16px; justify-content: flex-end; display: flex"
            @current-change="fetchList"
          />
        </div>
      </el-col>
    </el-row>

    <!-- 编辑弹窗 -->
    <ProDialog v-model="editDialogVisible" title="编辑 AI 题目" width="700px" @confirm="submitEdit">
      <el-form v-if="editForm" label-width="80px">
        <el-form-item label="题干">
          <el-input v-model="editForm.content" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="答案">
          <el-input v-model="editForm.answer" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="解析">
          <el-input v-model="editForm.analysis" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
    </ProDialog>
  </div>
</template>

<style scoped lang="scss">
.panel {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

  &__title {
    font-size: 16px;
    margin-bottom: 12px;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
}

.quota {
  margin-bottom: 20px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;

  &__header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 13px;
  }

  &__tip {
    margin-top: 6px;
    font-size: 12px;
    color: var(--app-text-secondary);
  }
}

.generate-form {
  margin-top: 12px;
}

.question-preview {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
