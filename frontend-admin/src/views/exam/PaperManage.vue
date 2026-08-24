<template>
  <div class="paper-manage-page">
    <div class="table-panel">
      <!-- 筛选与操作栏 -->
      <div class="table-toolbar">
        <div class="filter-bar">
          <el-select
            v-model="query.subjectId"
            placeholder="全部科目"
            clearable
            style="width: 220px"
            @change="fetchList"
          >
            <el-option
              v-for="s in subjects"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>

          <el-select
            v-model="query.type"
            placeholder="试卷类型"
            clearable
            style="width: 140px"
            @change="fetchList"
          >
            <el-option label="历年真题" value="real" />
            <el-option label="全真模拟" value="mock" />
            <el-option label="专项精练" value="practice" />
          </el-select>

          <el-button type="primary" @click="fetchList">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </div>

        <div class="action-bar">
          <el-button type="warning" @click="openImportDialog">
            📥 导入试卷
          </el-button>
          <el-button type="primary" @click="handleAddPaper">
            + 手动新建试卷
          </el-button>
          <el-button type="success" @click="openAutoDialog">
            ⚡ 智能组卷
          </el-button>
        </div>
      </div>

      <!-- 试卷表格 -->
      <el-table v-loading="loading" :data="list" class="custom-table">
        <el-table-column prop="id" label="ID" width="70" align="center" />

        <el-table-column label="试卷名称" min-width="280">
          <template #default="{ row }">
            <div class="paper-title-cell">
              <span class="p-type-tag" :class="row.type || row.paperType">
                {{ formatType(row.type || row.paperType) }}
              </span>
              <span class="p-name">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="subjectName" label="所属科目" min-width="160" />

        <el-table-column label="题量与总分" width="130" align="center">
          <template #default="{ row }">
            <div class="score-info">
              <span>{{ row.questionCount || (row.questionIds ? row.questionIds.length : 75) }} 题</span>
              <span class="sep">/</span>
              <span>{{ row.totalScore || 75 }} 分</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="考试时长" width="110" align="center">
          <template #default="{ row }">
            <span>{{ row.duration || row.totalTime || 150 }} 分钟</span>
          </template>
        </el-table-column>

        <el-table-column label="及格线" width="100" align="center">
          <template #default="{ row }">
            <span class="pass-score">{{ row.passScore || 45 }} 分</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 || row.status === 'published' ? 'success' : 'info'" size="small">
              {{ row.status === 1 || row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <div class="table-ops">
              <span class="op-link" @click="handlePreview(row)">预览</span>
              <span class="op-link" @click="handleEditPaper(row)">重命名</span>
              <span class="op-link danger" @click="handleDeletePaper(row)">删除</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 📥 导入试卷弹窗 -->
    <el-dialog
      v-model="importDialogVisible"
      title="📥 导入完整试卷 (Word / Excel / 文本批量解析入卷)"
      width="780px"
      destroy-on-close
    >
      <el-form :model="importForm" label-width="95px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属科目" required>
              <el-select v-model="importForm.subjectId" style="width: 100%">
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
            <el-form-item label="试卷类型" required>
              <el-select v-model="importForm.type" style="width: 100%">
                <el-option label="历年真题" value="real" />
                <el-option label="全真模拟" value="mock" />
                <el-option label="专项精练" value="practice" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="试卷名称" required>
          <el-input
            v-model="importForm.name"
            placeholder="如：2024年下半年系统集成项目管理工程师真题（上午综合知识）"
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="考试时长">
              <el-input-number v-model="importForm.duration" :min="30" :max="240" :step="10" />
              <span style="margin-left: 8px; color: var(--text-muted)">分钟</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="试卷年份">
              <el-input-number v-model="importForm.year" :min="2010" :max="2035" />
              <span style="margin-left: 8px; color: var(--text-muted)">年</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="试卷文档">
          <div style="width: 100%">
            <div style="display: flex; gap: 12px; margin-bottom: 10px; align-items: center">
              <el-button type="primary" plain @click="triggerPaperUpload">
                📎 上传 Word (.docx) / Excel (.xlsx) 试卷文件
              </el-button>
              <span v-if="parsedQuestions.length > 0" style="color: var(--success); font-weight: 600">
                ✅ 已解析出 {{ parsedQuestions.length }} 道试题
              </span>
              <span v-else style="color: var(--text-muted); font-size: 13px">
                支持标准题干、选项A/B/C/D、答案与解析自动提取
              </span>
            </div>
            <input
              ref="paperFileInputRef"
              type="file"
              accept=".docx,.xlsx,.xls,.txt"
              style="display: none"
              @change="onPaperFileSelected"
            />
          </div>
        </el-form-item>

        <el-form-item label="或粘贴试卷">
          <el-input
            v-model="paperRawText"
            type="textarea"
            :rows="6"
            placeholder="也可直接粘贴整套试卷文本内容，自动提取题干、选项、答案与解析..."
            @input="onPaperTextInput"
          />
        </el-form-item>

        <!-- 试题解析列表预览 -->
        <div v-if="parsedQuestions.length > 0" style="margin-top: 10px">
          <div style="font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px">
            试卷题目解析预览（前 3 题展示）：
          </div>
          <div class="parsed-preview-box">
            <div
              v-for="(q, idx) in parsedQuestions.slice(0, 3)"
              :key="idx"
              class="preview-q-item"
            >
              <div class="pqi-title">
                <strong>{{ idx + 1 }}. [{{ q.type === 'single' ? '单选' : q.type === 'multiple' ? '多选' : '问答' }}]</strong>
                {{ q.content }}
              </div>
              <div v-if="q.options && q.options.length" class="pqi-opts">
                <span v-for="opt in q.options" :key="opt.key" style="margin-right: 12px">
                  {{ opt.key }}. {{ opt.content }}
                </span>
              </div>
              <div class="pqi-ans">
                <span style="color: var(--success); font-weight: 600">【答案】{{ q.answer }}</span>
                <span v-if="q.analysis" style="margin-left: 12px; color: var(--text-muted)">【解析】{{ q.analysis }}</span>
              </div>
            </div>
            <div v-if="parsedQuestions.length > 3" style="text-align: center; color: var(--text-muted); font-size: 12px; padding-top: 4px">
              ... 及其他 {{ parsedQuestions.length - 3 }} 道题目，全部将一并入库建卷
            </div>
          </div>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="importLoading"
          :disabled="parsedQuestions.length === 0 && !paperRawText.trim()"
          @click="submitImportPaper"
        >
          确认导入试卷并生成 (共 {{ parsedQuestions.length }} 题)
        </el-button>
      </template>
    </el-dialog>

    <!-- 智能组卷弹窗 -->
    <el-dialog
      v-model="autoDialogVisible"
      title="⚡ 软考智能组卷引擎"
      width="560px"
      destroy-on-close
    >
      <el-form :model="autoForm" label-width="100px">
        <el-form-item label="目标科目" required>
          <el-select v-model="autoForm.subjectId" style="width: 100%">
            <el-option
              v-for="s in subjects"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="试卷名称" required>
          <el-input v-model="autoForm.name" placeholder="如：2026年系统集成全真模拟卷（一）" />
        </el-form-item>

        <el-form-item label="试卷类型">
          <el-select v-model="autoForm.type" style="width: 100%">
            <el-option label="全真模拟" value="mock" />
            <el-option label="历年真题" value="real" />
            <el-option label="专项精练" value="practice" />
          </el-select>
        </el-form-item>

        <el-form-item label="考试时长">
          <el-input-number v-model="autoForm.totalTime" :min="30" :max="240" :step="10" />
          <span style="margin-left: 10px; color: var(--gray-5)">分钟</span>
        </el-form-item>

        <el-form-item label="试卷题量">
          <el-input-number v-model="autoForm.questionCount" :min="5" :max="150" :step="5" />
          <span style="margin-left: 10px; color: var(--gray-5)">道题</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="autoDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="autoLoading" @click="submitAutoPaper">
          开始自动组卷并生成
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'
import {
  getPaperList,
  createPaper,
  updatePaper,
  deletePaper,
  autoGeneratePaper,
  importPaper,
  getAllSubjects,
} from '@/api/exam'

const loading = ref(false)
const list = ref<any[]>([])
const subjects = ref<{ label: string; value: number }[]>([])

const query = reactive<any>({
  page: 1,
  pageSize: 50,
  subjectId: undefined,
  type: '',
})

// 智能组卷
const autoDialogVisible = ref(false)
const autoLoading = ref(false)
const autoForm = reactive({
  subjectId: 1,
  name: '2026年系统集成全真模拟卷（一）',
  type: 'mock',
  totalTime: 150,
  questionCount: 75,
})

// 导入试卷
const importDialogVisible = ref(false)
const importLoading = ref(false)
const paperFileInputRef = ref<HTMLInputElement | null>(null)
const paperRawText = ref('')
const parsedQuestions = ref<any[]>([])
const importForm = reactive({
  subjectId: 1,
  name: '',
  type: 'real',
  duration: 150,
  year: 2024,
})

function formatType(type: string) {
  if (type === 'real') return '真题'
  if (type === 'mock') return '模拟'
  if (type === 'practice') return '精练'
  return '试卷'
}

function resetQuery() {
  query.subjectId = undefined
  query.type = ''
  fetchList()
}

async function loadSubjects() {
  try {
    const res = await getAllSubjects()
    if (res?.data) {
      subjects.value = res.data.map((s: any) => ({ label: s.name, value: Number(s.id) }))
      if (subjects.value.length > 0) {
        autoForm.subjectId = subjects.value[0].value
        importForm.subjectId = subjects.value[0].value
      }
    }
  } catch {
    // ignore
  }
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getPaperList({
      page: query.page,
      pageSize: query.pageSize,
      subjectId: query.subjectId || undefined,
      status: undefined,
    })
    if (res?.data?.list) {
      list.value = res.data.list
    }
  } catch (err: any) {
    ElMessage.error(err.message || '获取试卷列表失败')
  } finally {
    loading.value = false
  }
}

function handleAddPaper() {
  ElMessageBox.prompt('请输入试卷名称', '新建试卷', {
    confirmButtonText: '创建',
    cancelButtonText: '取消',
    inputPattern: /\S+/,
    inputErrorMessage: '试卷名称不能为空',
  }).then(async ({ value }) => {
    try {
      await createPaper({
        name: value,
        subjectId: query.subjectId || (subjects.value[0]?.value || 1),
        type: 'mock' as any,
        totalTime: 150,
        duration: 150,
        totalScore: 75,
        passScore: 45,
        status: 'published' as any,
      })
      ElMessage.success(`试卷「${value}」创建成功！`)
      fetchList()
    } catch (err: any) {
      ElMessage.error(err.message || '创建试卷失败')
    }
  })
}

function openAutoDialog() {
  autoDialogVisible.value = true
}

async function submitAutoPaper() {
  autoLoading.value = true
  try {
    await autoGeneratePaper({
      subjectId: autoForm.subjectId,
      name: autoForm.name,
      totalTime: autoForm.totalTime,
      totalScore: autoForm.questionCount,
      passScore: Math.round(autoForm.questionCount * 0.6),
      rules: [
        {
          type: 'single',
          difficulty: 'medium',
          chapterIds: [],
          count: autoForm.questionCount,
          scorePerQuestion: 1,
        },
      ],
    })
    ElMessage.success('智能组卷成功，已自动抽取题库试题完成组卷！')
    autoDialogVisible.value = false
    fetchList()
  } catch (err: any) {
    ElMessage.error(err.message || '智能组卷失败')
  } finally {
    autoLoading.value = false
  }
}

// 导入试卷逻辑
function openImportDialog() {
  importForm.name = `2024年软考真题试卷_${new Date().getMonth() + 1}月`
  importForm.subjectId = query.subjectId || (subjects.value[0]?.value || 1)
  importForm.type = 'real'
  importForm.duration = 150
  importForm.year = 2024
  paperRawText.value = ''
  parsedQuestions.value = []
  importDialogVisible.value = true
}

function triggerPaperUpload() {
  paperFileInputRef.value?.click()
}

async function onPaperFileSelected(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files || !files.length) return
  const file = files[0]
  
  // 提取试卷名
  const cleanBaseName = file.name.replace(/\.[^/.]+$/, '')
  if (cleanBaseName && cleanBaseName.length >= 3) {
    importForm.name = cleanBaseName
  }

  ElMessage.info(`正在解析试卷「${file.name}」...`)
  try {
    if (file.name.endsWith('.docx')) {
      const buffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer: buffer })
      parseTextToQuestions(result.value)
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })
      parseExcelToQuestions(rows)
    } else {
      const text = await file.text()
      parseTextToQuestions(text)
    }
  } catch (err: any) {
    ElMessage.error(`试卷解析失败: ${err.message}`)
  } finally {
    if (paperFileInputRef.value) paperFileInputRef.value.value = ''
  }
}

function onPaperTextInput() {
  if (paperRawText.value.trim()) {
    parseTextToQuestions(paperRawText.value)
  }
}

// Excel 题目解析
function parseExcelToQuestions(rows: any[]) {
  const questions: any[] = []
  rows.forEach((r: any, idx: number) => {
    const content = String(r['题干'] || r['题目'] || r['content'] || r['title'] || '').trim()
    if (!content) return
    const answer = String(r['答案'] || r['正确答案'] || r['answer'] || 'A').trim().toUpperCase()
    const analysis = String(r['解析'] || r['试题解析'] || r['analysis'] || '').trim()
    const options: any[] = []
    ;['A', 'B', 'C', 'D', 'E'].forEach((k) => {
      const opt = String(r[`选项${k}`] || r[k] || '').trim()
      if (opt) options.push({ key: k, label: k, content: opt })
    })
    questions.push({
      rowNo: idx + 1,
      type: options.length > 0 ? (answer.length > 1 ? 'multiple' : 'single') : 'essay',
      content,
      options,
      answer,
      analysis,
      score: 1,
    })
  })
  parsedQuestions.value = questions
  ElMessage.success(`从 Excel 成功解析出 ${questions.length} 道试题！`)
}

// 文本与 Word 试卷解析状态机
function parseTextToQuestions(rawText: string) {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const questions: any[] = []
  let currentQ: any = null

  const isQuestionStart = (line: string) => {
    return /^(\d+)[、.．\s]\s*(.+)/.test(line) || /^[（(](\d+)[）)]\s*(.+)/.test(line)
  }

  const saveCurrentQ = () => {
    if (!currentQ) return
    if (currentQ.content) {
      if (!currentQ.answer) currentQ.answer = 'A'
      if (currentQ.options && currentQ.options.length >= 2 && currentQ.type === 'essay') {
        currentQ.type = currentQ.answer.length > 1 ? 'multiple' : 'single'
      }
      questions.push({ ...currentQ })
    }
    currentQ = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (isQuestionStart(line)) {
      saveCurrentQ()
      const m = line.match(/^(\d+)[、.．\s]\s*(.+)/) || line.match(/^[（(](\d+)[）)]\s*(.+)/)
      const qNum = m ? m[1] : String(questions.length + 1)
      const titleContent = m ? m[2] : line

      let type = 'single'
      if (titleContent.includes('多选')) type = 'multiple'
      else if (titleContent.includes('判断')) type = 'judge'
      else if (titleContent.includes('问答') || titleContent.includes('简答')) type = 'essay'

      currentQ = {
        rowNo: Number(qNum) || questions.length + 1,
        type,
        content: titleContent.replace(/【(?:单选|多选|判断|问答)题?】/g, '').trim(),
        options: [],
        answer: '',
        analysis: '',
        score: 1,
      }
      continue
    }

    if (!currentQ) continue

    // 答案识别
    const ansMatch = line.match(/【?(?:参考)?答案】?[:：\s]*([A-Za-z对错正确错误√×]+)/i)
    if (ansMatch) {
      currentQ.answer = ansMatch[1].trim().toUpperCase()
      continue
    }

    // 解析识别
    const anaMatch = line.match(/【?(?:试题)?解析】?[:：\s]*(.*)/i)
    if (anaMatch) {
      currentQ.analysis = anaMatch[1].trim()
      continue
    }

    // 选项识别 A/B/C/D
    const optMatch = line.match(/^([A-Ea-e])[\.、．\s]\s*(.+)/) || line.match(/^[（(]([A-Ea-e])[）)]\s*(.+)/)
    if (optMatch) {
      const key = optMatch[1].toUpperCase()
      currentQ.options.push({ key, label: key, content: optMatch[2].trim() })
      continue
    }

    // 多行选项识别（如 A. xxx B. yyy在一行）
    const inlineOptRegex = /([A-Ea-e])[\.、．\s]\s*([^A-Ea-e]+)/g
    let inlineM: RegExpExecArray | null
    let foundInline = false
    while ((inlineM = inlineOptRegex.exec(line)) !== null) {
      foundInline = true
      const key = inlineM[1].toUpperCase()
      currentQ.options.push({ key, label: key, content: inlineM[2].trim() })
    }
    if (foundInline) continue

    // 题干/解析多行追加
    if (currentQ.analysis) {
      currentQ.analysis += '\n' + line
    } else if (currentQ.options.length === 0) {
      currentQ.content += ' ' + line
    }
  }

  saveCurrentQ()
  parsedQuestions.value = questions
  if (questions.length > 0) {
    ElMessage.success(`试卷解析完毕，共提取出 ${questions.length} 道试题！`)
  } else {
    ElMessage.warning('未能识别出符合格式的试题，请检查文档题号与选项标识')
  }
}

// 提交导入试卷
async function submitImportPaper() {
  if (!importForm.name.trim()) return ElMessage.warning('请输入试卷名称')
  if (parsedQuestions.value.length === 0) return ElMessage.warning('试题列表为空，请先上传文档或粘贴试卷')

  importLoading.value = true
  try {
    const res = await importPaper({
      subjectId: importForm.subjectId,
      name: importForm.name,
      type: importForm.type,
      duration: importForm.duration,
      year: importForm.year,
      totalScore: parsedQuestions.value.length,
      passScore: Math.round(parsedQuestions.value.length * 0.6),
      questions: parsedQuestions.value,
    })
    ElMessage.success(`试卷「${importForm.name}」导入成功，共包含 ${res.data?.questionCount || parsedQuestions.value.length} 道试题！`)
    importDialogVisible.value = false
    fetchList()
  } catch (err: any) {
    ElMessage.error(err.message || '导入试卷失败')
  } finally {
    importLoading.value = false
  }
}

function handlePreview(row: any) {
  ElMessageBox.alert(
    `试卷名称：${row.name}\n所属科目：${row.subjectName}\n考试时长：${row.duration || row.totalTime || 150}分钟\n试题总数：${row.questionCount || (row.questionIds ? row.questionIds.length : 75)}道\n及格分值：${row.passScore || 45}分`,
    '试卷信息详情',
  )
}

function handleEditPaper(row: any) {
  ElMessageBox.prompt('修改试卷名称', '重命名试卷', {
    inputValue: row.name,
    inputPattern: /\S+/,
    inputErrorMessage: '试卷名称不能为空',
  }).then(async ({ value }) => {
    try {
      await updatePaper(row.id, { name: value })
      ElMessage.success('已保存修改')
      fetchList()
    } catch (err: any) {
      ElMessage.error(err.message || '修改失败')
    }
  })
}

async function handleDeletePaper(row: any) {
  try {
    await ElMessageBox.confirm(`确定要删除试卷「${row.name}」吗？`, '删除确认', {
      type: 'warning',
    })
    await deletePaper(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch {
    // cancel
  }
}

onMounted(() => {
  loadSubjects()
  fetchList()
})
</script>

<style scoped lang="scss">
.paper-manage-page {
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
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--gray-2);
  flex-wrap: wrap;
  gap: 12px;

  .filter-bar,
  .action-bar {
    display: flex;
    gap: 12px;
    align-items: center;
  }
}

.paper-title-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .p-type-tag {
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: 600;
    flex-shrink: 0;

    &.real {
      background: #eff6ff;
      color: #3b82f6;
    }
    &.mock {
      background: #fdf2f8;
      color: #ec4899;
    }
    &.practice {
      background: #f0fdf4;
      color: #22c55e;
    }
  }

  .p-name {
    font-weight: 500;
    color: var(--gray-8);
  }
}

.score-info {
  font-size: 13px;
  color: var(--gray-7);

  .sep {
    color: var(--gray-4);
    margin: 0 4px;
  }
}

.pass-score {
  font-weight: 600;
  color: var(--success);
}

.table-ops {
  display: flex;
  gap: 12px;
  justify-content: center;

  .op-link {
    font-size: 13px;
    color: var(--primary);
    cursor: pointer;

    &.danger {
      color: var(--danger);
    }

    &:hover {
      text-decoration: underline;
    }
  }
}

/* 解析试题预览框 */
.parsed-preview-box {
  background: var(--gray-1);
  border-radius: 6px;
  padding: 12px 14px;
  border: 1px dashed var(--gray-3);
  max-height: 220px;
  overflow-y: auto;

  .preview-q-item {
    padding-bottom: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid var(--gray-2);

    &:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .pqi-title {
      font-size: 13px;
      color: var(--gray-8);
      line-height: 1.4;
      margin-bottom: 4px;
    }

    .pqi-opts {
      font-size: 12px;
      color: var(--gray-6);
      margin-bottom: 4px;
    }

    .pqi-ans {
      font-size: 12px;
    }
  }
}
</style>
