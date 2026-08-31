<template>
  <div class="ai-generate-page">
    <!-- 顶部出题控制台卡片 -->
    <div class="panel generate-panel">
      <div class="panel-header">
        <div class="ph-left">
          <span class="ph-title">🤖 AI 智能命题引擎控制台</span>
          <span class="ph-badge">软考官方考纲 2026 最新增强版</span>
        </div>
        <div class="ph-right">
          <span class="quota-pill">
            今日模型配额：<strong>{{ quota.used }}</strong> / {{ quota.total }} 次（剩余 <strong>{{ quota.remaining }}</strong> 次）
          </span>
          <el-button link type="primary" :icon="'Refresh'" @click="fetchQuota">刷新配额</el-button>
        </div>
      </div>

      <!-- 出题参数表单 -->
      <div class="generate-form-container">
        <div class="form-row">
          <div class="form-item">
            <span class="label">基座大模型：</span>
            <el-select v-model="generateForm.model" style="width: 220px">
              <el-option label="Gemini 3.7 Flash (推荐/极速)" value="gemini-3.7-flash" />
              <el-option label="Gemini 3.1 Pro (高阶深度推理)" value="gemini-3.1-pro" />
              <el-option label="DeepSeek-Chat (深度求索)" value="deepseek-chat" />
              <el-option label="DeepSeek-Reasoner (R1推理)" value="deepseek-reasoner" />
              <el-option label="Qwen-Plus (阿里通义千问)" value="qwen-plus" />
              <el-option label="GPT-4o-mini" value="gpt-4o-mini" />
            </el-select>
          </div>

          <div class="form-item">
            <span class="label">目标科目：</span>
            <el-select v-model="generateForm.subjectId" style="width: 230px" @change="onSubjectChange">
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
            <el-select
              v-model="generateForm.chapterId"
              placeholder="选择指定章节"
              style="width: 220px"
              @change="onChapterChange"
            >
              <el-option
                v-for="c in chapterOptions"
                :key="c.id"
                :label="c.name"
                :value="c.id"
              />
            </el-select>
          </div>

          <div class="form-item">
            <span class="label">细分知识点：</span>
            <el-select
              v-model="generateForm.knowledgePointId"
              clearable
              filterable
              placeholder="全部考点/指定知识点"
              style="width: 210px"
              @change="onKnowledgePointChange"
            >
              <el-option
                v-for="kp in currentKnowledgePoints"
                :key="kp.id"
                :label="kp.name"
                :value="kp.id"
              />
            </el-select>
          </div>
        </div>

        <div class="form-row secondary-row">
          <div class="form-item">
            <span class="label">生成题型：</span>
            <el-radio-group v-model="generateForm.type" size="default">
              <el-radio-button label="single">单选题 (4选项)</el-radio-button>
              <el-radio-button label="multiple">多选题</el-radio-button>
              <el-radio-button label="judge">判断题 (对/错)</el-radio-button>
              <el-radio-button label="case">案例分析题</el-radio-button>
            </el-radio-group>
          </div>

          <div class="form-item">
            <span class="label">出题风格：</span>
            <el-select v-model="generateForm.promptStyle" style="width: 170px">
              <el-option label="🎯 历年真题风 (标准)" value="standard" />
              <el-option label="⚠️ 易错陷阱风 (避坑)" value="trap" />
              <el-option label="🧮 实战计算风 (攻坚)" value="calculation" />
              <el-option label="📖 概念辨析风 (规范)" value="concept" />
            </el-select>
          </div>

          <div class="form-item">
            <span class="label">难度等级：</span>
            <el-select v-model="generateForm.difficulty" style="width: 140px">
              <el-option label="基础巩固 (2星)" :value="2" />
              <el-option label="核心考点 (3星)" :value="3" />
              <el-option label="进阶提升 (4星)" :value="4" />
              <el-option label="压轴冲刺 (5星)" :value="5" />
            </el-select>
          </div>

          <div class="form-item count-item">
            <span class="label">生成数量：</span>
            <el-input-number
              v-model="generateForm.count"
              :min="1"
              :max="50"
              :step="1"
              style="width: 130px"
            />
            <div class="quick-count-tags">
              <span
                v-for="c in [5, 10, 20, 30, 50]"
                :key="c"
                class="count-tag"
                :class="{ active: generateForm.count === c }"
                @click="generateForm.count = c"
              >
                {{ c }}道
              </span>
            </div>
          </div>

          <div class="form-item action-btn-item">
            <el-button
              type="primary"
              size="large"
              :loading="generateLoading"
              class="generate-btn"
              @click="handleGenerate"
            >
              ⚡ 一键开始智能命题 ({{ generateForm.count }}道)
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 待审核试题池卡片 -->
    <div class="panel table-panel">
      <!-- 搜索过滤栏 -->
      <div class="filter-bar">
        <div class="fb-items">
          <div class="fb-item">
            <span class="fb-label">题型：</span>
            <el-select v-model="query.type" clearable placeholder="全部题型" style="width: 120px" @change="fetchReviewList">
              <el-option label="全部题型" value="" />
              <el-option label="单选题" value="single" />
              <el-option label="多选题" value="multiple" />
              <el-option label="判断题" value="judge" />
              <el-option label="案例题" value="case" />
            </el-select>
          </div>

          <div class="fb-item">
            <span class="fb-label">难度：</span>
            <el-select v-model="query.difficulty" clearable placeholder="全部难度" style="width: 120px" @change="fetchReviewList">
              <el-option label="全部难度" value="" />
              <el-option label="2星 (基础)" :value="2" />
              <el-option label="3星 (核心)" :value="3" />
              <el-option label="4星 (进阶)" :value="4" />
              <el-option label="5星 (难题)" :value="5" />
            </el-select>
          </div>

          <div class="fb-item">
            <span class="fb-label">关键词：</span>
            <el-input
              v-model="query.keyword"
              placeholder="搜索题干或解析核心词..."
              clearable
              style="width: 220px"
              @keyup.enter="fetchReviewList"
              @clear="fetchReviewList"
            />
          </div>

          <el-button type="primary" :icon="'Search'" @click="fetchReviewList">查询</el-button>
          <el-button :icon="'Refresh'" @click="resetQuery">重置</el-button>
        </div>

        <div class="fb-actions">
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
            ✗ 批量驳回 ({{ selectedRows.length }})
          </el-button>
          <el-button
            type="warning"
            plain
            :disabled="total === 0"
            @click="handleClearAllPending"
          >
            🗑️ 清空待审池
          </el-button>
        </div>
      </div>

      <!-- 待审池状态栏 -->
      <div class="table-toolbar">
        <div class="tt-left">
          <span class="tt-title">📋 待审核 AI 智能题目池</span>
          <span class="tt-badge">{{ total }} 道待审</span>
          <span class="tt-desc">由 AI 命题生成并经过查重防撞校验的试题将在此暂存，经教研老师核验确认后正式发布入库</span>
        </div>
      </div>

      <!-- 题目列表 -->
      <el-table
        v-loading="loading"
        :data="list"
        row-key="id"
        class="custom-table"
        border
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="45" align="center" />
        <el-table-column prop="id" label="ID" width="70" align="center" />

        <el-table-column label="题型" width="95" align="center">
          <template #default="{ row }">
            <span class="type-tag" :class="row.type">
              {{ typeMap[row.type] || row.type }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="难度" width="80" align="center">
          <template #default="{ row }">
            <span class="diff-stars" :title="`难度: ${row.difficulty || 3}星`">
              {{ '★'.repeat(row.difficulty || 3) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="题干与选项 / 深度名师解析" min-width="460">
          <template #default="{ row }">
            <div class="stem-content">
              <!-- 题干 -->
              <div class="stem-title">
                <span class="q-id-tag">#{{ row.id }}</span>
                {{ row.title || row.content }}
              </div>

              <!-- 选项卡片 (单选/多选/判断) -->
              <div v-if="row.options && row.options.length" class="options-grid">
                <div
                  v-for="opt in row.options"
                  :key="opt.key || opt.label"
                  class="opt-item"
                  :class="{ 'is-correct': isOptionCorrect(row, opt.key || opt.label) }"
                >
                  <span class="opt-badge">{{ opt.key || opt.label }}</span>
                  <span class="opt-text">{{ opt.content }}</span>
                </div>
              </div>

              <!-- 正确答案与解析 -->
              <div class="stem-footer">
                <div class="stem-ans-row">
                  <span class="ans-label">正确答案：</span>
                  <span class="ans-badge">{{ row.answer }}</span>
                  <span class="ans-sep">｜</span>
                  <span class="analysis-toggle-btn" @click="toggleAnalysis(row.id)">
                    {{ expandedAnalysisIds.has(row.id) ? '▲ 收起深度解析' : '▼ 查看名师深度解析' }}
                  </span>
                </div>

                <!-- 展开的名师解析 -->
                <div v-show="expandedAnalysisIds.has(row.id)" class="analysis-box">
                  <div class="analysis-header">
                    <span>💡 名师深度解析与避坑指南</span>
                    <el-button link type="primary" size="small" :loading="rewritingId === row.id" @click="handleRewriteAnalysis(row)">
                      ✨ AI一键优化解析
                    </el-button>
                  </div>
                  <div class="analysis-body" v-html="formatAnalysisHtml(row.analysis)" />
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="科目 / 考点章节" width="180">
          <template #default="{ row }">
            <div class="sub-info">
              <div class="sub-name">{{ row.subjectName || '系统集成项目管理' }}</div>
              <div class="ch-name">{{ row.chapterName || row.knowledgePoint || '核心章节' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="AI 置信度" width="125" align="center">
          <template #default="{ row }">
            <div class="confidence-wrap">
              <div class="conf-bar">
                <div
                  class="conf-fill"
                  :style="{
                    width: (row.confidence || 95) + '%',
                    background: (row.confidence || 95) >= 90 ? 'var(--el-color-success)' : 'var(--el-color-warning)',
                  }"
                />
              </div>
              <span class="conf-text">{{ row.confidence || 95 }}%</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="生成时间" width="150" align="center">
          <template #default="{ row }">
            <span class="time-text">{{ formatTime(row.createdAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="190" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-ops">
              <el-button type="success" link size="small" @click="handlePass(row)">
                入库
              </el-button>
              <el-button type="primary" link size="small" @click="openEditDialog(row)">
                修改
              </el-button>
              <el-button type="info" link size="small" @click="copyQuestion(row)">
                复制
              </el-button>
              <el-button type="danger" link size="small" @click="handleReject(row)">
                驳回
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <div class="table-pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @change="fetchReviewList"
        />
      </div>
    </div>

    <!-- 编辑待审核试题弹窗 -->
    <el-dialog v-model="editDialogVisible" title="✏️ 编辑待审核试题与答案" width="720px">
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="试题题型">
          <el-select v-model="editForm.type" style="width: 140px">
            <el-option label="单选题" value="single" />
            <el-option label="多选题" value="multiple" />
            <el-option label="判断题" value="judge" />
            <el-option label="案例分析" value="case" />
          </el-select>
        </el-form-item>

        <el-form-item label="题干内容" required>
          <el-input v-model="editForm.content" type="textarea" :rows="3" placeholder="请输入题干描述" />
        </el-form-item>

        <!-- 选项编辑 -->
        <el-form-item v-if="editForm.type !== 'case'" label="选项列表">
          <div class="dialog-options-list">
            <div v-for="(opt, idx) in editForm.options" :key="idx" class="dialog-opt-item">
              <span class="d-opt-key">{{ opt.key || opt.label }}.</span>
              <el-input v-model="opt.content" placeholder="选项描述内容" style="flex: 1" />
            </div>
          </div>
        </el-form-item>

        <el-form-item label="正确答案" required>
          <el-input v-model="editForm.answer" placeholder="如 A、ABC 或 正确/错误" style="width: 200px" />
        </el-form-item>

        <el-form-item label="名师解析">
          <el-input
            v-model="editForm.analysis"
            type="textarea"
            :rows="6"
            placeholder="包含考点定位、推导依据、干扰项辨析与考前口诀..."
          />
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
  clearPendingQuestions,
  rewriteQuestionAnalysis,
  updateAIQuestion,
  getAIQuota,
} from '@/api/ai'
import { getAllSubjects, getChapterTree } from '@/api/exam'

const loading = ref(false)
const generateLoading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const selectedRows = ref<any[]>([])
const expandedAnalysisIds = ref<Set<number>>(new Set())
const rewritingId = ref<number | null>(null)

const quota = reactive({
  total: 5000,
  used: 150,
  remaining: 4850,
})

const query = reactive({
  page: 1,
  pageSize: 20,
  subjectId: undefined as any,
  chapterId: undefined as any,
  type: '',
  difficulty: '',
  keyword: '',
})

const subjects = ref<{ label: string; value: number }[]>([])
const chapterOptions = ref<any[]>([])
const currentKnowledgePoints = ref<any[]>([])

const generateForm = reactive<any>({
  model: 'gemini-3.7-flash',
  subjectId: 1,
  chapterId: 1,
  knowledgePointId: undefined,
  knowledgePoint: '',
  type: 'single',
  difficulty: 3,
  promptStyle: 'standard',
  count: 10,
})

const typeMap: Record<string, string> = {
  single: '单选',
  single_choice: '单选',
  multiple: '多选',
  multiple_choice: '多选',
  judge: '判断',
  true_false: '判断',
  case: '案例',
  case_analysis: '案例',
}

const editDialogVisible = ref(false)
const editForm = reactive<any>({
  id: 0,
  type: 'single',
  content: '',
  options: [] as any[],
  answer: '',
  analysis: '',
})

function formatTime(t: string | Date | undefined) {
  if (!t) return '-'
  const d = new Date(t)
  if (isNaN(d.getTime())) return String(t)
  const pad = (n: number) => (n < 10 ? '0' + n : n)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function isOptionCorrect(row: any, key: string) {
  if (!row.answer || !key) return false
  const ans = String(row.answer).toUpperCase()
  const k = String(key).toUpperCase()
  return ans.includes(k)
}

function toggleAnalysis(id: number) {
  if (expandedAnalysisIds.value.has(id)) {
    expandedAnalysisIds.value.delete(id)
  } else {
    expandedAnalysisIds.value.add(id)
  }
}

function formatAnalysisHtml(analysis: string) {
  if (!analysis) return '<span style="color: var(--el-text-color-secondary)">暂无详细解析</span>'
  return analysis
    .replace(/【(.*?)】/g, '<strong style="color: var(--el-color-primary); display: inline-block; margin-top: 4px;">【$1】</strong>')
    .replace(/\n/g, '<br/>')
}

async function loadSubjects() {
  try {
    const res = await getAllSubjects()
    if (res?.data && res.data.length > 0) {
      subjects.value = res.data.map((s: any) => ({ label: s.name, value: Number(s.id) }))
      generateForm.subjectId = subjects.value[0].value
      loadChapters(generateForm.subjectId)
    }
  } catch {
    subjects.value = [
      { label: '系统集成项目管理工程师', value: 1 },
      { label: '信息系统项目管理师', value: 2 },
    ]
  }
}

async function onSubjectChange(subId: number) {
  generateForm.subjectId = subId
  await loadChapters(subId)
  fetchReviewList()
}

async function loadChapters(subjectId: number) {
  try {
    const res = await getChapterTree(subjectId)
    if (res?.data && res.data.length > 0) {
      chapterOptions.value = res.data
      generateForm.chapterId = res.data[0].id
      onChapterChange(res.data[0].id)
    }
  } catch {
    chapterOptions.value = [
      { id: 1, name: '第1章 信息化与发展' },
      { id: 2, name: '第6章 项目整体管理' },
    ]
  }
}

function onChapterChange(chapterId: number) {
  generateForm.chapterId = chapterId
  const ch = chapterOptions.value.find((item) => item.id === chapterId)
  if (ch && Array.isArray(ch.knowledgePoints)) {
    currentKnowledgePoints.value = ch.knowledgePoints
  } else {
    currentKnowledgePoints.value = []
  }
  generateForm.knowledgePointId = undefined
  generateForm.knowledgePoint = ''
}

function onKnowledgePointChange(kpId: number) {
  const kp = currentKnowledgePoints.value.find((item) => item.id === kpId)
  generateForm.knowledgePoint = kp ? kp.name : ''
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

function onSelectionChange(rows: any[]) {
  selectedRows.value = rows
}

function resetQuery() {
  query.type = ''
  query.difficulty = ''
  query.keyword = ''
  query.page = 1
  fetchReviewList()
}

async function handleGenerate() {
  generateLoading.value = true
  try {
    const res = await generateQuestions(generateForm)
    const count = res?.data?.count || generateForm.count
    ElMessage.success(`🎉 AI 命题完成！成功生成并载入 ${count} 道题目至待审池（已自动去重）`)
    fetchQuota()
    fetchReviewList()
  } catch (err: any) {
    ElMessage.error(err.message || 'AI 出题请求失败')
  } finally {
    generateLoading.value = false
  }
}

async function handlePass(row: any) {
  try {
    await approveAIQuestion(row.id)
    ElMessage.success(`题目 [ID: ${row.id}] 审核通过并正式入库！`)
    fetchReviewList()
  } catch (err: any) {
    ElMessage.error(err.message || '审核操作失败')
  }
}

function openEditDialog(row: any) {
  editForm.id = row.id
  editForm.type = row.type || 'single'
  editForm.content = row.content || row.title
  editForm.options = Array.isArray(row.options) ? JSON.parse(JSON.stringify(row.options)) : []
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

async function handleRewriteAnalysis(row: any) {
  rewritingId.value = row.id
  try {
    const res = await rewriteQuestionAnalysis(row.id)
    if (res?.data?.analysis) {
      row.analysis = res.data.analysis
      expandedAnalysisIds.value.add(row.id)
      ElMessage.success('名师解析已成功由 AI 重新深度优化！')
    }
  } catch (err: any) {
    ElMessage.error(err.message || '优化解析失败')
  } finally {
    rewritingId.value = null
  }
}

function copyQuestion(row: any) {
  let text = `【题干】${row.content || row.title}\n`
  if (row.options && row.options.length) {
    row.options.forEach((opt: any) => {
      text += `${opt.key || opt.label}. ${opt.content}\n`
    })
  }
  text += `【正确答案】${row.answer}\n`
  text += `【名师解析】\n${row.analysis}\n`

  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('试题内容及解析已复制到剪贴板！')
  }).catch(() => {
    ElMessage.info('复制失败，请手动选择复制')
  })
}

async function handleReject(row: any) {
  try {
    await ElMessageBox.confirm(`确定驳回并丢弃题目 [ID: ${row.id}] 吗？`, '驳回确认', {
      type: 'warning',
    })
    await rejectAIQuestion(row.id, '人工核验不符合标准')
    ElMessage.warning(`题目 [ID: ${row.id}] 已驳回丢弃`)
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

async function handleClearAllPending() {
  try {
    await ElMessageBox.confirm('确定清空当前待审池中的所有待审核题目吗？清空后将不可恢复。', '清空待审池确认', {
      type: 'warning',
      confirmButtonText: '确定清空',
      confirmButtonClass: 'el-button--danger',
    })
    const res = await clearPendingQuestions()
    ElMessage.success(res?.data?.message || '已清空待审核池')
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
.ai-generate-page {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel {
  background: #fff;
  border-radius: 10px;
  padding: 22px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.generate-panel {
  border: 1px solid #e2e8f0;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 14px;
    border-bottom: 1px solid #f1f5f9;

    .ph-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .ph-title {
        font-size: 17px;
        font-weight: 700;
        color: #1e293b;
      }

      .ph-badge {
        font-size: 12px;
        background: #e0f2fe;
        color: #0284c7;
        padding: 2px 8px;
        border-radius: 12px;
        font-weight: 600;
      }
    }

    .ph-right {
      display: flex;
      align-items: center;
      gap: 12px;

      .quota-pill {
        font-size: 13px;
        color: #64748b;
        background: #f8fafc;
        padding: 4px 12px;
        border-radius: 20px;
        border: 1px solid #e2e8f0;

        strong {
          color: var(--el-color-primary);
        }
      }
    }
  }
}

.generate-form-container {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .form-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px 24px;
  }

  .secondary-row {
    background: #f8fafc;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #edf2f7;
  }

  .form-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .label {
      font-size: 13px;
      font-weight: 600;
      color: #475569;
      white-space: nowrap;
    }
  }

  .count-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .quick-count-tags {
      display: flex;
      gap: 4px;

      .count-tag {
        font-size: 12px;
        padding: 2px 8px;
        background: #fff;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        cursor: pointer;
        color: #475569;
        transition: all 0.2s;

        &:hover {
          border-color: var(--el-color-primary);
          color: var(--el-color-primary);
        }

        &.active {
          background: var(--el-color-primary);
          color: #fff;
          border-color: var(--el-color-primary);
          font-weight: 600;
        }
      }
    }
  }

  .action-btn-item {
    margin-left: auto;

    .generate-btn {
      font-weight: 700;
      padding: 0 24px;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
    }
  }
}

.table-panel {
  border: 1px solid #e2e8f0;

  .filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 14px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f1f5f9;

    .fb-items {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;

      .fb-item {
        display: flex;
        align-items: center;
        gap: 6px;

        .fb-label {
          font-size: 13px;
          color: #64748b;
          white-space: nowrap;
        }
      }
    }

    .fb-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }

  .table-toolbar {
    margin-bottom: 14px;

    .tt-left {
      display: flex;
      align-items: center;
      gap: 8px;

      .tt-title {
        font-size: 15px;
        font-weight: 700;
        color: #1e293b;
      }

      .tt-badge {
        background: #eef2ff;
        color: var(--el-color-primary);
        font-size: 12px;
        padding: 1px 8px;
        border-radius: 10px;
        font-weight: 600;
      }

      .tt-desc {
        font-size: 12px;
        color: #94a3b8;
        margin-left: 6px;
      }
    }
  }
}

.type-tag {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;

  &.single,
  &.single_choice {
    background: #e0e7ff;
    color: #4338ca;
  }
  &.multiple,
  &.multiple_choice {
    background: #f3e8ff;
    color: #7e22ce;
  }
  &.judge,
  &.true_false {
    background: #ffedd5;
    color: #c2410c;
  }
  &.case,
  &.case_analysis {
    background: #fce7f3;
    color: #be185d;
  }
}

.diff-stars {
  color: #f59e0b;
  font-size: 13px;
  letter-spacing: 1px;
}

.stem-content {
  padding: 4px 0;

  .stem-title {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    line-height: 1.6;
    margin-bottom: 8px;

    .q-id-tag {
      font-size: 11px;
      color: #94a3b8;
      font-weight: normal;
      margin-right: 4px;
    }
  }

  .options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 8px 16px;
    margin-bottom: 10px;

    .opt-item {
      display: flex;
      align-items: baseline;
      gap: 6px;
      font-size: 13px;
      color: #334155;
      background: #f8fafc;
      padding: 5px 10px;
      border-radius: 6px;
      border: 1px solid #f1f5f9;

      .opt-badge {
        font-weight: 700;
        color: #64748b;
        min-width: 16px;
      }

      &.is-correct {
        background: #f0fdf4;
        border-color: #bbf7d0;
        color: #166534;
        font-weight: 600;

        .opt-badge {
          color: #16a34a;
        }
      }
    }
  }

  .stem-footer {
    border-top: 1px dashed #e2e8f0;
    padding-top: 8px;
    margin-top: 6px;

    .stem-ans-row {
      display: flex;
      align-items: center;
      font-size: 13px;
      color: #475569;

      .ans-label {
        font-weight: 600;
      }

      .ans-badge {
        background: var(--el-color-primary);
        color: #fff;
        font-weight: 700;
        padding: 1px 8px;
        border-radius: 4px;
        font-size: 12px;
      }

      .ans-sep {
        margin: 0 10px;
        color: #cbd5e1;
      }

      .analysis-toggle-btn {
        color: var(--el-color-primary);
        cursor: pointer;
        font-size: 12px;
        user-select: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .analysis-box {
      margin-top: 10px;
      background: #fafafa;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px 14px;
      font-size: 13px;

      .analysis-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 700;
        color: #374151;
        margin-bottom: 6px;
        border-bottom: 1px solid #f3f4f6;
        padding-bottom: 6px;
      }

      .analysis-body {
        line-height: 1.7;
        color: #4b5563;
      }
    }
  }
}

.sub-info {
  .sub-name {
    font-size: 13px;
    font-weight: 600;
    color: #334155;
  }
  .ch-name {
    font-size: 12px;
    color: #64748b;
    margin-top: 3px;
  }
}

.confidence-wrap {
  display: flex;
  align-items: center;
  gap: 6px;

  .conf-bar {
    flex: 1;
    height: 6px;
    background: #e2e8f0;
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
    color: #475569;
    width: 32px;
  }
}

.time-text {
  font-size: 12px;
  color: #64748b;
}

.table-ops {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.dialog-options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;

  .dialog-opt-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .d-opt-key {
      font-weight: 700;
      font-size: 14px;
      width: 20px;
      color: #475569;
    }
  }
}

.table-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
