<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { importQuestions, getImportRecords } from '@/api/question'
import { aiImport } from '@/api/ai'
import { getAllSubjects } from '@/api/exam'
import { formatDateTime, formatFileSize } from '@/utils/format'
import type { PageResult } from '@/types/api'

const activeTab = ref<'excel' | 'word' | 'ai'>('excel')
const loading = ref(false)
const subjects = ref<{ label: string; value: number }[]>([])
const selectedSubjectId = ref<number>()
const fileList = ref<any[]>([])
const importResult = ref<{ success: number; failed: number; errors: any[] } | null>(null)
const recordsLoading = ref(false)
const records = ref<PageResult['list']>([])

async function loadSubjects() {
  const res = await getAllSubjects()
  subjects.value = res.data.map((s) => ({ label: s.name, value: s.id }))
}

async function handleUpload(options: any) {
  if (!selectedSubjectId.value) {
    ElMessage.warning('请先选择科目')
    return
  }
  loading.value = true
  try {
    const formData = new FormData()
    formData.append('file', options.file)
    formData.append('subjectId', String(selectedSubjectId.value))
    formData.append('type', activeTab.value)
    const res = await importQuestions(formData)
    importResult.value = res.data
    ElMessage.success(`导入成功 ${res.data.success} 条`)
    loadRecords()
  } catch {
    ElMessage.error('导入失败')
  } finally {
    loading.value = false
  }
}

// AI 智能导入
const aiContent = ref('')
const aiImportLoading = ref(false)
async function handleAIImport() {
  if (!selectedSubjectId.value) {
    ElMessage.warning('请先选择科目')
    return
  }
  if (!aiContent.value.trim()) {
    ElMessage.warning('请输入文本内容')
    return
  }
  aiImportLoading.value = true
  try {
    const res = await aiImport({ subjectId: selectedSubjectId.value, content: aiContent.value })
    ElMessage.success(`AI 识别出 ${res.data.questions.length} 道题目`)
    importResult.value = { success: res.data.questions.length, failed: 0, errors: [] }
  } finally {
    aiImportLoading.value = false
  }
}

function downloadTemplate(type: 'excel' | 'word') {
  const url = type === 'excel' ? '/templates/question_template.xlsx' : '/templates/question_template.docx'
  window.open(url, '_blank')
}

async function loadRecords() {
  recordsLoading.value = true
  try {
    const res = await getImportRecords({ page: 1, pageSize: 10 })
    records.value = res.data.list
  } finally {
    recordsLoading.value = false
  }
}

function handleFileChange(file: any) {
  fileList.value = [file]
}

onMounted(() => {
  loadSubjects()
  loadRecords()
})
</script>

<template>
  <div class="page-container">
    <el-row :gutter="16">
      <!-- 左侧：导入区 -->
      <el-col :span="16">
        <div class="import-card">
          <div class="import-card__subject">
            <span class="import-card__label">目标科目：</span>
            <el-select
              v-model="selectedSubjectId"
              placeholder="请选择科目"
              style="width: 240px"
            >
              <el-option v-for="s in subjects" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
          </div>

          <el-tabs v-model="activeTab" class="import-card__tabs">
            <el-tab-pane label="Excel导入" name="excel">
              <div class="import-card__tip">
                <el-button type="primary" link @click="downloadTemplate('excel')">
                  下载Excel模板
                </el-button>
              </div>
              <el-upload
                drag
                :file-list="fileList"
                :http-request="handleUpload"
                :on-change="handleFileChange"
                accept=".xlsx,.xls"
                v-loading="loading"
              >
                <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                <div class="el-upload__text">将 Excel 文件拖到此处，或<em>点击上传</em></div>
                <template #tip>
                  <div class="el-upload__tip">仅支持 .xlsx / .xls 格式，单次最多 1000 条</div>
                </template>
              </el-upload>
            </el-tab-pane>

            <el-tab-pane label="Word导入" name="word">
              <div class="import-card__tip">
                <el-button type="primary" link @click="downloadTemplate('word')">
                  下载Word模板
                </el-button>
              </div>
              <el-upload
                drag
                :file-list="fileList"
                :http-request="handleUpload"
                :on-change="handleFileChange"
                accept=".docx,.doc"
                v-loading="loading"
              >
                <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                <div class="el-upload__text">将 Word 文件拖到此处，或<em>点击上传</em></div>
                <template #tip>
                  <div class="el-upload__tip">仅支持 .docx / .doc 格式</div>
                </template>
              </el-upload>
            </el-tab-pane>

            <el-tab-pane label="AI智能导入" name="ai">
              <p class="import-card__desc">
                粘贴文本内容，AI 自动识别并生成题目结构。
              </p>
              <el-input
                v-model="aiContent"
                type="textarea"
                :rows="8"
                placeholder="粘贴题目文本，支持单题或多题..."
              />
              <div style="margin-top: 12px; text-align: right">
                <el-button
                  type="primary"
                  :loading="aiImportLoading"
                  @click="handleAIImport"
                >
                  AI 智能识别
                </el-button>
              </div>
            </el-tab-pane>
          </el-tabs>

          <!-- 导入结果 -->
          <div v-if="importResult" class="import-card__result">
            <el-alert
              :title="`导入完成：成功 ${importResult.success} 条，失败 ${importResult.failed} 条`"
              :type="importResult.failed ? 'warning' : 'success'"
              :closable="false"
              show-icon
            />
            <el-table
              v-if="importResult.errors.length"
              :data="importResult.errors"
              border
              style="margin-top: 12px"
            >
              <el-table-column type="index" label="行号" width="70" />
              <el-table-column prop="reason" label="错误原因" />
            </el-table>
          </div>
        </div>
      </el-col>

      <!-- 右侧：导入记录 -->
      <el-col :span="8">
        <div class="import-card">
          <h3 class="import-card__title">导入记录</h3>
          <el-timeline v-loading="recordsLoading">
            <el-timeline-item
              v-for="rec in records"
              :key="rec.id"
              :timestamp="formatDateTime(rec.createdAt)"
              placement="top"
            >
              <p>{{ rec.filename }} ({{ formatFileSize(rec.fileSize) }})</p>
              <el-tag size="small" :type="rec.failed ? 'warning' : 'success'">
                成功 {{ rec.success }} / 失败 {{ rec.failed }}
              </el-tag>
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.import-card {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  margin-bottom: 16px;

  &__subject {
    margin-bottom: 16px;
  }

  &__label {
    font-weight: 500;
  }

  &__tip {
    margin-bottom: 8px;
  }

  &__desc {
    color: var(--app-text-secondary);
    font-size: 13px;
    margin-bottom: 8px;
  }

  &__result {
    margin-top: 16px;
  }

  &__title {
    font-size: 16px;
    margin-bottom: 12px;
  }
}
</style>
