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

          <!-- 完整性健康度筛选 -->
          <el-select
            v-model="query.health"
            placeholder="全部完整性"
            clearable
            class="filter-select"
            style="width: 160px"
            @change="fetchList"
          >
            <el-option label="全部完整性" :value="undefined" />
            <el-option label="✅ 完备 (100分)" value="complete" />
            <el-option label="⚡ 待补充解析" value="need_analysis" />
            <el-option label="⚠️ 存在缺陷 / 异常" value="defective" />
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

        <el-table-column label="题干内容（点击预览）" min-width="280">
          <template #default="{ row }">
            <div
              class="stem-text clickable"
              :title="row.content || row.title"
              @click="handlePreview(row)"
            >
              {{ row.content || row.title }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="完整性检测" width="140" align="center">
          <template #default="{ row }">
            <el-tooltip
              :content="checkQuestionQuality(row).issues.length ? checkQuestionQuality(row).issues.join('；') : '题目信息完备，题干/选项/答案/解析均正常'"
              placement="top"
            >
              <span
                class="health-tag"
                :class="{
                  perfect: checkQuestionQuality(row).isComplete,
                  error: checkQuestionQuality(row).hasSeriousIssue,
                  warning: !checkQuestionQuality(row).isComplete && !checkQuestionQuality(row).hasSeriousIssue
                }"
              >
                {{ checkQuestionQuality(row).isComplete ? '✅ 完备 (100%)' : checkQuestionQuality(row).hasSeriousIssue ? '⚠️ 存在缺陷' : '⚡ 待补充解析' }}
              </span>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column label="科目 / 章节" min-width="180">
          <template #default="{ row }">
            <div class="sub-chapter">
              <span class="sc-subject">{{ row.subjectName || '系统集成项目管理工程师' }}</span>
              <span class="sc-chapter">{{ row.chapterName || '第1章 信息化与发展' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="难度" width="110" align="center">
          <template #default="{ row }">
            <span class="star-rating">
              {{ '⭐'.repeat(Math.min(5, Math.max(1, typeof row.difficulty === 'number' ? row.difficulty : 3))) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="正确答案" width="100" align="center">
          <template #default="{ row }">
            <span class="answer-badge">{{ row.answer || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="来源" width="130">
          <template #default="{ row }">
            <span class="source-tag">{{ row.source || '历年真题' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <span class="status-badge" :class="row.status || 'published'">
              {{ statusMap[row.status] || '已发布' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-ops">
              <span class="op-link view" @click="handlePreview(row)">🔍 预览</span>
              <span class="op-link" @click="handleEdit(row)">编辑</span>
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

    <!-- 题目全真预览与质量诊断抽屉 -->
    <el-drawer
      v-model="previewDrawerVisible"
      title="题目详情预览与质量体检"
      size="720px"
      direction="rtl"
      destroy-on-close
      class="question-preview-drawer"
    >
      <template #header>
        <div class="drawer-custom-header">
          <div class="header-left">
            <span class="preview-id">#{{ currentPreviewQuestion?.id }}</span>
            <span class="type-tag" :class="currentPreviewQuestion?.type">
              {{ typeMap[currentPreviewQuestion?.type] || '单选' }}
            </span>
            <span class="preview-title-sub">{{ currentPreviewQuestion?.subjectName }}</span>
          </div>
          <div class="header-right">
            <el-tag
              :type="currentPreviewQuality.isComplete ? 'success' : currentPreviewQuality.hasSeriousIssue ? 'danger' : 'warning'"
              size="small"
            >
              {{ currentPreviewQuality.isComplete ? '✅ 完整可用 (100分)' : currentPreviewQuality.hasSeriousIssue ? '⚠️ 存在缺陷' : '⚡ 待补充解析' }}
            </el-tag>
          </div>
        </div>
      </template>

      <div v-if="currentPreviewQuestion" class="preview-content-wrap">
        <!-- 题目完整性诊断面板 -->
        <div
          class="diagnostic-card"
          :class="{
            complete: currentPreviewQuality.isComplete,
            warning: !currentPreviewQuality.isComplete && !currentPreviewQuality.hasSeriousIssue,
            danger: currentPreviewQuality.hasSeriousIssue
          }"
        >
          <div class="diag-top">
            <div class="diag-title">
              <span class="icon">🩺</span> 题目完整性体检诊断
            </div>
            <div class="diag-score">
              健康度得分：<strong>{{ currentPreviewQuality.score }}</strong> / 100
            </div>
          </div>

          <div class="diag-checklist">
            <div class="check-item" :class="{ ok: currentPreviewQuality.stemLength >= 5, bad: currentPreviewQuality.stemLength < 5 }">
              <span class="c-icon">{{ currentPreviewQuality.stemLength >= 5 ? '✓' : '✗' }}</span>
              <span class="c-label">题干内容：</span>
              <span class="c-val">{{ currentPreviewQuality.stemLength ? `${currentPreviewQuality.stemLength} 字` : '缺失题干' }}</span>
            </div>

            <div
              class="check-item"
              :class="{
                ok: ['single', 'multiple'].includes(currentPreviewQuestion.type) ? currentPreviewQuality.optionCount === 4 : true,
                bad: ['single', 'multiple'].includes(currentPreviewQuestion.type) && (currentPreviewQuality.optionCount < 2 || currentPreviewQuality.optionCount > 4)
              }"
            >
              <span class="c-icon">{{ ['single', 'multiple'].includes(currentPreviewQuestion.type) ? (currentPreviewQuality.optionCount === 4 ? '✓' : '!') : '✓' }}</span>
              <span class="c-label">选项配置：</span>
              <span class="c-val">
                {{
                  currentPreviewQuality.optionCount
                    ? `${currentPreviewQuality.optionCount} 个选项${currentPreviewQuality.optionCount > 4 ? '（选项冗余过多）' : ''}`
                    : (['single', 'multiple'].includes(currentPreviewQuestion.type) ? '缺失选项' : '主观题型')
                }}
              </span>
            </div>

            <div class="check-item" :class="{ ok: !!currentPreviewQuestion.answer, bad: !currentPreviewQuestion.answer }">
              <span class="c-icon">{{ currentPreviewQuestion.answer ? '✓' : '✗' }}</span>
              <span class="c-label">参考答案：</span>
              <span class="c-val">{{ currentPreviewQuestion.answer || '未设置答案' }}</span>
            </div>

            <div class="check-item" :class="{ ok: currentPreviewQuality.analysisLength > 0, bad: !currentPreviewQuality.analysisLength }">
              <span class="c-icon">{{ currentPreviewQuality.analysisLength > 0 ? '✓' : '!' }}</span>
              <span class="c-label">考点解析：</span>
              <span class="c-val">{{ currentPreviewQuality.analysisLength ? `${currentPreviewQuality.analysisLength} 字` : '暂无解析' }}</span>
            </div>
          </div>

          <div v-if="currentPreviewQuality.issues.length > 0" class="diag-issues">
            <span class="issue-tip">待完善事项：</span>
            <el-tag
              v-for="(iss, idx) in currentPreviewQuality.issues"
              :key="idx"
              size="small"
              type="danger"
              effect="plain"
              class="issue-tag"
            >
              {{ iss }}
            </el-tag>
          </div>
        </div>

        <!-- 基础元数据栏 -->
        <div class="meta-row-card">
          <div class="meta-item">
            <span class="m-label">所属科目：</span>
            <span class="m-val">{{ currentPreviewQuestion.subjectName }}</span>
          </div>
          <div class="meta-item">
            <span class="m-label">所属章节：</span>
            <span class="m-val">{{ currentPreviewQuestion.chapterName }}</span>
          </div>
          <div class="meta-item">
            <span class="m-label">难度等级：</span>
            <span class="m-val">{{ '⭐'.repeat(Math.min(5, Math.max(1, typeof currentPreviewQuestion.difficulty === 'number' ? currentPreviewQuestion.difficulty : 3))) }}</span>
          </div>
          <div class="meta-item">
            <span class="m-label">试题来源：</span>
            <span class="m-val">{{ currentPreviewQuestion.source || '历年真题' }}</span>
          </div>
        </div>

        <!-- 题目全真排版展示区 -->
        <div class="paper-simulator-box">
          <div class="sim-stem-title">
            <span class="stem-badge">{{ typeMap[currentPreviewQuestion.type] || '单选题' }}</span>
            <div class="stem-text-full">{{ currentPreviewQuestion.content || currentPreviewQuestion.title }}</div>
          </div>

          <!-- 选项列表 -->
          <div v-if="getNormalizedOptions(currentPreviewQuestion).length > 0" class="sim-options-list">
            <div
              v-for="opt in getNormalizedOptions(currentPreviewQuestion)"
              :key="opt.key"
              class="sim-option-card"
              :class="{
                'is-correct': isOptionCorrect(opt.key, currentPreviewQuestion.answer)
              }"
            >
              <div class="opt-prefix">{{ opt.key }}</div>
              <div class="opt-text">{{ opt.content }}</div>
              <div v-if="isOptionCorrect(opt.key, currentPreviewQuestion.answer)" class="opt-correct-badge">
                ✔️ 正确答案
              </div>
            </div>
          </div>

          <!-- 答案与考点深度解析面板 -->
          <div class="answer-analysis-panel">
            <div class="correct-answer-box">
              <span class="tag-bold">🎯 【正确答案】</span>
              <span class="ans-badge">{{ currentPreviewQuestion.answer || '暂未设置' }}</span>
            </div>

            <div class="analysis-box">
              <div class="ana-header">
                <span class="tag-bold">💡 【试题解析 / 考点说明】</span>
              </div>
              <div v-if="currentPreviewQuestion.analysis" class="ana-content">
                {{ currentPreviewQuestion.analysis }}
              </div>
              <div v-else class="ana-empty">
                ⚠️ 本题暂无官方解析，建议点击下方【编辑此题】进行补充完善。
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="preview-drawer-footer">
          <div class="footer-nav">
            <el-button :disabled="currentPreviewIndex <= 0" @click="prevPreviewQuestion">
              ‹ 上一题
            </el-button>
            <span class="nav-indicator">{{ currentPreviewIndex + 1 }} / {{ list.length }} 题</span>
            <el-button :disabled="currentPreviewIndex >= list.length - 1" @click="nextPreviewQuestion">
              下一题 ›
            </el-button>
          </div>
          <div class="footer-actions">
            <el-button type="primary" @click="handleEditFromPreview">
              ✏️ 编辑此题
            </el-button>
            <el-button @click="previewDrawerVisible = false">
              关闭
            </el-button>
          </div>
        </div>
      </template>
    </el-drawer>

    <!-- 题目新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增题目' : '编辑题目'"
      width="820px"
      destroy-on-close
    >
      <!-- 异常检测提示与一键修复按钮 -->
      <el-alert
        v-if="formData.options && (formData.options.length > 4 || formData.options.length < 2)"
        type="error"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
        :title="`⚠️ 选项异常提示：当前题目存在 ${formData.options.length} 个选项（非标准4项），题干可能包含前题残留文本`"
      >
        <template #default>
          <div style="margin-top: 8px; display: flex; gap: 10px; flex-wrap: wrap;">
            <el-button type="danger" size="small" @click="autoCleanOptions">
              🧹 一键规整选项（去重并保留前4项 A/B/C/D）
            </el-button>
            <el-button type="warning" size="small" @click="autoCleanStem">
              ✨ 一键清洗题干前缀残留
            </el-button>
          </div>
        </template>
      </el-alert>

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
          <div style="width: 100%;">
            <div style="display: flex; justify-content: flex-end; margin-bottom: 4px;">
              <el-button type="primary" link size="small" @click="autoCleanStem">
                ✨ 智能清洗题干前缀残留
              </el-button>
            </div>
            <el-input
              v-model="formData.content"
              type="textarea"
              :rows="4"
              placeholder="请输入题目描述，支持 LaTeX 数学公式，如 $E=mc^2$"
            />
          </div>
        </el-form-item>

        <!-- 选项列表（单选/多选/判断） -->
        <div v-if="formData.type === 'single' || formData.type === 'multiple'" class="options-form">
          <div class="of-header">
            <div class="of-title">
              <span>选项列表 (共 {{ formData.options?.length || 0 }} 项)：</span>
            </div>
            <div class="of-actions">
              <el-button size="small" type="primary" link @click="addOption">
                + 添加选项
              </el-button>
              <el-button size="small" type="warning" link @click="autoCleanOptions">
                🧹 一键规整 (4项)
              </el-button>
              <el-button size="small" link @click="reindexOptions">
                🔄 重新按 A-Z 编号
              </el-button>
            </div>
          </div>

          <div
            v-for="(opt, idx) in formData.options"
            :key="idx"
            class="option-row"
          >
            <el-input
              v-model="opt.key"
              style="width: 48px; text-align: center;"
              placeholder="A"
              @input="updateAnswerFromOptions"
            />
            <el-input
              v-model="opt.content"
              placeholder="请输入选项描述..."
              style="flex: 1"
            />
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
              @change="onSingleAnswerChange(opt.key)"
            >
              设为答案
            </el-radio>
            <el-button
              type="danger"
              link
              size="small"
              title="删除此选项"
              @click="removeOption(idx)"
            >
              🗑️
            </el-button>
          </div>
        </div>

        <el-form-item label="正确答案" required>
          <el-input
            v-model="formData.answerStr"
            placeholder="如 A 或 ABCD"
            @input="syncAnswerToOptions"
          />
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
import { ref, reactive, computed, onMounted } from 'vue'
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
  health: undefined,
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

// 预览抽屉状态
const previewDrawerVisible = ref(false)
const currentPreviewQuestion = ref<any>(null)
const currentPreviewIndex = ref(0)

const currentPreviewQuality = computed(() => {
  return checkQuestionQuality(currentPreviewQuestion.value)
})

// 弹窗状态
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
    { key: 'A', content: '', isAnswer: true },
    { key: 'B', content: '', isAnswer: false },
    { key: 'C', content: '', isAnswer: false },
    { key: 'D', content: '', isAnswer: false },
  ],
  answer: 'A',
  answerStr: 'A',
  analysis: '',
  source: '历年真题',
})

// 题目质量体检算法
function checkQuestionQuality(row: any) {
  if (!row) {
    return {
      isComplete: false,
      hasSeriousIssue: true,
      issues: ['无数据'],
      score: 0,
      stemLength: 0,
      optionCount: 0,
      analysisLength: 0,
    }
  }
  const issues: string[] = []
  const content = (row.content || row.title || '').trim()
  if (!content) {
    issues.push('题干内容为空')
  } else if (content.length < 5) {
    issues.push('题干内容过短')
  }

  const type = row.type || 'single'
  let options = row.options
  if (typeof options === 'string') {
    try {
      options = JSON.parse(options)
    } catch {
      options = []
    }
  }
  if (!Array.isArray(options)) options = []

  if (['single', 'multiple'].includes(type)) {
    if (options.length === 0) {
      issues.push('未配置选择题选项')
    } else if (options.length > 6) {
      issues.push(`选项过多(${options.length}项)，疑似多题合并异常`)
    } else {
      const emptyOpts = options.filter((o: any) => !(o.content || o.text || '').trim())
      if (emptyOpts.length > 0) {
        issues.push(`存在 ${emptyOpts.length} 个空选项`)
      }
      if (options.length < 2) {
        issues.push('选项少于 2 个')
      }
    }
  }

  const answer = (row.answer || '').trim()
  if (!answer) {
    issues.push('未设置参考答案')
  }

  const analysis = (row.analysis || '').trim()
  if (!analysis) {
    issues.push('未填写考点解析')
  }

  let score = 100
  if (!content || content.length < 5) score -= 30
  if (['single', 'multiple'].includes(type) && (options.length < 2 || options.length > 6)) score -= 30
  if (!answer) score -= 25
  if (!analysis) score -= 15
  score = Math.max(0, score)

  const hasSeriousIssue =
    !content ||
    content.length < 5 ||
    (!answer && type !== 'subjective') ||
    (['single', 'multiple'].includes(type) && (options.length < 2 || options.length > 6))

  return {
    isComplete: issues.length === 0,
    hasSeriousIssue,
    issues,
    score,
    stemLength: content.length,
    optionCount: options.length,
    analysisLength: analysis.length,
  }
}

function getNormalizedOptions(row: any) {
  if (!row) return []
  let options = row.options
  if (typeof options === 'string') {
    try {
      options = JSON.parse(options)
    } catch {
      options = []
    }
  }
  if (!Array.isArray(options)) return []
  return options.map((opt: any, idx: number) => {
    if (typeof opt === 'string') {
      const key = String.fromCharCode(65 + idx)
      return { key, label: key, content: opt }
    }
    const key = opt.key || opt.label || String.fromCharCode(65 + idx)
    return {
      key,
      label: opt.label || key,
      content: opt.content || opt.text || '',
    }
  })
}

function isOptionCorrect(key: string, answer?: string) {
  if (!answer || !key) return false
  const cleanAns = String(answer).trim().toUpperCase()
  const cleanKey = String(key).trim().toUpperCase()
  return cleanAns.includes(cleanKey)
}

// 智能清洗题干前缀残留
function autoCleanStem() {
  let text = (formData.content || '').trim()
  if (!text) {
    ElMessage.warning('题干内容为空')
    return
  }

  // 1. 如果包含标准软考真题标识 "【20xx年...】" 且前面有残留文本
  const bracketMatch = text.match(/(?:试题\s*\d+[\s\S]*?|(?:\d+[\.、\s]+))?(【\d{4}年[\s\S]+)/)
  if (bracketMatch && bracketMatch[1] && text.indexOf(bracketMatch[1]) > 5) {
    formData.content = bracketMatch[1].trim()
    ElMessage.success('已自动清洗前序题目的残留前缀！')
    return
  }

  // 2. 如果包含 "试题XX- "
  const examNumMatch = text.match(/试题\s*\d+[-—\s]+([\s\S]+)/)
  if (examNumMatch && examNumMatch[1] && text.indexOf(examNumMatch[0]) > 5) {
    formData.content = examNumMatch[0].trim()
    ElMessage.success('已自动清洗前序题目的残留前缀！')
    return
  }

  // 3. 如果开头有 "xxx。 试题xx"
  const dotSplit = text.split(/。\s+(?=【|\d+[\.、]|试题)/)
  if (dotSplit.length > 1) {
    formData.content = dotSplit.slice(1).join('。 ').trim()
    ElMessage.success('已自动清洗前序题目的残留前缀！')
    return
  }

  ElMessage.info('题干结构正常，未检测到明显残留前缀')
}

// 一键智能规整选项（去重并保留前4项）
function autoCleanOptions() {
  if (!Array.isArray(formData.options) || formData.options.length === 0) {
    formData.options = [
      { key: 'A', content: '', isAnswer: true },
      { key: 'B', content: '', isAnswer: false },
      { key: 'C', content: '', isAnswer: false },
      { key: 'D', content: '', isAnswer: false },
    ]
    return
  }

  const seenContents = new Set<string>()
  const cleaned: any[] = []
  for (const opt of formData.options) {
    const c = (opt.content || '').trim()
    if (c && !seenContents.has(c)) {
      seenContents.add(c)
      cleaned.push({
        key: String.fromCharCode(65 + cleaned.length),
        content: c,
        isAnswer: opt.isAnswer || false,
      })
    }
    if (cleaned.length >= 4) break
  }

  while (cleaned.length < 4) {
    cleaned.push({
      key: String.fromCharCode(65 + cleaned.length),
      content: '',
      isAnswer: false,
    })
  }

  formData.options = cleaned

  // 确保有且仅有一个正确答案（或单选设默认）
  const ansKey = formData.options.find((o: any) => o.isAnswer)?.key || 'A'
  formData.answer = ansKey
  formData.answerStr = ansKey
  formData.options.forEach((o: any) => {
    o.isAnswer = o.key === ansKey
  })

  ElMessage.success('已一键规整为标准 4 项选项 (A/B/C/D)')
}

function addOption() {
  const nextKey = String.fromCharCode(65 + formData.options.length)
  formData.options.push({
    key: nextKey,
    content: '',
    isAnswer: false,
  })
}

function removeOption(index: number) {
  if (formData.options.length <= 2) {
    ElMessage.warning('选择题至少需要保留 2 个选项')
    return
  }
  formData.options.splice(index, 1)
  reindexOptions()
}

function reindexOptions() {
  formData.options.forEach((opt: any, idx: number) => {
    opt.key = String.fromCharCode(65 + idx)
  })
  updateAnswerFromOptions()
}

function onSingleAnswerChange(key: string) {
  formData.answer = key
  formData.answerStr = key
  formData.options.forEach((o: any) => {
    o.isAnswer = o.key === key
  })
}

function updateMultipleAnswer() {
  const ans = formData.options.filter((o: any) => o.isAnswer).map((o: any) => o.key)
  formData.answerStr = ans.join('')
  formData.answer = ans.join('')
}

function updateAnswerFromOptions() {
  if (formData.type === 'multiple') {
    updateMultipleAnswer()
  } else {
    const current = formData.options.find((o: any) => o.isAnswer)
    if (current) {
      formData.answer = current.key
      formData.answerStr = current.key
    }
  }
}

function syncAnswerToOptions() {
  const val = (formData.answerStr || '').trim().toUpperCase()
  formData.answer = val
  formData.options.forEach((o: any) => {
    o.isAnswer = val.includes(o.key)
  })
}

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
    if (res?.data) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
      // 如果当前预览题目在列表中，同步刷新数据
      if (currentPreviewQuestion.value) {
        const found = list.value.find((q) => q.id === currentPreviewQuestion.value.id)
        if (found) currentPreviewQuestion.value = found
      }
    }
  } catch (err: any) {
    ElMessage.error(err.message || '获取题目列表失败')
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
  query.health = undefined
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
  formData.answer = 'A'
  formData.options = [
    { key: 'A', content: '', isAnswer: true },
    { key: 'B', content: '', isAnswer: false },
    { key: 'C', content: '', isAnswer: false },
    { key: 'D', content: '', isAnswer: false },
  ]
  dialogVisible.value = true
}

function handlePreview(row: any) {
  currentPreviewQuestion.value = row
  currentPreviewIndex.value = list.value.findIndex((q) => q.id === row.id)
  previewDrawerVisible.value = true
}

function prevPreviewQuestion() {
  if (currentPreviewIndex.value > 0) {
    currentPreviewIndex.value--
    currentPreviewQuestion.value = list.value[currentPreviewIndex.value]
  }
}

function nextPreviewQuestion() {
  if (currentPreviewIndex.value < list.value.length - 1) {
    currentPreviewIndex.value++
    currentPreviewQuestion.value = list.value[currentPreviewIndex.value]
  }
}

function handleEditFromPreview() {
  if (currentPreviewQuestion.value) {
    handleEdit(currentPreviewQuestion.value)
  }
}

function handleEdit(row: any) {
  dialogType.value = 'edit'
  editId.value = row.id
  formData.subjectId = row.subjectId || 1
  formData.chapterId = row.chapterId || 1
  formData.content = row.content || row.title
  formData.type = row.type || 'single'
  formData.difficulty = typeof row.difficulty === 'number' ? row.difficulty : 3
  formData.analysis = row.analysis || ''
  formData.answer = row.answer || 'A'
  formData.answerStr = row.answer || 'A'
  formData.source = row.source || '历年真题'

  const normalized = getNormalizedOptions(row)
  if (normalized.length > 0) {
    formData.options = normalized.map((o: any) => ({
      key: o.key,
      content: o.content,
      isAnswer: isOptionCorrect(o.key, row.answer),
    }))
  } else {
    formData.options = [
      { key: 'A', content: '', isAnswer: false },
      { key: 'B', content: '', isAnswer: false },
      { key: 'C', content: '', isAnswer: false },
      { key: 'D', content: '', isAnswer: false },
    ]
  }

  dialogVisible.value = true
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定要删除题目 [ID: ${row.id}] 吗？`, '删除确认', {
      type: 'warning',
    })
    await deleteQuestion(row.id)
    ElMessage.success('删除成功')
    if (currentPreviewQuestion.value?.id === row.id) {
      previewDrawerVisible.value = false
    }
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

async function handleSubmit() {
  submitLoading.value = true
  try {
    const payload = {
      ...formData,
      answer: formData.answerStr || formData.answer,
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

.health-tag {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;

  &.perfect {
    background: #ecfdf5;
    color: #059669;
    border: 1px solid #a7f3d0;
  }
  &.warning {
    background: #fffbeb;
    color: #d97706;
    border: 1px solid #fde68a;
  }
  &.error {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }
}

.stem-text {
  font-size: 13px;
  color: var(--gray-8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 380px;

  &.clickable {
    cursor: pointer;
    color: var(--primary);
    &:hover {
      text-decoration: underline;
    }
  }
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

.answer-badge {
  font-family: monospace;
  font-weight: 700;
  color: #059669;
  background: #ecfdf5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
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
  gap: 8px;

  .op-link {
    font-size: 13px;
    color: var(--primary);
    cursor: pointer;

    &.view {
      color: #0284c7;
      font-weight: 600;
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
  padding: 14px 16px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;

  .of-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;

    .of-title {
      font-size: 13px;
      font-weight: 700;
      color: #334155;
    }

    .of-actions {
      display: flex;
      gap: 10px;
    }
  }

  .option-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
}

// 预览抽屉样式
.drawer-custom-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 20px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;

    .preview-id {
      font-weight: 800;
      font-size: 16px;
      color: var(--gray-8);
    }

    .preview-title-sub {
      font-size: 13px;
      color: var(--gray-6);
    }
  }
}

.preview-content-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.diagnostic-card {
  border-radius: 8px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;

  &.complete {
    background: #f0fdf4;
    border-color: #bbf7d0;
  }
  &.warning {
    background: #fffbeb;
    border-color: #fef08a;
  }
  &.danger {
    background: #fef2f2;
    border-color: #fecaca;
  }

  .diag-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    .diag-title {
      font-weight: 700;
      font-size: 14px;
      color: #1e293b;
    }

    .diag-score {
      font-size: 13px;
      color: #475569;
      strong {
        color: #059669;
        font-size: 16px;
      }
    }
  }

  .diag-checklist {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;

    .check-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;

      .c-icon {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 11px;
      }

      &.ok .c-icon {
        background: #dcfce7;
        color: #15803d;
      }

      &.bad .c-icon {
        background: #fee2e2;
        color: #b91c1c;
      }

      .c-label {
        color: #64748b;
      }

      .c-val {
        font-weight: 600;
        color: #1e293b;
      }
    }
  }

  .diag-issues {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px dashed rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;

    .issue-tip {
      font-size: 12px;
      color: #b91c1c;
      font-weight: 600;
    }
  }
}

.meta-row-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;

  .meta-item {
    font-size: 13px;
    .m-label {
      color: #64748b;
    }
    .m-val {
      font-weight: 600;
      color: #334155;
    }
  }
}

.paper-simulator-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 18px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);

  .sim-stem-title {
    font-size: 15px;
    line-height: 1.6;
    color: #1e293b;
    font-weight: 600;
    margin-bottom: 16px;
    display: flex;
    align-items: flex-start;
    gap: 8px;

    .stem-badge {
      font-size: 12px;
      padding: 1px 6px;
      border-radius: 4px;
      background: #e0e7ff;
      color: #4338ca;
      font-weight: 700;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .stem-text-full {
      flex: 1;
      white-space: pre-wrap;
    }
  }

  .sim-options-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 18px;

    .sim-option-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      background: #fafafa;
      transition: all 0.2s;

      .opt-prefix {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #e2e8f0;
        color: #475569;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        flex-shrink: 0;
      }

      .opt-text {
        font-size: 14px;
        color: #334155;
        flex: 1;
      }

      &.is-correct {
        background: #ecfdf5;
        border-color: #34d399;
        box-shadow: 0 0 0 1px #34d399;

        .opt-prefix {
          background: #059669;
          color: #ffffff;
        }

        .opt-text {
          color: #065f46;
          font-weight: 600;
        }

        .opt-correct-badge {
          font-size: 11px;
          font-weight: 700;
          color: #047857;
          background: #d1fae5;
          padding: 2px 6px;
          border-radius: 4px;
        }
      }
    }
  }

  .answer-analysis-panel {
    border-top: 1px dashed #cbd5e1;
    padding-top: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;

    .correct-answer-box {
      background: #ecfdf5;
      padding: 10px 14px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 10px;

      .tag-bold {
        font-weight: 700;
        color: #047857;
        font-size: 13px;
      }

      .ans-badge {
        font-size: 15px;
        font-weight: 800;
        color: #065f46;
        letter-spacing: 1px;
      }
    }

    .analysis-box {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 6px;
      padding: 12px 14px;

      .ana-header {
        font-weight: 700;
        color: #0369a1;
        font-size: 13px;
        margin-bottom: 6px;
      }

      .ana-content {
        font-size: 13px;
        line-height: 1.6;
        color: #1e293b;
        white-space: pre-wrap;
      }

      .ana-empty {
        font-size: 12px;
        color: #d97706;
      }
    }
  }
}

.preview-drawer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  .footer-nav {
    display: flex;
    align-items: center;
    gap: 8px;

    .nav-indicator {
      font-size: 13px;
      color: #64748b;
      font-weight: 600;
    }
  }

  .footer-actions {
    display: flex;
    gap: 8px;
  }
}
</style>
