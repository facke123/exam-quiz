<template>
  <div class="ai-review-page">
    <!-- 顶部出题控制台 -->
    <div class="panel generate-panel">
      <div class="panel-title">
        <span>🤖 AI 命题引擎配置</span>
        <span class="quota-info">今日模型调用剩余配额：<strong>4,850</strong> / 5,000次</span>
      </div>

      <div class="generate-form-grid">
        <div class="form-item">
          <span class="label">基座大模型：</span>
          <el-select v-model="generateForm.model" style="width: 160px">
            <el-option label="Gemini 2.5 Pro (推荐)" value="gemini-2.5-pro" />
            <el-option label="GPT-4o" value="gpt-4o" />
            <el-option label="Claude 3.5 Sonnet" value="claude-3.5" />
            <el-option label="DeepSeek-V3" value="deepseek-v3" />
          </el-select>
        </div>

        <div class="form-item">
          <span class="label">目标科目：</span>
          <el-select v-model="generateForm.subjectId" style="width: 200px" @change="loadChapters">
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
          <el-select v-model="generateForm.chapterId" placeholder="全部章节/重点" style="width: 180px">
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
          <el-input-number v-model="generateForm.count" :min="1" :max="20" style="width: 120px" />
        </div>

        <div class="form-item action-item">
          <el-button type="primary" :loading="generateLoading" @click="handleGenerate">
            ⚡ 一键开始生成题目
          </el-button>
        </div>
      </div>
    </div>

    <!-- 待审核题目列表 -->
    <div class="panel table-panel">
      <div class="table-toolbar">
        <div class="tt-left">
          <span class="tt-title">📋 待审核题目（{{ total }}道）</span>
          <span class="tt-desc">由 AI 命题生成的试题需人工核验答案与解析后方可上架</span>
        </div>
        <div class="tt-right">
          <el-button
            type="success"
            :disabled="!selectedRows.length"
            @click="handleBatchApprove"
          >
            ✓ 批量审核通过 ({{ selectedRows.length }})
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

        <el-table-column label="题型" width="90">
          <template #default="{ row }">
            <span class="type-tag" :class="row.type">
              {{ typeMap[row.type] || row.type }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="题干与选项预览" min-width="280">
          <template #default="{ row }">
            <div class="stem-content">
              <div class="stem-title">{{ row.title || row.content }}</div>
              <div class="stem-ans">答案：<strong>{{ row.answer }}</strong> ｜ 解析：{{ row.analysis }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="knowledgePoint" label="知识点 / 考点" width="160">
          <template #default="{ row }">
            <span class="kp-badge">{{ row.knowledgePoint || '项目范围管理' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="AI 置信度" width="130">
          <template #default="{ row }">
            <div class="confidence-wrap">
              <div class="conf-bar">
                <div
                  class="conf-fill"
                  :style="{
                    width: (row.confidence || 95) + '%',
                    background: (row.confidence || 95) >= 90 ? 'var(--success)' : 'var(--warning)',
                  }"
                ></div>
              </div>
              <span class="conf-text">{{ row.confidence || 95 }}%</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="生成时间" width="150" align="center" />

        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-ops">
              <span class="op-link pass" @click="handlePass(row)">通过入库</span>
              <span class="op-link edit" @click="handleEdit(row)">修改</span>
              <span class="op-link reject" @click="handleReject(row)">驳回</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAllSubjects, getChapterTree } from '@/api/exam'

const loading = ref(false)
const generateLoading = ref(false)
const list = ref<any[]>([])
const total = ref(12)
const selectedRows = ref<any[]>([])

const subjects = ref<{ label: string; value: number }[]>([])
const chapterOptions = ref<any[]>([])

const generateForm = reactive({
  model: 'gemini-2.5-pro',
  subjectId: 1,
  chapterId: 1,
  type: 'single',
  count: 5,
})

const typeMap: Record<string, string> = {
  single: '单选',
  multiple: '多选',
  judge: '判断',
  case: '案例',
}

async function loadSubjects() {
  try {
    const res = await getAllSubjects()
    if (res?.data) {
      subjects.value = res.data.map((s: any) => ({ label: s.name, value: Number(s.id) }))
    }
  } catch {
    subjects.value = [
      { label: '系统集成项目管理工程师', value: 1 },
      { label: '信息系统项目管理师', value: 2 },
    ]
  }
}

async function loadChapters() {
  try {
    const res = await getChapterTree(generateForm.subjectId)
    if (res?.data) {
      chapterOptions.value = res.data
    }
  } catch {
    chapterOptions.value = [
      { id: 1, name: '第1章 信息化与发展' },
      { id: 2, name: '第6章 项目整体管理' },
      { id: 3, name: '第7章 项目范围管理' },
    ]
  }
}

function fetchReviewList() {
  loading.value = true
  setTimeout(() => {
    list.value = [
      {
        id: 201,
        type: 'single',
        title: '关于敏捷项目管理中的每日站会（Daily Scrum），以下说法正确的是？',
        answer: 'B',
        analysis: '每日站会通常严格控制在15分钟以内，由开发团队成员轮流同步昨天完成、今天计划及遇到的阻碍。',
        knowledgePoint: '敏捷项目管理方法',
        confidence: 98,
        createdAt: '10分钟前',
      },
      {
        id: 202,
        type: 'multiple',
        title: '在项目成本控制中，出现挣值（EV）小于计划价值（PV）通常意味着？',
        answer: 'AC',
        analysis: 'EV < PV 说明当前实际进度落后于计划进度（进度偏差 SV = EV - PV < 0）。',
        knowledgePoint: '挣值分析法 (EVM)',
        confidence: 92,
        createdAt: '25分钟前',
      },
      {
        id: 203,
        type: 'case',
        title: '【案例分析】某金融集成项目在上线前一周发现重大性能瓶颈...',
        answer: '参考要点',
        analysis: '应立即启动紧急变更评审，评估对上线里程碑及业务连续性的影响。',
        knowledgePoint: '项目变更控制委员会 (CCB)',
        confidence: 86,
        createdAt: '1小时前',
      },
    ]
    total.value = 12
    loading.value = false
  }, 300)
}

function handleGenerate() {
  generateLoading.value = true
  setTimeout(() => {
    generateLoading.value = false
    ElMessage.success('AI 已完成生成 5 道全新题目，已加入待审核列表！')
    fetchReviewList()
  }, 1200)
}

function onSelectionChange(rows: any[]) {
  selectedRows.value = rows
}

function handlePass(row: any) {
  ElMessage.success(`题目 [ID: ${row.id}] 审核通过并入库发布！`)
  list.value = list.value.filter((i) => i.id !== row.id)
  total.value = Math.max(0, total.value - 1)
}

function handleEdit(row: any) {
  ElMessageBox.prompt('修改题干与答案', `编辑题目 [ID: ${row.id}]`, {
    inputValue: row.title,
  }).then(({ value }) => {
    row.title = value
    ElMessage.success('已保存修改')
  })
}

function handleReject(row: any) {
  ElMessage.warning(`题目 [ID: ${row.id}] 已驳回丢弃`)
  list.value = list.value.filter((i) => i.id !== row.id)
  total.value = Math.max(0, total.value - 1)
}

function handleBatchApprove() {
  ElMessage.success(`已批量审核通过 ${selectedRows.value.length} 道题目！`)
  const ids = selectedRows.value.map((r) => r.id)
  list.value = list.value.filter((i) => !ids.includes(i.id))
  total.value = Math.max(0, total.value - ids.length)
}

function handleBatchReject() {
  ElMessage.warning(`已批量驳回 ${selectedRows.value.length} 道题目`)
  const ids = selectedRows.value.map((r) => r.id)
  list.value = list.value.filter((i) => !ids.includes(i.id))
  total.value = Math.max(0, total.value - ids.length)
}

onMounted(() => {
  loadSubjects()
  loadChapters()
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
    margin-bottom: 4px;
  }

  .stem-ans {
    font-size: 12px;
    color: var(--gray-6);
    line-height: 1.4;
  }
}

.kp-badge {
  font-size: 12px;
  background: #f1f5f9;
  color: #475569;
  padding: 2px 8px;
  border-radius: 4px;
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
</style>
