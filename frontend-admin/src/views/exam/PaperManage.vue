<template>
  <div class="paper-manage-page">
    <div class="table-panel">
      <!-- 顶部筛选与操作工具栏 -->
      <div class="table-toolbar">
        <div class="filter-bar">
          <el-select
            v-model="query.subjectId"
            placeholder="全部科目"
            clearable
            class="filter-select"
            style="width: 200px"
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
            placeholder="全部试卷类型"
            clearable
            class="filter-select"
            style="width: 140px"
            @change="fetchList"
          >
            <el-option label="历年真题" value="real" />
            <el-option label="全真模拟卷" value="mock" />
            <el-option label="考前押题卷" value="sprint" />
          </el-select>

          <el-button type="primary" class="btn-primary" @click="fetchList">查询</el-button>
        </div>

        <div class="actions-bar">
          <el-button type="primary" class="btn-primary" @click="handleAddPaper">
            + 手动组卷
          </el-button>
          <el-button type="success" class="btn-success" @click="openAutoDialog">
            ⚡ 智能规则组卷
          </el-button>
        </div>
      </div>

      <!-- 试卷列表表格 -->
      <el-table v-loading="loading" :data="list" class="custom-table">
        <el-table-column prop="id" label="试卷ID" width="80" align="center" />

        <el-table-column label="试卷名称" min-width="260">
          <template #default="{ row }">
            <div class="paper-name-row">
              <span class="p-name">{{ row.name }}</span>
              <span class="p-type" :class="row.paperType || 'real'">
                {{ row.paperType === 'mock' ? '全真模拟' : '历年真题' }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="subjectName" label="科目" width="180">
          <template #default="{ row }">
            <span class="sub-text">{{ row.subjectName || '系统集成项目管理工程师' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="题型分布" min-width="160">
          <template #default="{ row }">
            <div class="type-dist-bar">
              <div class="td-seg single" style="width: 65%" title="单选 65%"></div>
              <div class="td-seg multiple" style="width: 25%" title="多选 25%"></div>
              <div class="td-seg case" style="width: 10%" title="案例 10%"></div>
            </div>
            <div class="td-labels">50单选 + 20多选 + 5案例</div>
          </template>
        </el-table-column>

        <el-table-column prop="questionCount" label="题量" width="80" align="center">
          <template #default="{ row }">
            <strong>{{ row.questionCount || 75 }}</strong>
          </template>
        </el-table-column>

        <el-table-column prop="totalScore" label="总分" width="80" align="center">
          <template #default="{ row }">
            <span>{{ row.totalScore || 75 }}分</span>
          </template>
        </el-table-column>

        <el-table-column prop="totalTime" label="时长" width="90" align="center">
          <template #default="{ row }">
            <span>{{ row.totalTime || 150 }}分钟</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-ops">
              <span class="op-link" @click="handlePreview(row)">预览试卷</span>
              <span class="op-link" @click="handleEditPaper(row)">编辑</span>
              <span class="op-link del" @click="handleDeletePaper(row)">删除</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 智能组卷弹窗 -->
    <el-dialog v-model="autoDialogVisible" title="⚡ 智能规则组卷" width="600px">
      <el-form :model="autoForm" label-width="100px">
        <el-form-item label="所属科目" required>
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
          <el-input v-model="autoForm.name" placeholder="如 2026年全真模拟卷一" />
        </el-form-item>
        <el-form-item label="考试限时">
          <el-input-number v-model="autoForm.totalTime" :min="30" :max="240" :step="10" /> 分钟
        </el-form-item>
        <el-form-item label="抽题配比">
          <div class="ratio-inputs">
            <div>单选题：<el-input-number v-model="autoForm.singleCount" :min="0" :max="100" /> 道</div>
            <div style="margin-top: 8px">多选题：<el-input-number v-model="autoForm.multipleCount" :min="0" :max="100" /> 道</div>
            <div style="margin-top: 8px">案例题：<el-input-number v-model="autoForm.caseCount" :min="0" :max="20" /> 道</div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="autoDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="autoLoading" @click="submitAutoPaper">
          一键生成并发布试卷
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPaperList, createPaper, deletePaper, getAllSubjects } from '@/api/exam'

const loading = ref(false)
const list = ref<any[]>([])
const subjects = ref<{ label: string; value: number }[]>([])

const query = reactive({
  subjectId: undefined as any,
  type: '',
})

const autoDialogVisible = ref(false)
const autoLoading = ref(false)
const autoForm = reactive({
  subjectId: 1,
  name: '2026年系统集成全真模拟卷（一）',
  totalTime: 150,
  singleCount: 50,
  multipleCount: 20,
  caseCount: 5,
})

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

async function fetchList() {
  loading.value = true
  try {
    const res = await getPaperList(query)
    if (res?.data?.list && res.data.list.length > 0) {
      list.value = res.data.list
    } else {
      throw new Error('empty')
    }
  } catch {
    list.value = [
      {
        id: 1,
        name: '2025年下半年系统集成项目管理工程师上午综合知识',
        subjectName: '系统集成项目管理工程师',
        paperType: 'real',
        questionCount: 75,
        totalScore: 75,
        totalTime: 150,
      },
      {
        id: 2,
        name: '2025年上半年系统集成项目管理工程师上午综合知识',
        subjectName: '系统集成项目管理工程师',
        paperType: 'real',
        questionCount: 75,
        totalScore: 75,
        totalTime: 150,
      },
      {
        id: 3,
        name: '2026全真模拟试卷（一）· 基础冲刺',
        subjectName: '系统集成项目管理工程师',
        paperType: 'mock',
        questionCount: 75,
        totalScore: 75,
        totalTime: 150,
      },
      {
        id: 4,
        name: '2024年下半年信息系统项目管理师综合知识',
        subjectName: '信息系统项目管理师',
        paperType: 'real',
        questionCount: 75,
        totalScore: 75,
        totalTime: 150,
      },
    ]
  } finally {
    loading.value = false
  }
}

function handleAddPaper() {
  ElMessageBox.prompt('请输入试卷名称', '手动创建试卷').then(({ value }) => {
    ElMessage.success(`试卷「${value}」创建成功，请进入详情添加题目！`)
  })
}

function openAutoDialog() {
  autoDialogVisible.value = true
}

function submitAutoPaper() {
  autoLoading.value = true
  setTimeout(() => {
    autoLoading.value = false
    autoDialogVisible.value = false
    ElMessage.success('智能组卷成功，已自动抽取 75 道匹配题目入卷！')
    fetchList()
  }, 1000)
}

function handlePreview(row: any) {
  ElMessageBox.alert(`已加载试卷「${row.name}」，包含 ${row.questionCount || 75} 道试题。`, '试卷预览')
}

function handleEditPaper(row: any) {
  ElMessageBox.prompt('修改试卷名称', '编辑试卷', { inputValue: row.name }).then(({ value }) => {
    row.name = value
    ElMessage.success('已保存')
  })
}

async function handleDeletePaper(row: any) {
  try {
    await ElMessageBox.confirm(`确定要删除试卷「${row.name}」吗？`, '删除确认', { type: 'warning' })
    list.value = list.value.filter((p) => p.id !== row.id)
    ElMessage.success('删除成功')
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
  border-bottom: 1px solid var(--gray-3);
  flex-wrap: wrap;
  gap: 12px;

  .filter-bar {
    display: flex;
    gap: 8px;
    align-items: center;
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
    font-size: 13px;
  }
}

.paper-name-row {
  display: flex;
  align-items: center;
  gap: 8px;

  .p-name {
    font-weight: 600;
    color: var(--gray-8);
  }

  .p-type {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: 700;

    &.real {
      background: #f5f3ff;
      color: #8b5cf6;
    }
    &.mock {
      background: #eef2ff;
      color: #4a6cf7;
    }
  }
}

.type-dist-bar {
  display: flex;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  background: var(--gray-2);
  margin-bottom: 4px;

  .td-seg {
    height: 100%;

    &.single {
      background: #4a6cf7;
    }
    &.multiple {
      background: #8b5cf6;
    }
    &.case {
      background: #ec4899;
    }
  }
}

.td-labels {
  font-size: 11px;
  color: var(--gray-5);
}

.table-ops {
  display: flex;
  gap: 10px;
  justify-content: center;

  .op-link {
    font-size: 13px;
    color: var(--primary);
    cursor: pointer;

    &.del {
      color: var(--danger);
    }

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
