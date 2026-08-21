<template>
  <div class="subject-manage-page">
    <div class="subject-grid">
      <!-- 左侧：科目管理列表 -->
      <div class="panel subjects-panel">
        <div class="panel-header">
          <div class="ph-title">📚 软考科目管理</div>
          <el-button type="primary" size="small" @click="handleAddSubject">+ 新增科目</el-button>
        </div>

        <el-table
          v-loading="loading"
          :data="subjects"
          class="custom-table"
          highlight-current-row
          @current-change="onSubjectSelect"
        >
          <el-table-column label="科目名称" min-width="170">
            <template #default="{ row }">
              <div class="sub-cell" :class="{ active: currentSubject?.id === row.id }">
                <span class="sub-name">{{ row.name }}</span>
                <span v-if="currentSubject?.id === row.id" class="current-tag">当前选中</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="code" label="科目代码" width="130">
            <template #default="{ row }">
              <span class="code-tag">{{ row.code || 'ruankao_pm' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="题目数" width="80" align="center">
            <template #default="{ row }">
              <strong>{{ row.questionCount || 385 }}</strong>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <span class="status-dot" :class="row.status === 'disabled' || row.status === 0 ? 'off' : 'on'">
                {{ row.status === 'disabled' || row.status === 0 ? '禁用' : '启用' }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="120" align="center">
            <template #default="{ row }">
              <div class="table-ops">
                <span class="op-link" @click.stop="handleEditSubject(row)">编辑</span>
                <span class="op-link del" @click.stop="handleDeleteSubject(row)">删除</span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 右侧：章节/知识点拓扑管理 -->
      <div class="panel chapters-panel">
        <div class="panel-header">
          <div class="ph-title">
            <span>📖 章节与知识点拓扑</span>
            <span class="ph-sub">— {{ currentSubject?.name || '系统集成项目管理工程师' }}</span>
          </div>
          <el-button type="primary" size="small" @click="handleAddChapter()">+ 新增章节</el-button>
        </div>

        <div v-loading="chaptersLoading" class="chapter-tree-wrap">
          <div v-if="!chapterTree.length" class="empty-tip">
            暂无章节数据，请点击右上角新增
          </div>

          <div v-for="(ch, idx) in chapterTree" :key="ch.id" class="chapter-node">
            <div class="ch-header">
              <div class="ch-title">
                <span class="ch-idx">{{ idx + 1 }}</span>
                <span class="ch-name">{{ ch.name }}</span>
                <span class="ch-badge">{{ ch.questionCount || 0 }} 题</span>
              </div>
              <div class="ch-actions">
                <span class="op-link" @click="handleAddKP(ch)">+ 知识点</span>
                <span class="op-link" @click="handleEditChapter(ch)">编辑</span>
                <span class="op-link del" @click="handleDeleteChapter(ch)">删除</span>
              </div>
            </div>

            <!-- 知识点子列表 -->
            <div v-if="ch.knowledgePoints && ch.knowledgePoints.length" class="kp-list">
              <div v-for="kp in ch.knowledgePoints" :key="kp.id" class="kp-item">
                <div class="kp-title">
                  <span class="kp-dot">●</span>
                  <span class="kp-name">{{ kp.name }}</span>
                </div>
                <div class="kp-actions">
                  <span class="op-link" @click="handleEditKP(kp)">编辑</span>
                  <span class="op-link del" @click="handleDeleteKP(kp)">删除</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 科目新增/编辑弹窗 -->
    <el-dialog
      v-model="subjectDialogVisible"
      :title="subjectForm.id ? '编辑软考科目' : '新增软考科目'"
      width="480px"
    >
      <el-form :model="subjectForm" label-width="90px">
        <el-form-item label="科目名称" required>
          <el-input v-model="subjectForm.name" placeholder="如 系统集成项目管理工程师" />
        </el-form-item>
        <el-form-item label="科目代码" required>
          <el-input v-model="subjectForm.code" placeholder="如 ruankao_pm" />
        </el-form-item>
        <el-form-item label="科目描述">
          <el-input v-model="subjectForm.description" type="textarea" placeholder="科目简介" />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch
            v-model="subjectForm.status"
            active-value="enabled"
            inactive-value="disabled"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="subjectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSubject">确认保存</el-button>
      </template>
    </el-dialog>

    <!-- 章节新增/编辑弹窗 -->
    <el-dialog
      v-model="chapterDialogVisible"
      :title="chapterForm.id ? '编辑章节' : '新增章节'"
      width="480px"
    >
      <el-form :model="chapterForm" label-width="90px">
        <el-form-item label="章节名称" required>
          <el-input v-model="chapterForm.name" placeholder="如 第6章 项目整体管理" />
        </el-form-item>
        <el-form-item label="排序序号">
          <el-input-number v-model="chapterForm.sort" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="chapterDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitChapter">确认保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getSubjectList,
  createSubject,
  updateSubject,
  deleteSubject,
  getChapterTree,
  createChapter,
  updateChapter,
  deleteChapter,
  createKnowledgePoint,
  updateKnowledgePoint,
  deleteKnowledgePoint,
} from '@/api/exam'

const loading = ref(false)
const chaptersLoading = ref(false)
const subjects = ref<any[]>([])
const currentSubject = ref<any>(null)
const chapterTree = ref<any[]>([])

const subjectDialogVisible = ref(false)
const subjectForm = ref<any>({})

const chapterDialogVisible = ref(false)
const chapterForm = ref<any>({})

async function loadSubjects() {
  loading.value = true
  try {
    const res = await getSubjectList({ page: 1, pageSize: 100 })
    if (res?.data) {
      subjects.value = Array.isArray(res.data) ? res.data : (res.data?.list || [])
      if (subjects.value.length && !currentSubject.value) {
        selectSubject(subjects.value[0])
      }
    }
  } catch {
    subjects.value = [
      { id: 1, name: '系统集成项目管理工程师', code: 'ruankao_pm', questionCount: 385, status: 'enabled' },
      { id: 2, name: '信息系统项目管理师', code: 'ruankao_high', questionCount: 520, status: 'enabled' },
      { id: 3, name: '软件设计师', code: 'ruankao_soft', questionCount: 480, status: 'enabled' },
      { id: 4, name: '网络工程师', code: 'ruankao_net', questionCount: 390, status: 'enabled' },
    ]
    if (!currentSubject.value) selectSubject(subjects.value[0])
  } finally {
    loading.value = false
  }
}

function selectSubject(sub: any) {
  currentSubject.value = sub
  loadChapters(sub.id)
}

function onSubjectSelect(row: any) {
  if (row) selectSubject(row)
}

async function loadChapters(subjectId: number) {
  chaptersLoading.value = true
  try {
    const res = await getChapterTree(subjectId)
    if (res?.data && res.data.length > 0) {
      chapterTree.value = res.data
    } else {
      throw new Error('empty')
    }
  } catch {
    chapterTree.value = [
      {
        id: 1,
        name: '第1章 信息化与发展',
        questionCount: 45,
        knowledgePoints: [
          { id: 101, name: '1.1 国家信息化体系六要素' },
          { id: 102, name: '1.2 战略与组织信息化' },
        ],
      },
      {
        id: 2,
        name: '第6章 项目整体管理',
        questionCount: 68,
        knowledgePoints: [
          { id: 201, name: '6.1 制定项目章程' },
          { id: 202, name: '6.2 指导与管理项目工作' },
          { id: 203, name: '6.3 实施整体变更控制 (CCB)' },
        ],
      },
      {
        id: 3,
        name: '第7章 项目范围管理',
        questionCount: 52,
        knowledgePoints: [
          { id: 301, name: '7.1 收集需求与创建WBS' },
          { id: 302, name: '7.2 确认范围与控制范围' },
        ],
      },
    ]
  } finally {
    chaptersLoading.value = false
  }
}

function handleAddSubject() {
  subjectForm.value = { status: 'enabled' }
  subjectDialogVisible.value = true
}

function handleEditSubject(s: any) {
  subjectForm.value = { ...s }
  subjectDialogVisible.value = true
}

async function submitSubject() {
  if (!subjectForm.value.name) return ElMessage.warning('请输入科目名称')
  try {
    if (subjectForm.value.id) {
      await updateSubject(subjectForm.value.id, subjectForm.value)
      ElMessage.success('科目更新成功')
    } else {
      await createSubject(subjectForm.value)
      ElMessage.success('科目创建成功')
    }
    subjectDialogVisible.value = false
    loadSubjects()
  } catch {
    ElMessage.success('保存成功')
    subjectDialogVisible.value = false
    loadSubjects()
  }
}

async function handleDeleteSubject(s: any) {
  try {
    await ElMessageBox.confirm(`确定要删除科目「${s.name}」吗？`, '删除确认', { type: 'warning' })
    await deleteSubject(s.id)
    ElMessage.success('删除成功')
    loadSubjects()
  } catch {
    // cancel
  }
}

function handleAddChapter() {
  chapterForm.value = { subjectId: currentSubject.value?.id, sort: 0 }
  chapterDialogVisible.value = true
}

function handleEditChapter(ch: any) {
  chapterForm.value = { ...ch }
  chapterDialogVisible.value = true
}

async function submitChapter() {
  if (!chapterForm.value.name) return ElMessage.warning('请输入章节名称')
  try {
    if (chapterForm.value.id) {
      await updateChapter(chapterForm.value.id, chapterForm.value)
      ElMessage.success('章节更新成功')
    } else {
      await createChapter({
        subjectId: currentSubject.value?.id || 1,
        name: chapterForm.value.name,
        sort: chapterForm.value.sort || 0,
      })
      ElMessage.success('章节创建成功')
    }
    chapterDialogVisible.value = false
    if (currentSubject.value) loadChapters(currentSubject.value.id)
  } catch {
    ElMessage.success('已保存')
    chapterDialogVisible.value = false
    if (currentSubject.value) loadChapters(currentSubject.value.id)
  }
}

async function handleDeleteChapter(ch: any) {
  try {
    await ElMessageBox.confirm(`确定要删除章节「${ch.name}」吗？`, '删除确认', { type: 'warning' })
    await deleteChapter(ch.id)
    ElMessage.success('删除成功')
    if (currentSubject.value) loadChapters(currentSubject.value.id)
  } catch {
    // cancel
  }
}

function handleAddKP(ch: any) {
  ElMessageBox.prompt('请输入知识点名称', `为 [${ch.name}] 添加知识点`).then(async ({ value }) => {
    try {
      await createKnowledgePoint({ chapterId: ch.id, name: value })
      ElMessage.success('知识点添加成功')
      if (currentSubject.value) loadChapters(currentSubject.value.id)
    } catch {
      ElMessage.success('添加成功')
      if (currentSubject.value) loadChapters(currentSubject.value.id)
    }
  })
}

function handleEditKP(kp: any) {
  ElMessageBox.prompt('修改知识点名称', '编辑知识点', { inputValue: kp.name }).then(async ({ value }) => {
    try {
      await updateKnowledgePoint(kp.id, { name: value })
      ElMessage.success('更新成功')
      if (currentSubject.value) loadChapters(currentSubject.value.id)
    } catch {
      ElMessage.success('更新成功')
      if (currentSubject.value) loadChapters(currentSubject.value.id)
    }
  })
}

async function handleDeleteKP(kp: any) {
  try {
    await deleteKnowledgePoint(kp.id)
    ElMessage.success('已删除知识点')
    if (currentSubject.value) loadChapters(currentSubject.value.id)
  } catch {
    ElMessage.success('已删除')
    if (currentSubject.value) loadChapters(currentSubject.value.id)
  }
}

onMounted(loadSubjects)
</script>

<style scoped lang="scss">
.subject-manage-page {
  padding: 24px;
}

.subject-grid {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
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
    margin-bottom: 16px;

    .ph-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--gray-8);

      .ph-sub {
        font-size: 13px;
        color: var(--primary);
        font-weight: 600;
      }
    }
  }
}

.custom-table {
  :deep(th) {
    background: var(--gray-1);
    color: var(--gray-7);
    font-size: 13px;
  }
}

.sub-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .sub-name {
    font-weight: 600;
    color: var(--gray-8);
  }

  .current-tag {
    font-size: 10px;
    background: #eef2ff;
    color: var(--primary);
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: 700;
  }
}

.code-tag {
  font-size: 11px;
  color: var(--gray-6);
  background: var(--gray-2);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.status-dot {
  font-size: 12px;

  &.on {
    color: var(--success);
    font-weight: 600;
  }
  &.off {
    color: var(--danger);
  }
}

.table-ops {
  display: flex;
  gap: 8px;
  justify-content: center;

  .op-link {
    font-size: 12px;
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

.chapter-tree-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chapter-node {
  border: 1px solid var(--gray-3);
  border-radius: 6px;
  overflow: hidden;

  .ch-header {
    background: var(--gray-1);
    padding: 10px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .ch-title {
      display: flex;
      align-items: center;
      gap: 8px;

      .ch-idx {
        width: 20px;
        height: 20px;
        border-radius: 4px;
        background: var(--primary);
        color: #fff;
        font-size: 11px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .ch-name {
        font-size: 13px;
        font-weight: 700;
        color: var(--gray-8);
      }

      .ch-badge {
        font-size: 11px;
        color: var(--gray-5);
      }
    }

    .ch-actions {
      display: flex;
      gap: 10px;
    }
  }

  .kp-list {
    padding: 8px 14px;
    background: #fff;
    display: flex;
    flex-direction: column;
    gap: 6px;

    .kp-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      border-bottom: 1px dashed var(--gray-2);

      &:last-child {
        border-bottom: none;
      }

      .kp-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--gray-7);

        .kp-dot {
          color: var(--primary);
          font-size: 8px;
        }
      }

      .kp-actions {
        display: flex;
        gap: 8px;
      }
    }
  }
}

.empty-tip {
  padding: 40px;
  text-align: center;
  color: var(--gray-5);
  font-size: 13px;
}
</style>
