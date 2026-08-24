<template>
  <div class="question-import-page">
    <!-- 顶部上传卡片 -->
    <div class="panel upload-panel">
      <div class="panel-header">
        <div class="ph-title">📥 批量导入题目</div>
        <div class="ph-templates">
          <a class="tpl-link" @click="downloadTemplate('excel')">📊 下载 Excel 标准模板 (.xlsx)</a>
          <a class="tpl-link" @click="downloadTemplate('word')">📄 下载 Word 标准模板 (.docx)</a>
        </div>
      </div>

      <div class="upload-config-row">
        <div class="config-item">
          <span class="label">目标科目：</span>
          <el-select v-model="selectedSubjectId" placeholder="请选择科目" style="width: 260px">
            <el-option
              v-for="s in subjects"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </div>

        <div class="config-item">
          <span class="label">导入格式：</span>
          <el-radio-group v-model="importMode">
            <el-radio-button value="excel">Excel 批量导入</el-radio-button>
            <el-radio-button value="word">Word / 文本解析</el-radio-button>
            <el-radio-button value="ai">AI 文本智能识别</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 拖拽上传框 (Excel / Word / 文本) -->
      <div v-if="importMode !== 'ai'" class="drop-zone" @click="triggerUpload">
        <input
          ref="fileInputRef"
          type="file"
          :accept="importMode === 'excel' ? '.xlsx,.xls,.csv' : '.docx,.doc,.txt'"
          style="display: none"
          @change="onFileSelected"
        />
        <div class="dz-icon">
          {{ importMode === 'excel' ? '📊' : '📑' }}
        </div>
        <div class="dz-text">点击或将 {{ importMode === 'excel' ? 'Excel 表格' : 'Word / 试卷文本' }} 文件拖拽至此处</div>
        <div class="dz-sub">
          支持 {{ importMode === 'excel' ? '.xlsx / .xls / .csv' : '.docx / .doc / .txt' }} 格式文件，单批次建议不超过 500 道题
        </div>
      </div>

      <!-- AI 文本直接粘贴 -->
      <div v-else class="ai-text-zone">
        <div class="ai-zone-header">
          <span class="ai-zone-tip">💡 粘贴任意格式的题目文本（支持真题试卷、网页复制、题干+选项ABCD+答案解析），AI 将智能分拆与结构化提取：</span>
          <el-button size="small" type="primary" link @click="fillSampleAiText">填入示例试题文本</el-button>
        </div>
        <el-input
          v-model="aiText"
          type="textarea"
          :rows="8"
          placeholder="请直接在此处粘贴题目文本，如：&#10;1. 国家信息化体系六要素中，处于核心位置的是哪个要素？&#10;A. 信息资源&#10;B. 信息网络&#10;C. 信息技术应用&#10;D. 信息化人才&#10;【答案】A&#10;【解析】信息资源是国家信息化体系的六要素之一，处于核心位置。"
        />
        <div class="ai-btn-row">
          <el-button type="primary" size="default" :loading="parsing" @click="startAIParsing">
            🤖 开始 AI 结构化识别
          </el-button>
        </div>
      </div>
    </div>

    <!-- 导入预览与校验表（解析后展示） -->
    <div v-if="previewList.length > 0" class="panel preview-panel">
      <div class="panel-header">
        <div class="ph-title">
          <span>📋 解析校验预览</span>
          <span class="ph-badge">共 {{ previewList.length }} 道题</span>
          <span v-if="errorCount > 0" class="ph-badge error-badge">⚠️ {{ errorCount }} 道格式待修正</span>
          <span v-else class="ph-badge success-badge">✓ 全部格式合规</span>
        </div>
        <div class="ph-actions">
          <el-button size="small" @click="previewList = []">清空预览</el-button>
          <el-button
            type="primary"
            size="small"
            :loading="importingLoading"
            :disabled="previewList.length === 0"
            @click="commitImport"
          >
            🚀 确认全部入库 ({{ validList.length }}题)
          </el-button>
        </div>
      </div>

      <el-table :data="previewList" class="custom-table" border stripe max-height="600">
        <el-table-column prop="rowNo" label="序号" width="65" align="center" />
        <el-table-column prop="type" label="题型" width="85" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)" size="small">
              {{ row.typeText || row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="chapter" label="对应章节" width="160" show-overflow-tooltip />
        <el-table-column prop="title" label="题干内容" min-width="260">
          <template #default="{ row }">
            <div class="question-stem-box">
              <div class="stem-title">{{ row.content || row.title }}</div>
              <div v-if="row.options && row.options.length > 0" class="stem-options">
                <span v-for="opt in row.options" :key="opt.key" class="opt-pill">
                  <strong>{{ opt.label }}.</strong> {{ opt.content }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="answer" label="答案" width="90" align="center">
          <template #default="{ row }">
            <span class="answer-badge">{{ row.answer }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="analysis" label="解析说明" min-width="180" show-overflow-tooltip />
        <el-table-column label="校验状态" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.valid" class="val-tag success">✓ 格式合规</span>
            <span v-else class="val-tag error" :title="row.errorMsg">✗ {{ row.errorMsg }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row, $index }">
            <div class="row-ops">
              <el-button type="danger" link size="small" @click="removePreviewRow($index)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 历史导入批次记录 -->
    <div class="panel history-panel">
      <div class="panel-header">
        <div class="ph-title">📜 历史导入批次记录</div>
        <el-button size="small" :loading="recordsLoading" @click="loadRecords">刷新记录</el-button>
      </div>

      <el-table v-loading="recordsLoading" :data="historyRecords" class="custom-table" border stripe>
        <el-table-column prop="id" label="批次ID" width="130" align="center" />
        <el-table-column prop="createdAt" label="导入时间" width="180" />
        <el-table-column prop="type" label="导入方式" width="130" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ formatImportType(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fileName" label="文件名 / 来源" min-width="220" show-overflow-tooltip />
        <el-table-column prop="subjectName" label="目标科目" width="200" show-overflow-tooltip />
        <el-table-column label="导入统计" width="140" align="center">
          <template #default="{ row }">
            <span style="color: var(--success); font-weight: 600">成功 {{ row.successCount || 0 }}</span>
            <span v-if="row.failCount > 0" style="color: var(--danger); font-weight: 600; margin-left: 6px">
              失败 {{ row.failCount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <span class="status-pill" :class="row.status">
              {{ row.status === 'success' ? '导入成功' : '部分失败' }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'
import { getAllSubjects } from '@/api/exam'
import { getImportRecords, importQuestions } from '@/api/question'
import { parseQuestions } from '@/api/ai'

const subjects = ref<{ label: string; value: number }[]>([])
const selectedSubjectId = ref<number>(1)
const importMode = ref<'excel' | 'word' | 'ai'>('excel')
const fileInputRef = ref<HTMLInputElement | null>(null)
const currentFileName = ref<string>('')
const aiText = ref('')
const parsing = ref(false)
const importingLoading = ref(false)
const recordsLoading = ref(false)

const previewList = ref<any[]>([])
const historyRecords = ref<any[]>([])

const errorCount = computed(() => previewList.value.filter((p) => !p.valid).length)
const validList = computed(() => previewList.value.filter((p) => p.valid))

function getTypeTagType(type: string) {
  if (type === 'single') return 'primary'
  if (type === 'multiple') return 'warning'
  if (type === 'judge') return 'success'
  if (type === 'essay') return 'info'
  return 'primary'
}

function formatImportType(type: string) {
  if (type === 'excel') return 'Excel 批量'
  if (type === 'word') return 'Word 试卷解析'
  if (type === 'ai') return 'AI 智能识别'
  return type || '批量导入'
}

async function loadSubjects() {
  try {
    const res = await getAllSubjects()
    if (res?.data && Array.isArray(res.data)) {
      subjects.value = res.data.map((s: any) => ({ label: s.name, value: Number(s.id) }))
      if (subjects.value.length > 0) selectedSubjectId.value = subjects.value[0].value
    }
  } catch {
    subjects.value = [
      { label: '系统集成项目管理工程师', value: 1 },
      { label: '信息系统项目管理师', value: 2 },
    ]
  }
}

async function loadRecords() {
  recordsLoading.value = true
  try {
    const res = await getImportRecords({ page: 1, pageSize: 15 })
    if (res?.data?.list) {
      historyRecords.value = res.data.list.map((r: any) => ({
        id: r.id,
        createdAt: r.createdAt ? r.createdAt.replace('T', ' ').substring(0, 16) : '刚刚',
        type: r.type || 'excel',
        fileName: r.fileName || '批量试题导入.xlsx',
        subjectName: r.subjectName || '系统集成项目管理工程师',
        successCount: r.successCount ?? r.totalCount ?? 0,
        failCount: r.failCount || 0,
        status: r.status || 'success',
      }))
    }
  } catch {
    // 默认空列表
  } finally {
    recordsLoading.value = false
  }
}

function triggerUpload() {
  fileInputRef.value?.click()
}

// 示例 AI 文本
function fillSampleAiText() {
  aiText.value = `1. 国家信息化体系六要素中，处于核心位置的是哪个要素？
A. 信息资源
B. 信息网络
C. 信息技术应用
D. 信息化人才
【答案】A
【解析】信息资源是国家信息化体系的六要素之一，处于核心位置。

2. 【多选题】以下哪些项属于制定项目章程的输入文件？
A. 立项管理文件
B. 协议与合同
C. 事业环境因素
D. 组织过程资产
【答案】ABCD
【解析】制定项目章程的输入包括立项文件、协议、事业环境因素和组织过程资产。

3. 【判断题】自由时差总是不大于总时差。
【答案】正确
【解析】自由时差是指在不延误紧后活动最早开始时间的前提下可以延误的时间，因此自由时差 <= 总时差。`
  ElMessage.success('已填入标准示例试题')
}

// Excel / Word / 文本文件选择解析
async function onFileSelected(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files || !files.length) return
  const file = files[0]
  currentFileName.value = file.name
  ElMessage.info(`正在解析「${file.name}」...`)

  try {
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
      await parseExcelFile(file)
    } else {
      await parseTextOrDocFile(file)
    }
  } catch (err: any) {
    ElMessage.error(`文件解析失败: ${err.message || '格式不支持'}`)
  } finally {
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

// 解析 Excel 文件
async function parseExcelFile(file: File) {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[firstSheetName]
  const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

  if (!rows || rows.length === 0) {
    return ElMessage.warning('Excel 表格内容为空，请使用标准模板填写后重新上传')
  }

  const parsed: any[] = []
  rows.forEach((row: any, idx: number) => {
    // 兼容多样化列名
    const rawType = String(row['题型'] || row['type'] || row['题型(单选/多选/判断/问答)'] || '单选').trim()
    let type = 'single'
    let typeText = '单选'
    if (rawType.includes('多选')) {
      type = 'multiple'
      typeText = '多选'
    } else if (rawType.includes('判断')) {
      type = 'judge'
      typeText = '判断'
    } else if (rawType.includes('问答') || rawType.includes('简答') || rawType.includes('案例')) {
      type = 'essay'
      typeText = '问答'
    }

    const chapter = String(row['章节'] || row['章节名称'] || row['chapter'] || '第1章 信息化发展').trim()
    const content = String(row['题干'] || row['题干内容'] || row['题干内容(必填)'] || row['题目'] || row['content'] || row['title'] || '').trim()
    const answer = String(row['答案'] || row['正确答案'] || row['正确答案(如A/ABCD/正确)'] || row['answer'] || 'A').trim().toUpperCase()
    const analysis = String(row['解析'] || row['试题解析'] || row['analysis'] || '').trim()
    const difficulty = Number(row['难度'] || row['难度(1-5)'] || 3) || 3

    const options: any[] = []
    const optA = String(row['选项A'] || row['A'] || '').trim()
    const optB = String(row['选项B'] || row['B'] || '').trim()
    const optC = String(row['选项C'] || row['C'] || '').trim()
    const optD = String(row['选项D'] || row['D'] || '').trim()
    const optE = String(row['选项E'] || row['E'] || '').trim()

    if (optA) options.push({ key: 'A', label: 'A', content: optA })
    if (optB) options.push({ key: 'B', label: 'B', content: optB })
    if (optC) options.push({ key: 'C', label: 'C', content: optC })
    if (optD) options.push({ key: 'D', label: 'D', content: optD })
    if (optE) options.push({ key: 'E', label: 'E', content: optE })

    let valid = true
    let errorMsg = ''
    if (!content) {
      valid = false
      errorMsg = '题干不能为空'
    } else if (type === 'single' && options.length < 2) {
      valid = false
      errorMsg = '单选题至少需要提供A和B选项'
    } else if (!answer) {
      valid = false
      errorMsg = '正确答案不能为空'
    }

    parsed.push({
      rowNo: idx + 1,
      type,
      typeText,
      chapter,
      chapterName: chapter,
      title: content,
      content,
      options,
      answer,
      analysis: analysis || '详见教材对应核心考点解析。',
      difficulty,
      valid,
      errorMsg,
    })
  })

  previewList.value = parsed
  ElMessage.success(`成功从 Excel 解析出 ${parsed.length} 道试题！`)
}

// 解析 Word / 纯文本文件
async function parseTextOrDocFile(file: File) {
  let text = ''
  try {
    if (file.name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      text = result.value || ''
    } else {
      text = await file.text()
    }
  } catch (readErr: any) {
    return ElMessage.error(`读取 Word/文本文件失败: ${readErr.message || '文件损坏'}`)
  }

  // 清洗不可打印字符与多余空字符
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim()
  if (!text) {
    return ElMessage.warning('未能从 Word 文档中提取到文字内容，请确认文档非空')
  }

  parsing.value = true
  try {
    const res = await parseQuestions({
      subjectId: selectedSubjectId.value,
      content: text,
    })
    if (res?.data?.questions && res.data.questions.length > 0) {
      previewList.value = res.data.questions
      ElMessage.success(`🎉 成功从 Word 文档解析出 ${res.data.questions.length} 道试题！`)
    } else {
      ElMessage.warning('未能识别到有效题目，请参考标准模板调整 Word 试卷排版')
    }
  } catch (err: any) {
    ElMessage.error(err.message || '试卷识别失败')
  } finally {
    parsing.value = false
  }
}

// AI 智能解析题目
async function startAIParsing() {
  if (!aiText.value.trim()) {
    return ElMessage.warning('请先粘贴试题文本')
  }
  parsing.value = true
  currentFileName.value = `AI智能识别批次_${Date.now()}`
  try {
    const res = await parseQuestions({
      subjectId: selectedSubjectId.value,
      content: aiText.value.trim(),
    })
    if (res?.data?.questions && res.data.questions.length > 0) {
      previewList.value = res.data.questions
      ElMessage.success(`AI 成功识别出 ${res.data.questions.length} 道题目！`)
    } else {
      ElMessage.warning('AI 未能识别出题目，请检查文本内容')
    }
  } catch (err: any) {
    ElMessage.error(err.message || 'AI 识别服务异常')
  } finally {
    parsing.value = false
  }
}

function removePreviewRow(idx: number) {
  previewList.value.splice(idx, 1)
  previewList.value.forEach((item, i) => {
    item.rowNo = i + 1
  })
}

// 确认全部入库
async function commitImport() {
  if (previewList.value.length === 0) return

  const toImport = previewList.value.filter((p) => p.valid)
  if (toImport.length === 0) {
    return ElMessage.error('当前预览列表中无合规试题，请修改或删除错误条目后再试')
  }

  if (errorCount.value > 0) {
    try {
      await ElMessageBox.confirm(
        `当前列表中有 ${errorCount.value} 道题目格式存在错误将被忽略，是否仅导入 ${toImport.length} 道合规试题？`,
        '提示',
        { confirmButtonText: '继续导入合规题目', cancelButtonText: '取消', type: 'warning' }
      )
    } catch {
      return
    }
  }

  importingLoading.value = true
  try {
    const targetSub = subjects.value.find((s) => s.value === selectedSubjectId.value)
    const res = await importQuestions({
      subjectId: selectedSubjectId.value,
      subjectName: targetSub ? targetSub.label : '系统集成项目管理工程师',
      fileName: currentFileName.value || `${importMode.value}_批次导入_${Date.now()}`,
      type: importMode.value,
      questions: toImport,
    })

    if (res?.data) {
      ElMessage.success(`🎉 成功导入 ${toImport.length} 道题目到题库！`)
      previewList.value = []
      aiText.value = ''
      loadRecords()
    }
  } catch (err: any) {
    ElMessage.error(err.message || '入库失败，请稍后重试')
  } finally {
    importingLoading.value = false
  }
}

// 标准模板生成与下载
function downloadTemplate(type: 'excel' | 'word') {
  if (type === 'excel') {
    // 1. 生成真实 Excel 模板
    const headers = [
      '题型(单选/多选/判断/问答)',
      '章节名称',
      '题干内容(必填)',
      '选项A',
      '选项B',
      '选项C',
      '选项D',
      '正确答案(如A/ABCD/正确)',
      '难度(1-5)',
      '试题解析',
    ]

    const sampleRows = [
      [
        '单选题',
        '第1章 信息化发展',
        '国家信息化体系六要素中，处于核心位置的是哪个要素？',
        '信息资源',
        '信息网络',
        '信息技术应用',
        '信息化人才',
        'A',
        3,
        '信息资源是国家信息化体系的六要素之一，处于核心位置。',
      ],
      [
        '多选题',
        '第6章 项目整体管理',
        '以下哪些项属于项目章程的输入文件？',
        '立项管理文件',
        '协议与合同',
        '事业环境因素',
        '组织过程资产',
        'ABCD',
        4,
        '制定项目章程的输入包括立项管理文件、协议、事业环境因素和组织过程资产。',
      ],
      [
        '判断题',
        '第8章 项目进度管理',
        '自由时差总是不大于总时差。',
        '',
        '',
        '',
        '',
        '正确',
        2,
        '自由时差是指在不延误紧后活动最早开始时间的前提下可以延误的时间，因此自由时差 <= 总时差。',
      ],
      [
        '问答题',
        '第7章 项目范围管理',
        '请简述项目范围说明书包含的主要内容。',
        '',
        '',
        '',
        '',
        '主要包括项目范围描述、可交付成果、验收标准以及项目的除外责任。',
        3,
        '详细范围说明书是范围基准的关键组成部分。',
      ],
    ]

    const wsData = [headers, ...sampleRows]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    // 设置列宽
    ws['!cols'] = [
      { wch: 25 },
      { wch: 20 },
      { wch: 45 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 25 },
      { wch: 12 },
      { wch: 40 },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '题目导入模板')
    XLSX.writeFile(wb, '软考题库_标准导入模板.xlsx')
    ElMessage.success('已成功生成并下载「Excel 标准导入模板.xlsx」！')
  } else {
    // 2. 生成真实 Word / 文档模板
    const docContent = `软考刷题系统 —— Word 题目标准导入模板与排版规范

【使用说明与排版规则】
1. 题型支持：【单选题】、【多选题】、【判断题】、【问答题】（可在题目前加题型标签或序号）
2. 选项规范：每行一个选项，格式如 A. 选项内容 或 A、选项内容
3. 答案规范：单独成行，格式如 【答案】A 或 答案：ABCD 或 答案：正确
4. 解析规范：单独成行，格式如 【解析】本题考察核心考点...

==================================================
【示例试题区】

【单选题】
1. 国家信息化体系六要素中，处于核心位置的是哪个要素？
A. 信息资源
B. 信息网络
C. 信息技术应用
D. 信息化人才
【答案】A
【解析】信息资源是国家信息化体系的六要素之一，处于核心位置。

【多选题】
2. 以下哪些项属于项目章程的输入文件？
A. 立项管理文件
B. 协议与合同
C. 事业环境因素
D. 组织过程资产
【答案】ABCD
【解析】制定项目章程的输入包括立项管理文件、协议、事业环境因素和组织过程资产。

【判断题】
3. 自由时差总是不大于总时差。
【答案】正确
【解析】自由时差是指在不延误紧后活动最早开始时间的前提下可以延误的时间，因此自由时差 <= 总时差。

【问答题】
4. 请简述项目范围说明书包含的主要内容。
【答案】主要包括项目范围描述、验收标准、可交付成果以及项目的除外责任。
【解析】详细范围说明书是制定 WBS 与范围基准的关键依据。
`

    const blob = new Blob([docContent], { type: 'application/msword;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = '软考题库_Word标准试卷导入模板.doc'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
    ElMessage.success('已成功生成并下载「Word 标准导入模板.doc」！')
  }
}

onMounted(() => {
  loadSubjects()
  loadRecords()
})
</script>

<style scoped lang="scss">
.question-import-page {
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

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;

    .ph-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--gray-8);
      display: flex;
      align-items: center;
      gap: 12px;

      .ph-badge {
        font-size: 12px;
        font-weight: normal;
        background: #f1f5f9;
        color: #475569;
        padding: 2px 10px;
        border-radius: 12px;

        &.success-badge {
          background: #ecfdf5;
          color: #059669;
        }

        &.error-badge {
          background: #fef2f2;
          color: #dc2626;
        }
      }
    }

    .ph-templates {
      display: flex;
      gap: 16px;

      .tpl-link {
        font-size: 13px;
        color: var(--primary);
        cursor: pointer;
        font-weight: 500;
        transition: color 0.15s;

        &:hover {
          text-decoration: underline;
          color: #3730a3;
        }
      }
    }

    .ph-actions {
      display: flex;
      gap: 10px;
    }
  }
}

.upload-config-row {
  display: flex;
  gap: 32px;
  align-items: center;
  margin-bottom: 20px;
  background: #f8fafc;
  padding: 14px 18px;
  border-radius: 6px;
  border: 1px solid #f1f5f9;

  .config-item {
    display: flex;
    align-items: center;
    gap: 10px;

    .label {
      font-size: 14px;
      font-weight: 600;
      color: var(--gray-7);
      white-space: nowrap;
    }
  }
}

.drop-zone {
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  background: #fafafa;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary);
    background: #eef2ff;
  }

  .dz-icon {
    font-size: 46px;
    margin-bottom: 12px;
  }

  .dz-text {
    font-size: 15px;
    font-weight: 600;
    color: var(--gray-8);
    margin-bottom: 6px;
  }

  .dz-sub {
    font-size: 13px;
    color: var(--gray-5);
  }
}

.ai-text-zone {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .ai-zone-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .ai-zone-tip {
      font-size: 13px;
      color: var(--gray-6);
    }
  }

  .ai-btn-row {
    display: flex;
    justify-content: flex-end;
  }
}

.question-stem-box {
  .stem-title {
    font-weight: 600;
    color: var(--gray-8);
    margin-bottom: 6px;
    line-height: 1.5;
  }

  .stem-options {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .opt-pill {
      font-size: 12px;
      background: #f1f5f9;
      color: var(--gray-7);
      padding: 3px 8px;
      border-radius: 4px;
    }
  }
}

.answer-badge {
  display: inline-block;
  background: #e0e7ff;
  color: #4338ca;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
}

.val-tag {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;

  &.success {
    background: #ecfdf5;
    color: #059669;
  }

  &.error {
    background: #fef2f2;
    color: #dc2626;
  }
}

.status-pill {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;

  &.success {
    background: #ecfdf5;
    color: #059669;
  }

  &.partial {
    background: #fffbeb;
    color: #d97706;
  }
}
</style>

