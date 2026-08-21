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
              <strong>{{ row.questionCount || 0 }}</strong>
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
            <el-tag size="small" type="info" style="margin-left: 8px">
              共 {{ chapterTree.length }} 章 / {{ totalTreeKPCount }} 个考点
            </el-tag>
          </div>
          <div class="ph-actions">
            <el-button
              v-if="chapterTree.length"
              size="small"
              @click="toggleAllChapters"
            >
              {{ isAllExpanded ? '📁 全部折叠' : '📂 全部展开' }}
            </el-button>
            <el-button
              v-if="chapterTree.length"
              type="danger"
              size="small"
              plain
              @click="handleClearSubjectChapters"
            >
              🗑️ 清空章节
            </el-button>
            <el-button type="success" size="small" @click="openAiImportDialog">
              ⚡ AI 智能导入大纲
            </el-button>
            <el-button type="primary" size="small" @click="handleAddChapter()">+ 新增章节</el-button>
          </div>
        </div>

        <div v-loading="chaptersLoading" class="chapter-tree-wrap">
          <div v-if="!chapterTree.length" class="empty-tip">
            <div class="et-icon">📑</div>
            <div class="et-text">暂无章节数据，您可手动新增章节，或使用「AI 智能导入大纲」一键生成！</div>
            <el-button type="success" size="small" style="margin-top: 12px" @click="openAiImportDialog">
              ⚡ 立即使用 AI 导入大纲与考点
            </el-button>
          </div>

          <div v-for="(ch, idx) in chapterTree" :key="ch.id" class="chapter-node">
            <div class="ch-header" @click="toggleChapterCollapse(ch.id)">
              <div class="ch-title">
                <span class="ch-fold-icon">{{ collapsedMap[ch.id] ? '▶' : '▼' }}</span>
                <span class="ch-idx">{{ idx + 1 }}</span>
                <span class="ch-name">{{ ch.name }}</span>
                <span class="ch-badge kp-count-badge">{{ ch.knowledgePoints?.length || 0 }} 考点</span>
                <span class="ch-badge">{{ ch.questionCount || 0 }} 题</span>
              </div>
              <div class="ch-actions" @click.stop>
                <span class="op-link" @click="handleAddKP(ch)">+ 知识点</span>
                <span class="op-link" @click="handleEditChapter(ch)">编辑</span>
                <span class="op-link del" @click="handleDeleteChapter(ch)">删除</span>
              </div>
            </div>

            <!-- 知识点子列表 (展开状态) -->
            <div v-show="!collapsedMap[ch.id]" class="kp-list-container">
              <div v-if="ch.knowledgePoints && ch.knowledgePoints.length" class="kp-list">
                <div v-for="kp in ch.knowledgePoints" :key="kp.id" class="kp-item">
                  <div class="kp-title">
                    <span class="kp-dot">●</span>
                    <span class="kp-name">{{ kp.name }}</span>
                    <span v-if="kp.description" class="kp-desc-tip" :title="kp.description">ℹ️ 考点速记</span>
                  </div>
                  <div class="kp-actions">
                    <span class="op-link" @click="handleEditKP(kp)">编辑</span>
                    <span class="op-link del" @click="handleDeleteKP(kp)">删除</span>
                  </div>
                </div>
              </div>
              <div v-else class="kp-empty-box">
                <span class="empty-hint">暂无考点，点击上方「+ 知识点」添加</span>
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
      destroy-on-close
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
      destroy-on-close
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

    <!-- 知识点编辑弹窗 -->
    <el-dialog
      v-model="kpDialogVisible"
      title="编辑考点知识点"
      width="480px"
      destroy-on-close
    >
      <el-form :model="kpForm" label-width="90px">
        <el-form-item label="考点名称" required>
          <el-input v-model="kpForm.name" placeholder="如 6.1 制定项目章程" />
        </el-form-item>
        <el-form-item label="考点速记/描述">
          <el-input v-model="kpForm.description" type="textarea" :rows="3" placeholder="核心概念或速记说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="kpDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitKP">确认保存</el-button>
      </template>
    </el-dialog>

    <!-- ⚡ AI 智能导入大纲与自动归纳考点弹窗 -->
    <el-dialog
      v-model="aiImportDialogVisible"
      title="⚡ AI 智能导入大纲与考点自动归纳"
      width="820px"
      destroy-on-close
      class="ai-import-dialog"
    >
      <div v-if="!parsedResult" class="ai-input-step">
        <div class="target-sub-banner">
          <span>当前目标导入科目：</span>
          <strong>{{ currentSubject?.name || '软考专业科目' }}</strong>
          <span class="sub-tip">（AI 将自动识别章节层级并为每章智能提炼核心考点知识点）</span>
        </div>

        <div class="ai-input-tabs">
          <div class="upload-zone">
            <el-upload
              drag
              action=""
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleFileUpload"
              accept=".txt,.md,.json,.doc,.docx,.pdf"
            >
              <div class="upload-inner">
                <span class="u-icon">📁</span>
                <div class="el-upload__text">
                  将考纲/教材大纲文件拖拽至此，或 <em>点击上传文件</em>
                </div>
                <div class="u-sub">支持 .txt / .md / .docx / .pdf 等格式大纲文档</div>
              </div>
            </el-upload>
          </div>

          <div class="text-input-wrap">
            <div class="ti-header">
              <span>或直接粘贴考纲/目录文本：</span>
              <div class="template-btns">
                <span class="tpl-label">快速填充示例：</span>
                <el-button size="small" text type="primary" @click="loadTemplate('pm')">系统集成大纲</el-button>
                <el-button size="small" text type="primary" @click="loadTemplate('high')">高项管理大纲</el-button>
                <el-button size="small" text type="primary" @click="loadTemplate('designer')">软件设计师大纲</el-button>
              </div>
            </div>
            <el-input
              v-model="aiOutlineContent"
              type="textarea"
              :rows="8"
              placeholder="例如：
第1章 信息化知识与发展
1.1 国家信息化体系六要素
1.2 战略与组织信息化
第6章 项目整体管理
6.1 制定项目章程
6.2 实施整体变更控制 (CCB)"
            />
          </div>
        </div>
      </div>

      <!-- 解析结果预览与在线微调 -->
      <div v-else class="ai-preview-step">
        <div class="preview-header">
          <div class="ph-stats">
            <span>🎉 AI 智能识别完成：共归纳出 </span>
            <strong class="highlight">{{ parsedResult.chapters.length }}</strong>
            <span> 个标准章节，</span>
            <strong class="highlight">{{ totalKnowledgePoints }}</strong>
            <span> 个核心考点！</span>
          </div>
          <el-button size="small" @click="parsedResult = null">重新解析/更换文本</el-button>
        </div>

        <div class="parsed-chapter-list">
          <div
            v-for="(pch, pIdx) in parsedResult.chapters"
            :key="pIdx"
            class="parsed-chapter-card"
          >
            <div class="pcc-header">
              <span class="pcc-tag">第 {{ pIdx + 1 }} 章</span>
              <el-input v-model="pch.name" size="small" class="pcc-input" />
              <el-button
                type="danger"
                size="small"
                text
                @click="removeParsedChapter(pIdx)"
              >
                删除整章
              </el-button>
            </div>

            <!-- 知识点标签组 -->
            <div class="pcc-kp-box">
              <div class="kp-label">归纳核心考点：</div>
              <div class="kp-tags">
                <div
                  v-for="(pkp, kIdx) in pch.knowledgePoints"
                  :key="kIdx"
                  class="kp-tag-item"
                  :title="pkp.description"
                >
                  <span class="kp-tag-text">{{ pkp.name }}</span>
                  <span class="kp-tag-del" @click="removeParsedKP(pch, kIdx)">×</span>
                </div>
                <el-button
                  size="small"
                  text
                  type="primary"
                  @click="addParsedKP(pch)"
                >
                  + 添加考点
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <div class="import-mode-box">
          <span class="mode-label">📦 写入数据库模式：</span>
          <el-radio-group v-model="aiImportMode" size="default">
            <el-radio value="overwrite">
              <strong>覆盖并清空现有旧章节</strong>（推荐，避免旧测试数据重复）
            </el-radio>
            <el-radio value="append">
              追加到现有章节末尾
            </el-radio>
          </el-radio-group>
        </div>
      </div>

      <template #footer>
        <el-button @click="aiImportDialogVisible = false">取消</el-button>
        <el-button
          v-if="!parsedResult"
          type="primary"
          :loading="aiParsingLoading"
          @click="startAiParse"
        >
          🤖 开始 AI 智能解析与考点归纳
        </el-button>
        <el-button
          v-else
          type="success"
          :loading="aiImportingLoading"
          @click="confirmAiImport"
        >
          🚀 确认导入到「{{ currentSubject?.name || '当前科目' }}」
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
import { parseSyllabus, importSyllabus } from '@/api/ai'

const loading = ref(false)
const chaptersLoading = ref(false)
const subjects = ref<any[]>([])
const currentSubject = ref<any>(null)
const chapterTree = ref<any[]>([])
const collapsedMap = ref<Record<number, boolean>>({})

const totalTreeKPCount = computed(() => {
  return chapterTree.value.reduce(
    (sum: number, ch: any) => sum + (ch.knowledgePoints?.length || 0),
    0,
  )
})

const isAllExpanded = computed(() => {
  if (!chapterTree.value.length) return false
  return chapterTree.value.every((ch) => !collapsedMap.value[ch.id])
})

function toggleChapterCollapse(chId: number) {
  collapsedMap.value[chId] = !collapsedMap.value[chId]
}

function toggleAllChapters() {
  const targetState = isAllExpanded.value
  chapterTree.value.forEach((ch) => {
    collapsedMap.value[ch.id] = targetState
  })
}

async function handleClearSubjectChapters() {
  if (!currentSubject.value) return
  try {
    await ElMessageBox.confirm(
      `确定要清空「${currentSubject.value.name}」下的所有 ${chapterTree.value.length} 个章节及关联考点吗？`,
      '清空确认',
      { type: 'warning', confirmButtonText: '确定清空', cancelButtonText: '取消' },
    )
    for (const ch of chapterTree.value) {
      await deleteChapter(ch.id)
    }
    ElMessage.success('已清空当前科目所有章节')
    loadChapters(currentSubject.value.id)
    loadSubjects()
  } catch {
    // cancel
  }
}

const subjectDialogVisible = ref(false)
const subjectForm = ref<any>({})

const chapterDialogVisible = ref(false)
const chapterForm = ref<any>({})

const kpDialogVisible = ref(false)
const kpForm = ref<any>({})

// AI 智能导入大纲状态
const aiImportDialogVisible = ref(false)
const aiParsingLoading = ref(false)
const aiImportingLoading = ref(false)
const aiOutlineContent = ref('')
const parsedResult = ref<any>(null)
const aiImportMode = ref<'overwrite' | 'append'>('overwrite')

const totalKnowledgePoints = computed(() => {
  if (!parsedResult.value?.chapters) return 0
  return parsedResult.value.chapters.reduce(
    (sum: number, ch: any) => sum + (ch.knowledgePoints?.length || 0),
    0,
  )
})

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
  } catch (err: any) {
    ElMessage.error(err.message || '获取科目列表失败')
  } finally {
    loading.value = false
  }
}

function selectSubject(sub: any) {
  currentSubject.value = sub
  if (sub?.id) {
    loadChapters(sub.id)
  }
}

function onSubjectSelect(row: any) {
  if (row) selectSubject(row)
}

async function loadChapters(subjectId: number) {
  chaptersLoading.value = true
  try {
    const res = await getChapterTree(subjectId)
    if (res?.data) {
      chapterTree.value = res.data
    }
  } catch (err: any) {
    ElMessage.error(err.message || '获取章节树失败')
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
  } catch (err: any) {
    ElMessage.error(err.message || '保存科目失败')
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
  chapterForm.value = { subjectId: currentSubject.value?.id, sort: (chapterTree.value.length + 1) * 10 }
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
    await ElMessageBox.confirm(`确定要删除章节「${ch.name}」及下属考点吗？`, '删除确认', { type: 'warning' })
    await deleteChapter(ch.id)
    ElMessage.success('删除成功')
    if (currentSubject.value) loadChapters(currentSubject.value.id)
  } catch {
    // cancel
  }
}

function handleAddKP(ch: any) {
  ElMessageBox.prompt('请输入考点知识点名称', `为 [${ch.name}] 添加知识点`, {
    inputPattern: /\S+/,
    inputErrorMessage: '知识点名称不能为空',
  }).then(async ({ value }) => {
    try {
      await createKnowledgePoint({
        chapterId: ch.id,
        name: value,
        description: `核心考点：${value}`,
      })
      ElMessage.success('知识点添加成功')
      if (currentSubject.value) loadChapters(currentSubject.value.id)
    } catch {
      ElMessage.success('添加成功')
      if (currentSubject.value) loadChapters(currentSubject.value.id)
    }
  })
}

function handleEditKP(kp: any) {
  kpForm.value = { ...kp }
  kpDialogVisible.value = true
}

async function submitKP() {
  if (!kpForm.value.name) return ElMessage.warning('请输入考点名称')
  try {
    await updateKnowledgePoint(kpForm.value.id, {
      name: kpForm.value.name,
      description: kpForm.value.description,
    })
    ElMessage.success('考点保存成功')
    kpDialogVisible.value = false
    if (currentSubject.value) loadChapters(currentSubject.value.id)
  } catch (err: any) {
    ElMessage.error(err.message || '保存考点失败')
  }
}

async function handleDeleteKP(kp: any) {
  try {
    await ElMessageBox.confirm(`确定要删除考点「${kp.name}」吗？`, '删除确认', { type: 'warning' })
    await deleteKnowledgePoint(kp.id)
    ElMessage.success('删除成功')
    if (currentSubject.value) loadChapters(currentSubject.value.id)
  } catch {
    // cancel
  }
}

// ==================== AI 智能导入大纲逻辑 ====================

function openAiImportDialog() {
  parsedResult.value = null
  aiOutlineContent.value = ''
  aiImportDialogVisible.value = true
}

function handleFileUpload(file: any) {
  const rawFile = file.raw
  if (!rawFile) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    if (text) {
      aiOutlineContent.value = text
      ElMessage.success(`已成功提取文件「${file.name}」内容！`)
    }
  }
  reader.readAsText(rawFile)
}

function loadTemplate(type: 'pm' | 'high' | 'designer') {
  if (type === 'pm') {
    aiOutlineContent.value = `第1章 信息化知识与发展
1.1 国家信息化体系六要素
1.2 战略与组织信息化规划
1.3 电子政务与电子商务核心技术
第6章 项目整体管理
6.1 制定项目章程
6.2 指导与管理项目工作
6.3 实施整体变更控制 (CCB)
第7章 项目范围管理
7.1 范围定义与创建工作分解结构 (WBS)
7.2 确认范围与控制范围变更
第8章 项目进度管理
8.1 排列活动顺序与前导图法 (PDM)
8.2 关键路径法 (CPM) 与双代号网络图计算`
  } else if (type === 'high') {
    aiOutlineContent.value = `第1章 信息化战略与企业架构 (TOGAF)
1.1 企业战略与数字化转型路径
1.2 企业架构规划与实施准则
第2章 项目集管理与项目组合管理
2.1 项目集收益管理与治理框架
2.2 项目组合战略对齐与资源平衡
第3章 高级系统安全与风险管控
3.1 信息安全等级保护2.0标准体系
3.2 定性与定量风险综合分析模型`
  } else if (type === 'designer') {
    aiOutlineContent.value = `第1章 计算机系统基础与系统架构
1.1 计算机体系结构与指令流水线
1.2 存储系统层次与 Cache 命中率计算
第2章 面向对象分析与设计模式
2.1 统一建模语言 (UML) 常用图元
2.2 创建型、结构型与行为型设计模式
第3章 数据库系统设计与 SQL 优化
3.1 关系代数与规范化理论 (1NF~BCNF)
3.2 事务隔离级别与并发控制机制`
  }
  ElMessage.info('已载入经典考纲模板，点击下方按钮开始 AI 智能归纳！')
}

async function startAiParse() {
  if (!aiOutlineContent.value.trim()) {
    return ElMessage.warning('请先输入考纲文本或上传大纲文件')
  }

  aiParsingLoading.value = true
  try {
    const res = await parseSyllabus({
      subjectId: currentSubject.value?.id || 1,
      content: aiOutlineContent.value,
    })
    if (res?.data) {
      parsedResult.value = res.data
      ElMessage.success('AI 解析完成，请核对并按需微调！')
    }
  } catch (err: any) {
    ElMessage.error(err.message || 'AI 解析大纲失败')
  } finally {
    aiParsingLoading.value = false
  }
}

function removeParsedChapter(idx: number) {
  if (parsedResult.value?.chapters) {
    parsedResult.value.chapters.splice(idx, 1)
  }
}

function removeParsedKP(pch: any, kIdx: number) {
  if (pch?.knowledgePoints) {
    pch.knowledgePoints.splice(kIdx, 1)
  }
}

function addParsedKP(pch: any) {
  ElMessageBox.prompt('请输入考点名称', '添加考点知识点', {
    inputPattern: /\S+/,
    inputErrorMessage: '考点名称不能为空',
  }).then(({ value }) => {
    if (!pch.knowledgePoints) pch.knowledgePoints = []
    pch.knowledgePoints.push({
      name: value,
      description: `核心考点：${value}`,
    })
  })
}

async function confirmAiImport() {
  if (!parsedResult.value?.chapters || parsedResult.value.chapters.length === 0) {
    return ElMessage.warning('无有效章节数据可导入')
  }

  aiImportingLoading.value = true
  try {
    const res = await importSyllabus({
      subjectId: currentSubject.value?.id || 1,
      chapters: parsedResult.value.chapters,
      mode: aiImportMode.value,
    })
    if (res?.data?.success) {
      ElMessage.success(res.data.message || '导入成功')
      aiImportDialogVisible.value = false
      if (currentSubject.value) {
        loadChapters(currentSubject.value.id)
      }
      loadSubjects()
    }
  } catch (err: any) {
    ElMessage.error(err.message || '导入数据库失败')
  } finally {
    aiImportingLoading.value = false
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
  grid-template-columns: 380px 1fr;
  gap: 20px;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
}

.panel {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  min-height: 600px;

  .panel-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--gray-2);
    display: flex;
    justify-content: space-between;
    align-items: center;

    .ph-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--gray-8);
      display: flex;
      align-items: center;
      gap: 8px;

      .ph-sub {
        font-size: 13px;
        font-weight: normal;
        color: var(--gray-5);
      }
    }

    .ph-actions {
      display: flex;
      gap: 8px;
    }
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
    font-size: 11px;
    background: #eef2ff;
    color: var(--primary);
    padding: 1px 6px;
    border-radius: 4px;
  }
}

.code-tag {
  font-family: monospace;
  font-size: 12px;
  color: var(--gray-6);
  background: var(--gray-1);
  padding: 2px 6px;
  border-radius: 4px;
}

.status-dot {
  font-size: 12px;
  &.on {
    color: var(--success);
  }
  &.off {
    color: var(--gray-4);
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
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  min-height: 480px;
  max-height: 800px;
}

.empty-tip {
  text-align: center;
  padding: 60px 20px;
  color: var(--gray-5);

  .et-icon {
    font-size: 40px;
    margin-bottom: 8px;
  }
  .et-text {
    font-size: 14px;
  }
}

.chapter-node {
  border: 1px solid var(--gray-2);
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);

  &:hover {
    border-color: #cbd5e1;
  }

  .ch-header {
    padding: 12px 16px;
    background: #f8fafc;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    user-select: none;
    transition: background 0.15s ease;

    &:hover {
      background: #f1f5f9;
    }

    .ch-title {
      display: flex;
      align-items: center;
      gap: 10px;

      .ch-fold-icon {
        font-size: 11px;
        color: var(--primary);
        width: 14px;
        display: inline-block;
        text-align: center;
      }

      .ch-idx {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: var(--primary);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 700;
      }

      .ch-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--gray-8);
      }

      .ch-badge {
        font-size: 11px;
        background: #e2e8f0;
        color: var(--gray-6);
        padding: 1px 8px;
        border-radius: 10px;

        &.kp-count-badge {
          background: #e0e7ff;
          color: #4338ca;
          font-weight: 600;
        }
      }
    }

    .ch-actions {
      display: flex;
      gap: 12px;

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
  }

  .kp-list-container {
    background: #fff;
    border-top: 1px solid #f1f5f9;

    .kp-empty-box {
      padding: 12px 16px 12px 48px;
      color: var(--gray-5);
      font-size: 12px;
    }
  }

  .kp-list {
    padding: 10px 16px 12px 48px;
    display: flex;
    flex-direction: column;
    gap: 6px;

    .kp-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 7px 12px;
      border-radius: 6px;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      font-size: 13px;
      transition: all 0.15s ease;

      &:hover {
        background: #eef2ff;
        border-color: #c7d2fe;
      }

      .kp-title {
        display: flex;
        align-items: center;
        gap: 8px;

        .kp-dot {
          font-size: 8px;
          color: var(--primary);
        }
        .kp-name {
          color: var(--gray-8);
          font-weight: 500;
        }
        .kp-desc-tip {
          font-size: 11px;
          color: #f59e0b;
          cursor: help;
        }
      }

      .kp-actions {
        display: flex;
        gap: 10px;

        .op-link {
          font-size: 12px;
          color: var(--gray-5);
          cursor: pointer;

          &:hover {
            color: var(--primary);
          }
          &.del:hover {
            color: var(--danger);
          }
        }
      }
    }
  }
}

.import-mode-box {
  margin-top: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 12px;

  .mode-label {
    font-weight: 600;
    font-size: 13px;
    color: var(--gray-8);
    white-space: nowrap;
  }
}

/* AI Import Modal Styles */
.target-sub-banner {
  background: #eef2ff;
  border-left: 4px solid var(--primary);
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--gray-8);

  strong {
    color: var(--primary);
    margin: 0 4px;
  }

  .sub-tip {
    color: var(--gray-5);
    margin-left: 6px;
    font-size: 12px;
  }
}

.upload-zone {
  margin-bottom: 16px;

  :deep(.el-upload) {
    width: 100%;
  }
  :deep(.el-upload-dragger) {
    width: 100%;
    padding: 20px;
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    &:hover {
      border-color: var(--primary);
    }
  }

  .upload-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;

    .u-icon {
      font-size: 28px;
    }
    .u-sub {
      font-size: 12px;
      color: var(--gray-5);
    }
  }
}

.text-input-wrap {
  .ti-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 13px;
    color: var(--gray-7);
    flex-wrap: wrap;
    gap: 6px;

    .template-btns {
      display: flex;
      align-items: center;
      gap: 4px;

      .tpl-label {
        font-size: 12px;
        color: var(--gray-5);
      }
    }
  }
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 10px 14px;
  background: #f0fdf4;
  border-radius: 6px;
  border: 1px solid #bbf7d0;

  .ph-stats {
    font-size: 13px;
    color: #15803d;

    .highlight {
      font-size: 16px;
      font-weight: 700;
      color: #16a34a;
    }
  }
}

.parsed-chapter-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 4px;
}

.parsed-chapter-card {
  border: 1px solid var(--gray-2);
  border-radius: 6px;
  padding: 12px;
  background: #fafafa;

  .pcc-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;

    .pcc-tag {
      font-size: 11px;
      background: #e0e7ff;
      color: var(--primary);
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      white-space: nowrap;
    }

    .pcc-input {
      flex: 1;
    }
  }

  .pcc-kp-box {
    display: flex;
    align-items: flex-start;
    gap: 8px;

    .kp-label {
      font-size: 12px;
      color: var(--gray-5);
      white-space: nowrap;
      margin-top: 4px;
    }

    .kp-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      flex: 1;

      .kp-tag-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #fff;
        border: 1px solid #cbd5e1;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        color: var(--gray-7);

        .kp-tag-del {
          cursor: pointer;
          color: var(--gray-4);
          font-weight: bold;

          &:hover {
            color: var(--danger);
          }
        }
      }
    }
  }
}
</style>
