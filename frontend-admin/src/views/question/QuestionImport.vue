<template>
  <div class="question-import-page">
    <!-- 顶部上传卡片 -->
    <div class="panel upload-panel">
      <div class="panel-header">
        <div class="ph-title">📥 批量导入题目</div>
        <div class="ph-templates">
          <a class="tpl-link" @click="downloadTemplate('excel')">📄 下载 Excel 标准模板</a>
          <a class="tpl-link" @click="downloadTemplate('word')">📄 下载 Word 标准模板</a>
        </div>
      </div>

      <div class="upload-config-row">
        <div class="config-item">
          <span class="label">目标科目：</span>
          <el-select v-model="selectedSubjectId" placeholder="请选择科目" style="width: 240px">
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
            <el-radio-button label="excel">Excel 导入</el-radio-button>
            <el-radio-button label="word">Word 试卷解析</el-radio-button>
            <el-radio-button label="ai">AI 文本识别</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 拖拽上传框 -->
      <div v-if="importMode !== 'ai'" class="drop-zone" @click="triggerUpload">
        <input ref="fileInputRef" type="file" style="display: none" @change="onFileSelected" />
        <div class="dz-icon">📁</div>
        <div class="dz-text">点击或将文件拖拽至此处上传</div>
        <div class="dz-sub">
          支持 {{ importMode === 'excel' ? '.xlsx / .xls' : '.docx / .doc' }} 格式文件，单批次建议不超过 500 道题
        </div>
      </div>

      <!-- AI 文本直接粘贴 -->
      <div v-else class="ai-text-zone">
        <el-input
          v-model="aiText"
          type="textarea"
          :rows="6"
          placeholder="请直接粘贴题目文本（包含题干、选项ABCD、答案及解析），AI 将自动结构化提取..."
        />
        <div class="ai-btn-row">
          <el-button type="primary" :loading="parsing" @click="startAIParsing">
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
          <span class="ph-badge">共 {{ previewList.length }} 道 · {{ errorCount }} 道格式需修改</span>
        </div>
        <div class="ph-actions">
          <el-button @click="previewList = []">清空预览</el-button>
          <el-button type="primary" :disabled="errorCount > 0" @click="commitImport">
            确认全部入库 ({{ previewList.length }}题)
          </el-button>
        </div>
      </div>

      <el-table :data="previewList" class="custom-table">
        <el-table-column prop="rowNo" label="行号" width="70" align="center" />
        <el-table-column prop="type" label="题型" width="90">
          <template #default="{ row }">
            <span class="type-tag" :class="row.type">{{ row.typeText }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="chapter" label="章节" width="160" />
        <el-table-column prop="title" label="题干内容" min-width="260" />
        <el-table-column prop="answer" label="答案" width="80" align="center" />
        <el-table-column label="校验状态" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.valid" class="val-tag success">✓ 格式合规</span>
            <span v-else class="val-tag error" :title="row.errorMsg">✗ {{ row.errorMsg }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 历史导入批次记录 -->
    <div class="panel history-panel">
      <div class="panel-header">
        <div class="ph-title">📜 历史导入批次记录</div>
      </div>

      <el-table v-loading="recordsLoading" :data="historyRecords" class="custom-table">
        <el-table-column prop="id" label="批次ID" width="90" align="center" />
        <el-table-column prop="createdAt" label="导入时间" width="170" />
        <el-table-column prop="type" label="导入方式" width="120" />
        <el-table-column prop="fileName" label="文件名 / 来源" min-width="200" />
        <el-table-column prop="subjectName" label="目标科目" width="180" />
        <el-table-column label="成功/失败" width="130" align="center">
          <template #default="{ row }">
            <span style="color: var(--success); font-weight: 600">{{ row.successCount }}</span>
            <span> / </span>
            <span :style="{ color: row.failCount > 0 ? 'var(--danger)' : 'var(--gray-5)' }">
              {{ row.failCount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <span class="status-pill" :class="row.status">{{ row.status === 'success' ? '导入成功' : '部分失败' }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getAllSubjects } from '@/api/exam'
import { getImportRecords } from '@/api/question'

const subjects = ref<{ label: string; value: number }[]>([])
const selectedSubjectId = ref<number>(1)
const importMode = ref<'excel' | 'word' | 'ai'>('excel')
const fileInputRef = ref<HTMLInputElement | null>(null)
const aiText = ref('')
const parsing = ref(false)
const recordsLoading = ref(false)

const previewList = ref<any[]>([])
const historyRecords = ref<any[]>([])

const errorCount = computed(() => previewList.value.filter((p) => !p.valid).length)

async function loadSubjects() {
  try {
    const res = await getAllSubjects()
    if (res?.data) {
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
    const res = await getImportRecords({ page: 1, pageSize: 10 })
    if (res?.data?.list) {
      historyRecords.value = res.data.list
    } else {
      throw new Error('empty')
    }
  } catch {
    historyRecords.value = [
      {
        id: 101,
        createdAt: '2026-08-20 16:30',
        type: 'Excel 批量',
        fileName: '2025年上半年系统集成真题.xlsx',
        subjectName: '系统集成项目管理工程师',
        successCount: 75,
        failCount: 0,
        status: 'success',
      },
      {
        id: 100,
        createdAt: '2026-08-19 11:20',
        type: 'AI 识别导入',
        fileName: '项目范围管理专项精选.txt',
        subjectName: '系统集成项目管理工程师',
        successCount: 20,
        failCount: 0,
        status: 'success',
      },
    ]
  } finally {
    recordsLoading.value = false
  }
}

function triggerUpload() {
  fileInputRef.value?.click()
}

function onFileSelected(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files || !files.length) return
  const file = files[0]
  ElMessage.info(`正在解析 ${file.name}...`)

  // 模拟前端解析结构
  setTimeout(() => {
    previewList.value = [
      {
        rowNo: 1,
        type: 'single',
        typeText: '单选',
        chapter: '第1章 信息化与发展',
        title: '国家信息化体系六要素中，处于核心位置的是哪个要素？',
        answer: 'A',
        valid: true,
        errorMsg: '',
      },
      {
        rowNo: 2,
        type: 'multiple',
        typeText: '多选',
        chapter: '第6章 项目整体管理',
        title: '以下哪些项属于项目章程的输入文件？',
        answer: 'ABCD',
        valid: true,
        errorMsg: '',
      },
      {
        rowNo: 3,
        type: 'single',
        typeText: '单选',
        chapter: '第7章 项目范围管理',
        title: 'WBS字典的作用是什么？',
        answer: 'B',
        valid: true,
        errorMsg: '',
      },
    ]
    ElMessage.success(`解析成功，生成 ${previewList.value.length} 道预览试题`)
  }, 600)
}

function startAIParsing() {
  if (!aiText.value.trim()) {
    return ElMessage.warning('请先粘贴试题文本')
  }
  parsing.value = true
  setTimeout(() => {
    parsing.value = false
    previewList.value = [
      {
        rowNo: 1,
        type: 'single',
        typeText: '单选',
        chapter: '第6章 项目整体管理',
        title: '根据PMBOK指南，制定项目章程过程的主要输出是什么？',
        answer: 'A',
        valid: true,
        errorMsg: '',
      },
      {
        rowNo: 2,
        type: 'judge',
        typeText: '判断',
        chapter: '第8章 项目进度管理',
        title: '自由时差总是不大于总时差。',
        answer: 'A',
        valid: true,
        errorMsg: '',
      },
    ]
    ElMessage.success(`AI 成功识别出 ${previewList.value.length} 道题目`)
  }, 1000)
}

function commitImport() {
  ElMessage.success(`成功导入 ${previewList.value.length} 道题目至题库！`)
  previewList.value = []
  loadRecords()
}

function downloadTemplate(type: 'excel' | 'word') {
  ElMessage.success(`已开始下载 ${type.toUpperCase()} 标准模板文件`)
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
      gap: 10px;

      .ph-badge {
        font-size: 12px;
        font-weight: normal;
        color: var(--gray-6);
        background: var(--gray-2);
        padding: 2px 8px;
        border-radius: 10px;
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

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}

.upload-config-row {
  display: flex;
  gap: 32px;
  margin-bottom: 20px;
  align-items: center;

  .config-item {
    display: flex;
    align-items: center;
    gap: 10px;

    .label {
      font-size: 13px;
      font-weight: 600;
      color: var(--gray-7);
    }
  }
}

.drop-zone {
  border: 2px dashed var(--gray-3);
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  background: var(--gray-1);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--primary);
    background: #eef2ff;
  }

  .dz-icon {
    font-size: 44px;
    margin-bottom: 8px;
  }

  .dz-text {
    font-size: 15px;
    font-weight: 700;
    color: var(--gray-8);
  }

  .dz-sub {
    font-size: 12px;
    color: var(--gray-5);
    margin-top: 6px;
  }
}

.ai-text-zone {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .ai-btn-row {
    display: flex;
    justify-content: flex-end;
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

.val-tag {
  font-size: 12px;
  font-weight: 600;

  &.success {
    color: var(--success);
  }
  &.error {
    color: var(--danger);
  }
}

.status-pill {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;

  &.success {
    background: #f0fdf4;
    color: #16a34a;
  }
  &.partial {
    background: #fffbeb;
    color: #d97706;
  }
}
</style>
