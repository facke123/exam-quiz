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
import {
  getPaperList,
  createPaper,
  updatePaper,
  deletePaper,
  autoGeneratePaper,
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

const autoDialogVisible = ref(false)
const autoLoading = ref(false)
const autoForm = reactive({
  subjectId: 1,
  name: '2026年系统集成全真模拟卷（一）',
  totalTime: 150,
  questionCount: 75,
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
      }
    }
  } catch {
    // ignore
  }
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getPaperList(query)
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
</style>
