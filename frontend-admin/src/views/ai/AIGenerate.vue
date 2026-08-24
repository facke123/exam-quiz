<template>
  <div class="ai-review-page">
    <!-- 顶部出题控制台 -->
    <div class="panel generate-panel">
      <div class="panel-title">
        <span>🤖 AI 智能命题引擎控制台</span>
        <span class="quota-info">
          今日模型配额：<strong>{{ quota.used }}</strong> / {{ quota.total }} 次（剩余 <strong>{{ quota.remaining }}</strong> 次）
        </span>
      </div>

      <div class="generate-form-grid">
        <div class="form-item">
          <span class="label">基座大模型：</span>
          <el-select v-model="generateForm.model" style="width: 200px">
            <el-option label="Gemini 3.7 Flash (推荐)" value="gemini-3.7-flash" />
            <el-option label="Gemini 3.1 Pro (高阶)" value="gemini-3.1-pro" />
            <el-option label="Gemini 3.6 Flash" value="gemini-3.6-flash" />
            <el-option label="DeepSeek-Chat" value="deepseek-chat" />
            <el-option label="Qwen-Plus (通义千问)" value="qwen-plus" />
            <el-option label="GPT-4o-mini" value="gpt-4o-mini" />
          </el-select>
        </div>

        <div class="form-item">
          <span class="label">目标科目：</span>
          <el-select v-model="generateForm.subjectId" style="width: 220px" @change="loadChapters">
            <el-option
              v-for="s in subjects"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </div>

        <div class="form-item">
          <span class="label">核心章节：</span>
          <el-select v-model="generateForm.chapterId" placeholder="指定章节/知识点" style="width: 200px">
            <el-option
              v-for="c in chapterOptions"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </el-select>
        </div>

        <div class="form-item">
          <span class="label">生成题型：</span>
          <el-select v-model="generateForm.type" style="width: 120px">
            <el-option label="单选题" value="single" />
            <el-option label="多选题" value="multiple" />
            <el-option label="判断题" value="judge" />
            <el-option label="案例题" value="case" />
          </el-select>
        </div>

        <div class="form-item">
          <span class="label">生成数量：</span>
          <el-input-number v-model="generateForm.count" :min="1" :max="10" style="width: 120px" />
        </div>

        <div class="form-item action-item">
          <el-button type="primary" :loading="generateLoading" @click="handleGenerate">
            ⚡ 一键开始智能命题
          </el-button>
        </div>
      </div>
    </div>

    <!-- 待审核题目列表 -->
    <div class="panel table-panel">
      <div class="table-toolbar">
        <div class="tt-left">
          <span class="tt-title">📋 待审核 AI 题目（共 {{ total }} 道）</span>
          <span class="tt-desc">由 AI 命题生成的试题将写入待审池，经教研核验通过后直接入库上架</span>
        </div>
        <div class="tt-right">
          <el-button
            type="success"
            :disabled="!selectedRows.length"
            @click="handleBatchApprove"
          >
            ✓ 批量审核入库 ({{ selectedRows.length }})
          </el-button>
          <el-button
            type="danger"
            :disabled="!selectedRows.length"
            @click="handleBatchReject"
          >
            ✗ 批量驳回
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="list"
        row-key="id"
        class="custom-table"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="45" align="center" />
        <el-table-column prop="id" label="ID" width="70" align="center" />

        <el-table-column label="题型" width="90" align="center">
          <template #default="{ row }">
            <span class="type-tag" :class="row.type">
              {{ typeMap[row.type] || row.type }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="题干与选项 / 解析内容" min-width="320">
          <template #default="{ row }">
            <div class="stem-content">
              <div class="stem-title">{{ row.title || row.content }}</div>
              <div v-if="row.options && row.options.length" class="options-preview">
                <span v-for="opt in row.options" :key="opt.key" class="opt-snippet">
                  <strong>{{ opt.key }}.</strong> {{ opt.content }}
                </span>
              </div>
              <div class="stem-ans">
                <span class="ans-label">正确答案：</span><strong class="ans-val">{{ row.answer }}</strong>
                <span class="ans-sep">｜</span>
                <span class="ans-analysis">{{ row.analysis }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="科目 / 章节" width="180">
          <template #default="{ row }">
            <div class="sub-info">
              <div class="sub-name">{{ row.subjectName || '系统集成项目管理' }}</div>
              <div class="ch-name">{{ row.chapterName || row.knowledgePoint || '第1章' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="AI 置信度" width="130" align="center">
          <template #default="{ row }">
            <div class="confidence-wrap">
              <div class="conf-bar">
                <div
                  class="conf-fill"
                  :style="{
                    width: (row.confidence || 95) + '%',
                    background: (row.confidence || 95) >= 90 ? 'var(--success)' : 'var(--warning)',
                  }"
                />
              </div>
              <span class="conf-text">{{ row.confidence || 95 }}%</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="生成时间" width="160" align="center" />

        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-ops">
              <span class="op-link pass" @click="handlePass(row)">通过入库</span>
              <span class="op-link edit" @click="openEditDialog(row)">修改</span>
              <span class="op-link reject" @click="handleReject(row)">驳回</span>
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
          layout="total, prev, pager, next"
          @change="fetchReviewList"
        />
      </div>
    </div>

    <!-- 编辑待审核试题弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑待审核试题" width="650px">
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="题干内容" required>
          <el-input v-model="editForm.content" type="textarea" :rows="3" placeholder="请输入题干描述" />
        </el-form-item>
        <el-form-item label="正确答案" required>
          <el-input v-model="editForm.answer" placeholder="如 A 或 ABCD" />
        </el-form-item>
        <el-form-item label="解析内容">
          <el-input v-model="editForm.analysis" type="textarea" :rows="3" placeholder="官方解析" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getAIQuestionList,
  generateQuestions,
  approveAIQuestion,
  rejectAIQuestion,
  batchApproveAIQuestions,
  batchRejectAIQuestions,
  updateAIQuestion,
  getAIQuota,
} from '@/api/ai'
import { getAllSubjects, getChapterTree } from '@/api/exam'

const loading = ref(false)
const generateLoading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const selectedRows = ref<any[]>([])

const quota = reactive({
  total: 5000,
  used: 150,
  remaining: 4850,
})

const query = reactive({
  page: 1,
  pageSize: 10,
  subjectId: undefined as any,
})

const subjects = ref<{ label: string; value: number }[]>([])
const chapterOptions = ref<any[]>([])

const generateForm = reactive<any>({
  model: 'gemini-3.7-flash',
  subjectId: 1,
  chapterId: 1,
  type: 'single',
  count: 3,
})

const typeMap: Record<string, string> = {
  single: '单选',
  multiple: '多选',
  judge: '判断',
  case: '案例',
}

const editDialogVisible = ref(false)
const editForm = reactive<any>({
  id: 0,
  content: '',
  answer: '',
  analysis: '',
})

async function loadSubjects() {
  try {
    const res = await getAllSubjects()
    if (res?.data) {
      subjects.value = res.data.map((s: any) => ({ label: s.name, value: Number(s.id) }))
      if (subjects.value.length > 0) {
        generateForm.subjectId = subjects.value[0].value
        loadChapters(subjects.value[0].value)
      }
    }
  } catch {
    subjects.value = [
      { label: '系统集成项目管理工程师', value: 1 },
      { label: '信息系统项目管理师', value: 2 },
    ]
  }
}

async function loadChapters(subjectId: number) {
  try {
    const res = await getChapterTree(subjectId)
    if (res?.data && res.data.length > 0) {
      chapterOptions.value = res.data
      generateForm.chapterId = res.data[0].id
    }
  } catch {
    chapterOptions.value = [
      { id: 1, name: '第1章 信息化与发展' },
      { id: 2, name: '第6章 项目整体管理' },
    ]
  }
}

async function fetchQuota() {
  try {
    const res = await getAIQuota()
    if (res?.data) {
      quota.total = res.data.total
      quota.used = res.data.used
      quota.remaining = res.data.remaining
    }
  } catch {
    // ignore
  }
}

async function fetchReviewList() {
  loading.value = true
  try {
    const res = await getAIQuestionList(query)
    if (res?.data) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (err: any) {
    ElMessage.error(err.message || '获取待审核题目失败')
  } finally {
    loading.value = false
  }
}

async function handleGenerate() {
  generateLoading.value = true
  try {
    const res = await generateQuestions(generateForm)
    ElMessage.success(`AI 命题完成！已成功生成并在待审池载入题目`)
    fetchQuota()
    fetchReviewList()
  } catch (err: any) {
    ElMessage.error(err.message || 'AI 出题请求失败')
  } finally {
    generateLoading.value = false
  }
}

function onSelectionChange(rows: any[]) {
  selectedRows.value = rows
}

async function handlePass(row: any) {
  try {
    await approveAIQuestion(row.id)
    ElMessage.success(`题目 [ID: ${row.id}] 审核通过并正式上架题库！`)
    fetchReviewList()
  } catch (err: any) {
    ElMessage.error(err.message || '审核操作失败')
  }
}

function openEditDialog(row: any) {
  editForm.id = row.id
  editForm.content = row.content || row.title
  editForm.answer = row.answer
  editForm.analysis = row.analysis
  editDialogVisible.value = true
}

async function submitEdit() {
  try {
    await updateAIQuestion(editForm.id, editForm)
    ElMessage.success('已保存修改')
    editDialogVisible.value = false
    fetchReviewList()
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  }
}

async function handleReject(row: any) {
  try {
    await ElMessageBox.confirm(`确定驳回并丢弃题目 [ID: ${row.id}] 吗？`, '驳回确认', {
      type: 'warning',
    })
    await rejectAIQuestion(row.id, '人工核验不符合标准')
    ElMessage.warning(`题目 [ID: ${row.id}] 已驳回`)
    fetchReviewList()
  } catch {
    // cancel
  }
}

async function handleBatchApprove() {
  const ids = selectedRows.value.map((r) => r.id)
  try {
    await batchApproveAIQuestions(ids)
    ElMessage.success(`已批量审核通过 ${ids.length} 道题目并入库！`)
    fetchReviewList()
  } catch (err: any) {
    ElMessage.error(err.message || '批量审核失败')
  }
}

async function handleBatchReject() {
  const ids = selectedRows.value.map((r) => r.id)
  try {
    await ElMessageBox.confirm(`确定批量驳回选中的 ${ids.length} 道题目吗？`, '批量驳回确认', {
      type: 'warning',
    })
    await batchRejectAIQuestions(ids)
    ElMessage.warning(`已批量驳回 ${ids.length} 道题目`)
    fetchReviewList()
  } catch {
    // cancel
  }
}

onMounted(() => {
  loadSubjects()
  fetchQuota()
  fetchReviewList()
})
</script>

<style scoped lang="scss">
.ai-review-page {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .panel-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--gray-8);
    margin-bottom: 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .quota-info {
      font-size: 13px;
      font-weight: normal;
      color: var(--gray-6);

      strong {
        color: var(--primary);
      }
    }
  }
}

.generate-form-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;

  .form-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .label {
      font-size: 13px;
      font-weight: 600;
      color: var(--gray-7);
    }
  }
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;

  .tt-left {
    .tt-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--gray-8);
    }
    .tt-desc {
      font-size: 12px;
      color: var(--gray-5);
      margin-left: 10px;
    }
  }

  .tt-right {
    display: flex;
    gap: 10px;
  }
}

.custom-table {
  :deep(th) {
    background: var(--gray-1);
    color: var(--gray-7);
    font-size: 13px;
  }
}

.type-tag {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
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
}

.stem-content {
  .stem-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--gray-8);
    margin-bottom: 6px;
    line-height: 1.5;
  }

  .options-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    margin-bottom: 6px;

    .opt-snippet {
      font-size: 12px;
      color: var(--gray-7);
      background: var(--gray-1);
      padding: 1px 6px;
      border-radius: 4px;
    }
  }

  .stem-ans {
    font-size: 12px;
    color: var(--gray-6);
    line-height: 1.5;

    .ans-label {
      font-weight: 600;
      color: var(--gray-7);
    }

    .ans-val {
      color: var(--primary);
      font-size: 13px;
    }

    .ans-sep {
      margin: 0 6px;
      color: var(--gray-3);
    }

    .ans-analysis {
      color: var(--gray-6);
    }
  }
}

.sub-info {
  .sub-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--gray-8);
  }
  .ch-name {
    font-size: 11px;
    color: var(--gray-5);
    margin-top: 2px;
  }
}

.confidence-wrap {
  display: flex;
  align-items: center;
  gap: 8px;

  .conf-bar {
    flex: 1;
    height: 6px;
    background: var(--gray-2);
    border-radius: 3px;
    overflow: hidden;

    .conf-fill {
      height: 100%;
      border-radius: 3px;
    }
  }

  .conf-text {
    font-size: 12px;
    font-weight: 700;
    color: var(--gray-7);
    width: 32px;
  }
}

.table-ops {
  display: flex;
  gap: 10px;
  justify-content: center;

  .op-link {
    font-size: 13px;
    cursor: pointer;

    &.pass {
      color: var(--success);
      font-weight: 600;
    }
    &.edit {
      color: var(--primary);
    }
    &.reject {
      color: var(--danger);
    }

    &:hover {
      text-decoration: underline;
    }
  }
}

.table-pagination {
  padding: 14px 0 0;
  display: flex;
  justify-content: flex-end;
}
</style>
