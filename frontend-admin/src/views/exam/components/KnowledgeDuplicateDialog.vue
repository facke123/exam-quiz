<template>
  <el-dialog
    v-model="visible"
    title="🔍 知识库重复内容智能检测与清理"
    width="1080px"
    top="5vh"
    destroy-on-close
    class="knowledge-duplicate-dialog"
  >
    <!-- 顶部过滤与扫描控制栏 -->
    <div class="duplicate-toolbar">
      <div class="dt-left">
        <span class="label">检测科目：</span>
        <el-select
          v-model="filterSubjectId"
          placeholder="全部科目"
          clearable
          style="width: 220px"
          @change="onSubjectChange"
        >
          <el-option label="全部科目" :value="0" />
          <el-option
            v-for="s in subjects"
            :key="s.value"
            :label="s.label"
            :value="s.value"
          />
        </el-select>

        <span class="label" style="margin-left: 12px">查重规则：</span>
        <el-radio-group v-model="matchType" size="default" @change="fetchDuplicates">
          <el-radio-button value="exact_name">名称精确比对</el-radio-button>
          <el-radio-button value="normalized_name">智能忽略符号与空格</el-radio-button>
        </el-radio-group>
      </div>

      <div class="dt-right">
        <el-button :loading="scanning" type="primary" plain @click="fetchDuplicates">
          🔄 重新扫描检测
        </el-button>
      </div>
    </div>

    <!-- 扫描结果概览 Banner -->
    <div v-if="duplicateData" class="result-banner">
      <el-alert
        v-if="duplicateData.totalDuplicates > 0"
        type="warning"
        :closable="false"
        show-icon
      >
        <template #title>
          <div class="banner-title">
            检测到 <strong>{{ duplicateData.duplicateGroupCount }}</strong> 组重复知识点，共计
            <strong>{{ duplicateData.totalDuplicates }}</strong> 条冗余副本可被清理。
          </div>
        </template>
        <template #default>
          <div class="banner-desc">
            系统已根据<strong>核心逻辑框架字数、速记口诀完整度、出处章节及配套题数</strong>自动为您推荐每组的最佳保留项（标有
            <el-tag size="small" type="success" effect="dark">🌟 推荐保留</el-tag>）。
          </div>
        </template>
      </el-alert>

      <el-alert
        v-else
        type="success"
        :closable="false"
        show-icon
        title="🎉 太棒了！当前知识库中未检测到任何重复知识点，内容质量状态优良！"
      />
    </div>

    <!-- 批量快捷操作栏 -->
    <div v-if="duplicateData && duplicateData.totalDuplicates > 0" class="batch-action-bar">
      <div class="ba-left">
        <el-dropdown trigger="click" @command="handleQuickDeduplicate">
          <el-button type="danger" :loading="cleaning">
            ⚡ 一键智能去重清理 ({{ duplicateData.totalDuplicates }}条)
            <el-icon class="el-icon--right">▼</el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="keep_richer">
                🌟 保留最丰富内容（推荐：保留字数最多、解析最全版本）
              </el-dropdown-item>
              <el-dropdown-item command="keep_earliest">
                🕒 保留最早创建记录（保留原始历史版本）
              </el-dropdown-item>
              <el-dropdown-item command="keep_latest">
                ✨ 保留最新创建记录（保留最近更新版本）
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-button
          type="danger"
          plain
          :disabled="selectedRowIds.length === 0"
          :loading="cleaning"
          @click="handleDeleteSelected"
        >
          🗑️ 批量删除选中副本 {{ selectedRowIds.length ? `(${selectedRowIds.length})` : '' }}
        </el-button>

        <span v-if="selectedRowIds.length > 0" class="select-tip">
          已勾选 {{ selectedRowIds.length }} 项
          <el-button link type="primary" size="small" @click="clearRowSelection">取消勾选</el-button>
        </span>
      </div>

      <div class="ba-right">
        <span class="group-count-tip">共 {{ duplicateData.groups.length }} 个重复组</span>
      </div>
    </div>

    <!-- 重复分组列表 -->
    <div
      v-loading="scanning"
      class="groups-scroll-container"
      :class="{ empty: !duplicateData || duplicateData.groups.length === 0 }"
    >
      <div v-if="duplicateData && duplicateData.groups.length > 0" class="groups-list">
        <div
          v-for="(group, gIdx) in duplicateData.groups"
          :key="group.groupKey || gIdx"
          class="group-card"
        >
          <!-- 组标题栏 -->
          <div class="gc-header">
            <div class="gc-title-wrap">
              <span class="gc-idx">#{{ gIdx + 1 }}</span>
              <span class="gc-name">考点名称：<strong>{{ group.name }}</strong></span>
              <el-tag size="small" type="primary" effect="plain">{{ group.subjectName }}</el-tag>
              <el-tag size="small" type="danger" effect="light">重复 {{ group.count }} 条副本</el-tag>
            </div>

            <div class="gc-actions">
              <el-button
                size="small"
                type="info"
                plain
                @click="openCompareDialog(group)"
              >
                ⚖️ 差异横向比对
              </el-button>
              <el-button
                size="small"
                type="danger"
                plain
                :loading="cleaning"
                @click="handleCleanGroup(group)"
              >
                ⚡ 清理此组冗余项 ({{ group.redundantCount }}条)
              </el-button>
            </div>
          </div>

          <!-- 组内项数据表格 -->
          <div class="gc-table-wrap">
            <el-table
              :data="group.items"
              size="small"
              border
              row-key="id"
              :header-cell-style="{ background: '#f8fafc', color: '#475569' }"
              @selection-change="(rows) => onGroupSelectionChange(group.groupKey, rows)"
            >
              <el-table-column
                type="selection"
                width="42"
                align="center"
                :selectable="(row) => row.id !== group.recommendedKeepId"
              />
              <el-table-column prop="id" label="ID" width="70" align="center" />
              <el-table-column label="考点级别" width="85" align="center">
                <template #default="{ row }">
                  <el-tag
                    size="small"
                    :type="row.importance === '必考' ? 'danger' : row.importance === '高频' ? 'warning' : 'info'"
                  >
                    {{ row.importance || '必考' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="sourceBook" label="出处章节" min-width="160" show-overflow-tooltip />
              <el-table-column label="内容字数" width="95" align="center">
                <template #default="{ row }">
                  <span class="content-len-tag">📝 {{ row.contentLength }} 字</span>
                </template>
              </el-table-column>
              <el-table-column label="速记口诀预览" min-width="180" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="tip-preview">💡 {{ row.memoryTips || '无口诀' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="智能评估建议" width="160" align="center">
                <template #default="{ row }">
                  <el-tag
                    v-if="row.id === group.recommendedKeepId"
                    type="success"
                    effect="dark"
                    size="small"
                    class="keep-badge"
                  >
                    🌟 推荐保留 (最丰富)
                  </el-tag>
                  <span v-else class="redundant-tag">待清理副本</span>
                </template>
              </el-table-column>
              <el-table-column prop="createdAt" label="创建时间" width="150">
                <template #default="{ row }">
                  <span class="time-txt">{{ formatTime(row.createdAt) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="160" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="viewDetail(row)">
                    查看
                  </el-button>
                  <el-button
                    v-if="row.id !== group.recommendedKeepId"
                    link
                    type="warning"
                    size="small"
                    @click="setAsRecommended(group, row.id)"
                  >
                    设为保留
                  </el-button>
                  <el-popconfirm
                    title="确定要删除此条重复副本吗？"
                    @confirm="handleDeleteSingle(row)"
                  >
                    <template #reference>
                      <el-button link type="danger" size="small">删除</el-button>
                    </template>
                  </el-popconfirm>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>

      <div v-else-if="!scanning" class="empty-placeholder">
        <div class="ep-icon">✨</div>
        <div class="ep-title">无重复知识点</div>
        <div class="ep-desc">当前科目下所有考点名称均唯一，无需去重。</div>
      </div>
    </div>

    <!-- 底部操作区 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
        <el-button type="primary" plain @click="fetchDuplicates">重新检测</el-button>
      </div>
    </template>

    <!-- 差异横向比对弹窗 -->
    <el-dialog
      v-model="compareDialogVisible"
      :title="`⚖️ 重复考点差异比对：【${currentCompareGroup?.name || ''}】`"
      width="920px"
      top="8vh"
      append-to-body
      destroy-on-close
    >
      <div v-if="currentCompareGroup" class="compare-container">
        <div class="compare-tip">
          共有 <strong>{{ currentCompareGroup.items.length }}</strong> 条同名记录，可对比后直接点击【保留此项并删除其它】完成去重：
        </div>
        <div class="compare-grid" :style="{ gridTemplateColumns: `repeat(${Math.min(currentCompareGroup.items.length, 3)}, 1fr)` }">
          <div
            v-for="item in currentCompareGroup.items"
            :key="item.id"
            class="compare-card"
            :class="{ 'is-recommended': item.id === currentCompareGroup.recommendedKeepId }"
          >
            <div class="cc-header">
              <div class="cch-title">
                <strong>ID: {{ item.id }}</strong>
                <el-tag
                  v-if="item.id === currentCompareGroup.recommendedKeepId"
                  type="success"
                  size="small"
                  effect="dark"
                >
                  🌟 推荐保留
                </el-tag>
              </div>
              <div class="cch-info">
                <span>{{ item.importance }}</span> · <span>{{ item.categoryTag }}</span>
              </div>
            </div>

            <div class="cc-section">
              <div class="ccs-label">出处章节：</div>
              <div class="ccs-val">{{ item.sourceBook }}</div>
            </div>

            <div class="cc-section">
              <div class="ccs-label">核心逻辑框架 ({{ item.coreAnalysis.length }}字)：</div>
              <pre class="ccs-pre">{{ item.coreAnalysis || '暂无逻辑框架' }}</pre>
            </div>

            <div class="cc-section">
              <div class="ccs-label">速记口诀：</div>
              <div class="ccs-tips">{{ item.memoryTips || '暂无口诀' }}</div>
            </div>

            <div class="cc-footer">
              <el-button
                type="primary"
                size="small"
                :plain="item.id !== currentCompareGroup.recommendedKeepId"
                :loading="cleaning"
                @click="keepThisItemOnly(currentCompareGroup, item.id)"
              >
                {{ item.id === currentCompareGroup.recommendedKeepId ? '✅ 确认保留此项并删除其它' : '保留此项并删除其它' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 知识点详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="detailItem?.name || '考点详情'"
      width="680px"
      append-to-body
    >
      <div v-if="detailItem" class="detail-box">
        <div class="db-header">
          <el-tag :type="detailItem.importance === '必考' ? 'danger' : 'warning'">
            {{ detailItem.importance }}
          </el-tag>
          <el-tag type="primary" effect="plain">{{ detailItem.categoryTag }}</el-tag>
          <span class="db-source">{{ detailItem.sourceBook }}</span>
        </div>
        <div class="db-sec">
          <div class="dbs-title">📖 逻辑框架内容</div>
          <pre class="dbs-pre">{{ detailItem.coreAnalysis || '暂无内容' }}</pre>
        </div>
        <div class="db-sec">
          <div class="dbs-title">💡 记忆口诀</div>
          <div class="dbs-tip">{{ detailItem.memoryTips || '暂无口诀' }}</div>
        </div>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getDuplicateKnowledgePoints,
  deduplicateKnowledgePoints,
  deleteKnowledgePoint,
  type DuplicateKnowledgeResult,
  type DuplicateKnowledgeGroup,
  type DuplicateKnowledgeItem,
} from '@/api/exam'

const props = defineProps<{
  modelValue: boolean
  subjectId?: number
  subjects: Array<{ label: string; value: number }>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'cleaned'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
})

const filterSubjectId = ref<number>(props.subjectId || 0)
const matchType = ref<'exact_name' | 'normalized_name'>('exact_name')
const scanning = ref(false)
const cleaning = ref(false)
const duplicateData = ref<DuplicateKnowledgeResult | null>(null)

// 选中删除的 ID 映射表
const groupSelectionMap = ref<Record<string, number[]>>({})
const selectedRowIds = computed(() => {
  const ids: number[] = []
  for (const list of Object.values(groupSelectionMap.value)) {
    ids.push(...list)
  }
  return ids
})

// 比对与详情弹窗
const compareDialogVisible = ref(false)
const currentCompareGroup = ref<DuplicateKnowledgeGroup | null>(null)
const detailDialogVisible = ref(false)
const detailItem = ref<DuplicateKnowledgeItem | null>(null)

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      if (props.subjectId !== undefined) {
        filterSubjectId.value = props.subjectId
      }
      fetchDuplicates()
    }
  },
)

function onSubjectChange() {
  clearRowSelection()
  fetchDuplicates()
}

function onGroupSelectionChange(groupKey: string, rows: DuplicateKnowledgeItem[]) {
  groupSelectionMap.value[groupKey] = rows.map((r) => r.id)
}

function clearRowSelection() {
  groupSelectionMap.value = {}
}

async function fetchDuplicates() {
  scanning.value = true
  clearRowSelection()
  try {
    const res = await getDuplicateKnowledgePoints({
      subjectId: filterSubjectId.value > 0 ? filterSubjectId.value : undefined,
      matchType: matchType.value,
    })
    if (res?.data) {
      duplicateData.value = res.data
    }
  } catch (err: any) {
    ElMessage.error(err.message || '检测重复知识点失败')
  } finally {
    scanning.value = false
  }
}

// 快速一键智能去重
async function handleQuickDeduplicate(strategy: string) {
  if (!duplicateData.value || duplicateData.value.totalDuplicates === 0) return

  const strategyNameMap: Record<string, string> = {
    keep_richer: '保留内容最丰富项',
    keep_earliest: '保留最早创建记录',
    keep_latest: '保留最新创建记录',
  }

  try {
    await ElMessageBox.confirm(
      `确定按照【${strategyNameMap[strategy]}】策略，一键清理全部 ${duplicateData.value.totalDuplicates} 条重复知识点吗？\n此操作将自动删除冗余副本，保留推荐的核心知识点，不可撤销！`,
      '一键去重确认',
      {
        confirmButtonText: '确定去重',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      },
    )

    cleaning.value = true
    const res = await deduplicateKnowledgePoints({
      strategy,
      subjectId: filterSubjectId.value > 0 ? filterSubjectId.value : undefined,
      matchType: matchType.value,
    })

    ElMessage.success(res?.data?.message || '智能去重完成')
    emit('cleaned')
    await fetchDuplicates()
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || '去重失败')
    }
  } finally {
    cleaning.value = false
  }
}

// 单组清理
async function handleCleanGroup(group: DuplicateKnowledgeGroup) {
  try {
    await ElMessageBox.confirm(
      `确定清理【${group.name}】的 ${group.redundantCount} 条冗余记录吗？将保留推荐项 (ID: ${group.recommendedKeepId})。`,
      '单组清理确认',
      {
        confirmButtonText: '确定清理',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    cleaning.value = true
    const deleteIds = group.items
      .filter((item) => item.id !== group.recommendedKeepId)
      .map((item) => item.id)

    const res = await deduplicateKnowledgePoints({ deleteIds })
    ElMessage.success(res?.data?.message || `已成功清理此组 ${deleteIds.length} 条重复项`)
    emit('cleaned')
    await fetchDuplicates()
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || '清理失败')
    }
  } finally {
    cleaning.value = false
  }
}

// 批量删除选中的副本
async function handleDeleteSelected() {
  const ids = selectedRowIds.value
  if (ids.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要删除已勾选的 ${ids.length} 条重复知识点副本吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      },
    )

    cleaning.value = true
    const res = await deduplicateKnowledgePoints({ deleteIds: ids })
    ElMessage.success(res?.data?.message || `成功删除 ${ids.length} 条记录`)
    clearRowSelection()
    emit('cleaned')
    await fetchDuplicates()
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || '删除失败')
    }
  } finally {
    cleaning.value = false
  }
}

// 单条删除
async function handleDeleteSingle(row: DuplicateKnowledgeItem) {
  try {
    await deleteKnowledgePoint(row.id)
    ElMessage.success('删除成功')
    emit('cleaned')
    await fetchDuplicates()
  } catch (err: any) {
    ElMessage.error(err.message || '删除失败')
  }
}

// 设为组内推荐保留项
function setAsRecommended(group: DuplicateKnowledgeGroup, id: number) {
  group.recommendedKeepId = id
  ElMessage.success(`已将 ID: ${id} 设为此组保留目标`)
}

// 打开比对弹窗
function openCompareDialog(group: DuplicateKnowledgeGroup) {
  currentCompareGroup.value = group
  compareDialogVisible.value = true
}

// 在比对弹窗中指定保留某一项
async function keepThisItemOnly(group: DuplicateKnowledgeGroup, keepId: number) {
  try {
    const deleteIds = group.items
      .filter((item) => item.id !== keepId)
      .map((item) => item.id)

    cleaning.value = true
    const res = await deduplicateKnowledgePoints({ deleteIds })
    ElMessage.success(res?.data?.message || `去重成功，已保留 ID: ${keepId}`)
    compareDialogVisible.value = false
    emit('cleaned')
    await fetchDuplicates()
  } catch (err: any) {
    ElMessage.error(err.message || '操作失败')
  } finally {
    cleaning.value = false
  }
}

// 查看单项详情
function viewDetail(row: DuplicateKnowledgeItem) {
  detailItem.value = row
  detailDialogVisible.value = true
}

function formatTime(val: string) {
  if (!val) return '-'
  return val.replace('T', ' ').slice(0, 16)
}
</script>

<style scoped lang="scss">
.knowledge-duplicate-dialog {
  :deep(.el-dialog__body) {
    padding: 16px 20px 24px;
  }
}

.duplicate-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-lighter);

  .dt-left {
    display: flex;
    align-items: center;

    .label {
      font-size: 13px;
      color: var(--el-text-color-regular);
      margin-right: 6px;
    }
  }
}

.result-banner {
  margin-bottom: 16px;

  .banner-title {
    font-size: 14px;
    font-weight: 700;
  }

  .banner-desc {
    font-size: 12px;
    margin-top: 4px;
    line-height: 1.5;
  }
}

.batch-action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  padding: 8px 4px;

  .ba-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .select-tip {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .group-count-tip {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
  }
}

.groups-scroll-container {
  max-height: 520px;
  overflow-y: auto;
  padding-right: 4px;

  &.empty {
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .groups-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .group-card {
    background: #fff;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .gc-header {
      background: #f1f5f9;
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--el-border-color-lighter);

      .gc-title-wrap {
        display: flex;
        align-items: center;
        gap: 8px;

        .gc-idx {
          font-size: 11px;
          font-weight: 700;
          background: #cbd5e1;
          color: #334155;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .gc-name {
          font-size: 14px;
          color: var(--el-text-color-primary);
        }
      }

      .gc-actions {
        display: flex;
        gap: 8px;
      }
    }

    .gc-table-wrap {
      padding: 8px;

      .content-len-tag {
        font-size: 12px;
        color: #0284c7;
        font-weight: 600;
      }

      .tip-preview {
        font-size: 12px;
        color: #d97706;
      }

      .keep-badge {
        font-weight: 600;
      }

      .redundant-tag {
        font-size: 11px;
        color: var(--el-text-color-placeholder);
      }

      .time-txt {
        font-size: 11px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .empty-placeholder {
    text-align: center;
    padding: 40px 0;

    .ep-icon {
      font-size: 40px;
      margin-bottom: 8px;
    }

    .ep-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }

    .ep-desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: 4px;
    }
  }
}

/* 横向差异比对 */
.compare-container {
  .compare-tip {
    font-size: 13px;
    color: var(--el-text-color-regular);
    margin-bottom: 14px;
  }

  .compare-grid {
    display: grid;
    gap: 14px;

    .compare-card {
      background: #fafafa;
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;

      &.is-recommended {
        background: #f0fdf4;
        border-color: #86efac;
        box-shadow: 0 2px 8px rgba(34, 197, 94, 0.15);
      }

      .cc-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--el-border-color-extra-light);

        .cch-title {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .cch-info {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }

      .cc-section {
        .ccs-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--el-text-color-secondary);
          margin-bottom: 4px;
        }

        .ccs-val {
          font-size: 13px;
          color: var(--el-text-color-primary);
        }

        .ccs-pre {
          background: #fff;
          padding: 8px;
          border-radius: 4px;
          font-size: 12px;
          line-height: 1.5;
          max-height: 200px;
          overflow-y: auto;
          white-space: pre-wrap;
          word-break: break-word;
          color: var(--el-text-color-regular);
          border: 1px solid var(--el-border-color-extra-light);
        }

        .ccs-tips {
          background: #fffbeb;
          border: 1px solid #fef3c7;
          color: #b45309;
          padding: 6px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
      }

      .cc-footer {
        margin-top: auto;
        padding-top: 10px;
        text-align: center;
      }
    }
  }
}

/* 单项详情弹窗 */
.detail-box {
  display: flex;
  flex-direction: column;
  gap: 14px;

  .db-header {
    display: flex;
    align-items: center;
    gap: 8px;

    .db-source {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-left: auto;
    }
  }

  .db-sec {
    .dbs-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--el-text-color-primary);
      margin-bottom: 6px;
    }

    .dbs-pre {
      background: var(--el-fill-color-light);
      padding: 10px;
      border-radius: 6px;
      font-size: 13px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .dbs-tip {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      color: #b45309;
      padding: 8px 10px;
      border-radius: 4px;
      font-size: 13px;
    }
  }
}
</style>
