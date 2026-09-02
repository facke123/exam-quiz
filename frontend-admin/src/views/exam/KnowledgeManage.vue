<template>
  <div class="knowledge-manage-page">
    <!-- 顶部统计卡片 -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="sc-icon" style="background: #e0f2fe; color: #0284c7">💡</div>
        <div class="sc-info">
          <div class="sc-val">{{ total }}</div>
          <div class="sc-lbl">考点总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="sc-icon" style="background: #fee2e2; color: #ef4444">🔴</div>
        <div class="sc-info">
          <div class="sc-val">{{ mustCount }}</div>
          <div class="sc-lbl">必考/重点考点</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="sc-icon" style="background: #fef3c7; color: #d97706">🟠</div>
        <div class="sc-info">
          <div class="sc-val">{{ highCount }}</div>
          <div class="sc-lbl">高频考点</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="sc-icon" style="background: #f3e8ff; color: #9333ea">📚</div>
        <div class="sc-info">
          <div class="sc-val">{{ categories.length }}</div>
          <div class="sc-lbl">覆盖知识分类</div>
        </div>
      </div>
    </div>

    <!-- 筛选与操作栏 -->
    <div class="filter-panel">
      <div class="filter-row">
        <div class="filter-item">
          <span class="label">科目：</span>
          <el-select v-model="selectedSubjectId" placeholder="选择科目" style="width: 220px" @change="onSubjectChange">
            <el-option
              v-for="s in subjects"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </div>

        <div class="filter-item">
          <span class="label">分类：</span>
          <el-select v-model="filterCategory" placeholder="全部分类" clearable style="width: 180px" @change="loadData">
            <el-option
              v-for="c in categories"
              :key="c"
              :label="c"
              :value="c"
            />
          </el-select>
        </div>

        <div class="filter-item">
          <span class="label">级别：</span>
          <el-select v-model="filterImportance" placeholder="全部级别" clearable style="width: 130px" @change="loadData">
            <el-option label="必考" value="必考" />
            <el-option label="高频" value="高频" />
            <el-option label="常考" value="常考" />
            <el-option label="重点" value="重点" />
          </el-select>
        </div>

        <div class="filter-item search-item">
          <el-input
            v-model="keyword"
            placeholder="搜索考点名称、口诀、公式..."
            clearable
            style="width: 240px"
            @keyup.enter="loadData"
            @clear="loadData"
          >
            <template #prefix>🔍</template>
          </el-input>
          <el-button type="primary" @click="loadData">查询</el-button>
        </div>
      </div>

      <div class="action-row">
        <div class="left-actions">
          <el-button type="success" @click="showImportDialog = true">
            📥 Word 考点智能提炼导入
          </el-button>
          <el-button type="primary" @click="openCreateDialog">
            ➕ 新增考点
          </el-button>
          <el-button
            type="danger"
            plain
            :disabled="selectedRows.length === 0"
            @click="handleBatchDelete"
          >
            🗑️ 批量删除 {{ selectedRows.length ? `(${selectedRows.length})` : '' }}
          </el-button>
        </div>
        <div class="right-actions">
          <el-button @click="loadData">🔄 刷新</el-button>
        </div>
      </div>
    </div>

    <!-- 考点数据表格 -->
    <div class="table-panel">
      <el-table
        v-loading="loading"
        :data="pagedKpList"
        row-key="id"
        border
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" :reserve-selection="true" width="48" align="center" />
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column label="考点名称" min-width="220">
          <template #default="{ row }">
            <div class="kp-title-cell" @click="viewDetail(row)">
              <span class="kp-name">{{ row.name }}</span>
              <el-tag
                size="small"
                :type="row.importance === '必考' ? 'danger' : row.importance === '高频' ? 'warning' : 'info'"
                effect="light"
              >
                {{ row.importance || '常考' }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="categoryTag" label="分类标签" width="160">
          <template #default="{ row }">
            <el-tag size="small" type="primary" effect="plain">{{ row.categoryTag || '核心考点' }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="sourceBook" label="出处章节" width="180" show-overflow-tooltip />

        <el-table-column label="速记口诀" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="memory-tip-text">💡 {{ row.memoryTips || '暂无口诀' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="配套题数" width="90" align="center">
          <template #default="{ row }">
            <el-badge :value="row.questionCount || 0" type="primary" />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">查看</el-button>
            <el-button type="warning" link size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-popconfirm title="确定要删除此考点吗？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button type="danger" link size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <div v-if="total > 0" class="pagination-panel">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100, 200]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </div>

    <!-- 查看考点详情抽屉 (含配套例题预览) -->
    <el-drawer
      v-model="showDetailDrawer"
      :title="currentKp?.name || '考点详情'"
      size="620px"
      destroy-on-close
    >
      <div v-if="currentKp" class="kp-drawer-content">
        <div class="kp-drawer-header">
          <el-tag :type="currentKp.importance === '必考' ? 'danger' : 'warning'" size="large">
            {{ currentKp.importance || '必考' }}
          </el-tag>
          <el-tag size="large" type="primary" effect="plain">{{ currentKp.categoryTag }}</el-tag>
          <span class="source-book-txt">{{ currentKp.sourceBook }}</span>
        </div>

        <div class="drawer-section">
          <div class="ds-title">📖 教材考点提炼与逻辑框架</div>
          <div class="markdown-preview-box">
            <pre class="core-analysis-pre">{{ currentKp.coreAnalysis || '暂无详细逻辑框架' }}</pre>
          </div>
        </div>

        <div class="drawer-section">
          <div class="ds-title">💡 记忆口诀与冲刺速记技巧</div>
          <div class="memory-tips-card">
            {{ currentKp.memoryTips || '暂无口诀' }}
          </div>
        </div>

        <div class="drawer-section">
          <div class="ds-title">🔮 配套精选试题与答案解析 ({{ currentKpQuestions.length }} 道)</div>
          <div v-if="currentKpQuestions.length > 0" class="questions-list">
            <div
              v-for="(q, idx) in currentKpQuestions"
              :key="idx"
              class="q-card"
            >
              <div class="q-badge-row">
                <span class="q-idx-tag">例题 {{ idx + 1 }}</span>
                <span class="q-type-tag">{{ q.type === 'single_choice' ? '单选题' : '选择题' }}</span>
              </div>
              <div class="q-stem">{{ q.content }}</div>
              <div v-if="q.options && q.options.length" class="q-options">
                <div
                  v-for="opt in q.options"
                  :key="opt.key"
                  class="q-opt-item"
                  :class="{ correct: opt.key === q.answer }"
                >
                  <span class="opt-key">{{ opt.key }}.</span>
                  <span class="opt-text">{{ opt.content }}</span>
                </div>
              </div>
              <div class="q-ans-box">
                <div><strong>正确答案：</strong><span class="ans-val">{{ q.answer }}</span></div>
                <div class="q-analysis"><strong>名师解析：</strong>{{ q.analysis || '详见教材对应知识点逻辑框架。' }}</div>
              </div>
            </div>
          </div>
          <div v-else class="empty-q-tip">暂无关联题目</div>
        </div>
      </div>
    </el-drawer>

    <!-- 新建/编辑考点弹窗 -->
    <el-dialog
      v-model="showEditDialog"
      :title="isEditMode ? '编辑考点' : '新增考点'"
      width="720px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="editForm" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="14">
            <el-form-item label="考点名称" required>
              <el-input v-model="editForm.name" placeholder="如：净值管理(EVM)关键公式与绩效指标分析" />
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="考点级别" required>
              <el-select v-model="editForm.importance" style="width: 100%">
                <el-option label="必考" value="必考" />
                <el-option label="高频" value="高频" />
                <el-option label="常考" value="常考" />
                <el-option label="重点" value="重点" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="分类标签">
              <el-input v-model="editForm.categoryTag" placeholder="如：项目成本与进度管理" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="教材出处章节">
              <el-input v-model="editForm.sourceBook" placeholder="如：《教程》第9章 项目成本管理" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="逻辑框架 (MD)">
          <el-input
            v-model="editForm.coreAnalysis"
            type="textarea"
            :rows="6"
            placeholder="支持 Markdown 格式，详细梳理定义、核心公式、参数与对比..."
          />
        </el-form-item>

        <el-form-item label="冲刺速记口诀">
          <el-input
            v-model="editForm.memoryTips"
            type="textarea"
            :rows="3"
            placeholder="朗朗上口的押韵速记口诀..."
          />
        </el-form-item>

        <el-form-item label="排序权重">
          <el-input-number v-model="editForm.sort" :min="0" :max="999" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="savingEdit" @click="saveEditForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- Word 考点智能提炼与导入弹窗 -->
    <KnowledgeImportDialog
      v-model="showImportDialog"
      :subject-id="selectedSubjectId"
      :subjects="subjects"
      @imported="loadData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getKnowledgeBase,
  getKnowledgePointDetail,
  createKnowledgePoint,
  updateKnowledgePoint,
  deleteKnowledgePoint,
  batchDeleteKnowledgePoints,
  getAllSubjects,
} from '@/api/exam'
import KnowledgeImportDialog from './components/KnowledgeImportDialog.vue'

const subjects = ref<Array<{ label: string; value: number }>>([])
const selectedSubjectId = ref<number>(1)
const filterCategory = ref('')
const filterImportance = ref('')
const keyword = ref('')

const loading = ref(false)
const kpList = ref<any[]>([])
const categories = ref<string[]>([])
const total = ref(0)
const mustCount = ref(0)
const highCount = ref(0)

const selectedRows = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const pagedKpList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return kpList.value.slice(start, start + pageSize.value)
})

const showImportDialog = ref(false)
const showDetailDrawer = ref(false)
const currentKp = ref<any>(null)
const currentKpQuestions = ref<any[]>([])

const showEditDialog = ref(false)
const isEditMode = ref(false)
const savingEdit = ref(false)
const editForm = ref<any>({
  id: undefined,
  name: '',
  importance: '必考',
  categoryTag: '',
  sourceBook: '',
  coreAnalysis: '',
  memoryTips: '',
  sort: 1,
})

function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows
}

async function fetchSubjects() {
  try {
    const res = await getAllSubjects()
    if (res?.data && Array.isArray(res.data)) {
      subjects.value = res.data.map((s) => ({ label: s.name, value: s.id }))
      if (subjects.value.length > 0 && !selectedSubjectId.value) {
        selectedSubjectId.value = subjects.value[0].value
      }
    }
  } catch {
    subjects.value = [
      { label: '系统集成项目管理工程师', value: 1 },
      { label: '信息系统项目管理师', value: 2 },
    ]
  }
}

function onSubjectChange() {
  filterCategory.value = ''
  currentPage.value = 1
  loadData()
}

async function loadData() {
  loading.value = true
  try {
    const res = await getKnowledgeBase({
      subjectId: selectedSubjectId.value,
      category: filterCategory.value || undefined,
      importance: filterImportance.value || undefined,
      keyword: keyword.value.trim() || undefined,
    })

    if (res?.data) {
      kpList.value = res.data.list || []
      categories.value = (res.data.categories || []).filter((c: string) => c !== '全部')
      total.value = res.data.total || kpList.value.length

      mustCount.value = kpList.value.filter((k) => k.importance === '必考' || k.importance === '重点').length
      highCount.value = kpList.value.filter((k) => k.importance === '高频').length
    }
  } catch (err: any) {
    ElMessage.error(err.message || '加载考点列表失败')
  } finally {
    loading.value = false
  }
}

async function viewDetail(row: any) {
  try {
    const res = await getKnowledgePointDetail(row.id)
    if (res?.data) {
      currentKp.value = res.data
      currentKpQuestions.value = res.data.questions || []
      showDetailDrawer.value = true
    }
  } catch {
    currentKp.value = row
    currentKpQuestions.value = []
    showDetailDrawer.value = true
  }
}

function openCreateDialog() {
  isEditMode.value = false
  editForm.value = {
    id: undefined,
    name: '',
    importance: '必考',
    categoryTag: filterCategory.value || '核心考点',
    sourceBook: '《教程》对应章节',
    coreAnalysis: '',
    memoryTips: '',
    sort: total.value + 1,
  }
  showEditDialog.value = true
}

function openEditDialog(row: any) {
  isEditMode.value = true
  editForm.value = {
    id: row.id,
    name: row.name,
    importance: row.importance || '必考',
    categoryTag: row.categoryTag,
    sourceBook: row.sourceBook,
    coreAnalysis: row.coreAnalysis,
    memoryTips: row.memoryTips,
    sort: row.sort || 0,
  }
  showEditDialog.value = true
}

async function saveEditForm() {
  if (!editForm.value.name.trim()) {
    ElMessage.warning('请输入考点名称')
    return
  }

  savingEdit.value = true
  try {
    if (isEditMode.value) {
      await updateKnowledgePoint(editForm.value.id, {
        ...editForm.value,
        subjectId: selectedSubjectId.value,
      })
      ElMessage.success('考点更新成功')
    } else {
      await createKnowledgePoint({
        ...editForm.value,
        subjectId: selectedSubjectId.value,
      })
      ElMessage.success('新增考点成功')
    }
    showEditDialog.value = false
    loadData()
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    savingEdit.value = false
  }
}

async function handleDelete(row: any) {
  try {
    await deleteKnowledgePoint(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (err: any) {
    ElMessage.error(err.message || '删除失败')
  }
}

async function handleBatchDelete() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请勾选要删除的考点')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要批量删除选中的 ${selectedRows.value.length} 个考点知识点吗？此操作不可撤销！`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      },
    )

    const ids = selectedRows.value.map((r) => r.id)
    loading.value = true
    const res = await batchDeleteKnowledgePoints(ids)
    ElMessage.success(res?.data?.message || `成功删除 ${ids.length} 个考点`)
    selectedRows.value = []
    await loadData()
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || '批量删除失败')
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchSubjects()
  await loadData()
})
</script>

<style scoped lang="scss">
.knowledge-manage-page {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;

    .stat-card {
      background: #fff;
      border-radius: 8px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);

      .sc-icon {
        width: 46px;
        height: 46px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
      }

      .sc-val {
        font-size: 22px;
        font-weight: 700;
        color: var(--el-text-color-primary);
      }

      .sc-lbl {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-top: 2px;
      }
    }
  }

  .filter-panel {
    background: #fff;
    border-radius: 8px;
    padding: 16px 20px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    gap: 14px;

    .filter-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;

      .filter-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--el-text-color-regular);
      }

      .search-item {
        margin-left: auto;
      }
    }

    .action-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid var(--el-border-color-lighter);
    }
  }

  .table-panel {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);

    .kp-title-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;

      .kp-name {
        font-weight: 600;
        color: var(--el-color-primary);
        &:hover {
          text-decoration: underline;
        }
      }
    }

    .memory-tip-text {
      color: #d97706;
      font-size: 12px;
    }

    .pagination-panel {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .kp-drawer-content {
    display: flex;
    flex-direction: column;
    gap: 18px;

    .kp-drawer-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      .source-book-txt {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-left: auto;
      }
    }

    .drawer-section {
      .ds-title {
        font-size: 14px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        margin-bottom: 8px;
      }

      .core-analysis-pre {
        background: var(--el-fill-color-light);
        padding: 14px;
        border-radius: 6px;
        font-size: 13px;
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-word;
        font-family: inherit;
        color: var(--el-text-color-regular);
      }

      .memory-tips-card {
        background: #fffbeb;
        border: 1px solid #fde68a;
        color: #b45309;
        padding: 12px 14px;
        border-radius: 6px;
        font-size: 13px;
        line-height: 1.5;
        font-weight: 500;
      }

      .questions-list {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .q-card {
          border: 1px solid var(--el-border-color-lighter);
          border-radius: 8px;
          padding: 12px 14px;
          background: #fafafa;

          .q-badge-row {
            display: flex;
            gap: 6px;
            margin-bottom: 8px;

            .q-idx-tag {
              background: #e0e7ff;
              color: #4f46e5;
              font-size: 10px;
              font-weight: 700;
              padding: 2px 6px;
              border-radius: 4px;
            }

            .q-type-tag {
              background: #f3f4f6;
              color: #6b7280;
              font-size: 10px;
              padding: 2px 6px;
              border-radius: 4px;
            }
          }

          .q-stem {
            font-size: 13px;
            font-weight: 600;
            line-height: 1.5;
            color: var(--el-text-color-primary);
            margin-bottom: 10px;
          }

          .q-options {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 10px;

            .q-opt-item {
              display: flex;
              gap: 8px;
              background: #fff;
              padding: 6px 10px;
              border-radius: 4px;
              font-size: 12px;
              border: 1px solid var(--el-border-color-extra-light);

              &.correct {
                border-color: #10b981;
                background: #ecfdf5;
                color: #065f46;
                font-weight: 600;
              }
            }
          }

          .q-ans-box {
            font-size: 12px;
            background: #fff;
            padding: 8px 10px;
            border-radius: 4px;
            border-left: 3px solid var(--el-color-primary);

            .ans-val {
              color: #10b981;
              font-weight: 700;
            }

            .q-analysis {
              margin-top: 4px;
              color: var(--el-text-color-secondary);
              line-height: 1.4;
            }
          }
        }
      }

      .empty-q-tip {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        padding: 10px;
      }
    }
  }
}
</style>
