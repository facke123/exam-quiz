<template>
  <el-dialog
    v-model="visible"
    title="📥 Word 文档 / 讲义大纲 AI 智能考点提炼与导入"
    width="960px"
    :close-on-click-modal="false"
    destroy-on-close
    class="knowledge-import-dialog"
  >
    <!-- 步骤条 -->
    <div class="step-indicator">
      <div class="step-item" :class="{ active: currentStep === 1, done: currentStep > 1 }">
        <span class="step-num">1</span>
        <span class="step-txt">上传文档 / 粘贴大纲</span>
      </div>
      <div class="step-line" :class="{ done: currentStep > 1 }" />
      <div class="step-item" :class="{ active: currentStep === 2, done: currentStep > 2 }">
        <span class="step-num">2</span>
        <span class="step-txt">AI 深度提取与智能结构化</span>
      </div>
      <div class="step-line" :class="{ done: currentStep > 2 }" />
      <div class="step-item" :class="{ active: currentStep === 3 }">
        <span class="step-num">3</span>
        <span class="step-txt">校验微调与一键批量入库</span>
      </div>
    </div>

    <!-- 步骤 1: 上传与输入 -->
    <div v-if="currentStep === 1" class="step-content">
      <el-form label-width="110px" label-position="top">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="目标科目">
              <el-select v-model="selectedSubjectId" placeholder="请选择科目" style="width: 100%">
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
            <el-form-item label="输入来源">
              <el-radio-group v-model="inputType">
                <el-radio-button value="word">📄 上传 Word 文档 (.docx)</el-radio-button>
                <el-radio-button value="text">📝 直接粘贴大纲/讲义文本</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Word 上传区 -->
        <div v-if="inputType === 'word'" class="word-upload-box" @click="triggerUpload">
          <input
            ref="fileInputRef"
            type="file"
            accept=".docx,.doc,.txt"
            style="display: none"
            @change="onFileSelected"
          >
          <div class="upload-icon">📄</div>
          <div v-if="!selectedFile" class="upload-title">点击或将 Word (.docx / .doc) 讲义文件拖拽到此处</div>
          <div v-else class="upload-file-name">
            已选择文件：<strong>{{ selectedFile.name }}</strong> ({{ (selectedFile.size / 1024).toFixed(1) }} KB)
          </div>
          <div class="upload-tip">AI 将自动读取全文并按章节拆解：考点逻辑框架、冲刺速记口诀、精选配套试题</div>
        </div>

        <!-- 文本粘贴区 -->
        <div v-else class="text-input-box">
          <div class="text-input-header">
            <span>💡 请在下方粘贴软考教材章节内容、讲义大纲或高频考点汇总：</span>
            <el-button type="primary" link size="small" @click="fillSampleText">填入示例讲义</el-button>
          </div>
          <el-input
            v-model="rawContent"
            type="textarea"
            :rows="9"
            placeholder="例如：第9章 项目成本管理&#10;一、净值分析法(EVM)&#10;PV计划价值，EV实际挣得值，AC实际成本。&#10;CV=EV-AC（成本偏差，>0结余，<0超支）；SV=EV-PV（进度偏差，>0提前，<0滞后）...&#10;典型例题：某项目计划成本100万，实际支出90万，EV为80万..."
          />
        </div>
      </el-form>
    </div>

    <!-- 步骤 2: AI 解析中 -->
    <div v-else-if="currentStep === 2" class="step-content parsing-state">
      <div class="ai-loader-spinner" />
      <div class="ai-loader-title">🤖 大模型正在深度提炼教材考点与逻辑框架...</div>
      <div class="ai-loader-desc">
        正在解析文档结构、归纳章节、提取核心知识点、编写押韵速记口诀及生成配套例题，通常需要 5~15 秒，请稍候。
      </div>
      <el-progress :percentage="parsingPercent" :indeterminate="true" style="width: 60%; margin-top: 20px;" />
    </div>

    <!-- 步骤 3: 预览与微调 -->
    <div v-else-if="currentStep === 3" class="step-content preview-state">
      <div class="preview-summary-bar">
        <div class="sum-item">📚 识别章节：<strong>{{ parsedChapters.length }}</strong> 个</div>
        <div class="sum-item">💡 提炼考点：<strong>{{ totalKpCount }}</strong> 个</div>
        <div class="sum-item">🎯 配套例题：<strong>{{ totalQuestionCount }}</strong> 道</div>
        <el-button size="small" @click="currentStep = 1">‹ 重新解析</el-button>
      </div>

      <div class="chapter-accordion">
        <div
          v-for="(chap, cIdx) in parsedChapters"
          :key="cIdx"
          class="chapter-card"
        >
          <div class="chap-header">
            <div class="chap-title">
              <span class="chap-badge">第 {{ cIdx + 1 }} 章</span>
              <el-input v-model="chap.name" size="small" style="width: 320px;" />
            </div>
            <div class="chap-count">
              包含 {{ chap.knowledgePoints ? chap.knowledgePoints.length : 0 }} 个考点
            </div>
          </div>

          <div class="kp-list">
            <div
              v-for="(kp, kIdx) in chap.knowledgePoints"
              :key="kIdx"
              class="kp-preview-item"
            >
              <div class="kp-top-row">
                <el-input v-model="kp.name" size="small" placeholder="考点名称" style="flex: 1" />
                <el-select v-model="kp.importance" size="small" style="width: 100px">
                  <el-option label="必考" value="必考" />
                  <el-option label="高频" value="高频" />
                  <el-option label="常考" value="常考" />
                  <el-option label="重点" value="重点" />
                </el-select>
                <el-input v-model="kp.categoryTag" size="small" placeholder="分类标签" style="width: 160px" />
                <el-button type="danger" link size="small" @click="chap.knowledgePoints.splice(kIdx, 1)">✕</el-button>
              </div>

              <!-- 逻辑框架与速记口诀预览/编辑 -->
              <div class="kp-body-row">
                <div class="kp-core">
                  <div class="lbl">📖 教材考点提炼与逻辑框架 (Markdown)：</div>
                  <el-input
                    v-model="kp.coreAnalysis"
                    type="textarea"
                    :rows="3"
                    size="small"
                  />
                </div>
                <div class="kp-tips">
                  <div class="lbl">💡 冲刺速记口诀：</div>
                  <el-input
                    v-model="kp.memoryTips"
                    type="textarea"
                    :rows="3"
                    size="small"
                  />
                </div>
              </div>

              <!-- 配套题目提示 -->
              <div v-if="kp.questions && kp.questions.length > 0" class="kp-questions-tag">
                🔮 包含配套例题：<strong>{{ kp.questions.length }}</strong> 道（{{ kp.questions[0].content?.slice(0, 35) }}...）
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button
          v-if="currentStep === 1"
          type="primary"
          :disabled="(!selectedFile && !rawContent.trim()) || !selectedSubjectId"
          @click="startAiParse"
        >
          🤖 开始 AI 智能解析提炼
        </el-button>
        <el-button
          v-else-if="currentStep === 3"
          type="success"
          :loading="saving"
          @click="confirmBatchImport"
        >
          🚀 确认一键批量入库 ({{ totalKpCount }} 个考点)
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { parseWordKnowledge, batchImportKnowledge } from '@/api/exam'

const props = defineProps<{
  modelValue: boolean
  subjectId?: number
  subjects: Array<{ label: string; value: number }>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'imported'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const currentStep = ref(1)
const selectedSubjectId = ref<number>(props.subjectId || 1)
const inputType = ref<'word' | 'text'>('word')
const selectedFile = ref<File | null>(null)
const rawContent = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const parsingPercent = ref(20)
const saving = ref(false)
const parsedChapters = ref<any[]>([])

watch(
  () => props.subjectId,
  (val) => {
    if (val) selectedSubjectId.value = val
  }
)

const totalKpCount = computed(() => {
  return parsedChapters.value.reduce((acc, chap) => acc + (chap.knowledgePoints?.length || 0), 0)
})

const totalQuestionCount = computed(() => {
  let count = 0
  for (const chap of parsedChapters.value) {
    if (chap.knowledgePoints) {
      for (const kp of chap.knowledgePoints) {
        if (kp.questions) count += kp.questions.length
      }
    }
  }
  return count
})

function triggerUpload() {
  fileInputRef.value?.click()
}

function onFileSelected(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
  }
}

function fillSampleText() {
  rawContent.value = `第12章 项目风险管理
一、风险识别与消极/积极风险应对策略
【消极风险应对策略】：
1. 规避 (Avoid)：改变计划消除威胁（如取消高风险模块、更换技术方案）。
2. 转移 (Transfer)：将风险及后果转交给第三方（如买保险、签固定总价合同、外包）。
3. 减轻 (Mitigate)：降低发生概率或减轻后果（如增加测试、冗余设计）。
4. 接受 (Accept)：建立应急储备（主动接受）或不采取措施（被动接受）。

【积极风险应对策略】：
1. 开拓 (Exploit)：确保机会100%实现（如分配顶尖专家）。
2. 提高 (Enhance)：提高机会发生概率或影响。
3. 分享 (Share)：将机会分配给最能捕获的第三方（如成立合资公司）。
4. 接受 (Accept)：乐于利用机会但不主动追求。

【配套精选题】：
例题1：项目经理为了应对技术难度极高的核心模块开发风险，决定将该模块以固定总价合同形式外包给一家经验丰富专业公司。这种风险应对策略属于（ ）。
A. 风险规避
B. 风险转移
C. 风险减轻
D. 风险开拓
答案：B
解析：将风险后果转移给第三方（如签固定总价合同外包），属于风险转移策略。`
}

async function startAiParse() {
  if (!selectedSubjectId.value) {
    ElMessage.warning('请先选择目标科目')
    return
  }

  currentStep.value = 2
  parsingPercent.value = 35

  try {
    const formData = new FormData()
    formData.append('subjectId', String(selectedSubjectId.value))
    if (inputType.value === 'word' && selectedFile.value) {
      formData.append('file', selectedFile.value)
    } else if (rawContent.value) {
      formData.append('content', rawContent.value)
    }

    const res = await parseWordKnowledge(formData)
    if (res?.data?.chapters && Array.isArray(res.data.chapters) && res.data.chapters.length > 0) {
      parsedChapters.value = res.data.chapters
      currentStep.value = 3
      ElMessage.success(`AI 提炼成功！已识别 ${res.data.chapters.length} 个章节`)
    } else {
      ElMessage.error('AI 解析未识别出有效考点，请检查文档内容')
      currentStep.value = 1
    }
  } catch (err: any) {
    ElMessage.error(err.message || 'AI 提炼解析失败')
    currentStep.value = 1
  }
}

async function confirmBatchImport() {
  if (parsedChapters.value.length === 0) {
    ElMessage.warning('没有可导入的章节考点')
    return
  }

  saving.value = true
  try {
    const res = await batchImportKnowledge({
      subjectId: selectedSubjectId.value,
      chapters: parsedChapters.value,
    })
    ElMessage.success(res?.data?.message || '考点批量入库成功！')
    emit('imported')
    visible.value = false
  } catch (err: any) {
    ElMessage.error(err.message || '入库失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.knowledge-import-dialog {
  .step-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .step-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--el-text-color-secondary);

      .step-num {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--el-fill-color-dark);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
      }

      .step-txt {
        font-size: 13px;
        font-weight: 500;
      }

      &.active {
        color: var(--el-color-primary);
        .step-num {
          background: var(--el-color-primary);
          color: #fff;
        }
      }

      &.done {
        color: var(--el-color-success);
        .step-num {
          background: var(--el-color-success);
          color: #fff;
        }
      }
    }

    .step-line {
      width: 60px;
      height: 2px;
      background: var(--el-border-color);
      margin: 0 12px;

      &.done {
        background: var(--el-color-success);
      }
    }
  }

  .word-upload-box {
    border: 2px dashed var(--el-border-color);
    border-radius: 8px;
    padding: 36px 20px;
    text-align: center;
    background: var(--el-fill-color-light);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: var(--el-color-primary);
      background: rgba(99, 102, 241, 0.04);
    }

    .upload-icon {
      font-size: 42px;
      margin-bottom: 10px;
    }

    .upload-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .upload-file-name {
      font-size: 14px;
      color: var(--el-color-primary);
    }

    .upload-tip {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: 8px;
    }
  }

  .text-input-box {
    .text-input-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }

  .parsing-state {
    text-align: center;
    padding: 40px 20px;

    .ai-loader-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid var(--el-border-color-lighter);
      border-top-color: var(--el-color-primary);
      border-radius: 50%;
      margin: 0 auto 20px;
      animation: spin 1s linear infinite;
    }

    .ai-loader-title {
      font-size: 17px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }

    .ai-loader-desc {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      margin-top: 8px;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }
  }

  .preview-state {
    .preview-summary-bar {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 10px 16px;
      background: var(--el-fill-color-light);
      border-radius: 6px;
      margin-bottom: 16px;
      font-size: 13px;

      .sum-item strong {
        color: var(--el-color-primary);
        font-size: 15px;
      }
    }

    .chapter-accordion {
      max-height: 480px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;

      .chapter-card {
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 8px;
        padding: 14px;
        background: #fff;

        .chap-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .chap-title {
            display: flex;
            align-items: center;
            gap: 8px;

            .chap-badge {
              background: var(--el-color-primary-light-9);
              color: var(--el-color-primary);
              font-size: 11px;
              font-weight: 700;
              padding: 2px 6px;
              border-radius: 4px;
            }
          }

          .chap-count {
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }
        }

        .kp-list {
          display: flex;
          flex-direction: column;
          gap: 10px;

          .kp-preview-item {
            border: 1px solid var(--el-border-color-extra-light);
            background: var(--el-fill-color-lighter);
            border-radius: 6px;
            padding: 10px;

            .kp-top-row {
              display: flex;
              gap: 8px;
              align-items: center;
              margin-bottom: 8px;
            }

            .kp-body-row {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;

              .lbl {
                font-size: 11px;
                font-weight: 600;
                color: var(--el-text-color-secondary);
                margin-bottom: 4px;
              }
            }

            .kp-questions-tag {
              margin-top: 6px;
              font-size: 11px;
              color: #8b5cf6;
              background: #f5f3ff;
              padding: 4px 8px;
              border-radius: 4px;
            }
          }
        }
      }
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
