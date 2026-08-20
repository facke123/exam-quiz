<script setup lang="ts">
import { onMounted, ref } from 'vue'
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
  sortChapters,
  createKnowledgePoint,
  updateKnowledgePoint,
  deleteKnowledgePoint,
  type Subject,
  type Chapter,
  type KnowledgePoint,
} from '@/api/exam'
import { formatDateTime } from '@/utils/format'
import ProDialog from '@/components/ProDialog.vue'

const loading = ref(false)
const subjects = ref<Subject[]>([])
const currentSubject = ref<Subject | null>(null)
const chapterTree = ref<Chapter[]>([])

// 科目操作
const subjectDialogVisible = ref(false)
const subjectForm = ref<Partial<Subject>>({})

async function loadSubjects() {
  loading.value = true
  try {
    const res = await getSubjectList({ page: 1, pageSize: 100 })
    subjects.value = res.data.list
    if (subjects.value.length && !currentSubject.value) {
      selectSubject(subjects.value[0])
    }
  } finally {
    loading.value = false
  }
}

function selectSubject(subject: Subject) {
  currentSubject.value = subject
  loadChapters(subject.id)
}

async function loadChapters(subjectId: number) {
  const res = await getChapterTree(subjectId)
  chapterTree.value = res.data
}

function handleAddSubject() {
  subjectForm.value = { status: 'enabled', sort: 0 }
  subjectDialogVisible.value = true
}

function handleEditSubject(s: Subject) {
  subjectForm.value = { ...s }
  subjectDialogVisible.value = true
}

async function submitSubject() {
  if (!subjectForm.value.name) {
    ElMessage.warning('请输入科目名称')
    return
  }
  if (subjectForm.value.id) {
    await updateSubject(subjectForm.value.id, subjectForm.value)
    ElMessage.success('修改成功')
  } else {
    await createSubject(subjectForm.value)
    ElMessage.success('新增成功')
  }
  subjectDialogVisible.value = false
  loadSubjects()
}

async function handleDeleteSubject(s: Subject) {
  await ElMessageBox.confirm(`确定删除科目「${s.name}」吗？`, '提示', { type: 'warning' })
  await deleteSubject(s.id)
  ElMessage.success('删除成功')
  loadSubjects()
}

// 章节操作
const chapterDialogVisible = ref(false)
const chapterForm = ref<Partial<Chapter>>({})
const chapterDialogTitle = ref('')

function handleAddChapter(parentId: number | null = null) {
  chapterForm.value = { subjectId: currentSubject.value?.id, parentId, sort: 0 }
  chapterDialogTitle.value = '新增章节'
  chapterDialogVisible.value = true
}

function handleEditChapter(ch: Chapter) {
  chapterForm.value = { ...ch }
  chapterDialogTitle.value = '编辑章节'
  chapterDialogVisible.value = true
}

async function submitChapter() {
  if (!chapterForm.value.name) {
    ElMessage.warning('请输入章节名称')
    return
  }
  if (chapterForm.value.id) {
    await updateChapter(chapterForm.value.id, chapterForm.value)
  } else {
    await createChapter(chapterForm.value)
  }
  ElMessage.success('保存成功')
  chapterDialogVisible.value = false
  loadChapters(currentSubject.value!.id)
}

async function handleDeleteChapter(ch: Chapter) {
  await ElMessageBox.confirm(`确定删除章节「${ch.name}」吗？`, '提示', { type: 'warning' })
  await deleteChapter(ch.id)
  ElMessage.success('删除成功')
  loadChapters(currentSubject.value!.id)
}

// 拖拽排序
function handleDrop(draggingNode: any, dropNode: any, type: string) {
  // 简化处理：重新保存排序
  const data = flattenTree(chapterTree.value)
  sortChapters(
    data.map((c, i) => ({ id: c.id, parentId: c.parentId, sort: i })),
  )
  return type !== 'inner'
}

function flattenTree(nodes: Chapter[]): Chapter[] {
  const result: Chapter[] = []
  function walk(list: Chapter[]) {
    list.forEach((n) => {
      result.push(n)
      if (n.children) walk(n.children)
    })
  }
  walk(nodes)
  return result
}

// 知识点操作
const kpDialogVisible = ref(false)
const kpForm = ref<Partial<KnowledgePoint>>({})
const kpDialogTitle = ref('')

function handleAddKP(chapterId: number) {
  kpForm.value = { chapterId, sort: 0 }
  kpDialogTitle.value = '新增知识点'
  kpDialogVisible.value = true
}

function handleEditKP(kp: KnowledgePoint) {
  kpForm.value = { ...kp }
  kpDialogTitle.value = '编辑知识点'
  kpDialogVisible.value = true
}

async function submitKP() {
  if (!kpForm.value.name) {
    ElMessage.warning('请输入知识点名称')
    return
  }
  if (kpForm.value.id) {
    await updateKnowledgePoint(kpForm.value.id, kpForm.value)
  } else {
    await createKnowledgePoint(kpForm.value)
  }
  ElMessage.success('保存成功')
  kpDialogVisible.value = false
  loadChapters(currentSubject.value!.id)
}

async function handleDeleteKP(kp: KnowledgePoint) {
  await ElMessageBox.confirm(`确定删除知识点「${kp.name}」吗？`, '提示', { type: 'warning' })
  await deleteKnowledgePoint(kp.id)
  ElMessage.success('删除成功')
  loadChapters(currentSubject.value!.id)
}

onMounted(loadSubjects)
</script>

<template>
  <div v-loading="loading" class="subject-manage page-container">
    <el-row :gutter="16">
      <!-- 左侧科目列表 -->
      <el-col :span="6">
        <div class="panel">
          <div class="panel__header">
            <h3>科目列表</h3>
            <el-button type="primary" size="small" :icon="'Plus'" @click="handleAddSubject">
              新增
            </el-button>
          </div>
          <el-menu :default-active="String(currentSubject?.id)" @select="(id) => selectSubject(subjects.find(s => s.id === Number(id))!)">
            <el-menu-item v-for="s in subjects" :key="s.id" :index="String(s.id)">
              <span>{{ s.name }}</span>
              <el-tag size="small" type="info">{{ s.questionCount || 0 }}题</el-tag>
            </el-menu-item>
          </el-menu>
        </div>
      </el-col>

      <!-- 右侧章节树 -->
      <el-col :span="18">
        <div class="panel">
          <div class="panel__header">
            <h3>{{ currentSubject?.name }} - 章节结构</h3>
            <el-button type="primary" size="small" :icon="'Plus'" @click="handleAddChapter(null)">
              新增章节
            </el-button>
          </div>

          <el-tree
            :data="chapterTree"
            node-key="id"
            :props="{ label: 'name', children: 'children' }"
            draggable
            default-expand-all
            :allow-drop="() => true"
            @node-drop="handleDrop"
          >
            <template #default="{ node, data }">
              <div class="tree-node">
                <span class="tree-node__label">{{ node.label }}</span>
                <span class="tree-node__actions">
                  <el-button link size="small" @click.stop="handleAddChapter(data.id)">添加子章节</el-button>
                  <el-button link size="small" @click.stop="handleEditChapter(data)">编辑</el-button>
                  <el-button link type="danger" size="small" @click.stop="handleDeleteChapter(data)">删除</el-button>
                </span>
                <!-- 知识点 -->
                <div v-if="data.knowledgePoints?.length" class="tree-node__kp">
                  <el-tag
                    v-for="kp in data.knowledgePoints"
                    :key="kp.id"
                    closable
                    size="small"
                    @click.stop="handleEditKP(kp)"
                    @close.stop="handleDeleteKP(kp)"
                  >
                    {{ kp.name }}
                  </el-tag>
                </div>
                <el-button
                  link
                  size="small"
                  type="primary"
                  @click.stop="handleAddKP(data.id)"
                >
                  + 知识点
                </el-button>
              </div>
            </template>
          </el-tree>
        </div>
      </el-col>
    </el-row>

    <!-- 科目弹窗 -->
    <ProDialog v-model="subjectDialogVisible" :title="subjectForm.id ? '编辑科目' : '新增科目'" @confirm="submitSubject">
      <el-form label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="subjectForm.name" placeholder="请输入科目名称" />
        </el-form-item>
        <el-form-item label="编码">
          <el-input v-model="subjectForm.code" placeholder="请输入科目编码" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="subjectForm.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="subjectForm.status">
            <el-option label="启用" value="enabled" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
      </el-form>
    </ProDialog>

    <!-- 章节弹窗 -->
    <ProDialog v-model="chapterDialogVisible" :title="chapterDialogTitle" @confirm="submitChapter">
      <el-form label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="chapterForm.name" placeholder="请输入章节名称" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="chapterForm.sort" :min="0" />
        </el-form-item>
      </el-form>
    </ProDialog>

    <!-- 知识点弹窗 -->
    <ProDialog v-model="kpDialogVisible" :title="kpDialogTitle" width="400px" @confirm="submitKP">
      <el-form label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="kpForm.name" placeholder="请输入知识点名称" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="kpForm.sort" :min="0" />
        </el-form-item>
      </el-form>
    </ProDialog>
  </div>
</template>

<style scoped lang="scss">
.panel {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    h3 {
      font-size: 16px;
    }
  }
}

.tree-node {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;

  &__label {
    font-size: 14px;
  }

  &__actions {
    margin-left: auto;
  }

  &__kp {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    width: 100%;
    padding-left: 8px;
  }
}
</style>
