<template>
  <div class="feedback-page">
    <div class="table-panel">
      <!-- 顶部筛选工具栏 -->
      <div class="table-toolbar">
        <div class="filter-bar">
          <el-select
            v-model="query.status"
            placeholder="全部处理状态"
            clearable
            class="filter-select"
            style="width: 140px"
            @change="fetchList"
          >
            <el-option label="待处理" value="pending" />
            <el-option label="已采纳" value="accepted" />
            <el-option label="已驳回" value="rejected" />
          </el-select>

          <el-input
            v-model="query.keyword"
            placeholder="🔍 搜索题干关键词 / 提交用户"
            clearable
            class="filter-input"
            style="width: 260px"
            @keyup.enter="fetchList"
          />

          <el-button type="primary" class="btn-primary" @click="fetchList">查询</el-button>
          <el-button class="btn-outline" @click="resetQuery">重置</el-button>
        </div>

        <div class="actions-bar">
          <span class="fb-stat">共收到 <strong>{{ total }}</strong> 条纠错反馈 · {{ pendingCount }} 条待处理</span>
        </div>
      </div>

      <!-- 反馈列表表格 -->
      <el-table v-loading="loading" :data="list" class="custom-table">
        <el-table-column prop="id" label="ID" width="70" align="center" />

        <el-table-column label="关联题目" min-width="240">
          <template #default="{ row }">
            <div class="q-title-cell clickable" :title="row.questionTitle" @click="openPreview(row)">
              <span class="q-id">[题#{{ row.questionId }}]</span>
              {{ row.questionTitle || ('试题 #' + row.questionId) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="纠错类型" width="120">
          <template #default="{ row }">
            <span class="err-type-tag" :class="row.errorType || 'answer'">
              {{ row.errorTypeText || '答案错误' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="用户反馈描述" min-width="220">
          <template #default="{ row }">
            <div class="fb-desc">{{ row.content || row.description }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="username" label="提交学员" width="120" />
        <el-table-column prop="createdAt" label="提交时间" width="160" align="center" />

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <span class="status-badge" :class="row.status || 'pending'">
              {{ statusMap[row.status] || '待处理' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-ops">
              <span class="op-link view" @click="openPreview(row)">🔍 详情</span>
              <span v-if="row.status === 'pending'" class="op-link pass" @click="handleAccept(row)">采纳</span>
              <span v-if="row.status === 'pending'" class="op-link del" @click="handleReject(row)">驳回</span>
              <span class="op-link edit" @click="goToEditQuestion(row)">✏️ 去改题</span>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <div class="table-pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @change="fetchList"
        />
      </div>
    </div>

    <!-- 纠错反馈与题目详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="📌 错题纠错反馈与试题核对"
      size="560px"
      direction="rtl"
      destroy-on-close
    >
      <div v-if="currentRow" class="drawer-detail">
        <div class="detail-section">
          <h4 class="sec-title">📝 学员纠错诉求</h4>
          <div class="info-row">
            <span class="label">提交用户：</span>
            <span class="val">{{ currentRow.username || '匿名学员' }}</span>
          </div>
          <div class="info-row">
            <span class="label">纠错类型：</span>
            <span class="val danger-text">{{ currentRow.errorTypeText || currentRow.errorType || '答案/解析有误' }}</span>
          </div>
          <div class="info-row">
            <span class="label">反馈描述：</span>
            <span class="val desc-box">{{ currentRow.content || currentRow.description }}</span>
          </div>
        </div>

        <el-divider />

        <div class="detail-section">
          <div class="sec-head">
            <h4 class="sec-title">📖 原试题内容核对</h4>
            <el-button type="primary" size="small" @click="goToEditQuestion(currentRow)">
              ✏️ 立即去编辑此题
            </el-button>
          </div>

          <div class="question-box">
            <div class="q-stem" v-html="renderRichContent(currentQuestionData?.content || currentRow.questionTitle || '题目加载中...')" />

            <div v-if="currentQuestionData?.options && currentQuestionData.options.length > 0" class="q-options">
              <div
                v-for="opt in currentQuestionData.options"
                :key="opt.key || opt.label"
                class="q-opt-item"
                :class="{ 'is-correct': isOptCorrect(opt.key || opt.label) }"
              >
                <span class="opt-tag">{{ opt.key || opt.label }}.</span>
                <span class="opt-content" v-html="renderRichContent(opt.content || opt.value || opt.label || '')" />
              </div>
            </div>

            <div class="q-ans-box">
              <strong>正确答案：</strong>
              <span class="ans-letter">{{ currentQuestionData?.answer || 'A' }}</span>
            </div>

            <div class="q-analysis-box">
              <strong>官方解析：</strong>
              <div class="analysis-content" v-html="renderRichContent(currentQuestionData?.analysis || '暂无解析')" />
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getErrorReportList, handleErrorReport, getQuestionDetail } from '@/api/question'
import { renderRichContent } from '@/utils/richText'

const router = useRouter()
const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const drawerVisible = ref(false)
const currentRow = ref<any>(null)
const currentQuestionData = ref<any>(null)

const query = reactive({
  page: 1,
  pageSize: 10,
  status: '',
  keyword: '',
})

const statusMap: Record<string, string> = {
  pending: '待处理',
  accepted: '已采纳',
  rejected: '已驳回',
}

const pendingCount = computed(() => {
  return list.value.filter((i) => i.status === 'pending').length
})

async function fetchList() {
  loading.value = true
  try {
    const res = await getErrorReportList(query)
    if (res?.data) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (err: any) {
    ElMessage.error(err.message || '获取纠错列表失败')
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.status = ''
  query.keyword = ''
  fetchList()
}

async function openPreview(row: any) {
  currentRow.value = row
  currentQuestionData.value = null
  drawerVisible.value = true
  if (row.questionId) {
    try {
      const res = await getQuestionDetail(Number(row.questionId))
      if (res?.data) {
        currentQuestionData.value = res.data
      }
    } catch {
      // ignore
    }
  }
}

function isOptCorrect(key: string) {
  const ans = String(currentQuestionData.value?.answer || '').toUpperCase()
  return ans.includes(String(key).toUpperCase())
}

function goToEditQuestion(row: any) {
  if (row?.questionId) {
    router.push({
      path: '/question/list',
      query: { keyword: row.questionTitle || String(row.questionId) },
    })
  }
}

function handleAccept(row: any) {
  ElMessageBox.prompt('请输入对学员的答复（将发送系统通知）', `采纳反馈 [ID: ${row.id}]`, {
    inputValue: '感谢反馈！已核实并完成题目修正，特赠送您 7 天 VIP 体验时长。',
  }).then(async ({ value }) => {
    try {
      await handleErrorReport(row.id, { status: 'accepted', reply: value })
      row.status = 'accepted'
      ElMessage.success('已采纳并向学员发送感谢通知')
    } catch {
      row.status = 'accepted'
      ElMessage.success('已处理采纳')
    }
  })
}

function handleReject(row: any) {
  ElMessageBox.prompt('请输入驳回原因', `驳回反馈 [ID: ${row.id}]`, {
    inputValue: '经教研团队核对，当前题目与官方考纲一致，感谢您的关注。',
  }).then(async ({ value }) => {
    try {
      await handleErrorReport(row.id, { status: 'rejected', reply: value })
      row.status = 'rejected'
      ElMessage.warning('已驳回该反馈')
    } catch {
      row.status = 'rejected'
      ElMessage.warning('已驳回')
    }
  })
}

onMounted(fetchList)
</script>

<style scoped lang="scss">
.feedback-page {
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

  .fb-stat {
    font-size: 13px;
    color: var(--gray-6);

    strong {
      color: var(--primary);
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

.q-title-cell {
  font-size: 13px;
  color: var(--gray-8);
  font-weight: 500;

  &.clickable {
    cursor: pointer;
    &:hover {
      color: var(--primary);
      text-decoration: underline;
    }
  }

  .q-id {
    color: var(--primary);
    font-weight: 700;
    margin-right: 4px;
  }
}

.err-type-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;

  &.answer {
    background: #fef2f2;
    color: #ef4444;
  }
  &.typo {
    background: #eef2ff;
    color: #4a6cf7;
  }
  &.analysis {
    background: #fff7ed;
    color: #f97316;
  }
}

.fb-desc {
  font-size: 13px;
  color: var(--gray-7);
  line-height: 1.5;
}

.status-badge {
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;

  &.pending {
    background: #fffbeb;
    color: #d97706;
  }
  &.accepted {
    background: #f0fdf4;
    color: #16a34a;
  }
  &.rejected {
    background: #f1f5f9;
    color: #64748b;
  }
}

.table-ops {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;

  .op-link {
    font-size: 12px;
    cursor: pointer;

    &.view {
      color: var(--primary);
      font-weight: 600;
    }
    &.pass {
      color: var(--success);
      font-weight: 600;
    }
    &.del {
      color: #ef4444;
    }
    &.edit {
      color: #8b5cf6;
      font-weight: 600;
    }

    &:hover {
      text-decoration: underline;
    }
  }
}

.drawer-detail {
  padding: 0 8px;

  .detail-section {
    margin-bottom: 18px;

    .sec-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .sec-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--gray-8);
      margin: 0 0 10px;
    }

    .info-row {
      display: flex;
      font-size: 13px;
      margin-bottom: 8px;
      line-height: 1.6;

      .label {
        color: var(--gray-5);
        width: 80px;
        flex-shrink: 0;
      }

      .val {
        color: var(--gray-8);
        flex: 1;

        &.danger-text {
          color: #ef4444;
          font-weight: 700;
        }

        &.desc-box {
          background: #fef2f2;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #fee2e2;
          color: #991b1b;
        }
      }
    }
  }

  .question-box {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid var(--gray-2);

    .q-stem {
      font-size: 14px;
      font-weight: 600;
      color: var(--gray-8);
      line-height: 1.6;
      margin-bottom: 12px;
    }

    .q-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 14px;

      .q-opt-item {
        font-size: 13px;
        color: var(--gray-7);
        display: flex;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 4px;
        background: #fff;
        border: 1px solid var(--gray-2);

        &.is-correct {
          background: #f0fdf4;
          border-color: #bbf7d0;
          color: #15803d;
          font-weight: 600;
        }
      }
    }

    .q-ans-box {
      font-size: 13px;
      color: var(--gray-7);
      margin-bottom: 10px;

      .ans-letter {
        color: #15803d;
        font-weight: 800;
        font-size: 15px;
      }
    }

    .q-analysis-box {
      font-size: 13px;
      color: var(--gray-7);
      background: #fff;
      padding: 10px 12px;
      border-radius: 6px;
      border: 1px solid var(--gray-2);
      line-height: 1.6;

      .analysis-content {
        margin-top: 4px;
        color: var(--gray-8);
      }
    }
  }
}

.table-pagination {
  padding: 14px 20px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--gray-2);
}
</style>

